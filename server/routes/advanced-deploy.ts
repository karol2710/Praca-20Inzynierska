import { RequestHandler } from "express";
import { query } from "../db";
import { generateYAMLManifest } from "../yaml-generator";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as k8s from "@kubernetes/client-node";
import * as yaml from "js-yaml";
import { execSync } from "child_process";

interface AdvancedDeployRequest {
  workloads: any[];
  resources: any[];
  globalNamespace: string;
  deploymentOptions?: {
    environment: "staging" | "production";
  };
  generatedYaml?: string;
  _fullYaml?: string;
}

interface AdvancedDeployResponse {
  success: boolean;
  output: string;
  error?: string;
  namespace?: string;
}

export const handleAdvancedDeploy: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { workloads, resources, globalNamespace, generatedYaml, _fullYaml } =
    req.body as AdvancedDeployRequest;

  if (!user || !user.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!workloads || !Array.isArray(workloads) || workloads.length === 0) {
    return res.status(400).json({
      error: "At least one workload is required",
    } as AdvancedDeployResponse);
  }

  try {
    const output: string[] = [];
    const namespace = globalNamespace;

    output.push("=== Advanced Deployment Started ===\n");
    output.push(`Namespace: ${namespace}`);
    output.push(`Workloads: ${workloads.length}`);
    output.push(`Resources: ${resources.length}\n`);

    // Debug environment
    output.push("=== Debug Information ===\n");
    output.push(
      `KUBERNETES_SERVICE_HOST: ${process.env.KUBERNETES_SERVICE_HOST || "not set"}\n`,
    );
    output.push(
      `KUBERNETES_SERVICE_PORT: ${process.env.KUBERNETES_SERVICE_PORT || "not set"}\n`,
    );
    output.push(
      `NODE_ENV: ${process.env.NODE_ENV || "not set"}\n`,
    );

    // Initialize Kubernetes client
    let kc = new k8s.KubeConfig();
    let kubeConfig: any = null;

    // Check if we're running inside a Kubernetes cluster
    // Method 1: Check environment variables
    const isInClusterEnv =
      process.env.KUBERNETES_SERVICE_HOST &&
      process.env.KUBERNETES_SERVICE_PORT;

    // Method 2: Check if service account token file exists
    let isInClusterToken = false;
    try {
      fsSync.accessSync("/var/run/secrets/kubernetes.io/serviceaccount/token");
      isInClusterToken = true;
    } catch {
      isInClusterToken = false;
    }

    const isInCluster = isInClusterEnv || isInClusterToken;

    if (isInCluster) {
      output.push("\n✓ Detected in-cluster Kubernetes environment\n");
      if (isInClusterEnv) {
        output.push(`  (via environment variables)\n`);
      }
      if (isInClusterToken) {
        output.push(`  (via service account token file)\n`);
      }

      try {
        kc.loadFromCluster();
        output.push("✓ Successfully loaded in-cluster configuration\n");
        kubeConfig = kc;
        console.log("[DEPLOY] In-cluster Kubernetes authentication successful");
      } catch (inClusterError: any) {
        output.push(
          `✗ Failed to load in-cluster config: ${inClusterError.message}\n`,
        );
        output.push(
          `Stack: ${inClusterError.stack}\n`,
        );
        console.error("[DEPLOY] In-cluster config error:", inClusterError);
        return res.status(500).json({
          success: false,
          output: output.join("\n"),
          error:
            "Failed to authenticate with Kubernetes cluster. Make sure the pod's service account is properly configured with RBAC permissions.",
        } as AdvancedDeployResponse);
      }
    } else {
      output.push(
        "\n⚠ Not running inside Kubernetes cluster, checking for Rancher credentials...\n",
      );

      // Fallback to user-configured Rancher credentials
      const userResult = await query(
        `SELECT id, username, rancher_api_url, rancher_api_token, rancher_cluster_id
         FROM users WHERE id = $1`,
        [user.userId],
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userResult.rows[0];

      if (
        !userData.rancher_api_url ||
        !userData.rancher_api_token ||
        !userData.rancher_cluster_id
      ) {
        output.push(
          "✗ No Rancher credentials configured in user account\n",
        );
        return res.status(400).json({
          success: false,
          output: output.join("\n"),
          error:
            "Cannot deploy: Not running inside Kubernetes cluster AND no Rancher credentials configured. Either deploy inside the cluster or configure Rancher credentials in your account settings.",
        } as AdvancedDeployResponse);
      }

      // Use Rancher credentials
      try {
        kc.loadFromOptions({
          clusters: [
            {
              name: "rancher-cluster",
              server: userData.rancher_api_url,
              skipTLSVerify: true,
            },
          ],
          users: [
            {
              name: "rancher-user",
              token: userData.rancher_api_token,
            },
          ],
          contexts: [
            {
              cluster: "rancher-cluster",
              user: "rancher-user",
              name: "rancher-context",
            },
          ],
          currentContext: "rancher-context",
        });
        output.push("✓ Using Rancher cluster configuration\n");
        output.push(`  Server: ${userData.rancher_api_url}\n`);
        kubeConfig = kc;
        console.log("[DEPLOY] Rancher authentication configured");
      } catch (rangerError: any) {
        output.push(
          `✗ Failed to load Rancher config: ${rangerError.message}\n`,
        );
        console.error("[DEPLOY] Rancher config error:", rangerError);
        return res.status(500).json({
          success: false,
          output: output.join("\n"),
          error: "Failed to configure cluster connection with Rancher credentials",
        } as AdvancedDeployResponse);
      }
    }

    // Create namespace if it doesn't exist - let it be created via YAML instead
    // The namespace will be in the _fullYaml, so we'll let applyResource handle it
    output.push(`ℹ Namespace '${namespace}' will be created via YAML deployment\n`);

    // Parse and apply YAML documents
    if (_fullYaml) {
      const yamlDocuments = _fullYaml
        .split(/^---$/m)
        .filter((doc) => doc.trim());

      output.push(
        `=== Applying ${yamlDocuments.length} Kubernetes Resources ===\n`,
      );

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < yamlDocuments.length; i++) {
        const yamlDoc = yamlDocuments[i].trim();

        try {
          const doc = yaml.load(yamlDoc) as any;

          if (!doc || !doc.kind) {
            console.log(`[DEPLOY] Skipping invalid YAML document ${i + 1}`);
            output.push(`⚠ Skipping invalid YAML document ${i + 1}\n`);
            continue;
          }

          const resourceKind = doc.kind;
          const resourceName = doc.metadata?.name || "unknown";
          const resourceNamespace = doc.metadata?.namespace || namespace;

          console.log(`[DEPLOY] Parsed YAML document ${i + 1}: kind=${resourceKind}, name=${resourceName}, ns=${resourceNamespace}, apiVersion=${doc.apiVersion}`);

          // Apply namespace if not specified
          if (!doc.metadata?.namespace && resourceKind !== "Namespace") {
            doc.metadata = doc.metadata || {};
            doc.metadata.namespace = namespace;
          }

          output.push(
            `→ Applying ${resourceKind}/${resourceName} (${resourceNamespace})...`,
          );

          try {
            await applyResource(kubeConfig, doc, namespace);
            output.push(" ✓\n");
            successCount++;
          } catch (applyError: any) {
            output.push(` ✗ (${applyError.message})\n`);
            errorCount++;
          }
        } catch (parseError: any) {
          output.push(
            `✗ Failed to parse YAML document ${i + 1}: ${parseError.message}\n`,
          );
          errorCount++;
        }
      }

      output.push(
        `\n=== Deployment Summary ===\n`,
      );
      output.push(`✓ Successfully applied: ${successCount} resources\n`);
      if (errorCount > 0) {
        output.push(`✗ Failed to apply: ${errorCount} resources\n`);
      }
      output.push(`\nNamespace: ${namespace}\n`);
      output.push("Verify with: kubectl get all -n " + namespace);
    }

    // Store deployment record
    const status = output.join("\n").includes("Failed to apply")
      ? "partial"
      : "deployed";
    await query(
      `INSERT INTO deployments (user_id, name, type, namespace, yaml_config, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.userId,
        `deployment-${Date.now()}`,
        "advanced",
        namespace,
        _fullYaml || generatedYaml || "",
        status,
      ],
    );

    output.push("\n=== Deployment record saved to database ===\n");

    res.status(200).json({
      success: true,
      output: output.join("\n"),
      namespace: namespace,
    } as AdvancedDeployResponse);
  } catch (error: any) {
    console.error("Advanced deploy error:", error);
    res.status(500).json({
      success: false,
      output: "",
      error: error.message || "Failed to generate deployment",
    } as AdvancedDeployResponse);
  }
};

// Helper function to apply a Kubernetes resource
async function applyResource(
  kubeConfig: k8s.KubeConfig,
  resource: any,
  namespace: string,
): Promise<void> {
  const kind = resource.kind;
  const apiVersion = resource.apiVersion || "v1";

  // Ensure metadata exists
  if (!resource.metadata) {
    resource.metadata = {};
  }

  const name = resource.metadata.name;
  const resourceNamespace = resource.metadata.namespace || namespace;

  // Validate that name exists
  if (!name) {
    throw new Error(`${kind} resource missing metadata.name`);
  }

  // Ensure namespace is set for namespaced resources
  if (kind !== "Namespace" && !resource.metadata.namespace) {
    resource.metadata.namespace = namespace;
  }

  console.log(`[DEPLOY] Applying ${kind}/${name} in namespace ${resourceNamespace}`);

  try {
    // Handle standard API resources FIRST (before custom resources check)
    let api: any;
    let isCustomResource = false;

    console.log(`[DEPLOY] Determining API client for apiVersion="${apiVersion}"`);

    if (apiVersion.startsWith("apps/")) {
      api = kubeConfig.makeApiClient(k8s.AppsV1Api);
      console.log(`[DEPLOY] Using AppsV1Api`);
    } else if (apiVersion.startsWith("batch/")) {
      api = kubeConfig.makeApiClient(k8s.BatchV1Api);
      console.log(`[DEPLOY] Using BatchV1Api`);
    } else if (apiVersion.startsWith("networking.k8s.io/")) {
      api = kubeConfig.makeApiClient(k8s.NetworkingV1Api);
      console.log(`[DEPLOY] Using NetworkingV1Api`);
    } else if (apiVersion.startsWith("autoscaling/")) {
      api = kubeConfig.makeApiClient(k8s.AutoscalingV2Api);
      console.log(`[DEPLOY] Using AutoscalingV2Api`);
    } else if (apiVersion.startsWith("rbac.authorization.k8s.io/")) {
      api = kubeConfig.makeApiClient(k8s.RbacAuthorizationV1Api);
      console.log(`[DEPLOY] Using RbacAuthorizationV1Api`);
    } else if (apiVersion.includes(".") && !apiVersion.startsWith("v1")) {
      // Custom resources (HTTPRoute, Certificate, Schedule, etc)
      console.log(`[DEPLOY] Detected custom resource (includes dot, not v1)`);
      try {
        api = kubeConfig.makeApiClient(k8s.CustomObjectsApi);
        console.log(`[DEPLOY] Successfully created CustomObjectsApi instance`);
        console.log(`[DEPLOY] CustomObjectsApi constructor: ${api.constructor.name}`);
        console.log(`[DEPLOY] CustomObjectsApi has createNamespacedCustomObject: ${typeof api.createNamespacedCustomObject === 'function'}`);
      } catch (e) {
        console.error(`[DEPLOY] Failed to create CustomObjectsApi:`, e);
        throw e;
      }
      isCustomResource = true;
      console.log(`[DEPLOY] Using CustomObjectsApi`);
    } else {
      api = kubeConfig.makeApiClient(k8s.CoreV1Api);
      console.log(`[DEPLOY] Using CoreV1Api`);
    }

    if (!api) {
      throw new Error(`Failed to create API client for apiVersion="${apiVersion}"`);
    }
    console.log(`[DEPLOY] API client created successfully`);
    console.log(`[DEPLOY] API client type: ${api.constructor.name}`);
    console.log(`[DEPLOY] API client methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(api)).slice(0, 10).join(", ")}...`);

    // Handle custom resources separately
    if (isCustomResource) {
      // Parse API version: "group/version"
      const versionParts = apiVersion.split("/");
      const customGroup = versionParts[0];
      const customVersion = versionParts[1] || "v1";

      // Convert kind to plural form - handle special cases
      let customPlural = kind.toLowerCase();
      if (!customPlural.endsWith("s")) {
        customPlural += "s";
      }
      // Handle special pluralization
      if (kind === "Schedule") {
        customPlural = "schedules";
      } else if (kind === "Certificate") {
        customPlural = "certificates";
      } else if (kind === "HTTPRoute") {
        customPlural = "httproutes";
      }

      // Validate all parameters separately
      console.log(`[DEPLOY] Validating custom resource parameters...`);

      if (!customGroup || customGroup === undefined || customGroup === null) {
        throw new Error(`Invalid group: group is ${customGroup}`);
      }
      if (typeof customGroup !== "string") {
        throw new Error(`Invalid group type: expected string, got ${typeof customGroup}`);
      }
      console.log(`[DEPLOY] ✓ group validated: "${customGroup}"`);

      if (!customVersion || customVersion === undefined || customVersion === null) {
        throw new Error(`Invalid version: version is ${customVersion}`);
      }
      if (typeof customVersion !== "string") {
        throw new Error(`Invalid version type: expected string, got ${typeof customVersion}`);
      }
      console.log(`[DEPLOY] ✓ version validated: "${customVersion}"`);

      if (!resourceNamespace || resourceNamespace === undefined || resourceNamespace === null) {
        throw new Error(`Invalid namespace: namespace is ${resourceNamespace}`);
      }
      if (typeof resourceNamespace !== "string") {
        throw new Error(`Invalid namespace type: expected string, got ${typeof resourceNamespace}`);
      }
      console.log(`[DEPLOY] ✓ namespace validated: "${resourceNamespace}"`);

      if (!customPlural || customPlural === undefined || customPlural === null) {
        throw new Error(`Invalid plural: plural is ${customPlural}`);
      }
      if (typeof customPlural !== "string") {
        throw new Error(`Invalid plural type: expected string, got ${typeof customPlural}`);
      }
      console.log(`[DEPLOY] ✓ plural validated: "${customPlural}"`);

      if (!resource || resource === undefined || resource === null) {
        throw new Error(`Invalid resource: resource is ${resource}`);
      }
      if (typeof resource !== "object") {
        throw new Error(`Invalid resource type: expected object, got ${typeof resource}`);
      }
      console.log(`[DEPLOY] ✓ resource body validated`);

      console.log(`[DEPLOY] Custom resource: group=${customGroup}, version=${customVersion}, plural=${customPlural}`);
      console.log(`[DEPLOY] API instance type: ${api?.constructor?.name}`);
      console.log(`[DEPLOY] Has createNamespacedCustomObject: ${typeof api?.createNamespacedCustomObject}`);

      try {
        // Try to create the custom resource
        console.log(`[DEPLOY] Creating custom resource ${kind}/${name}`);
        console.log(`[DEPLOY] Parameters: group="${customGroup}" (${typeof customGroup}), version="${customVersion}" (${typeof customVersion}), namespace="${resourceNamespace}" (${typeof resourceNamespace}), plural="${customPlural}" (${typeof customPlural})`);

        // Log available methods on the api object
        const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(api)).filter(m => m.includes("createNamespaced") || m.includes("patchNamespaced"));
        console.log(`[DEPLOY] Available create/patch methods: ${availableMethods.join(", ")}`);

        // Check if the method exists
        if (typeof api.createNamespacedCustomObject !== 'function') {
          throw new Error(`createNamespacedCustomObject is not a function on ${api.constructor.name}`);
        }

        // Pre-validate all parameters before calling
        const params = [customGroup, customVersion, resourceNamespace, customPlural, resource];
        console.log(`[DEPLOY] About to call createNamespacedCustomObject with params:`, params.map((p, i) => `${i}: ${typeof p} = ${p === null ? 'NULL' : p === undefined ? 'UNDEFINED' : typeof p === 'object' ? '[object]' : String(p).substring(0, 50)}`));

        // Call with explicit context binding to ensure 'this' is correct
        const createMethod = api.createNamespacedCustomObject;
        console.log(`[DEPLOY] Method type: ${typeof createMethod}, is bound: ${createMethod.name}`);

        const result = await createMethod.call(
          api,
          customGroup,
          customVersion,
          resourceNamespace,
          customPlural,
          resource,
        );
        console.log(`[DEPLOY] ✓ Created ${kind}/${name}`);
      } catch (createError: any) {
        console.error(`[DEPLOY] Create failed with error:`, createError.message);
        console.error(`[DEPLOY] Error status code:`, createError.statusCode);
        console.error(`[DEPLOY] Error body:`, createError.body);

        if (createError.statusCode === 409) {
          // Already exists, try to patch
          console.log(`[DEPLOY] ${kind}/${name} already exists, patching...`);
          try {
            if (typeof api.patchNamespacedCustomObject !== 'function') {
              throw new Error(`patchNamespacedCustomObject is not a function on ${api.constructor.name}`);
            }

            console.log(`[DEPLOY] About to patch with parameters: group="${customGroup}", version="${customVersion}", namespace="${resourceNamespace}", plural="${customPlural}", name="${name}"`);

            const patchMethod = api.patchNamespacedCustomObject;
            await patchMethod.call(
              api,
              customGroup,
              customVersion,
              resourceNamespace,
              customPlural,
              name,
              resource,
            );
            console.log(`[DEPLOY] ✓ Patched ${kind}/${name}`);
          } catch (patchError: any) {
            console.error(`[DEPLOY] Patch failed: ${patchError.message}`);
            throw patchError;
          }
        } else {
          throw createError;
        }
      }
      return;
    }

    // Directly create the resource (simpler approach - just try to create)
    if (kind === "Namespace") {
      console.log(`[DEPLOY] Creating namespace: ${name}`);
      try {
        await api.createNamespace(resource);
        console.log(`[DEPLOY] ✓ Created ${kind}/${name}`);
      } catch (createError: any) {
        if (createError.statusCode === 409) {
          // Already exists
          console.log(`[DEPLOY] ✓ ${kind}/${name} already exists`);
        } else {
          throw createError;
        }
      }
    } else {
      // For namespaced resources, use createNamespaced${kind} method
      const createNamespacedMethod = `createNamespaced${kind}`;
      if (typeof api[createNamespacedMethod] === "function") {
        console.log(`[DEPLOY] Creating ${kind}/${name} in namespace ${resourceNamespace}`);
        try {
          await api[createNamespacedMethod](resourceNamespace, resource);
          console.log(`[DEPLOY] ✓ Created ${kind}/${name}`);
        } catch (createError: any) {
          if (createError.statusCode === 409) {
            // Already exists, try to patch
            console.log(`[DEPLOY] ${kind}/${name} already exists, patching...`);
            const patchNamespacedMethod = `patchNamespaced${kind}`;
            if (typeof api[patchNamespacedMethod] === "function") {
              await api[patchNamespacedMethod](name, resourceNamespace, resource);
              console.log(`[DEPLOY] ✓ Patched ${kind}/${name}`);
            }
          } else {
            throw createError;
          }
        }
      } else {
        console.error(`[DEPLOY] Method ${createNamespacedMethod} not found for ${kind}`);
      }
    }
  } catch (error: any) {
    console.error(`[DEPLOY] Error applying ${kind}/${name}:`, error.message || error);
    throw new Error(
      `${kind} operation failed: ${error.body?.message || error.message || error.statusCode}`,
    );
  }
}
