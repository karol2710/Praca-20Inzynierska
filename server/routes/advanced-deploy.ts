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
    // Get user information from database
    const userResult = await query(
      `SELECT id, username, rancher_api_url, rancher_api_token, rancher_cluster_id
       FROM users WHERE id = $1`,
      [user.userId],
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

    const output: string[] = [];
    const namespace = globalNamespace;
    const deploymentDir = path.join(
      "/tmp",
      `deployment-${namespace}-${Date.now()}`,
    );

    output.push("=== Advanced Deployment Started ===\n");
    output.push(`Namespace: ${namespace}`);
    output.push(`Workloads: ${workloads.length}`);
    output.push(`Resources: ${resources.length}\n`);

    // Create deployment directory
    await fs.mkdir(deploymentDir, { recursive: true });
    output.push(`Created directory: ${deploymentDir}\n`);

    // Parse and write individual YAML files from full YAML
    if (_fullYaml) {
      const yamlDocuments = _fullYaml
        .split(/^---$/m)
        .filter((doc) => doc.trim());

      output.push(`=== Writing ${yamlDocuments.length} YAML files ===\n`);

      for (let i = 0; i < yamlDocuments.length; i++) {
        const yamlDoc = yamlDocuments[i].trim();
        const lines = yamlDoc.split("\n");

        // Extract kind and name from YAML
        let kind = "resource";
        let resourceName = "unknown";

        for (const line of lines) {
          if (line.includes("kind:")) {
            kind = line.split(":")[1].trim().toLowerCase();
          }
          if (
            line.includes("name:") &&
            (lines[lines.indexOf(line) - 1]?.includes("metadata") ||
              lines[lines.indexOf(line)].includes("metadata"))
          ) {
            resourceName = line.split(":")[1].trim();
            break;
          }
        }

        const fileName = `${i + 1}-${kind}-${resourceName}.yaml`;
        const filePath = path.join(deploymentDir, fileName);

        await fs.writeFile(filePath, yamlDoc + "\n");
        output.push(`✓ Created: ${fileName}`);
      }
    }

    output.push("\n=== Applying to Kubernetes Cluster ===\n");

    // Set kubectl context from Rancher credentials
    try {
      // Create kubeconfig with Rancher credentials
      const kubeconfigPath = path.join("/tmp", `kubeconfig-${Date.now()}`);
      const kubeconfig = {
        apiVersion: "v1",
        kind: "Config",
        clusters: [
          {
            name: "rancher-cluster",
            cluster: {
              server: userData.rancher_api_url,
              insecure_skip_tls_verify: true,
            },
          },
        ],
        contexts: [
          {
            name: "rancher-context",
            context: {
              cluster: "rancher-cluster",
              user: "rancher-user",
            },
          },
        ],
        "current-context": "rancher-context",
        users: [
          {
            name: "rancher-user",
            user: {
              token: userData.rancher_api_token,
            },
          },
        ],
      };

      await fs.writeFile(kubeconfigPath, JSON.stringify(kubeconfig, null, 2));

      // Apply all YAML files to the cluster
      const applyCmd = `KUBECONFIG=${kubeconfigPath} kubectl apply -f ${deploymentDir}`;
      const applyOutput = execSync(applyCmd, { encoding: "utf-8" });

      output.push("Kubernetes Deployment Output:");
      output.push(applyOutput);

      // Cleanup kubeconfig
      await fs.unlink(kubeconfigPath).catch(() => {});

      output.push("\n=== Deployment Successful ===\n");
      output.push(`All resources have been applied to namespace: ${namespace}`);
      output.push("Verify with: kubectl get all -n " + namespace);

      // Store deployment record
      await query(
        `INSERT INTO deployments (user_id, name, type, namespace, yaml_config, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.userId,
          `deployment-${Date.now()}`,
          "advanced",
          namespace,
          _fullYaml || generatedYaml || "",
          "deployed",
        ],
      );

      output.push("\n=== Deployment record saved to database ===\n");
    } catch (kubectlError: any) {
      output.push("⚠ kubectl error: " + kubectlError.message);
      output.push("\nYAML files have been created at: " + deploymentDir);
      output.push(
        "You can manually apply them with: kubectl apply -f " + deploymentDir,
      );

      // Still save the deployment record even if kubectl fails
      await query(
        `INSERT INTO deployments (user_id, name, type, namespace, yaml_config, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.userId,
          `deployment-${Date.now()}`,
          "advanced",
          namespace,
          _fullYaml || generatedYaml || "",
          "pending",
        ],
      );
    }

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
