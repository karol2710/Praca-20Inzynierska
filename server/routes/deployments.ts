import { RequestHandler } from "express";
import { query } from "../db";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as k8s from "@kubernetes/client-node";
import * as yaml from "js-yaml";
import https from "https";

interface DeploymentRecord {
  id: string;
  user_id: number;
  name: string;
  namespace: string;
  yaml_config: string;
  status: string;
  environment: string;
  created_at: string;
  workloads_count: number;
  resources_count: number;
}

// Resources that users are allowed to delete
const DELETABLE_RESOURCE_KINDS = new Set([
  "Pod",
  "Deployment",
  "StatefulSet",
  "ReplicaSet",
  "Job",
  "CronJob",
  "Service", // User-created ClusterIP services
  "HTTPRoute", // Auto-generated HTTPRoute can be deleted
]);

function isResourceDeletable(kind: string): boolean {
  return DELETABLE_RESOURCE_KINDS.has(kind);
}

// Get all deployments for current user
export const handleGetDeployments: RequestHandler = async (req, res) => {
  const user = (req as any).user;

  if (!user || !user.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await query(
      `SELECT id, name, namespace, yaml_config, status, environment, created_at, workloads_count, resources_count
       FROM deployments
       WHERE user_id = $1 AND status != 'deleted'
       ORDER BY created_at DESC`,
      [user.userId],
    );

    const deployments = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      namespace: row.namespace,
      status: row.status || "active",
      environment: row.environment || "production",
      createdAt: row.created_at,
      workloads: row.workloads_count || 0,
      resources: row.resources_count || 0,
    }));

    res.status(200).json({ deployments });
  } catch (error) {
    console.error("Get deployments error:", error);
    res.status(500).json({ error: "Failed to fetch deployments" });
  }
};

