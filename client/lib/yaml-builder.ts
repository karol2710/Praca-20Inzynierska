import YAML from "js-yaml";

export interface Container {
  id?: string;
  name: string;
  image: string;
  [key: string]: any;
}

function cleanEmptyValues(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === "" || key === "id") {
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      const nestedCleaned = cleanEmptyValues(value);
      if (Object.keys(nestedCleaned).length > 0) {
        cleaned[key] = nestedCleaned;
      }
    } else if (Array.isArray(value)) {
      const cleanedArray = value
        .map((item) => (typeof item === "object" && item !== null ? cleanEmptyValues(item) : item))
        .filter((item) => {
          if (typeof item === "object" && !Array.isArray(item)) {
            return Object.keys(item).length > 0;
          }
          return item !== null && item !== undefined && item !== "";
        });
      if (cleanedArray.length > 0) {
        cleaned[key] = cleanedArray;
      }
    } else if (typeof value === "boolean" || typeof value === "number") {
      cleaned[key] = value;
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

function buildContainerSpec(container: Container): Record<string, any> {
  const spec: Record<string, any> = {
    name: container.name,
    image: container.image,
  };

  if (container.imagePullPolicy) spec.imagePullPolicy = container.imagePullPolicy;
  if (container.args && container.args.length > 0) spec.args = container.args;
  if (container.command && container.command.length > 0) spec.command = container.command;
  if (container.stdin !== undefined) spec.stdin = container.stdin;
  if (container.stdinOnce !== undefined) spec.stdinOnce = container.stdinOnce;
  if (container.tty !== undefined) spec.tty = container.tty;

  if (container.lifecycle) {
    const lifecycle: Record<string, any> = {};
    if (container.lifecycle.postStart) lifecycle.postStart = container.lifecycle.postStart;
    if (container.lifecycle.preStop) lifecycle.preStop = container.lifecycle.preStop;
    if (Object.keys(lifecycle).length > 0) spec.lifecycle = lifecycle;
  }

  if (container.terminationMessagePath) spec.terminationMessagePath = container.terminationMessagePath;
  if (container.terminationMessagePolicy) spec.terminationMessagePolicy = container.terminationMessagePolicy;

  if (container.env && container.env.length > 0) spec.env = container.env;
  if (container.envFrom && container.envFrom.length > 0) spec.envFrom = container.envFrom;
  if (container.ports && container.ports.length > 0) spec.ports = container.ports;

  if (container.startupProbe) spec.startupProbe = container.startupProbe;
  if (container.livenessProbe) spec.livenessProbe = container.livenessProbe;
  if (container.readinessProbe) spec.readinessProbe = container.readinessProbe;

  if (container.volumeMounts && container.volumeMounts.length > 0) spec.volumeMounts = container.volumeMounts;
  if (container.volumeDevices && container.volumeDevices.length > 0) spec.volumeDevices = container.volumeDevices;

  if (container.resources) {
    const resources: Record<string, any> = {};
    if (container.resources.limits) resources.limits = container.resources.limits;
    if (container.resources.requests) resources.requests = container.resources.requests;
    if (Object.keys(resources).length > 0) spec.resources = resources;
  }

  if (container.workingDir) spec.workingDir = container.workingDir;
  if (container.resizePolicy && container.resizePolicy.length > 0) spec.resizePolicy = container.resizePolicy;
  if (container.restartPolicy) spec.restartPolicy = container.restartPolicy;
  if (container.restartPolicyRules && container.restartPolicyRules.length > 0) spec.restartPolicyRules = container.restartPolicyRules;
  if (container.securityContext) spec.securityContext = container.securityContext;

  return spec;
}

function buildPodSpec(config: Record<string, any>, containers: Container[]): Record<string, any> {
  const spec: Record<string, any> = {};

  spec.containers = containers.map((container) => buildContainerSpec(container));

  if (config.initContainers && config.initContainers.length > 0) {
    spec.initContainers = config.initContainers.map((container: Container) => buildContainerSpec(container));
  }

  if (config.ephemeralContainers && config.ephemeralContainers.length > 0) {
    spec.ephemeralContainers = config.ephemeralContainers.map((container: Container) => buildContainerSpec(container));
  }

  if (config.podDeathTime) spec.activeDeadlineSeconds = config.podDeathTime;
  if (config.terminationGracePeriodSeconds) spec.terminationGracePeriodSeconds = config.terminationGracePeriodSeconds;
  if (config.restartPolicy) spec.restartPolicy = config.restartPolicy;

  if (config.nodeName) spec.nodeName = config.nodeName;
  if (config.priority !== undefined) spec.priority = config.priority;
  if (config.priorityClassName) spec.priorityClassName = config.priorityClassName;

  if (config.serviceAccountName) spec.serviceAccountName = config.serviceAccountName;
  if (config.automountServiceAccountToken !== undefined) spec.automountServiceAccountToken = config.automountServiceAccountToken;

  if (config.hostname) spec.hostname = config.hostname;
  if (config.subdomain) spec.subdomain = config.subdomain;
  if (config.dnsPolicy) spec.dnsPolicy = config.dnsPolicy;
  if (config.enableServiceLinks !== undefined) spec.enableServiceLinks = config.enableServiceLinks;
  if (config.hostIPC !== undefined) spec.hostIPC = config.hostIPC;
  if (config.hostNetwork !== undefined) spec.hostNetwork = config.hostNetwork;
  if (config.hostPID !== undefined) spec.hostPID = config.hostPID;
  if (config.hostUsers !== undefined) spec.hostUsers = config.hostUsers;
  if (config.shareProcessNamespace !== undefined) spec.shareProcessNamespace = config.shareProcessNamespace;

  if (config.dnsConfig) {
    const dnsConfig: Record<string, any> = {};
    if (config.dnsConfig.nameServers && config.dnsConfig.nameServers.length > 0) dnsConfig.nameservers = config.dnsConfig.nameServers;
    if (config.dnsConfig.searches && config.dnsConfig.searches.length > 0) dnsConfig.searches = config.dnsConfig.searches;
    if (config.dnsConfig.options && config.dnsConfig.options.length > 0) dnsConfig.options = config.dnsConfig.options;
    if (Object.keys(dnsConfig).length > 0) spec.dnsConfig = dnsConfig;
  }

  if (config.hostAliases && config.hostAliases.length > 0) spec.hostAliases = config.hostAliases;

  if (config.tolerations && config.tolerations.length > 0) spec.tolerations = config.tolerations;

  if (config.topologySpreadConstraints && config.topologySpreadConstraints.length > 0) spec.topologySpreadConstraints = config.topologySpreadConstraints;

  if (config.affinity) {
    const affinity: Record<string, any> = {};

    if (config.affinity.nodeAffinity) {
      const nodeAffinity: Record<string, any> = {};

      const requiredTerms = config.affinity.nodeAffinity.requiredDuringScheduling?.nodeAffinityTerm;
      const hasRequiredContent = requiredTerms && (
        (requiredTerms.matchExpressions && requiredTerms.matchExpressions.length > 0) ||
        (requiredTerms.matchFields && requiredTerms.matchFields.length > 0)
      );
      if (hasRequiredContent) {
        nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution = { nodeSelectorTerms: [requiredTerms] };
      }

      const preferredTerms = config.affinity.nodeAffinity.preferredDuringScheduling?.nodeAffinityTerm;
      const hasPreferredContent = preferredTerms && (
        (preferredTerms.matchExpressions && preferredTerms.matchExpressions.length > 0) ||
        (preferredTerms.matchFields && preferredTerms.matchFields.length > 0)
      );
      if (hasPreferredContent) {
        const weight = config.affinity.nodeAffinity.preferredDuringScheduling?.weight || 1;
        nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution = [{
          weight,
          preference: preferredTerms,
        }];
      }

      if (Object.keys(nodeAffinity).length > 0) {
        affinity.nodeAffinity = nodeAffinity;
      }
    }

    if (config.affinity.podAffinity) {
      const podAffinity: Record<string, any> = {};

      const requiredTerm = config.affinity.podAffinity.requiredDuringScheduling?.podAffinityTerm;
      if (requiredTerm?.topologyKey) {
        podAffinity.requiredDuringSchedulingIgnoredDuringExecution = [requiredTerm];
      }

      const preferredTerm = config.affinity.podAffinity.preferredDuringScheduling?.podAffinityTerm;
      if (preferredTerm?.topologyKey) {
        podAffinity.preferredDuringSchedulingIgnoredDuringExecution = [{
          weight: config.affinity.podAffinity.preferredDuringScheduling?.weight || 1,
          podAffinityTerm: preferredTerm,
        }];
      }

      if (Object.keys(podAffinity).length > 0) {
        affinity.podAffinity = podAffinity;
      }
    }

    if (config.affinity.podAntiAffinity) {
      const podAntiAffinity: Record<string, any> = {};

      const requiredTerm = config.affinity.podAntiAffinity.requiredDuringScheduling?.podAffinityTerm;
      if (requiredTerm?.topologyKey) {
        podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution = [requiredTerm];
      }

      const preferredTerm = config.affinity.podAntiAffinity.preferredDuringScheduling?.podAffinityTerm;
      if (preferredTerm?.topologyKey) {
        podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution = [{
          weight: config.affinity.podAntiAffinity.preferredDuringScheduling?.weight || 1,
          podAffinityTerm: preferredTerm,
        }];
      }

      if (Object.keys(podAntiAffinity).length > 0) {
        affinity.podAntiAffinity = podAntiAffinity;
      }
    }

    if (Object.keys(affinity).length > 0) {
      spec.affinity = affinity;
    }
  }

  if (config.imagePullSecrets && typeof config.imagePullSecrets === "object" && Object.keys(config.imagePullSecrets).length > 0) {
    spec.imagePullSecrets = config.imagePullSecrets;
  }
  if (config.runtimeClassName) spec.runtimeClassName = config.runtimeClassName;

  if (config.volumes && config.volumes.length > 0) spec.volumes = config.volumes;

  if (config.securityContext) spec.securityContext = config.securityContext;

  return spec;
}

const yamlDumpOptions = {
  indent: 2,
  lineWidth: -1,
};

export function generatePodYAML(podName: string, podConfig: Record<string, any>, containers: Container[], namespace?: string): string {
  const metadata: Record<string, any> = {
    name: podName,
  };

  if (namespace) metadata.namespace = namespace;
  if (podConfig.deletionGracePeriodSeconds) metadata.deletionGracePeriodSeconds = podConfig.deletionGracePeriodSeconds;

  if (podConfig.annotations && Object.keys(podConfig.annotations).length > 0) {
    metadata.annotations = podConfig.annotations;
  }

  if (podConfig.labels && Object.keys(podConfig.labels).length > 0) {
    metadata.labels = podConfig.labels;
  }

  if (podConfig.ownerReferences && podConfig.ownerReferences.length > 0) {
    metadata.ownerReferences = podConfig.ownerReferences;
  }

  const yaml: Record<string, any> = {
    apiVersion: "v1",
    kind: "Pod",
    metadata: cleanEmptyValues(metadata),
    spec: cleanEmptyValues(buildPodSpec(podConfig, containers)),
  };

  const cleaned = cleanEmptyValues(yaml);
  return YAML.dump(cleaned, yamlDumpOptions);
}

function buildWorkloadYAML(
  name: string,
  config: Record<string, any>,
  containers: Container[],
  kind: string,
  apiVersion: string = "apps/v1",
  namespace?: string
): string {
  const metadata: Record<string, any> = {
    name,
  };

  if (namespace) metadata.namespace = namespace;
  if (config.deletionGracePeriodSeconds) metadata.deletionGracePeriodSeconds = config.deletionGracePeriodSeconds;

  if (config.annotations && Object.keys(config.annotations).length > 0) {
    metadata.annotations = config.annotations;
  }

  if (config.labels && Object.keys(config.labels).length > 0) {
    metadata.labels = config.labels;
  }

  if (config.ownerReferences && config.ownerReferences.length > 0) {
    metadata.ownerReferences = config.ownerReferences;
  }

  const spec: Record<string, any> = {};

  if (config.spec?.replicas !== undefined) spec.replicas = config.spec.replicas;
  if (config.spec?.minReadySeconds !== undefined) spec.minReadySeconds = config.spec.minReadySeconds;
  if (config.spec?.progressDeadlineSeconds !== undefined) spec.progressDeadlineSeconds = config.spec.progressDeadlineSeconds;
  if (config.spec?.revisionHistoryLimit !== undefined) spec.revisionHistoryLimit = config.spec.revisionHistoryLimit;

  if (config.spec?.selector) {
    spec.selector = config.spec.selector;
  }

  if (config.spec?.strategy) {
    const strategy: Record<string, any> = {};
    if (config.spec.strategy.type) strategy.type = config.spec.strategy.type;
    if (config.spec.strategy.rollingUpdate) {
      const rollingUpdate: Record<string, any> = {};
      if (config.spec.strategy.rollingUpdate.maxSurge !== undefined) {
        rollingUpdate.maxSurge = config.spec.strategy.rollingUpdate.maxSurge;
      }
      if (config.spec.strategy.rollingUpdate.maxUnavailable !== undefined) {
        rollingUpdate.maxUnavailable = config.spec.strategy.rollingUpdate.maxUnavailable;
      }
      if (Object.keys(rollingUpdate).length > 0) {
        strategy.rollingUpdate = rollingUpdate;
      }
    }
    if (Object.keys(strategy).length > 0) {
      spec.strategy = strategy;
    }
  }

  if (config.spec?.updateStrategy) {
    const updateStrategy: Record<string, any> = {};
    if (config.spec.updateStrategy.type) updateStrategy.type = config.spec.updateStrategy.type;
    if (config.spec.updateStrategy.rollingUpdate) {
      const rollingUpdate: Record<string, any> = {};
      if (config.spec.updateStrategy.rollingUpdate.maxSurge !== undefined) {
        rollingUpdate.maxSurge = config.spec.updateStrategy.rollingUpdate.maxSurge;
      }
      if (config.spec.updateStrategy.rollingUpdate.maxUnavailable !== undefined) {
        rollingUpdate.maxUnavailable = config.spec.updateStrategy.rollingUpdate.maxUnavailable;
      }
      if (config.spec.updateStrategy.rollingUpdate.partition !== undefined) {
        rollingUpdate.partition = config.spec.updateStrategy.rollingUpdate.partition;
      }
      if (Object.keys(rollingUpdate).length > 0) {
        updateStrategy.rollingUpdate = rollingUpdate;
      }
    }
    if (Object.keys(updateStrategy).length > 0) {
      spec.updateStrategy = updateStrategy;
    }
  }

  if (config.spec?.serviceName) spec.serviceName = config.spec.serviceName;
  if (config.spec?.podManagementPolicy) spec.podManagementPolicy = config.spec.podManagementPolicy;

  if (config.template) {
    spec.template = {
      metadata: {},
      spec: cleanEmptyValues(buildPodSpec(config.template, containers)),
    };

    if (config.template.labels && Object.keys(config.template.labels).length > 0) {
      spec.template.metadata.labels = config.template.labels;
    }

    if (config.template.annotations && Object.keys(config.template.annotations).length > 0) {
      spec.template.metadata.annotations = config.template.annotations;
    }

    if (config.template.namespace) {
      spec.template.metadata.namespace = config.template.namespace;
    }

    spec.template.metadata = cleanEmptyValues(spec.template.metadata);
  }

  const yaml: Record<string, any> = {
    apiVersion,
    kind,
    metadata: cleanEmptyValues(metadata),
    spec: cleanEmptyValues(spec),
  };

  const cleaned = cleanEmptyValues(yaml);
  return YAML.dump(cleaned, yamlDumpOptions);
}

function addTrailingNewlinesToMultilineValues(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.includes('\n') && !value.endsWith('\n')) {
      result[key] = value + '\n';
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function generateDeploymentYAML(deploymentName: string, deploymentConfig: Record<string, any>, containers: Container[], namespace?: string): string {
  return buildWorkloadYAML(deploymentName, deploymentConfig, containers, "Deployment", "apps/v1", namespace);
}

export function generateReplicaSetYAML(replicaSetName: string, replicaSetConfig: Record<string, any>, containers: Container[], namespace?: string): string {
  return buildWorkloadYAML(replicaSetName, replicaSetConfig, containers, "ReplicaSet", "apps/v1", namespace);
}

export function generateStatefulSetYAML(statefulSetName: string, statefulSetConfig: Record<string, any>, containers: Container[], namespace?: string): string {
  const metadata: Record<string, any> = {
    name: statefulSetName,
  };

  if (namespace) metadata.namespace = namespace;
  if (statefulSetConfig.deletionGracePeriodSeconds) metadata.deletionGracePeriodSeconds = statefulSetConfig.deletionGracePeriodSeconds;

  if (statefulSetConfig.annotations && Object.keys(statefulSetConfig.annotations).length > 0) {
    metadata.annotations = statefulSetConfig.annotations;
  }

  if (statefulSetConfig.labels && Object.keys(statefulSetConfig.labels).length > 0) {
    metadata.labels = statefulSetConfig.labels;
  }

  if (statefulSetConfig.ownerReferences && statefulSetConfig.ownerReferences.length > 0) {
    metadata.ownerReferences = statefulSetConfig.ownerReferences;
  }

  const spec: Record<string, any> = {};

  if (statefulSetConfig.spec?.replicas !== undefined) spec.replicas = statefulSetConfig.spec.replicas;
  if (statefulSetConfig.spec?.minReadySeconds !== undefined) spec.minReadySeconds = statefulSetConfig.spec.minReadySeconds;
  if (statefulSetConfig.spec?.revisionHistoryLimit !== undefined) spec.revisionHistoryLimit = statefulSetConfig.spec.revisionHistoryLimit;

  if (statefulSetConfig.spec?.ordinals) {
    const ordinals: Record<string, any> = {};
    if (statefulSetConfig.spec.ordinals.start !== undefined) ordinals.start = statefulSetConfig.spec.ordinals.start;
    if (Object.keys(ordinals).length > 0) spec.ordinals = ordinals;
  }

  if (statefulSetConfig.spec?.persistentVolumeClaimRetentionPolicy) {
    const pvcRetention: Record<string, any> = {};
    if (statefulSetConfig.spec.persistentVolumeClaimRetentionPolicy.whenDeleted) {
      pvcRetention.whenDeleted = statefulSetConfig.spec.persistentVolumeClaimRetentionPolicy.whenDeleted;
    }
    if (statefulSetConfig.spec.persistentVolumeClaimRetentionPolicy.whenScaled) {
      pvcRetention.whenScaled = statefulSetConfig.spec.persistentVolumeClaimRetentionPolicy.whenScaled;
    }
    if (Object.keys(pvcRetention).length > 0) {
      spec.persistentVolumeClaimRetentionPolicy = pvcRetention;
    }
  }

  if (statefulSetConfig.spec?.selector) {
    spec.selector = statefulSetConfig.spec.selector;
  }

  if (statefulSetConfig.spec?.serviceName) spec.serviceName = statefulSetConfig.spec.serviceName;
  if (statefulSetConfig.spec?.podManagementPolicy) spec.podManagementPolicy = statefulSetConfig.spec.podManagementPolicy;

  if (statefulSetConfig.spec?.updateStrategy) {
    const updateStrategy: Record<string, any> = {};
    if (statefulSetConfig.spec.updateStrategy.type) updateStrategy.type = statefulSetConfig.spec.updateStrategy.type;
    if (statefulSetConfig.spec.updateStrategy.rollingUpdate) {
      const rollingUpdate: Record<string, any> = {};
      if (statefulSetConfig.spec.updateStrategy.rollingUpdate.maxUnavailable !== undefined) {
        rollingUpdate.maxUnavailable = statefulSetConfig.spec.updateStrategy.rollingUpdate.maxUnavailable;
      }
      if (statefulSetConfig.spec.updateStrategy.rollingUpdate.partition !== undefined) {
        rollingUpdate.partition = statefulSetConfig.spec.updateStrategy.rollingUpdate.partition;
      }
      if (Object.keys(rollingUpdate).length > 0) {
        updateStrategy.rollingUpdate = rollingUpdate;
      }
    }
    if (Object.keys(updateStrategy).length > 0) {
      spec.updateStrategy = updateStrategy;
    }
  }

  if (statefulSetConfig.template) {
    spec.template = {
      metadata: {},
      spec: cleanEmptyValues(buildPodSpec(statefulSetConfig.template, containers)),
    };

    if (statefulSetConfig.template.labels && Object.keys(statefulSetConfig.template.labels).length > 0) {
      spec.template.metadata.labels = statefulSetConfig.template.labels;
    }

    if (statefulSetConfig.template.annotations && Object.keys(statefulSetConfig.template.annotations).length > 0) {
      spec.template.metadata.annotations = statefulSetConfig.template.annotations;
    }

    spec.template.metadata = cleanEmptyValues(spec.template.metadata);
  }

  if (statefulSetConfig.spec?.volumeClaimTemplates && statefulSetConfig.spec.volumeClaimTemplates.length > 0) {
    spec.volumeClaimTemplates = statefulSetConfig.spec.volumeClaimTemplates.map((template: Record<string, any>) => {
      const vctMetadata: Record<string, any> = {};

      if (template.metadata?.name) vctMetadata.name = template.metadata.name;
      if (template.metadata?.deletionGracePeriodSeconds) {
        vctMetadata.deletionGracePeriodSeconds = template.metadata.deletionGracePeriodSeconds;
      }
      if (template.metadata?.annotations && Object.keys(template.metadata.annotations).length > 0) {
        vctMetadata.annotations = template.metadata.annotations;
      }
      if (template.metadata?.labels && Object.keys(template.metadata.labels).length > 0) {
        vctMetadata.labels = template.metadata.labels;
      }
      if (template.metadata?.ownerReferences && template.metadata.ownerReferences.length > 0) {
        vctMetadata.ownerReferences = template.metadata.ownerReferences;
      }

      const vctSpec: Record<string, any> = {};

      if (template.spec?.accessModes && template.spec.accessModes.length > 0) {
        vctSpec.accessModes = template.spec.accessModes;
      }
      if (template.spec?.storageClassName) vctSpec.storageClassName = template.spec.storageClassName;
      if (template.spec?.volumeName) vctSpec.volumeName = template.spec.volumeName;
      if (template.spec?.volumeMode) vctSpec.volumeMode = template.spec.volumeMode;
      if (template.spec?.volumeAttributesClassName) vctSpec.volumeAttributesClassName = template.spec.volumeAttributesClassName;

      if (template.spec?.resources) {
        const resources: Record<string, any> = {};
        if (template.spec.resources.limits && Object.keys(template.spec.resources.limits).length > 0) {
          resources.limits = template.spec.resources.limits;
        }
        if (template.spec.resources.requests && Object.keys(template.spec.resources.requests).length > 0) {
          resources.requests = template.spec.resources.requests;
        }
        if (Object.keys(resources).length > 0) vctSpec.resources = resources;
      }

      if (template.spec?.dataSource) {
        const dataSource: Record<string, any> = {};
        if (template.spec.dataSource.apiGroup) dataSource.apiGroup = template.spec.dataSource.apiGroup;
        if (template.spec.dataSource.kind) dataSource.kind = template.spec.dataSource.kind;
        if (template.spec.dataSource.name) dataSource.name = template.spec.dataSource.name;
        if (Object.keys(dataSource).length > 0) vctSpec.dataSource = dataSource;
      }

      if (template.spec?.dataSourceRef) {
        const dataSourceRef: Record<string, any> = {};
        if (template.spec.dataSourceRef.apiGroup) dataSourceRef.apiGroup = template.spec.dataSourceRef.apiGroup;
        if (template.spec.dataSourceRef.kind) dataSourceRef.kind = template.spec.dataSourceRef.kind;
        if (template.spec.dataSourceRef.name) dataSourceRef.name = template.spec.dataSourceRef.name;
        if (template.spec.dataSourceRef.namespace) dataSourceRef.namespace = template.spec.dataSourceRef.namespace;
        if (Object.keys(dataSourceRef).length > 0) vctSpec.dataSourceRef = dataSourceRef;
      }

      if (template.spec?.selector) {
        vctSpec.selector = template.spec.selector;
      }

      return cleanEmptyValues({
        metadata: cleanEmptyValues(vctMetadata),
        spec: cleanEmptyValues(vctSpec),
      });
    });
  }

  const yaml: Record<string, any> = {
    apiVersion: "apps/v1",
    kind: "StatefulSet",
    metadata: cleanEmptyValues(metadata),
    spec: cleanEmptyValues(spec),
  };

  const cleaned = cleanEmptyValues(yaml);
  return YAML.dump(cleaned, yamlDumpOptions);
}

export function generateDaemonSetYAML(daemonSetName: string, daemonSetConfig: Record<string, any>, containers: Container[], namespace?: string): string {
  return buildWorkloadYAML(daemonSetName, daemonSetConfig, containers, "DaemonSet", "apps/v1", namespace);
}

export function generateJobYAML(jobName: string, jobConfig: Record<string, any>, containers: Container[], namespace?: string): string {
  const metadata: Record<string, any> = {
    name: jobName,
  };

  if (namespace) metadata.namespace = namespace;
  if (jobConfig.deletionGracePeriodSeconds) metadata.deletionGracePeriodSeconds = jobConfig.deletionGracePeriodSeconds;

  if (jobConfig.annotations && Object.keys(jobConfig.annotations).length > 0) {
    metadata.annotations = jobConfig.annotations;
  }

  if (jobConfig.labels && Object.keys(jobConfig.labels).length > 0) {
    metadata.labels = jobConfig.labels;
  }

  if (jobConfig.ownerReferences && jobConfig.ownerReferences.length > 0) {
    metadata.ownerReferences = jobConfig.ownerReferences;
  }

  const spec: Record<string, any> = {};

  if (jobConfig.spec?.activeDeadlineSeconds !== undefined) spec.activeDeadlineSeconds = jobConfig.spec.activeDeadlineSeconds;
  if (jobConfig.spec?.backoffLimit !== undefined) spec.backoffLimit = jobConfig.spec.backoffLimit;
  if (jobConfig.spec?.backoffLimitPerIndex !== undefined) spec.backoffLimitPerIndex = jobConfig.spec.backoffLimitPerIndex;
  if (jobConfig.spec?.completionMode) spec.completionMode = jobConfig.spec.completionMode;
  if (jobConfig.spec?.completions !== undefined) spec.completions = jobConfig.spec.completions;
  if (jobConfig.spec?.manualSelector !== undefined) spec.manualSelector = jobConfig.spec.manualSelector;
  if (jobConfig.spec?.maxFailedIndexes !== undefined) spec.maxFailedIndexes = jobConfig.spec.maxFailedIndexes;
  if (jobConfig.spec?.parallelism !== undefined) spec.parallelism = jobConfig.spec.parallelism;
  if (jobConfig.spec?.podReplacementPolicy) spec.podReplacementPolicy = jobConfig.spec.podReplacementPolicy;
  if (jobConfig.spec?.ttlSecondsAfterFinished !== undefined) spec.ttlSecondsAfterFinished = jobConfig.spec.ttlSecondsAfterFinished;

  if (jobConfig.spec?.selector) {
    spec.selector = jobConfig.spec.selector;
  }

  if (jobConfig.spec?.podFailurePolicy?.rules && jobConfig.spec.podFailurePolicy.rules.length > 0) {
    spec.podFailurePolicy = {
      rules: jobConfig.spec.podFailurePolicy.rules.map((rule: Record<string, any>) => {
        const cleanedRule: Record<string, any> = {};
        if (rule.action) cleanedRule.action = rule.action;
        if (rule.onExitCodes) cleanedRule.onExitCodes = rule.onExitCodes;
        if (rule.onPodConditions) cleanedRule.onPodConditions = rule.onPodConditions;
        return cleanEmptyValues(cleanedRule);
      }),
    };
  }

  if (jobConfig.spec?.successPolicy?.rules && jobConfig.spec.successPolicy.rules.length > 0) {
    spec.successPolicy = {
      rules: jobConfig.spec.successPolicy.rules.map((rule: Record<string, any>) => {
        const cleanedRule: Record<string, any> = {};
        if (rule.succeededCount !== undefined) cleanedRule.succeededCount = rule.succeededCount;
        if (rule.succeededIndexes) cleanedRule.succeededIndexes = rule.succeededIndexes;
        return cleanEmptyValues(cleanedRule);
      }),
    };
  }

  if (jobConfig.template) {
    spec.template = {
      metadata: {},
      spec: cleanEmptyValues(buildPodSpec(jobConfig.template, containers)),
    };

    if (jobConfig.template.labels && Object.keys(jobConfig.template.labels).length > 0) {
      spec.template.metadata.labels = jobConfig.template.labels;
    }

    if (jobConfig.template.annotations && Object.keys(jobConfig.template.annotations).length > 0) {
      spec.template.metadata.annotations = jobConfig.template.annotations;
    }

    spec.template.metadata = cleanEmptyValues(spec.template.metadata);
  }

  const yaml: Record<string, any> = {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: cleanEmptyValues(metadata),
    spec: cleanEmptyValues(spec),
  };

  const cleaned = cleanEmptyValues(yaml);
  return YAML.dump(cleaned, yamlDumpOptions);
}

export function generateCronJobYAML(cronJobName: string, cronJobConfig: Record<string, any>, containers: Container[], namespace?: string): string {
  const metadata: Record<string, any> = {
    name: cronJobName,
  };

  if (namespace) metadata.namespace = namespace;
  if (cronJobConfig.deletionGracePeriodSeconds) metadata.deletionGracePeriodSeconds = cronJobConfig.deletionGracePeriodSeconds;

  if (cronJobConfig.annotations && Object.keys(cronJobConfig.annotations).length > 0) {
    metadata.annotations = cronJobConfig.annotations;
  }

  if (cronJobConfig.labels && Object.keys(cronJobConfig.labels).length > 0) {
    metadata.labels = cronJobConfig.labels;
  }

  if (cronJobConfig.ownerReferences && cronJobConfig.ownerReferences.length > 0) {
    metadata.ownerReferences = cronJobConfig.ownerReferences;
  }

  const spec: Record<string, any> = {};

  if (cronJobConfig.spec?.schedule) spec.schedule = cronJobConfig.spec.schedule;
  if (cronJobConfig.spec?.concurrencyPolicy) spec.concurrencyPolicy = cronJobConfig.spec.concurrencyPolicy;
  if (cronJobConfig.spec?.failedJobsHistoryLimit !== undefined) spec.failedJobsHistoryLimit = cronJobConfig.spec.failedJobsHistoryLimit;
  if (cronJobConfig.spec?.startingDeadlineSeconds !== undefined) spec.startingDeadlineSeconds = cronJobConfig.spec.startingDeadlineSeconds;
  if (cronJobConfig.spec?.successfulJobsHistoryLimit !== undefined) spec.successfulJobsHistoryLimit = cronJobConfig.spec.successfulJobsHistoryLimit;
  if (cronJobConfig.spec?.timeZone) spec.timeZone = cronJobConfig.spec.timeZone;

  if (cronJobConfig.spec?.jobTemplate) {
    spec.jobTemplate = {
      metadata: {},
      spec: {},
    };

    if (cronJobConfig.spec.jobTemplate.metadata?.labels && Object.keys(cronJobConfig.spec.jobTemplate.metadata.labels).length > 0) {
      spec.jobTemplate.metadata.labels = cronJobConfig.spec.jobTemplate.metadata.labels;
    }

    if (cronJobConfig.spec.jobTemplate.metadata?.annotations && Object.keys(cronJobConfig.spec.jobTemplate.metadata.annotations).length > 0) {
      spec.jobTemplate.metadata.annotations = cronJobConfig.spec.jobTemplate.metadata.annotations;
    }

    spec.jobTemplate.metadata = cleanEmptyValues(spec.jobTemplate.metadata);

    if (cronJobConfig.spec.jobTemplate.spec) {
      const jobSpec = cronJobConfig.spec.jobTemplate.spec;
      const jobSpecObj: Record<string, any> = {};

      if (jobSpec.activeDeadlineSeconds !== undefined) jobSpecObj.activeDeadlineSeconds = jobSpec.activeDeadlineSeconds;
      if (jobSpec.backoffLimit !== undefined) jobSpecObj.backoffLimit = jobSpec.backoffLimit;
      if (jobSpec.backoffLimitPerIndex !== undefined) jobSpecObj.backoffLimitPerIndex = jobSpec.backoffLimitPerIndex;
      if (jobSpec.completionMode) jobSpecObj.completionMode = jobSpec.completionMode;
      if (jobSpec.completions !== undefined) jobSpecObj.completions = jobSpec.completions;
      if (jobSpec.manualSelector !== undefined) jobSpecObj.manualSelector = jobSpec.manualSelector;
      if (jobSpec.maxFailedIndexes !== undefined) jobSpecObj.maxFailedIndexes = jobSpec.maxFailedIndexes;
      if (jobSpec.parallelism !== undefined) jobSpecObj.parallelism = jobSpec.parallelism;
      if (jobSpec.podReplacementPolicy) jobSpecObj.podReplacementPolicy = jobSpec.podReplacementPolicy;
      if (jobSpec.ttlSecondsAfterFinished !== undefined) jobSpecObj.ttlSecondsAfterFinished = jobSpec.ttlSecondsAfterFinished;

      if (jobSpec.selector) {
        jobSpecObj.selector = jobSpec.selector;
      }

      if (jobSpec.podFailurePolicy?.rules && jobSpec.podFailurePolicy.rules.length > 0) {
        jobSpecObj.podFailurePolicy = {
          rules: jobSpec.podFailurePolicy.rules.map((rule: Record<string, any>) => {
            const cleanedRule: Record<string, any> = {};
            if (rule.action) cleanedRule.action = rule.action;
            if (rule.onExitCodes) cleanedRule.onExitCodes = rule.onExitCodes;
            if (rule.onPodConditions) cleanedRule.onPodConditions = rule.onPodConditions;
            return cleanEmptyValues(cleanedRule);
          }),
        };
      }

      if (jobSpec.successPolicy?.rules && jobSpec.successPolicy.rules.length > 0) {
        jobSpecObj.successPolicy = {
          rules: jobSpec.successPolicy.rules.map((rule: Record<string, any>) => {
            const cleanedRule: Record<string, any> = {};
            if (rule.succeededCount !== undefined) cleanedRule.succeededCount = rule.succeededCount;
            if (rule.succeededIndexes) cleanedRule.succeededIndexes = rule.succeededIndexes;
            return cleanEmptyValues(cleanedRule);
          }),
        };
      }

      spec.jobTemplate.spec = jobSpecObj;
    }

    if (cronJobConfig.spec.jobTemplate.template) {
      spec.jobTemplate.spec.template = {
        metadata: {},
        spec: cleanEmptyValues(buildPodSpec(cronJobConfig.spec.jobTemplate.template, containers)),
      };

      if (cronJobConfig.spec.jobTemplate.template.labels && Object.keys(cronJobConfig.spec.jobTemplate.template.labels).length > 0) {
        spec.jobTemplate.spec.template.metadata.labels = cronJobConfig.spec.jobTemplate.template.labels;
      }

      if (cronJobConfig.spec.jobTemplate.template.annotations && Object.keys(cronJobConfig.spec.jobTemplate.template.annotations).length > 0) {
        spec.jobTemplate.spec.template.metadata.annotations = cronJobConfig.spec.jobTemplate.template.annotations;
      }

      spec.jobTemplate.spec.template.metadata = cleanEmptyValues(spec.jobTemplate.spec.template.metadata);
    }
  }

  const yaml: Record<string, any> = {
    apiVersion: "batch/v1",
    kind: "CronJob",
    metadata: cleanEmptyValues(metadata),
    spec: cleanEmptyValues(spec),
  };

  const cleaned = cleanEmptyValues(yaml);
  return YAML.dump(cleaned, yamlDumpOptions);
}

export function generateResourceYAML(resourceName: string, resourceType: string, resourceConfig: Record<string, any>, namespace?: string): string {
  const metadata: Record<string, any> = {
    name: resourceName,
  };

  if (namespace) metadata.namespace = namespace;
  if (resourceConfig.deletionGracePeriodSeconds) metadata.deletionGracePeriodSeconds = resourceConfig.deletionGracePeriodSeconds;

  if (resourceConfig.annotations && Object.keys(resourceConfig.annotations).length > 0) {
    metadata.annotations = resourceConfig.annotations;
  }

  if (resourceConfig.labels && Object.keys(resourceConfig.labels).length > 0) {
    metadata.labels = resourceConfig.labels;
  }

  if (resourceConfig.ownerReferences && resourceConfig.ownerReferences.length > 0) {
    metadata.ownerReferences = resourceConfig.ownerReferences;
  }

  const spec: Record<string, any> = {};

  // Service-specific spec fields
  if (resourceType === "Service" && resourceConfig.spec) {
    const serviceSpec = resourceConfig.spec;

    if (serviceSpec.type) spec.type = serviceSpec.type;
    if (serviceSpec.externalName) spec.externalName = serviceSpec.externalName;
    if (serviceSpec.ports && serviceSpec.ports.length > 0) {
      spec.ports = serviceSpec.ports.map((port: Record<string, any>) => {
        const portObj: Record<string, any> = {};
        if (port.name) portObj.name = port.name;
        if (port.port !== undefined) portObj.port = port.port;
        if (port.targetPort !== undefined) portObj.targetPort = port.targetPort;
        if (port.protocol) portObj.protocol = port.protocol;
        if (port.appProtocol) portObj.appProtocol = port.appProtocol;
        return cleanEmptyValues(portObj);
      });
    }

    if (serviceSpec.selector && Object.keys(serviceSpec.selector).length > 0) {
      spec.selector = serviceSpec.selector;
    }

    if (serviceSpec.publishNotReadyAddresses !== undefined) spec.publishNotReadyAddresses = serviceSpec.publishNotReadyAddresses;
    if (serviceSpec.trafficDistribution) spec.trafficDistribution = serviceSpec.trafficDistribution;
    if (serviceSpec.sessionAffinity) spec.sessionAffinity = serviceSpec.sessionAffinity;

    // Handle sessionAffinityTimeout with nested structure
    if (serviceSpec.sessionAffinityTimeout !== undefined && serviceSpec.sessionAffinity === "ClientIP") {
      spec.sessionAffinityConfig = {
        clientIP: {
          timeoutSeconds: serviceSpec.sessionAffinityTimeout,
        },
      };
    }
  } else if (resourceType === "HTTPRoute" && resourceConfig.spec) {
    // HTTPRoute-specific spec fields
    const httpRouteSpec = resourceConfig.spec;

    // Static parentRefs that should always be included
    spec.parentRefs = [
      {
        name: "platform-gateway",
        namespace: "envoy-gateway-system",
      },
    ];

    if (httpRouteSpec.hostnames && httpRouteSpec.hostnames.length > 0) {
      spec.hostnames = httpRouteSpec.hostnames;
    }

    if (httpRouteSpec.rules && httpRouteSpec.rules.length > 0) {
      spec.rules = httpRouteSpec.rules.map((rule: Record<string, any>) => {
        const ruleObj: Record<string, any> = {};
        if (rule.sectionName) ruleObj.name = rule.sectionName;
        if (rule.matches && rule.matches.length > 0) ruleObj.matches = rule.matches;

        if (rule.filters && rule.filters.length > 0) {
          ruleObj.filters = rule.filters.map((filter: Record<string, any>) => {
            const filterObj: Record<string, any> = { type: filter.type };
            if (filter.requestHeaderModifier) filterObj.requestHeaderModifier = filter.requestHeaderModifier;
            if (filter.responseHeaderModifier) filterObj.responseHeaderModifier = filter.responseHeaderModifier;
            if (filter.requestRedirect) filterObj.requestRedirect = filter.requestRedirect;
            if (filter.urlRewrite) filterObj.urlRewrite = filter.urlRewrite;

            if (filter.requestMirror) {
              filterObj.requestMirror = {};
              if (filter.requestMirror.backendRef) {
                filterObj.requestMirror.backendRef = {};
                if (filter.requestMirror.backendRef.name) filterObj.requestMirror.backendRef.name = filter.requestMirror.backendRef.name;
                if (filter.requestMirror.backendRef.port !== undefined) filterObj.requestMirror.backendRef.port = filter.requestMirror.backendRef.port;
                filterObj.requestMirror.backendRef.namespace = namespace || "default";
              }
              if (filter.requestMirror.percent !== undefined) filterObj.requestMirror.percent = filter.requestMirror.percent;
              if (filter.requestMirror.fraction) filterObj.requestMirror.fraction = filter.requestMirror.fraction;
            }
            return cleanEmptyValues(filterObj);
          });
        }

        if (rule.backendRefs && rule.backendRefs.length > 0) {
          ruleObj.backendRefs = rule.backendRefs.map((backend: Record<string, any>) => {
            const backendObj: Record<string, any> = {};
            if (backend.name) backendObj.name = backend.name;
            if (backend.weight !== undefined) backendObj.weight = backend.weight;
            if (backend.group) backendObj.group = backend.group;
            if (backend.kind) backendObj.kind = backend.kind;
            backendObj.namespace = namespace || "default";
            if (backend.port !== undefined) backendObj.port = backend.port;

            if (backend.filters && backend.filters.length > 0) {
              backendObj.filters = backend.filters.map((bFilter: Record<string, any>) => {
                const bFilterObj: Record<string, any> = { type: bFilter.type };
                if (bFilter.requestHeaderModifier) bFilterObj.requestHeaderModifier = bFilter.requestHeaderModifier;
                if (bFilter.responseHeaderModifier) bFilterObj.responseHeaderModifier = bFilter.responseHeaderModifier;
                if (bFilter.requestRedirect) bFilterObj.requestRedirect = bFilter.requestRedirect;
                if (bFilter.urlRewrite) bFilterObj.urlRewrite = bFilter.urlRewrite;

                if (bFilter.requestMirror) {
                  bFilterObj.requestMirror = {};
                  if (bFilter.requestMirror.backendRef) {
                    bFilterObj.requestMirror.backendRef = {};
                    if (bFilter.requestMirror.backendRef.name) bFilterObj.requestMirror.backendRef.name = bFilter.requestMirror.backendRef.name;
                    if (bFilter.requestMirror.backendRef.port !== undefined) bFilterObj.requestMirror.backendRef.port = bFilter.requestMirror.backendRef.port;
                    bFilterObj.requestMirror.backendRef.namespace = namespace || "default";
                  }
                  if (bFilter.requestMirror.percent !== undefined) bFilterObj.requestMirror.percent = bFilter.requestMirror.percent;
                  if (bFilter.requestMirror.fraction) bFilterObj.requestMirror.fraction = bFilter.requestMirror.fraction;
                }
                return cleanEmptyValues(bFilterObj);
              });
            }

            return cleanEmptyValues(backendObj);
          });
        }

        if (rule.timeouts) ruleObj.timeouts = rule.timeouts;
        return cleanEmptyValues(ruleObj);
      });
    }
  } else if (resourceType === "GRPCRoute" && resourceConfig.spec) {
    // GRPCRoute-specific spec fields
    const grpcRouteSpec = resourceConfig.spec;

    // Static parentRefs that should always be included
    spec.parentRefs = [
      {
        name: "platform-gateway",
        namespace: "envoy-gateway-system",
      },
    ];

    if (grpcRouteSpec.hostnames && grpcRouteSpec.hostnames.length > 0) {
      spec.hostnames = grpcRouteSpec.hostnames;
    }

    if (grpcRouteSpec.rules && grpcRouteSpec.rules.length > 0) {
      spec.rules = grpcRouteSpec.rules.map((rule: Record<string, any>) => {
        const ruleObj: Record<string, any> = {};
        if (rule.sectionName) ruleObj.name = rule.sectionName;
        if (rule.matches && rule.matches.length > 0) ruleObj.matches = rule.matches;

        if (rule.filters && rule.filters.length > 0) {
          ruleObj.filters = rule.filters.map((filter: Record<string, any>) => {
            const filterObj: Record<string, any> = { type: filter.type };
            if (filter.requestHeaderModifier) filterObj.requestHeaderModifier = filter.requestHeaderModifier;
            if (filter.responseHeaderModifier) filterObj.responseHeaderModifier = filter.responseHeaderModifier;
            if (filter.requestRedirect) filterObj.requestRedirect = filter.requestRedirect;
            if (filter.urlRewrite) filterObj.urlRewrite = filter.urlRewrite;

            if (filter.requestMirror) {
              filterObj.requestMirror = {};
              if (filter.requestMirror.backendRef) {
                filterObj.requestMirror.backendRef = {};
                if (filter.requestMirror.backendRef.name) filterObj.requestMirror.backendRef.name = filter.requestMirror.backendRef.name;
                if (filter.requestMirror.backendRef.port !== undefined) filterObj.requestMirror.backendRef.port = filter.requestMirror.backendRef.port;
                filterObj.requestMirror.backendRef.namespace = namespace || "default";
              }
              if (filter.requestMirror.percent !== undefined) filterObj.requestMirror.percent = filter.requestMirror.percent;
              if (filter.requestMirror.fraction) filterObj.requestMirror.fraction = filter.requestMirror.fraction;
            }
            return cleanEmptyValues(filterObj);
          });
        }

        if (rule.backendRefs && rule.backendRefs.length > 0) {
          ruleObj.backendRefs = rule.backendRefs.map((backend: Record<string, any>) => {
            const backendObj: Record<string, any> = {};
            if (backend.name) backendObj.name = backend.name;
            if (backend.weight !== undefined) backendObj.weight = backend.weight;
            if (backend.group) backendObj.group = backend.group;
            if (backend.kind) backendObj.kind = backend.kind;
            backendObj.namespace = namespace || "default";
            if (backend.port !== undefined) backendObj.port = backend.port;

            if (backend.filters && backend.filters.length > 0) {
              backendObj.filters = backend.filters.map((bFilter: Record<string, any>) => {
                const bFilterObj: Record<string, any> = { type: bFilter.type };
                if (bFilter.requestHeaderModifier) bFilterObj.requestHeaderModifier = bFilter.requestHeaderModifier;
                if (bFilter.responseHeaderModifier) bFilterObj.responseHeaderModifier = bFilter.responseHeaderModifier;
                if (bFilter.requestRedirect) bFilterObj.requestRedirect = bFilter.requestRedirect;
                if (bFilter.urlRewrite) bFilterObj.urlRewrite = bFilter.urlRewrite;

                if (bFilter.requestMirror) {
                  bFilterObj.requestMirror = {};
                  if (bFilter.requestMirror.backendRef) {
                    bFilterObj.requestMirror.backendRef = {};
                    if (bFilter.requestMirror.backendRef.name) bFilterObj.requestMirror.backendRef.name = bFilter.requestMirror.backendRef.name;
                    if (bFilter.requestMirror.backendRef.port !== undefined) bFilterObj.requestMirror.backendRef.port = bFilter.requestMirror.backendRef.port;
                    bFilterObj.requestMirror.backendRef.namespace = namespace || "default";
                  }
                  if (bFilter.requestMirror.percent !== undefined) bFilterObj.requestMirror.percent = bFilter.requestMirror.percent;
                  if (bFilter.requestMirror.fraction) bFilterObj.requestMirror.fraction = bFilter.requestMirror.fraction;
                }
                return cleanEmptyValues(bFilterObj);
              });
            }

            return cleanEmptyValues(backendObj);
          });
        }

        if (rule.timeouts) ruleObj.timeouts = rule.timeouts;
        return cleanEmptyValues(ruleObj);
      });
    }
  } else if (resourceType === "ConfigMap" && resourceConfig.spec) {
    // ConfigMap-specific spec fields
    const configMapSpec = resourceConfig.spec;

    if (configMapSpec.immutable !== undefined) spec.immutable = configMapSpec.immutable;

    if (configMapSpec.data && Object.keys(configMapSpec.data).length > 0) {
      spec.data = addTrailingNewlinesToMultilineValues(configMapSpec.data);
    }

    if (configMapSpec.binaryData && Object.keys(configMapSpec.binaryData).length > 0) {
      spec.binaryData = configMapSpec.binaryData;
    }
  } else {
    // For other resource types, use spec as-is
    if (resourceConfig.spec) {
      Object.assign(spec, resourceConfig.spec);
    }
  }

  const apiVersions: Record<string, string> = {
    Service: "v1",
    HTTPRoute: "gateway.networking.k8s.io/v1beta1",
    GRPCRoute: "gateway.networking.k8s.io/v1",
    StorageClass: "storage.k8s.io/v1",
    PersistentVolume: "v1",
    PersistentVolumeClaim: "v1",
    VolumeAttributesClass: "storage.k8s.io/v1alpha1",
    ConfigMap: "v1",
    Secret: "v1",
    LimitRange: "v1",
    RuntimeClass: "node.k8s.io/v1",
  };

  const yaml: Record<string, any> = {
    apiVersion: apiVersions[resourceType] || "v1",
    kind: resourceType,
    metadata: cleanEmptyValues(metadata),
    spec: cleanEmptyValues(spec),
  };

  const cleaned = cleanEmptyValues(yaml);
  return YAML.dump(cleaned, yamlDumpOptions);
}
