import { ContainerConfig } from "@/components/ContainerConfiguration";
import {
  generatePodYAML,
  generateDeploymentYAML,
  generateReplicaSetYAML,
  generateStatefulSetYAML,
  generateJobYAML,
  generateCronJobYAML,
} from "./yaml-builder";

interface WorkloadContainer extends ContainerConfig {
  id: string;
}

interface Workload {
  id: string;
  name: string;
  type: string;
  containers?: WorkloadContainer[];
  config?: Record<string, any>;
}

interface GlobalConfig {
  namespace: string;
  domain: string;
  requestsPerSecond?: string;
  resourceQuota?: Record<string, any>;
}

interface TemplateGenerationResult {
  clusterIpServices: string[];
  httpRoute: string | null;
  workloadPortMappings: Record<string, number[]>;
  workloads: string[];
  namespace?: string;
  rateLimit?: string;
  resourceQuota?: string;
  networkPolicy?: string;
  rbac?: string;
  certificate?: string;
  backupSchedule?: string;
}

interface GenerateTemplatesOptions {
  userCreatedClusterIPNames?: string[];
}

export function generateTemplates(
  workloads: Workload[],
  globalConfig: GlobalConfig,
  createClusterIP: boolean,
  createHTTPRoute: boolean,
  options?: GenerateTemplatesOptions,
): TemplateGenerationResult {
  const result: TemplateGenerationResult = {
    clusterIpServices: [],
    httpRoute: null,
    workloadPortMappings: {},
    workloads: [],
  };

  if (!createClusterIP && !createHTTPRoute) {
    return result;
  }

  // Extract container ports from all workloads
  const workloadPortMappings: Record<string, number[]> = {};
  workloads.forEach((workload) => {
    const ports: number[] = [];
    if (workload.containers) {
      workload.containers.forEach((container) => {
        if (container.ports && container.ports.length > 0) {
          container.ports.forEach((port) => {
            if (port.containerPort && !ports.includes(port.containerPort)) {
              ports.push(port.containerPort);
            }
          });
        }
      });
    }
    workloadPortMappings[workload.name] = ports;
  });

  result.workloadPortMappings = workloadPortMappings;

  // Generate Workload YAML (Pods, Deployments, etc.)
  workloads.forEach((workload) => {
    const workloadConfig = workload.config || {};
    const containers = workload.containers || [];

    // Transform config based on workload type
    const transformedConfig = transformWorkloadConfig(
      workload.type,
      workloadConfig,
    );

    let workloadYaml = "";
    switch (workload.type) {
      case "Pod":
        workloadYaml = generatePodYAML(
          workload.name,
          transformedConfig,
          containers,
          globalConfig.namespace,
        );
        break;
      case "Deployment":
        workloadYaml = generateDeploymentYAML(
          workload.name,
          transformedConfig,
          containers,
          globalConfig.namespace,
        );
        break;
      case "ReplicaSet":
        workloadYaml = generateReplicaSetYAML(
          workload.name,
          transformedConfig,
          containers,
          globalConfig.namespace,
        );
        break;
      case "StatefulSet":
        workloadYaml = generateStatefulSetYAML(
          workload.name,
          transformedConfig,
          containers,
          globalConfig.namespace,
        );
        break;
      case "Job":
        workloadYaml = generateJobYAML(
          workload.name,
          transformedConfig,
          containers,
          globalConfig.namespace,
        );
        break;
      case "CronJob":
        workloadYaml = generateCronJobYAML(
          workload.name,
          transformedConfig,
          containers,
          globalConfig.namespace,
        );
        break;
    }

    if (workloadYaml) {
      result.workloads.push(workloadYaml);
    }
  });

  // Generate ClusterIP services
  if (createClusterIP) {
    workloads.forEach((workload) => {
      const ports = workloadPortMappings[workload.name];
      if (ports.length > 0) {
        const clusterIpYaml = generateClusterIPService(
          workload.name,
          globalConfig.namespace,
          ports,
        );
        result.clusterIpServices.push(clusterIpYaml);
      }
    });
  }

  // Generate single HTTPRoute with all workloads/ClusterIPs as backend refs
  if (createHTTPRoute) {
    const workloadsWithPorts = workloads.filter(
      (w) => workloadPortMappings[w.name]?.length > 0,
    );

    if (workloadsWithPorts.length > 0) {
      result.httpRoute = generateHTTPRoute(
        workloadsWithPorts,
        globalConfig.namespace,
        globalConfig.domain,
        options?.userCreatedClusterIPNames,
      );
    }
  }

  // Generate Namespace
  result.namespace = generateNamespace(globalConfig.namespace);

  // Generate Rate Limit ConfigMap if configured
  if (globalConfig.requestsPerSecond) {
    result.rateLimit = generateRateLimit(
      globalConfig.namespace,
      globalConfig.requestsPerSecond,
    );
  }

  // Generate Resource Quota if configured
  if (
    globalConfig.resourceQuota &&
    Object.keys(globalConfig.resourceQuota).length > 0
  ) {
    result.resourceQuota = generateResourceQuota(
      globalConfig.namespace,
      globalConfig.resourceQuota,
    );
  }

  // Generate Network Policy
  result.networkPolicy = generateNetworkPolicy(globalConfig.namespace);

  // Generate RBAC
  result.rbac = generateRBAC(globalConfig.namespace);

  // Generate Certificate if domain is specified
  if (globalConfig.domain) {
    result.certificate = generateCertificate(
      globalConfig.namespace,
      globalConfig.domain,
      "production",
    );
  }

  // Generate Backup Schedule
  result.backupSchedule = generateBackupSchedule(globalConfig.namespace);

  return result;
}

