interface SecurityCheck {
  name: string;
  severity: "error" | "warning" | "info";
  message: string;
  description: string;
}

interface SecurityReport {
  valid: boolean;
  checks: SecurityCheck[];
  errors: SecurityCheck[];
  warnings: SecurityCheck[];
  summary: string;
}

export function validateHelmChart(
  chartPath: string,
  helmValues: Record<string, any>,
): SecurityReport {
  const checks: SecurityCheck[] = [];

  // Check 1: Verify image security
  if (helmValues.image?.repository) {
    // Warn if using latest tag (not recommended)
    if (!helmValues.image.tag || helmValues.image.tag === "latest") {
      checks.push({
        name: "image-tag",
        severity: "warning",
        message: "Container image tag is 'latest' or unspecified",
        description:
          "Using 'latest' tag can lead to unexpected behavior when images are updated. Specify explicit version tags for production deployments.",
      });
    }

    // Warn if using Docker Hub without explicit registry (security risk)
    const imageRepo = helmValues.image.repository;
    if (
      !imageRepo.includes("/") ||
      (imageRepo.includes("/") &&
        !imageRepo.includes(".") &&
        !imageRepo.includes("localhost"))
    ) {
      checks.push({
        name: "image-registry",
        severity: "warning",
        message: "Using Docker Hub without explicit registry specification",
        description:
          "Explicitly specify a trusted registry (e.g., quay.io/myorg/myimage) instead of relying on Docker Hub defaults for production deployments.",
      });
    }
  } else {
    checks.push({
      name: "image-missing",
      severity: "error",
      message: "Container image not specified",
      description:
        "The deployment must specify a valid container image in the values.",
    });
  }

  // Check 2: Security Context
  if (!helmValues.securityContext?.runAsNonRoot) {
    checks.push({
      name: "security-context-user",
      severity: "warning",
      message: "Container may run as root user",
      description:
        "Set securityContext.runAsNonRoot: true and specify a non-root user (uid > 1000) for better security.",
    });
  }

  if (!helmValues.securityContext?.readOnlyRootFilesystem) {
    checks.push({
      name: "security-context-filesystem",
      severity: "warning",
      message: "Root filesystem is writable",
      description:
        "Set securityContext.readOnlyRootFilesystem: true to prevent unwanted file modifications in production.",
    });
  }

  if (helmValues.securityContext?.allowPrivilegeEscalation !== false) {
    checks.push({
      name: "security-context-privilege",
      severity: "warning",
      message: "Privilege escalation is not explicitly disabled",
      description:
        "Set securityContext.allowPrivilegeEscalation: false to prevent potential privilege escalation attacks.",
    });
  }

  // Check 3: Resource Limits
  if (
    !helmValues.resources?.limits?.cpu ||
    !helmValues.resources?.limits?.memory
  ) {
    checks.push({
      name: "resource-limits",
      severity: "warning",
      message: "Container resource limits not fully defined",
      description:
        "Define both CPU and memory limits (e.g., limits.cpu: '500m', limits.memory: '512Mi') to prevent resource exhaustion.",
    });
  }

  if (
    !helmValues.resources?.requests?.cpu ||
    !helmValues.resources?.requests?.memory
  ) {
    checks.push({
      name: "resource-requests",
      severity: "warning",
      message: "Container resource requests not fully defined",
      description:
        "Define both CPU and memory requests to ensure proper scheduling and resource allocation.",
    });
  }

  // Check 4: Health Checks
  if (!helmValues.livenessProbe) {
    checks.push({
      name: "liveness-probe",
      severity: "warning",
      message: "Liveness probe not configured",
      description:
        "Configure a liveness probe to automatically restart unhealthy containers.",
    });
  }

  if (!helmValues.readinessProbe) {
    checks.push({
      name: "readiness-probe",
      severity: "warning",
      message: "Readiness probe not configured",
      description:
        "Configure a readiness probe to properly manage traffic to healthy pods.",
    });
  }

  // Check 5: Service Account and RBAC
  if (!helmValues.serviceAccount?.create && !helmValues.serviceAccount?.name) {
    checks.push({
      name: "service-account",
      severity: "info",
      message: "Using default service account",
      description:
        "Create a dedicated service account with minimal required permissions following the principle of least privilege.",
    });
  }

  // Check 6: Secrets Management
  if (helmValues.env) {
    const envArray = Array.isArray(helmValues.env)
      ? helmValues.env
      : Object.entries(helmValues.env);
    for (const env of envArray) {
      const envName =
        typeof env === "object" ? env.name || "" : env.split("=")[0];
      const envValue =
        typeof env === "object" ? env.value || "" : env.split("=")[1] || "";

      // Check for hardcoded secrets
      if (
        /^(password|secret|token|key|credential|api_key|apikey)/i.test(
          envName,
        ) &&
        envValue &&
        typeof envValue === "string" &&
        envValue.length > 0
      ) {
        checks.push({
          name: "hardcoded-secret",
          severity: "error",
          message: `Hardcoded secret detected in environment variable: ${envName}`,
          description:
            "Use Kubernetes Secrets or external secret management solutions (e.g., Sealed Secrets, Vault) instead of hardcoding secrets in values.",
        });
      }
    }
  }

  // Check 7: Replica Count for HA
  if (!helmValues.replicaCount || helmValues.replicaCount < 2) {
    checks.push({
      name: "replica-count",
      severity: "warning",
      message: "Single replica configured - no high availability",
      description:
        "Set replicaCount >= 2 and configure pod disruption budgets and affinity rules for production deployments.",
    });
  }

  // Check 8: Image Pull Secrets (for private registries)
  if (
    helmValues.image?.repository &&
    (helmValues.image.repository.includes("private") ||
      helmValues.image.repository.includes("internal"))
  ) {
    if (
      !helmValues.imagePullSecrets ||
      helmValues.imagePullSecrets.length === 0
    ) {
      checks.push({
        name: "image-pull-secret",
        severity: "error",
        message: "Private image registry without imagePullSecrets configured",
        description:
          "Configure imagePullSecrets to authenticate with private container registries.",
      });
    }
  }

  // Check 9: Ingress/Service Configuration (referencing Advanced Config templates)
  if (!helmValues.service?.type) {
    checks.push({
      name: "service-type",
      severity: "info",
      message: "Service type not specified",
      description:
        "Configure an appropriate service type (ClusterIP, NodePort, LoadBalancer) for your deployment pattern.",
    });
  }

  if (
    helmValues.ingress?.enabled !== false &&
    !helmValues.ingress?.hosts?.length
  ) {
    checks.push({
      name: "ingress-hosts",
      severity: "warning",
      message: "Ingress enabled without hosts configured",
      description:
        "Configure ingress hosts and TLS certificates following the HTTPRoute pattern from Advanced Config templates.",
    });
  }

  // Check 10: Pod Disruption Budget (for production)
  if (!helmValues.podDisruptionBudget) {
    checks.push({
      name: "pod-disruption-budget",
      severity: "info",
      message: "Pod Disruption Budget not configured",
      description:
        "Configure a Pod Disruption Budget for production deployments to ensure availability during cluster maintenance.",
    });
  }

  // Separate checks by severity
  const errors = checks.filter((c) => c.severity === "error");
  const warnings = checks.filter((c) => c.severity === "warning");
  const infos = checks.filter((c) => c.severity === "info");

  const summary =
    errors.length > 0
      ? `Security check failed: ${errors.length} critical error(s) found. Fix these before deployment.`
      : warnings.length > 0
        ? `Security check passed with ${warnings.length} warning(s). Review recommendations for production readiness.`
        : `Security check passed with ${infos.length} info(s). All critical security checks passed.`;

  return {
    valid: errors.length === 0,
    checks,
    errors,
    warnings,
    summary,
  };
}

export function parseHelmValues(helmCommand: string): Record<string, any> {
  const values: Record<string, any> = {};

  // Parse helm values from command line flags
  // Format: helm upgrade --install my-release mychart --set key1=value1 --set key2=value2
  const setMatches = helmCommand.match(/--set\s+([^\s=]+)=([^\s]*)/g);
  if (setMatches) {
    setMatches.forEach((match) => {
      const [key, value] = match.replace("--set", "").trim().split("=");
      if (key && value) {
        // Handle nested keys like image.repository
        const keys = key.split(".");
        let current = values;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      }
    });
  }

  // Parse helm values from --values file references (if present)
  const valuesFileMatches = helmCommand.match(/--values\s+([^\s]+)/g);
  if (valuesFileMatches) {
    // Note: In actual implementation, you would read these files
    // For now, we'll note that they exist
    values.__valuesFiles = valuesFileMatches;
  }

  return values;
}
