import { RequestHandler } from "express";
import { execSync, spawnSync } from "child_process";
import { query } from "../db";
import { validateHelmChart, parseHelmValues } from "../security-validator";

interface DeployRequest {
  repository: string;
  helmInstall: string;
}

interface DeployResponse {
  success: boolean;
  output: string;
  error?: string;
  securityReport?: any;
}

interface SecurityCheckResponse {
  success: boolean;
  securityReport: any;
  error?: string;
}

// Validate input format and disallow dangerous patterns
const validateInput = (input: string, maxLength: number): { valid: boolean; error?: string } => {
  if (!input || typeof input !== "string") {
    return { valid: false, error: "Invalid input" };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return { valid: false, error: "Input length invalid" };
  }

  // Disallow shell metacharacters
  const dangerousPatterns = [';', '|', '&', '$', '`', '(', ')', '{', '}', '<', '>', '\n', '\r'];
  for (const pattern of dangerousPatterns) {
    if (trimmed.includes(pattern)) {
      return { valid: false, error: "Input contains disallowed characters" };
    }
  }

  return { valid: true };
};

// Validate repository format
const validateRepository = (input: string): { valid: boolean; name?: string; url?: string; error?: string } => {
  const validation = validateInput(input, 500);
  if (!validation.valid) {
    return { valid: false, error: validation.error };
  }

  const parts = input.trim().split(/\s+/);
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid repository format" };
  }

  const [name, url] = parts;

  // Validate name (alphanumeric, hyphens, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { valid: false, error: "Invalid repository name" };
  }

  // Validate URL
  try {
    new URL(url);
    if (!url.startsWith("https://")) {
      return { valid: false, error: "Repository URL must use HTTPS" };
    }
  } catch {
    return { valid: false, error: "Invalid repository URL" };
  }

  return { valid: true, name, url };
};

export const handleCheckSecurity: RequestHandler = async (req, res) => {
  const { repository, helmInstall } = req.body as DeployRequest;

  // Validate inputs
  const repoValidation = validateRepository(repository);
  if (!repoValidation.valid) {
    return res.status(400).json({
      success: false,
      securityReport: null,
      error: "Invalid repository configuration",
    } as SecurityCheckResponse);
  }

  const helmValidation = validateInput(helmInstall, 1000);
  if (!helmValidation.valid) {
    return res.status(400).json({
      success: false,
      securityReport: null,
      error: "Invalid helm install command",
    } as SecurityCheckResponse);
  }

  try {
    // Parse helm values from command
    const helmValues = parseHelmValues(helmInstall);

    // Run security validation
    const securityReport = validateHelmChart("", helmValues);

    res.status(200).json({
      success: true,
      securityReport,
    } as SecurityCheckResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      securityReport: null,
      error: "Security check failed",
    } as SecurityCheckResponse);
  }
};

export const handleDeploy: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { repository, helmInstall } = req.body as DeployRequest;

  // Validate inputs
  const repoValidation = validateRepository(repository);
  if (!repoValidation.valid) {
    return res.status(400).json({
      success: false,
      output: "",
      error: "Invalid repository configuration",
    } as DeployResponse);
  }

  const helmValidation = validateInput(helmInstall, 1000);
  if (!helmValidation.valid) {
    return res.status(400).json({
      success: false,
      output: "",
      error: "Invalid helm install command",
    } as DeployResponse);
  }

  try {
    const output: string[] = [];
    const { name: repoName, url: repoUrl } = repoValidation;

    output.push("=== Starting Helm Deployment ===\n");

    // Step 1: Add temporary helm repo using spawnSync (safer than execSync)
    output.push(`Adding helm repository: ${repoName}`);
    try {
      const addRepoResult = spawnSync("helm", ["repo", "add", repoName!, repoUrl!], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      if (addRepoResult.stdout) {
        output.push(addRepoResult.stdout);
      }
    } catch (error) {
      output.push(`Note: Repository might already exist or there was a warning (continuing)\n`);
    }

    // Update repo cache
    output.push("Updating helm repository cache...");
    try {
      const updateResult = spawnSync("helm", ["repo", "update"], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      if (updateResult.stdout) {
        output.push(updateResult.stdout);
      }
    } catch (error) {
      output.push("Helm repo update completed with warnings\n");
    }

    // Step 2: Deploy using helm upgrade --install with proper argument passing
    output.push(`\nDeploying: ${helmInstall}`);
    try {
      // Parse helm install command safely (already validated no shell metacharacters)
      const helmArgs = helmInstall.trim().split(/\s+/);
      const deployResult = spawnSync("helm", ["upgrade", "--install", ...helmArgs], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      if (deployResult.stdout) {
        output.push(deployResult.stdout);
      }
      if (deployResult.error) {
        throw new Error("Helm deployment failed");
      }
    } catch (error: any) {
      throw new Error("Helm upgrade failed");
    }

    // Step 3: Delete temporary helm repo
    output.push(`\nRemoving temporary repository: ${repoName}`);
    try {
      const removeResult = spawnSync("helm", ["repo", "remove", repoName!], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      if (removeResult.stdout) {
        output.push(removeResult.stdout);
      }
    } catch (error) {
      output.push(`Warning: Failed to remove repository\n`);
    }

    output.push("\n=== Helm Deployment Completed Successfully ===");

    res.status(200).json({
      success: true,
      output: output.join("\n"),
    } as DeployResponse);
  } catch (error: any) {
    // Don't expose detailed error messages to client
    res.status(500).json({
      success: false,
      output: "",
      error: "Deployment failed. Please check your inputs and try again.",
    } as DeployResponse);
  }
};
