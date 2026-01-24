import { RequestHandler } from "express";
import { query } from "../db";
import { generateYAMLManifest } from "../yaml-generator";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as k8s from "@kubernetes/client-node";
import * as yaml from "js-yaml";

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
    output.push(`NODE_ENV: ${process.env.NODE_ENV || "not set"}\n`);

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
        output.push(`Stack: ${inClusterError.stack}\n`);
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
        output.push("✗ No Rancher credentials configured in user account\n");
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
          error:
            "Failed to configure cluster connection with Rancher credentials",
        } as AdvancedDeployResponse);
      }
    }

    // Create namespace if it doesn't exist - let it be created via YAML instead
    // The namespace will be in the _fullYaml, so we'll let applyResource handle it
    output.push(
      `ℹ Namespace '${namespace}' will be created via YAML deployment\n`,
    );

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

          console.log(
            `[DEPLOY] Parsed YAML document ${i + 1}: kind=${resourceKind}, name=${resourceName}, ns=${resourceNamespace}, apiVersion=${doc.apiVersion}`,
          );

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

      output.push(`\n=== Deployment Summary ===\n`);
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

  console.log(
    `[DEPLOY] Applying ${kind}/${name} in namespace ${resourceNamespace}`,
  );

  try {
    // Handle standard API resources FIRST (before custom resources check)
    let api: any;
    let isCustomResource = false;

    if (apiVersion.startsWith("apps/")) {
      api = kubeConfig.makeApiClient(k8s.AppsV1Api);
    } else if (apiVersion.startsWith("batch/")) {
      api = kubeConfig.makeApiClient(k8s.BatchV1Api);
    } else if (apiVersion.startsWith("networking.k8s.io/")) {
      api = kubeConfig.makeApiClient(k8s.NetworkingV1Api);
    } else if (apiVersion.startsWith("autoscaling/")) {
      api = kubeConfig.makeApiClient(k8s.AutoscalingV2Api);
    } else if (apiVersion.startsWith("rbac.authorization.k8s.io/")) {
      api = kubeConfig.makeApiClient(k8s.RbacAuthorizationV1Api);
    } else if (apiVersion.includes(".") && !apiVersion.startsWith("v1")) {
      // Custom resources (HTTPRoute, Certificate, Schedule, etc)
      api = kubeConfig.makeApiClient(k8s.CustomObjectsApi);
      isCustomResource = true;
    } else {
      api = kubeConfig.makeApiClient(k8s.CoreV1Api);
    }

    // Handle custom resources separately
    if (isCustomResource) {
      // Parse API version: "group/version"
      const parts = apiVersion.split("/");
      const group = parts[0];
      const version = parts[1] || "v1";

      // Convert kind to plural form
      const plural = kind.toLowerCase() + "s";

      console.log(
        `[DEPLOY] Custom resource: group=${group}, version=${version}, plural=${plural}`,
      );

      try {
        await api.getNamespacedCustomObject(
          group,
          version,
          resourceNamespace,
          plural,
          name,
        );
        // Exists, patch it
        await api.patchNamespacedCustomObject(
          group,
          version,
          resourceNamespace,
          plural,
          name,
          resource,
        );
        console.log(`[DEPLOY] ✓ Patched ${kind}/${name}`);
      } catch (readError: any) {
        if (readError.statusCode === 404) {
          // Create it
          await api.createNamespacedCustomObject(
            group,
            version,
            resourceNamespace,
            plural,
            resource,
          );
          console.log(`[DEPLOY] ✓ Created ${kind}/${name}`);
        } else {
          throw readError;
        }
      }
      return;
    }

    // Try to read the existing resource
    let exists = false;
    try {
      if (kind === "Namespace") {
        await api.readNamespace(name);
        exists = true;
        console.log(`[DEPLOY] Found existing ${kind}/${name}`);
      } else {
        // For namespaced resources, use readNamespaced${kind} method
        const readNamespacedMethod = `readNamespaced${kind}`;
        if (typeof api[readNamespacedMethod] === "function") {
          await api[readNamespacedMethod](name, resourceNamespace);
          exists = true;
          console.log(`[DEPLOY] Found existing ${kind}/${name}`);
        }
      }
    } catch (readError: any) {
      if (readError.statusCode === 404) {
        exists = false;
        console.log(`[DEPLOY] ${kind}/${name} does not exist, will create`);
      } else {
        throw readError;
      }
    }

    // Apply the resource (create or patch)
    if (exists) {
      // Use patch to update existing resource
      if (kind === "Namespace") {
        await api.patchNamespace(name, resource);
      } else {
        const patchNamespacedMethod = `patchNamespaced${kind}`;
        if (typeof api[patchNamespacedMethod] === "function") {
          await api[patchNamespacedMethod](name, resourceNamespace, resource);
        }
      }
      console.log(`[DEPLOY] ✓ Patched ${kind}/${name}`);
    } else {
      // Create new resource
      if (kind === "Namespace") {
        await api.createNamespace(resource);
      } else {
        const createNamespacedMethod = `createNamespaced${kind}`;
        if (typeof api[createNamespacedMethod] === "function") {
          await api[createNamespacedMethod](resourceNamespace, resource);
        }
      }
      console.log(`[DEPLOY] ✓ Created ${kind}/${name}`);
    }
  } catch (error: any) {
    console.error(
      `[DEPLOY] Error applying ${kind}/${name}:`,
      error.message || error,
    );
    throw new Error(
      `${kind} operation failed: ${error.body?.message || error.message || error.statusCode}`,
    );
  }
}