// Get deployment YAML
export const handleGetDeploymentYaml: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { deploymentId } = req.params;

  if (!user || !user.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await query(
      `SELECT yaml_config FROM deployments 
       WHERE id = $1 AND user_id = $2`,
      [deploymentId, user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    res.status(200).json({
      yaml: result.rows[0].yaml_config,
    });
  } catch (error) {
    console.error("Get deployment YAML error:", error);
    res.status(500).json({ error: "Failed to fetch deployment YAML" });
  }
};

// Delete deployment
export const handleDeleteDeployment: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { deploymentId } = req.params;

  if (!user || !user.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Verify ownership and get deployment YAML before deleting
    const result = await query(
      `SELECT yaml_config, namespace FROM deployments
       WHERE id = $1 AND user_id = $2`,
      [deploymentId, user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    const yamlConfig = result.rows[0].yaml_config;
    const namespace = result.rows[0].namespace;

    // Delete resources from cluster
    try {
      await deleteResourcesFromCluster(yamlConfig, namespace);
      console.log(
        `[DELETE] Successfully deleted resources for deployment ${deploymentId}`,
      );
    } catch (deleteError: any) {
      console.error(
        `[DELETE] Error deleting resources: ${deleteError.message}`,
      );
      // Continue with database update even if cluster deletion fails
    }

    // Update deployment status to deleted instead of hard delete
    await query(`UPDATE deployments SET status = 'deleted' WHERE id = $1`, [
      deploymentId,
    ]);

    res.status(200).json({
      success: true,
      message: "Deployment deleted successfully",
    });
  } catch (error) {
    console.error("Delete deployment error:", error);
    res.status(500).json({ error: "Failed to delete deployment" });
  }
};

// Helper function to delete resources from cluster
async function deleteResourcesFromCluster(
  yamlConfig: string,
  namespace: string,
): Promise<void> {
  // Initialize Kubernetes client
  let kc = new k8s.KubeConfig();
  let kubeConfig: any = null;

  // Check if we're running inside a Kubernetes cluster
  const isInClusterEnv =
    process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT;

  let isInClusterToken = false;
  try {
    fsSync.accessSync("/var/run/secrets/kubernetes.io/serviceaccount/token");
    isInClusterToken = true;
  } catch {
    isInClusterToken = false;
  }

  const isInCluster = isInClusterEnv || isInClusterToken;

  if (isInCluster) {
    try {
      kc.loadFromCluster();
      kubeConfig = kc;
      console.log("[DELETE] In-cluster Kubernetes authentication successful");
    } catch (inClusterError: any) {
      console.error("[DELETE] In-cluster config error:", inClusterError);
      throw new Error("Failed to authenticate with Kubernetes cluster");
    }
  } else {
    // Fallback to user-configured Rancher credentials
    throw new Error(
      "Cannot delete: Not running inside Kubernetes cluster and no Rancher credentials configured",
    );
  }

  // Parse and delete YAML documents (in reverse order to handle dependencies)
  const yamlDocuments = yamlConfig.split(/^---$/m).filter((doc) => doc.trim());

  console.log(`[DELETE] Deleting ${yamlDocuments.length} resources...`);

  // Delete in reverse order (last deployed first)
  for (let i = yamlDocuments.length - 1; i >= 0; i--) {
    const yamlDoc = yamlDocuments[i].trim();

    try {
      const doc = yaml.load(yamlDoc) as any;

      if (!doc || !doc.kind) {
        console.log(`[DELETE] Skipping invalid YAML document`);
        continue;
      }

      const resourceKind = doc.kind;
      const resourceName = doc.metadata?.name || "unknown";
      const resourceNamespace = doc.metadata?.namespace || namespace;

      console.log(
        `[DELETE] Deleting ${resourceKind}/${resourceName} from namespace ${resourceNamespace}`,
      );

      try {
        await deleteResource(kubeConfig, doc, namespace);
        console.log(`[DELETE] ✓ Deleted ${resourceKind}/${resourceName}`);
      } catch (deleteError: any) {
        // Don't fail completely if a single resource deletion fails
        console.warn(
          `[DELETE] Warning deleting ${resourceKind}/${resourceName}: ${deleteError.message}`,
        );
      }
    } catch (parseError: any) {
      console.warn(
        `[DELETE] Warning parsing YAML document: ${parseError.message}`,
      );
    }
  }
}

// Helper function to delete a single Kubernetes resource
async function deleteResource(
  kubeConfig: k8s.KubeConfig,
  resource: any,
  defaultNamespace: string,
): Promise<void> {
  const kind = resource.kind;
  const apiVersion = resource.apiVersion || "v1";
  const name = resource.metadata?.name;
  const resourceNamespace = resource.metadata?.namespace || defaultNamespace;

  if (!name) {
    throw new Error(`${kind} resource missing metadata.name`);
  }

  try {
    const cluster = kubeConfig.getCurrentCluster();
    if (!cluster) {
      throw new Error("No cluster configured");
    }

    const server = cluster.server;

    // Get the auth token
    let token: string | null = null;
    try {
      const tokenPath = "/var/run/secrets/kubernetes.io/serviceaccount/token";
      token = await fs.readFile(tokenPath, "utf-8");
    } catch {
      const user = kubeConfig.getCurrentUser();
      if (user && user.token) {
        token = user.token;
      }
    }

    if (!token) {
      throw new Error("No authentication token available");
    }

    // Construct API path
    const apiPath = buildDeleteApiPath(
      kind,
      apiVersion,
      resourceNamespace,
      name,
    );
    console.log(`[DELETE] Using REST API path: ${apiPath}`);

    // Delete the resource
    await deleteViaRest(server, apiPath, token);

    console.log(`[DELETE] ✓ Deleted ${kind}/${name}`);
  } catch (error: any) {
    console.error(`[DELETE] Error deleting ${kind}/${name}:`, error.message);
    throw error;
  }
}

function buildDeleteApiPath(
  kind: string,
  apiVersion: string,
  namespace: string,
  name: string,
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
  } else if (apiVersion.startsWith("cert-manager.io/")) {
    return `/apis/cert-manager.io/v1/namespaces/${namespace}/${plural}/${name}`;
  } else if (apiVersion.startsWith("velero.io/")) {
    return `/apis/velero.io/v1/namespaces/${namespace}/${plural}/${name}`;
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
    GRPCRoute: "grpcroutes",
    BackendTrafficPolicy: "backendtrafficpolicies",
    Schedule: "schedules",
    Deployment: "deployments",
    Service: "services",
    Pod: "pods",
    ConfigMap: "configmaps",
    Secret: "secrets",
    Namespace: "namespaces",
    NetworkPolicy: "networkpolicies",
    ServiceAccount: "serviceaccounts",
    ResourceQuota: "resourcequotas",
  };

  return pluralMap[kind] || kind.toLowerCase() + "s";
}

async function deleteViaRest(
  server: string,
  apiPath: string,
  token: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(server + apiPath);

    const options: https.RequestOptions = {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      rejectUnauthorized: false,
    };

    console.log(`[DELETE] DELETE request to: ${url.href}`);

    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const status = res.statusCode || 0;
        console.log(`[DELETE] DELETE response status: ${status}`);

        if (status >= 200 && status < 300) {
          resolve();
        } else if (status === 404) {
          // Resource not found is OK (already deleted)
          console.log("[DELETE] Resource not found (404), treating as success");
          resolve();
        } else {
          const error = tryParseJsonError(data);
          reject(new Error(`Delete failed with ${status}: ${error}`));
        }
      });
    });

    req.on("error", (err) => {
      console.error(`[DELETE] Request error: ${err.message}`);
      reject(err);
    });
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

