import { RequestHandler } from "express";
import { query } from "@server/db";
import { generateYAMLManifest } from "@server/yaml-generator";

interface AdvancedDeployRequest {
  workloads: any[];
  resources: any[];
}

interface AdvancedDeployResponse {
  success: boolean;
  output: string;
  error?: string;
  namespace?: string;
}

export const handleAdvancedDeploy: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { workloads, resources } = req.body as AdvancedDeployRequest;

  if (!user || !user.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!workloads || !Array.isArray(workloads) || workloads.length === 0) {
    return res.status(400).json({
      error: "At least one workload is required",
    } as AdvancedDeployResponse);
  }

  try {
    // Get user information from database
    const userResult = await query(
      `SELECT id, username, namespace_counter, rancher_api_url, rancher_api_token, rancher_cluster_id 
       FROM users WHERE id = $1`,
      [user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userResult.rows[0];

    // Check if Rancher credentials are configured
    if (
      !userData.rancher_api_url ||
      !userData.rancher_api_token ||
      !userData.rancher_cluster_id
    ) {
      return res.status(400).json({
        error:
          "Rancher RKE2 cluster credentials not configured. Please set up your cluster in settings.",
      } as AdvancedDeployResponse);
    }

    // Increment namespace counter and create namespace
    const newCounter = (userData.namespace_counter || 0) + 1;
    const namespace = `${userData.username}-${newCounter}`;

    // Generate YAML manifest
    const yamlManifest = generateYAMLManifest(workloads, resources, namespace);

    const output: string[] = [];
    output.push("=== Advanced Deployment Started ===\n");
    output.push(`Namespace: ${namespace}`);
    output.push(`Workloads: ${workloads.length}`);
    output.push(`Resources: ${resources.length}\n`);

    output.push("=== Generated YAML Manifest ===\n");
    output.push(yamlManifest);
    output.push("\n=== Deployment Instructions ===\n");
    output.push(
      "YAML manifest has been generated. In a real deployment scenario:"
    );
    output.push("1. Create namespace: kubectl create namespace " + namespace);
    output.push("2. Apply manifest: kubectl apply -f manifest.yaml");
    output.push("3. Verify deployment: kubectl get all -n " + namespace);

    // Update user's namespace counter in database
    await query("UPDATE users SET namespace_counter = $1 WHERE id = $2", [
      newCounter,
      user.userId,
    ]);

    // Store deployment record
    await query(
      `INSERT INTO deployments (user_id, name, type, namespace, yaml_config, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.userId,
        `deployment-${Date.now()}`,
        "advanced",
        namespace,
        yamlManifest,
        "generated",
      ]
    );

    output.push(
      "\n=== Deployment saved to database ===\n"
    );
    output.push(
      `Note: To complete the deployment to your Rancher RKE2 cluster, please configure your cluster credentials in settings.`
    );

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
