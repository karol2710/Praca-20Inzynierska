import { RequestHandler } from "express";
import { query } from "../db";
import { generateYAMLManifest } from "../yaml-generator";
import * as fs from "fs/promises";
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

    // Initialize Kubernetes client
    let kc = new k8s.KubeConfig();
    let kubeConfig: any = null;

    // Try to load in-cluster configuration first (when running inside a pod)
    try {
      kc.loadFromCluster();
      output.push("✓ Using in-cluster Kubernetes configuration\n");
      kubeConfig = kc;
    } catch (inClusterError) {
      output.push("⚠ In-cluster config not available, trying Rancher credentials...\n");

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
        return res.status(400).json({
          error:
            "No cluster configuration available. Either run inside Kubernetes cluster or configure Rancher credentials in account settings.",
        } as AdvancedDeployResponse);
      }

      // Use Rancher credentials
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
      kubeConfig = kc;
    }

    // Create namespace if it doesn't exist
    try {
      const k8sApi = kubeConfig.makeApiClient(k8s.CoreV1Api);
      const namespaceObj: k8s.V1Namespace = {
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: namespace,
        },
      };

      try {
        await k8sApi.readNamespace(namespace);
        output.push(`✓ Namespace '${namespace}' already exists\n`);
      } catch (nsError: any) {
        if (nsError.statusCode === 404) {
          await k8sApi.createNamespace(namespaceObj);
          output.push(`✓ Created namespace '${namespace}'\n`);
        } else {
          throw nsError;
        }
      }
    } catch (nsError: any) {
      output.push(`⚠ Warning creating namespace: ${nsError.message}\n`);
    }

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
            output.push(`⚠ Skipping invalid YAML document ${i + 1}\n`);
            continue;
          }

          const resourceKind = doc.kind;
          const resourceName = doc.metadata?.name || "unknown";
          const resourceNamespace = doc.metadata?.namespace || namespace;

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
  const name = resource.metadata?.name;
  const resourceNamespace = resource.metadata?.namespace || namespace;

  // Ensure namespace is set for namespaced resources
  if (kind !== "Namespace" && !resource.metadata?.namespace) {
    resource.metadata = resource.metadata || {};
    resource.metadata.namespace = namespace;
  }

  // Get the appropriate API client based on API version
  let api: any;

  try {
    if (apiVersion.startsWith("apps/")) {
      api = kubeConfig.makeApiClient(k8s.AppsV1Api);
    } else if (apiVersion.startsWith("batch/")) {
      api = kubeConfig.makeApiClient(k8s.BatchV1Api);
    } else if (apiVersion.startsWith("networking.k8s.io/")) {
      api = kubeConfig.makeApiClient(k8s.NetworkingV1Api);
    } else if (apiVersion.startsWith("autoscaling/")) {
      api = kubeConfig.makeApiClient(k8s.AutoscalingV2Api);
    } else {
      api = kubeConfig.makeApiClient(k8s.CoreV1Api);
    }

    // Try to read the existing resource
    let exists = false;
    try {
      if (kind === "Namespace") {
        await api.readNamespace(name);
      } else {
        const readMethod = `read${kind}`;
        if (typeof api[readMethod] === "function") {
          await api[readMethod](name, resourceNamespace);
        }
      }
      exists = true;
    } catch (readError: any) {
      if (readError.statusCode !== 404) {
        throw readError;
      }
      // Resource doesn't exist, we'll create it
      exists = false;
    }

    // Apply the resource (create or patch)
    if (exists) {
      // Use patch to update existing resource
      if (kind === "Namespace") {
        await api.patchNamespace(name, resource);
      } else {
        const patchMethod = `patch${kind}`;
        if (typeof api[patchMethod] === "function") {
          await api[patchMethod](name, resourceNamespace, resource);
        }
      }
    } else {
      // Create new resource
      if (kind === "Namespace") {
        await api.createNamespace(resource);
      } else {
        const createMethod = `create${kind}`;
        if (typeof api[createMethod] === "function") {
          await api[createMethod](resourceNamespace, resource);
        } else {
          // Fallback: try the createNamespaced${kind} method
          const createNamespacedMethod = `createNamespaced${kind}`;
          if (typeof api[createNamespacedMethod] === "function") {
            await api[createNamespacedMethod](resourceNamespace, resource);
          }
        }
      }
    }
  } catch (error: any) {
    throw new Error(
      `${kind} operation failed: ${error.body?.message || error.message || error.statusCode}`,
    );
  }
}