function generateClusterIPService(
  workloadName: string,
  namespace: string,
  ports: number[],
): string {
  const serviceName = `${workloadName.toLowerCase()}-clusterip`;
  const appLabel = workloadName.toLowerCase();

  const portSpecs = ports
    .map(
      (port) => `    - port: ${port}
      targetPort: ${port}`,
    )
    .join("\n");

  return `apiVersion: v1
kind: Service
metadata:
  name: ${serviceName}
  namespace: ${namespace}
spec:
  selector:
    app: ${appLabel}
  ports:
${portSpecs}
  type: ClusterIP`;
}

function generateHTTPRoute(
  workloads: Workload[],
  namespace: string,
  domain: string,
  userCreatedClusterIPNames?: string[],
): string {
  const routeName = `${namespace}-route`;

  const backendRefs = workloads
    .map((w, index) => {
      // Use user-created ClusterIP name if available, otherwise generate one
      const serviceName =
        userCreatedClusterIPNames?.[index] ||
        `${w.name.toLowerCase()}-clusterip`;
      return `        - name: ${serviceName}\n          port: 80`;
    })
    .join("\n");

  // Build hostnames section - only include if domain is specified
  let hostnamesSection = "";
  if (domain && domain.trim()) {
    hostnamesSection = `  hostnames:\n    - ${domain}\n`;
  }

  return `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ${routeName}
  namespace: ${namespace}
spec:
  parentRefs:
    - name: platform-gateway
      namespace: envoy-gateway-system
${hostnamesSection}  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
${backendRefs}`;
}

function generateNamespace(namespace: string): string {
  return `apiVersion: v1
kind: Namespace
metadata:
  name: ${namespace}`;
}

function generateRateLimit(
  namespace: string,
  requestsPerSecond: string,
): string {
  return `apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: ${namespace}-ratelimit
  namespace: ${namespace}
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: ${namespace}-route
  rateLimit:
    local:
      rules:
          limit:
            requests: ${requestsPerSecond}
            unit: Second
  timeout:
    http:
      requestTimeout: 5s
      connectionIdleTimeout: 30s
  retry:
    numRetries: 2
    retryOn:
      triggers:
        - 5xx
        - gateway-error
        - connect-failure
    perRetry:
      backoff:
        baseInterval: 100ms
        maxInterval: 1s`;
}

function generateResourceQuota(
  namespace: string,
  quota: Record<string, any>,
): string {
  const limits: Record<string, string> = {};

  if (quota.requestsCPU) limits["requests.cpu"] = quota.requestsCPU;
  if (quota.requestsMemory) limits["requests.memory"] = quota.requestsMemory;
  if (quota.limitsCPU) limits["limits.cpu"] = quota.limitsCPU;
  if (quota.limitsMemory) limits["limits.memory"] = quota.limitsMemory;
  if (quota.requestsStorage) limits["requests.storage"] = quota.requestsStorage;
  if (quota.persistentVolumeClaimsLimit)
    limits["persistentvolumeclaims"] = quota.persistentVolumeClaimsLimit;

  const limitsYaml = Object.entries(limits)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join("\n");

  return `apiVersion: v1
kind: ResourceQuota
metadata:
  name: namespace-quota
  namespace: ${namespace}
spec:
  hard:
${limitsYaml}`;
}

function generateNetworkPolicy(namespace: string): string {
  return `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: isolate-${namespace}
  namespace: ${namespace}
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector: {}
        - namespaceSelector:
            matchLabels:
              name: envoy-gateway-system
  egress:
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.42.0.0/16
              - 10.43.0.0/16`;
}

function generateRBAC(namespace: string): string {
  return `apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
  namespace: ${namespace}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: default-role
  namespace: ${namespace}
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: default-rolebinding
  namespace: ${namespace}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: default-role
subjects:
  - kind: ServiceAccount
    name: default
    namespace: ${namespace}`;
}

