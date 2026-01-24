import { RequestHandler } from "express";
import { query } from "../db";
import { generateYAMLManifest } from "../yaml-generator";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as k8s from "@kubernetes/client-node";
import * as yaml from "js-yaml";
import https from "https";

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
      const failedResources: any[] = [];

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
            failedResources.push({doc, error: applyError, attempt: 1});
          }
        } catch (parseError: any) {
          output.push(
            `✗ Failed to parse YAML document ${i + 1}: ${parseError.message}\n`,
          );
          errorCount++;
        }
      }

      // Retry failed resources (in case they were dependent on other resources)
      if (failedResources.length > 0) {
        output.push(`\n=== Retrying ${failedResources.length} failed resources ===\n`);
        console.log(`[DEPLOY] Retrying ${failedResources.length} failed resources...`);

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));

        for (const item of failedResources) {
          const { doc, error } = item;
          const resourceKind = doc.kind;
          const resourceName = doc.metadata?.name || "unknown";
          const resourceNamespace = doc.metadata?.namespace || namespace;
          const errorMsg = error.message || "";

          // Skip retry if it's a validation error (won't be fixed by retrying)
          if (errorMsg.includes("invalid") || errorMsg.includes("Invalid") || errorMsg.includes("resourceVersion")) {
            output.push(
              `⊘ Skipping ${resourceKind}/${resourceName} (validation error, not retryable)\n`,
            );
            continue;
          }

          output.push(
            `↻ Retrying ${resourceKind}/${resourceName}...`,
          );

          try {
            await applyResource(kubeConfig, doc, namespace);
            output.push(" ✓\n");
            successCount++;
            errorCount--;
          } catch (retryError: any) {
            output.push(` ✗ (${retryError.message})\n`);
          }
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

// Helper function to apply a Kubernetes resource using REST API
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
    const cluster = kubeConfig.getCurrentCluster();
    if (!cluster) {
      throw new Error("No cluster configured");
    }

    const server = cluster.server;

    // Get the auth token - either from kubeConfig or from service account
    let token: string | null = null;
    try {
      const tokenPath = "/var/run/secrets/kubernetes.io/serviceaccount/token";
      token = await fs.readFile(tokenPath, "utf-8");
      console.log("[DEPLOY] Using in-cluster service account token");
    } catch {
      // Try to get token from kubeConfig
      const user = kubeConfig.getCurrentUser();
      if (user && user.token) {
        token = user.token;
        console.log("[DEPLOY] Using kubeConfig token");
      }
    }

    if (!token) {
      throw new Error("No authentication token available");
    }

    // Construct API path
    const apiPath = buildApiPath(kind, apiVersion, resourceNamespace, name);
    console.log(`[DEPLOY] Using REST API path: ${apiPath}`);

    // Try to create first, then patch if it exists
    await createOrPatchResource(server, apiPath, resource, token);

    console.log(`[DEPLOY] ✓ Applied ${kind}/${name}`);
  } catch (error: any) {
    console.error(`[DEPLOY] Error applying ${kind}/${name}:`, error.message);
    throw error;
  }
}

function buildApiPath(
  kind: string,
  apiVersion: string,
  namespace: string,
  name: string
): string {
  if (kind === "Namespace") {
    return `/api/v1/namespaces/${name}`;
  }

  const plural = getPluralForm(kind);

  if (apiVersion === "v1") {
    return `/api/v1/namespaces/${namespace}/${plural}/${name}`;
  } else if (apiVersion.startsWith("apps/")) {
    return `/apis/apps/v1/namespaces/${namespace}/${plural}/${name}`;
  } else if (apiVersion.startsWith("batch/")) {
    return `/apis/batch/v1/namespaces/${namespace}/${plural}/${name}`;
  } else if (apiVersion.startsWith("networking.k8s.io/")) {
    return `/apis/networking.k8s.io/v1/namespaces/${namespace}/${plural}/${name}`;
  } else if (apiVersion.startsWith("rbac.authorization.k8s.io/")) {
    return `/apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/${plural}/${name}`;
  } else if (apiVersion.includes("/")) {
    const [group, version] = apiVersion.split("/");
    return `/apis/${group}/${version}/namespaces/${namespace}/${plural}/${name}`;
  }

  return `/api/v1/namespaces/${namespace}/${plural}/${name}`;
}

function getPluralForm(kind: string): string {
  const pluralMap: Record<string, string> = {
    Role: "roles",
    RoleBinding: "rolebindings",
    ClusterRole: "clusterroles",
    ClusterRoleBinding: "clusterrolebindings",
    Certificate: "certificates",
    HTTPRoute: "httproutes",
    Schedule: "schedules",
    Deployment: "deployments",
    Service: "services",
    Pod: "pods",
    ConfigMap: "configmaps",
    Secret: "secrets",
    Namespace: "namespaces",
    NetworkPolicy: "networkpolicies",
  };

  return pluralMap[kind] || kind.toLowerCase() + "s";
}

async function callKubernetesApi(
  server: string,
  apiPath: string,
  resource: any,
  token: string,
  method: string = "PUT"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(server + apiPath);
    const options: https.RequestOptions = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      rejectUnauthorized: false,
    };

    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const status = res.statusCode || 0;
        if (status >= 200 && status < 300) {
          console.log(`[DEPLOY] REST API response: ${status}`);
          resolve();
        } else if (status === 404 && method === "PUT") {
          // Try POST if PUT returns 404
          console.log(`[DEPLOY] Resource not found (404), trying POST...`);
          createResource(server, apiPath, resource, token)
            .then(resolve)
            .catch(reject);
        } else if (status === 409) {
          // Conflict - already exists, treat as success
          console.log(`[DEPLOY] Resource already exists (409), treating as success`);
          resolve();
        } else {
          const error = tryParseJsonError(data);
          reject(new Error(`API returned ${status}: ${error}`));
        }
      });
    });

    req.on("error", reject);
    req.write(JSON.stringify(resource));
    req.end();
  });
}

function tryParseJsonError(data: string): string {
  try {
    const json = JSON.parse(data);
    return json.message || JSON.stringify(json).substring(0, 200);
  } catch {
    return data.substring(0, 200);
  }
}

async function createResource(
  server: string,
  apiPath: string,
  resource: any,
  token: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Remove resource name from path for POST
    const createPath = apiPath.substring(0, apiPath.lastIndexOf("/"));
    const url = new URL(server + createPath);
    const options: https.RequestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      rejectUnauthorized: false,
    };

    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const status = res.statusCode || 0;
        if (status >= 200 && status < 300) {
          console.log(`[DEPLOY] Create response: ${status}`);
          resolve();
        } else {
          reject(new Error(`Create failed with ${status}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(JSON.stringify(resource));
    req.end();
  });
}
