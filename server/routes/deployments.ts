import { RequestHandler } from "express";
import { query } from "../db";

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
       WHERE user_id = $1 
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
    // Verify ownership before deleting
    const result = await query(
      `SELECT id FROM deployments 
       WHERE id = $1 AND user_id = $2`,
      [deploymentId, user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    // Update deployment status to deleted instead of hard delete
    await query(`UPDATE deployments SET status = 'deleted' WHERE id = $1`, [
      deploymentId,
    ]);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete deployment error:", error);
    res.status(500).json({ error: "Failed to delete deployment" });
  }
};