function generateCertificate(
  namespace: string,
  domain: string,
  environment: "staging" | "production" = "production",
): string {
  const issuer =
    environment === "production" ? "letsencrypt-prod" : "letsencrypt-staging";

  return `apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ${namespace}-cert-${environment}
  namespace: ${namespace}
spec:
  secretName: ${namespace}-tls-${environment}
  issuerRef:
    name: ${issuer}
    kind: ClusterIssuer
  dnsNames:
    - ${domain}
    - "*.${domain}"`;
}

function generateBackupSchedule(namespace: string): string {
  return `apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: ${namespace}-daily
  namespace: velero
spec:
  schedule: "0 0 * * *"
  template:
    ttl: 720h
    includedNamespaces:
      - ${namespace}
    snapshotVolumes: true
    includeClusterResources: false`;
}

function transformWorkloadConfig(
  type: string,
  config: Record<string, any>,
): Record<string, any> {
  if (type === "Pod") {
    const transformed: Record<string, any> = {};
    for (const [key, value] of Object.entries(config)) {
      if (key.startsWith("pod")) {
        const newKey = key.slice(3);
        const lowerKey = newKey.charAt(0).toLowerCase() + newKey.slice(1);
        transformed[lowerKey] = value;
      } else {
        transformed[key] = value;
      }
    }
    return transformed;
  }

  const prefix =
    type === "Deployment"
      ? "deployment"
      : type === "ReplicaSet"
        ? "replicaSet"
        : type === "StatefulSet"
          ? "statefulSet"
          : type === "Job"
            ? "job"
            : type === "CronJob"
              ? "cronJob"
              : "";

  if (!prefix) return config;

  const transformed: Record<string, any> = {};

  for (const [key, value] of Object.entries(config)) {
    if (key.startsWith(prefix)) {
      const newKey = key.slice(prefix.length);
      const lowerKey = newKey.charAt(0).toLowerCase() + newKey.slice(1);
      transformed[lowerKey] = value;
    } else {
      transformed[key] = value;
    }
  }

  // For CronJob, include the Job Template configuration
  if (type === "CronJob") {
    if (!transformed.spec) {
      transformed.spec = {};
    }

    // Build Job Template from job-prefixed config keys
    const jobTemplate: Record<string, any> = {};
    const jobSpec: Record<string, any> = {};
    const jobMetadata: Record<string, any> = {};

    for (const [key, value] of Object.entries(config)) {
      if (key.startsWith("job")) {
        const jobKey = key.slice(3); // Remove "job" prefix
        const lowerKey = jobKey.charAt(0).toLowerCase() + jobKey.slice(1);

        if (lowerKey === "spec") {
          Object.assign(jobSpec, value);
        } else if (lowerKey === "template") {
          jobTemplate.template = value;
        } else if (
          lowerKey === "labels" ||
          lowerKey === "annotations" ||
          lowerKey === "namespace" ||
          lowerKey === "ownerReferences" ||
          lowerKey === "deletionGracePeriodSeconds"
        ) {
          jobMetadata[lowerKey] = value;
        }
      }
    }

    // Assemble the job template structure
    if (
      Object.keys(jobTemplate).length > 0 ||
      Object.keys(jobSpec).length > 0 ||
      Object.keys(jobMetadata).length > 0
    ) {
      transformed.spec.jobTemplate = {
        metadata: jobMetadata,
        spec: jobSpec,
        ...jobTemplate,
      };
    }
  }

  return transformed;
}

export function combineYamlDocuments(result: TemplateGenerationResult): string {
  // Only show ClusterIP and HTTPRoute to the user
  const documents: string[] = [];

  result.clusterIpServices.forEach((service) => {
    documents.push(service);
  });

  if (result.httpRoute) {
    documents.push(result.httpRoute);
  }

  return documents.join("\n---\n");
}

export function combineAllYamlDocuments(
  result: TemplateGenerationResult,
): string {
  // Include all templates for backend deployment
  const documents: string[] = [];

  if (result.namespace) {
    documents.push(result.namespace);
  }

  // Include actual workloads (Pods, Deployments, etc.)
  result.workloads.forEach((workload) => {
    documents.push(workload);
  });

  result.clusterIpServices.forEach((service) => {
    documents.push(service);
  });

  if (result.httpRoute) {
    documents.push(result.httpRoute);
  }

  if (result.rateLimit) {
    documents.push(result.rateLimit);
  }

  if (result.resourceQuota) {
    documents.push(result.resourceQuota);
  }

  if (result.networkPolicy) {
    documents.push(result.networkPolicy);
  }

  if (result.rbac) {
    documents.push(result.rbac);
  }

  if (result.certificate) {
    documents.push(result.certificate);
  }

  if (result.backupSchedule) {
    documents.push(result.backupSchedule);
  }

  return documents.join("\n---\n");
}