// Get deployment for editing
export const handleGetDeploymentForEdit: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { deploymentId } = req.params;

  if (!user || !user.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await query(
      `SELECT deployment_config FROM deployments
       WHERE id = $1 AND user_id = $2`,
      [deploymentId, user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    const deploymentConfig = result.rows[0].deployment_config;

    if (!deploymentConfig) {
      return res.status(400).json({
        error:
          "Deployment configuration not available. This deployment was created before edit feature was added.",
      });
    }

    res.status(200).json(deploymentConfig);
  } catch (error) {
    console.error("Get deployment for edit error:", error);
    res.status(500).json({ error: "Failed to fetch deployment configuration" });
  }
};

// Update deployment
export const handleUpdateDeployment: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { deploymentId } = req.params;

  if (!user || !user.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Verify ownership
    const deploymentResult = await query(
      `SELECT namespace, yaml_config FROM deployments
       WHERE id = $1 AND user_id = $2`,
      [deploymentId, user.userId],
    );

    if (deploymentResult.rows.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    const namespace = deploymentResult.rows[0].namespace;
    const oldYamlConfig = deploymentResult.rows[0].yaml_config;

    const {
      workloads,
      resources,
      globalNamespace,
      globalDomain,
      requestsPerSecond,
      resourceQuota,
      _fullYaml,
    } = req.body;

    // Validate
    if (!workloads || !Array.isArray(workloads) || workloads.length === 0) {
      return res.status(400).json({
        error: "At least one workload is required",
      });
    }

    // Note: globalNamespace must stay the same - no changing namespace
    if (globalNamespace !== namespace) {
      return res.status(400).json({
        error: "Cannot change deployment namespace",
      });
    }

    const deploymentConfig = {
      workloads,
      resources,
      globalNamespace,
      globalDomain,
      requestsPerSecond: requestsPerSecond || "",
      resourceQuota: resourceQuota || {},
    };

    // Update deployment in database
    await query(
      `UPDATE deployments
       SET deployment_config = $1, yaml_config = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [
        JSON.stringify(deploymentConfig),
        _fullYaml || oldYamlConfig,
        deploymentId,
      ],
    );

    res.status(200).json({
      success: true,
      message: "Deployment updated successfully",
      deploymentId,
    });
  } catch (error) {
    console.error("Update deployment error:", error);
    res.status(500).json({ error: "Failed to update deployment" });
  }
};

// Get all deployed resources for a deployment
export const handleGetDeploymentResources: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { deploymentId } = req.params;

  if (!user || !user.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await query(
      `SELECT yaml_config FROM deployments
       WHERE id = $1 AND user_id = $2`,
      [deploymentId, user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    const yamlConfig = result.rows[0].yaml_config;
    const resources: any[] = [];

    // Parse YAML documents to extract resources
    const yamlDocuments = yamlConfig.split(/^---$/m).filter((doc) => doc.trim());

    for (const doc of yamlDocuments) {
      try {
        const resource = yaml.load(doc) as any;
        if (resource && resource.kind && resource.metadata?.name) {
          resources.push({
            kind: resource.kind,
            name: resource.metadata.name,
            namespace: resource.metadata.namespace || "default",
            apiVersion: resource.apiVersion || "v1",
            deletable: isResourceDeletable(resource.kind),
          });
        }
      } catch {
        // Skip invalid YAML documents
      }
    }

    res.status(200).json({ resources });
  } catch (error) {
    console.error("Get deployment resources error:", error);
    res.status(500).json({ error: "Failed to fetch deployment resources" });
  }
};

// Delete a specific resource from deployment
export const handleDeleteDeploymentResource: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { deploymentId } = req.params;
  const { kind, name, namespace } = req.body;

  if (!user || !user.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!kind || !name || !namespace) {
    return res.status(400).json({ error: "Missing resource information" });
  }

  try {
    // Get deployment to verify ownership
    const result = await query(
      `SELECT namespace FROM deployments WHERE id = $1 AND user_id = $2`,
      [deploymentId, user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    // Initialize Kubernetes client
    let kc = new k8s.KubeConfig();

    const isInClusterEnv =
      process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT;

    let isInClusterToken = false;
    try {
      fsSync.accessSync("/var/run/secrets/kubernetes.io/serviceaccount/token");
      isInClusterToken = true;
    } catch {
      isInClusterToken = false;
    }

    const isInCluster = isInClusterEnv || isInClusterToken;

    if (isInCluster) {
      kc.loadFromCluster();
    } else {
      throw new Error("Cannot delete: Not running inside Kubernetes cluster");
    }

    // Create temporary resource object for deletion
    const resource = {
      kind,
      apiVersion: "v1",
      metadata: { name, namespace },
    };

    // Delete from cluster
    await deleteResource(kc, resource, namespace);

    res.status(200).json({
      success: true,
      message: `Resource ${kind}/${name} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete resource",
    });
  }
};
