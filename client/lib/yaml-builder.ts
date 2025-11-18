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
  return YAML.dump(cleaned, { indent: 2 });
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
  return YAML.dump(cleaned, { indent: 2 });
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
  return YAML.dump(cleaned, { indent: 2 });
}

export function generateDaemonSetYAML(daemonSetName: string, daemonSetConfig: Record<string, any>, containers: Container[]): string {
  return buildWorkloadYAML(daemonSetName, daemonSetConfig, containers, "DaemonSet", "apps/v1");
}

export function generateJobYAML(jobName: string, jobConfig: Record<string, any>, containers: Container[]): string {
  const metadata: Record<string, any> = {
    name: jobName,
  };

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
  return YAML.dump(cleaned, { indent: 2 });
}

export function generateCronJobYAML(cronJobName: string, cronJobConfig: Record<string, any>, containers: Container[]): string {
  const metadata: Record<string, any> = {
    name: cronJobName,
  };

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

  if (cronJobConfig.spec?.jobTemplate) {
    spec.jobTemplate = {
      metadata: {},
      spec: {},
    };

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

    spec.jobTemplate.metadata = cleanEmptyValues(spec.jobTemplate.metadata);
  }

  const yaml: Record<string, any> = {
    apiVersion: "batch/v1",
    kind: "CronJob",
    metadata: cleanEmptyValues(metadata),
    spec: cleanEmptyValues(spec),
  };

  const cleaned = cleanEmptyValues(yaml);
  return YAML.dump(cleaned, { indent: 2 });
}
