import React, { useState } from "react";
import Layout from "@/components/Layout";
import PodConfiguration from "@/components/PodConfiguration";
import ContainerConfiguration, { ContainerConfig } from "@/components/ContainerConfiguration";
import DeploymentConfiguration from "@/components/DeploymentConfiguration";
import ReplicaSetConfiguration from "@/components/ReplicaSetConfiguration";
import StatefulSetConfiguration from "@/components/StatefulSetConfiguration";
import DaemonSetConfiguration from "@/components/DaemonSetConfiguration";
import JobConfiguration from "@/components/JobConfiguration";
import CronJobConfiguration from "@/components/CronJobConfiguration";
import ResourceConfiguration from "@/components/ResourceConfiguration";
import { Upload, Plus, X, Zap } from "lucide-react";

type ChartMode = "standard" | "advanced";
type InputType = "file" | "repo";
type WorkloadType = "Pod" | "Deployment" | "ReplicaSet" | "StatefulSet" | "DaemonSet" | "Job" | "CronJob";
type ResourceType = "Service" | "HTTPRoute" | "GRPCRoute" | "Gateway" | "NetworkPolicy" | "StorageClass" | "PersistentVolume" | "PersistentVolumeClaim" | "VolumeAttributesClass" | "ConfigMap" | "Secret" | "LimitRange" | "RuntimeClass";
type RestartPolicy = "Always" | "OnFailure" | "Never";
type DNSPolicy = "ClusterFirstWithHostNet" | "ClusterFirst" | "Default" | "None";

interface Container extends ContainerConfig {
  id: string;
}

interface EphemeralContainer extends ContainerConfig {
  id: string;
  targetContainerName?: string;
}

interface InitContainer extends ContainerConfig {
  id: string;
}

interface OwnerReference {
  apiVersion?: string;
  blockOwnerDeletion?: boolean;
  controller?: boolean;
  kind?: string;
  name?: string;
  uid?: string;
}

interface PodConfig {
  // Metadata
  labels?: Record<string, string>;
  annotations?: Record<string, string>;

  // Lifecycle
  podDeathTime?: number;
  terminationGracePeriodSeconds?: number;
  restartPolicy?: RestartPolicy;
  dnsPolicy?: DNSPolicy;
  dnsConfig?: {
    nameservers?: string[];
    searches?: string[];
    options?: { name: string; value?: string }[];
  };
  hostAliases?: { ip: string; hostnames: string[] }[];

  // Scheduling
  nodeSelector?: Record<string, string>;
  affinity?: {
    nodeAffinity?: any;
    podAffinity?: any;
    podAntiAffinity?: any;
  };
  tolerations?: { key?: string; operator?: string; value?: string; effect?: string; tolerationSeconds?: number }[];
  topologySpreadConstraints?: {
    maxSkew: number;
    topologyKey: string;
    whenUnsatisfiable: string;
    labelSelector?: any;
  }[];

  // Security
  securityContext?: {
    runAsUser?: number;
    runAsGroup?: number;
    fsGroup?: number;
    seLinuxOptions?: any;
    supplementalGroups?: number[];
  };

  // Storage
  volumes?: {
    name: string;
    emptyDir?: any;
    configMap?: { name: string; defaultMode?: number };
    secret?: { secretName: string; defaultMode?: number };
    persistentVolumeClaim?: { claimName: string };
    downwardAPI?: any;
    projected?: any;
  }[];

  // Other
  serviceAccountName?: string;
  automountServiceAccountToken?: boolean;
  enableServiceLinks?: boolean;
  hostNetwork?: boolean;
  hostPID?: boolean;
  shareProcessNamespace?: boolean;
  priorityClassName?: string;
  preemptionPolicy?: string;

  // Resource claims
  resourceClaims?: { name: string }[];
}

interface WorkloadConfig extends PodConfig {
  // Deployment
  deploymentNamespace?: string;
  deploymentLabels?: Record<string, string>;
  deploymentAnnotations?: Record<string, string>;
  deploymentDeletionGracePeriodSeconds?: number;
  deploymentOwnerReferences?: OwnerReference[];
  deploymentSpec?: any;
  deploymentTemplate?: any;

  // ReplicaSet
  replicaSetNamespace?: string;
  replicaSetLabels?: Record<string, string>;
  replicaSetAnnotations?: Record<string, string>;
  replicaSetDeletionGracePeriodSeconds?: number;
  replicaSetOwnerReferences?: OwnerReference[];
  replicaSetSpec?: any;
  replicaSetTemplate?: any;

  // StatefulSet
  statefulSetNamespace?: string;
  statefulSetLabels?: Record<string, string>;
  statefulSetAnnotations?: Record<string, string>;
  statefulSetDeletionGracePeriodSeconds?: number;
  statefulSetOwnerReferences?: OwnerReference[];
  statefulSetSpec?: any;
  statefulSetTemplate?: any;

  // DaemonSet
  daemonSetNamespace?: string;
  daemonSetLabels?: Record<string, string>;
  daemonSetAnnotations?: Record<string, string>;
  daemonSetDeletionGracePeriodSeconds?: number;
  daemonSetOwnerReferences?: OwnerReference[];
  daemonSetSpec?: any;
  daemonSetTemplate?: any;

  // Job
  jobNamespace?: string;
  jobLabels?: Record<string, string>;
  jobAnnotations?: Record<string, string>;
  jobDeletionGracePeriodSeconds?: number;
  jobOwnerReferences?: OwnerReference[];
  jobSpec?: any;
  jobTemplate?: any;

  // CronJob
  cronJobNamespace?: string;
  cronJobLabels?: Record<string, string>;
  cronJobAnnotations?: Record<string, string>;
  cronJobDeletionGracePeriodSeconds?: number;
  cronJobOwnerReferences?: OwnerReference[];
  cronJobSpec?: any;

  // Containers
  initContainers?: InitContainer[];
  ephemeralContainers?: EphemeralContainer[];
}

interface Workload {
  id: string;
  name: string;
  type: WorkloadType;
  containers: Container[];
  config: WorkloadConfig;
}

interface OwnerReference {
  apiVersion?: string;
  blockOwnerDeletion?: boolean;
  controller?: boolean;
  kind?: string;
  name?: string;
  uid?: string;
}

interface ServicePort {
  name?: string;
  port: number;
  targetPort?: number | string;
  protocol?: "TCP" | "UDP" | "SCTP";
  nodePort?: number;
  appProtocol?: string;
}

interface ServiceSpec {
  type?: "ClusterIP" | "NodePort" | "ExternalName";
  clusterIP?: string;
  clusterIPs?: string[];
  externalName?: string;
  ipFamilyPolicy?: string;
  ports?: ServicePort[];
  publishNotReadyAddresses?: boolean;
  selector?: Record<string, string>;
  sessionAffinity?: "ClientIP" | "None";
  trafficDistribution?: string;
}

interface HTTPRouteParentReference {
  name?: string;
  namespace?: string;
  kind?: string;
  group?: string;
  sectionName?: string;
  port?: number;
}

interface HTTPRouteRule {
  matches?: {
    path?: { type?: string; value?: string };
    headers?: { name?: string; value?: string }[];
    queryParams?: { name?: string; value?: string }[];
    method?: string;
  }[];
  backendRefs?: { name?: string; namespace?: string; port?: number }[];
  filters?: { type?: string; requestHeaderModifier?: { set?: Record<string, string>; add?: Record<string, string>; remove?: string[] } }[];
}

interface HTTPRouteSpec {
  parentReferences?: HTTPRouteParentReference[];
  hostnames?: string[];
  rules?: HTTPRouteRule[];
}

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  deletionGracePeriodSeconds?: number;
  ownerReferences?: OwnerReference[];
  spec?: ServiceSpec | HTTPRouteSpec;
  data?: Record<string, any>;
}

const workloadTypes: WorkloadType[] = ["Pod", "Deployment", "ReplicaSet", "StatefulSet", "DaemonSet", "Job", "CronJob"];
const resourceTypes: ResourceType[] = ["Service", "HTTPRoute", "GRPCRoute", "Gateway", "NetworkPolicy", "StorageClass", "PersistentVolume", "PersistentVolumeClaim", "VolumeAttributesClass", "ConfigMap", "Secret", "LimitRange", "RuntimeClass"];

export default function CreateChart() {
  const [mode, setMode] = useState<ChartMode>("standard");
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedWorkloadType, setSelectedWorkloadType] = useState<WorkloadType>("Pod");
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>("Service");
  const [newWorkloadName, setNewWorkloadName] = useState<string>("");
  const [newResourceName, setNewResourceName] = useState<string>("");
  const [activeWorkloadId, setActiveWorkloadId] = useState<string>("");
  const [activeResourceId, setActiveResourceId] = useState<string>("");
  const [editingContainerId, setEditingContainerId] = useState<string>("");
  const [editingWorkloadId, setEditingWorkloadId] = useState<string>("");
  const [editingInitContainerId, setEditingInitContainerId] = useState<string>("");
  const [editingInitWorkloadId, setEditingInitWorkloadId] = useState<string>("");
  const [editingEphemeralContainerId, setEditingEphemeralContainerId] = useState<string>("");
  const [editingEphemeralWorkloadId, setEditingEphemeralWorkloadId] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [repository, setRepository] = useState<string>("");
  const [helmInstall, setHelmInstall] = useState<string>("");

  const activeWorkload = workloads.find((w) => w.id === activeWorkloadId);
  const activeResource = resources.find((r) => r.id === activeResourceId);

  const addWorkload = () => {
    if (newWorkloadName.trim()) {
      const newWorkload: Workload = {
        id: Date.now().toString(),
        name: newWorkloadName,
        type: selectedWorkloadType,
        containers: [{ id: Date.now().toString() + "-0", name: "", image: "" }],
        config: {},
      };
      setWorkloads([...workloads, newWorkload]);
      setNewWorkloadName("");
    }
  };

  const addResource = () => {
    if (newResourceName.trim()) {
      const newResource: Resource = {
        id: Date.now().toString(),
        name: newResourceName,
        type: selectedResourceType,
        data: {},
      };
      setResources([...resources, newResource]);
      setNewResourceName("");
    }
  };

  const deleteWorkload = (id: string) => {
    setWorkloads(workloads.filter((w) => w.id !== id));
    if (activeWorkloadId === id) setActiveWorkloadId("");
  };

  const deleteResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
    if (activeResourceId === id) setActiveResourceId("");
  };

  const updateWorkloadConfig = (id: string, key: keyof WorkloadConfig, value: any) => {
    setWorkloads(
      workloads.map((w) =>
        w.id === id ? { ...w, config: { ...w.config, [key]: value } } : w
      )
    );
  };

  const updateResourceConfig = (key: string, value: any) => {
    if (activeResource) {
      setResources(
        resources.map((r) => {
          if (r.id !== activeResource.id) return r;

          // Handle metadata fields at top level
          const metadataFields = ["name", "namespace", "labels", "annotations", "deletionGracePeriodSeconds", "ownerReferences"];

          if (metadataFields.includes(key)) {
            return { ...r, [key]: value };
          }

          // Handle spec at top level for resources like Service
          if (key === "spec") {
            return { ...r, spec: value };
          }

          // Handle other fields in data
          return { ...r, data: { ...r.data, [key]: value } };
        })
      );
    }
  };

  const addContainer = () => {
    if (activeWorkload) {
      const updatedWorkload = {
        ...activeWorkload,
        containers: [...activeWorkload.containers, { id: Date.now().toString(), name: "", image: "" }],
      };
      setWorkloads(workloads.map((w) => (w.id === activeWorkload.id ? updatedWorkload : w)));
    }
  };

  const deleteContainer = (workloadId: string, containerId: string) => {
    setWorkloads(
      workloads.map((w) =>
        w.id === workloadId
          ? { ...w, containers: w.containers.filter((c) => c.id !== containerId) }
          : w
      )
    );
  };

  const updateContainerConfig = (workloadId: string, containerId: string, key: keyof ContainerConfig, value: any) => {
    setWorkloads(
      workloads.map((w) =>
        w.id === workloadId
          ? {
            ...w,
            containers: w.containers.map((c) =>
              c.id === containerId ? { ...c, [key]: value } : c
            ),
          }
          : w
      )
    );
  };

  const addInitContainer = () => {
    if (activeWorkload) {
      const updatedConfig = {
        ...activeWorkload.config,
        initContainers: [...(activeWorkload.config.initContainers || []), { id: Date.now().toString(), name: "", image: "" }],
      };
      updateWorkloadConfig(activeWorkload.id, "initContainers" as keyof WorkloadConfig, updatedConfig.initContainers);
    }
  };

  const deleteInitContainer = (workloadId: string, containerId: string) => {
    setWorkloads(
      workloads.map((w) =>
        w.id === workloadId
          ? {
            ...w,
            config: {
              ...w.config,
              initContainers: (w.config.initContainers || []).filter((c) => c.id !== containerId),
            },
          }
          : w
      )
    );
  };

  const updateInitContainerConfig = (workloadId: string, containerId: string, key: keyof ContainerConfig, value: any) => {
    setWorkloads(
      workloads.map((w) =>
        w.id === workloadId
          ? {
            ...w,
            config: {
              ...w.config,
              initContainers: (w.config.initContainers || []).map((c) =>
                c.id === containerId ? { ...c, [key]: value } : c
              ),
            },
          }
          : w
      )
    );
  };

  const addEphemeralContainer = () => {
    if (activeWorkload) {
      const updatedConfig = {
        ...activeWorkload.config,
        ephemeralContainers: [...(activeWorkload.config.ephemeralContainers || []), { id: Date.now().toString(), name: "", image: "" }],
      };
      updateWorkloadConfig(activeWorkload.id, "ephemeralContainers" as keyof WorkloadConfig, updatedConfig.ephemeralContainers);
    }
  };

  const deleteEphemeralContainer = (workloadId: string, containerId: string) => {
    setWorkloads(
      workloads.map((w) =>
        w.id === workloadId
          ? {
            ...w,
            config: {
              ...w.config,
              ephemeralContainers: (w.config.ephemeralContainers || []).filter((c) => c.id !== containerId),
            },
          }
          : w
      )
    );
  };

  const updateEphemeralContainerConfig = (workloadId: string, containerId: string, key: keyof ContainerConfig | "targetContainerName", value: any) => {
    setWorkloads(
      workloads.map((w) =>
        w.id === workloadId
          ? {
            ...w,
            config: {
              ...w.config,
              ephemeralContainers: (w.config.ephemeralContainers || []).map((c) =>
                c.id === containerId ? { ...c, [key]: value } : c
              ),
            },
          }
          : w
      )
    );
  };

  const isContainerConfigValid = (container: ContainerConfig) => {
    return !!(container.name && container.image);
  };

  const handleStandardSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setTimeout(() => {
      alert("Standard chart created successfully!");
      setIsCreating(false);
      setMode("standard");
    }, 2000);
  };

  const handleAdvancedSubmit = () => {
    setIsCreating(true);
    setTimeout(() => {
      alert("Advanced chart created successfully!");
      setIsCreating(false);
      setWorkloads([]);
      setResources([]);
      setMode("standard");
    }, 2000);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Deploy Configuration</h1>
            <p className="text-lg text-foreground/60">Choose between Standard or Advanced deployment approach</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            <div
              onClick={() => setMode("standard")}
              className={`p-8 bg-card border-2 rounded-xl cursor-pointer transition-all ${
                mode === "standard"
                  ? "border-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/5"
              }`}
            >
              <h2 className="text-xl font-bold text-foreground mb-2">Standard</h2>
              <p className="text-sm text-foreground/60 mb-4">Simple and Quick</p>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li>✓ Pre-configured templates</li>
                <li>✓ Best practices built-in</li>
                <li>✓ Quick setup</li>
                <li>✓ Suitable for common use cases</li>
              </ul>
            </div>

            <div
              onClick={() => setMode("advanced")}
              className={`p-8 bg-card border-2 rounded-xl cursor-pointer transition-all ${
                mode === "advanced"
                  ? "border-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/5"
              }`}
            >
              <h2 className="text-xl font-bold text-foreground mb-2">Advanced</h2>
              <p className="text-sm text-foreground/60 mb-4">Full Customization</p>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li>✓ Create multiple workloads</li>
                <li>✓ Define resources</li>
                <li>✓ Full control over configuration</li>
                <li>✓ Complex deployments</li>
              </ul>
            </div>
          </div>

          {mode === "standard" && (
            <form onSubmit={handleStandardSubmit} className="max-w-2xl mx-auto space-y-6 bg-card border border-border rounded-xl p-8">
              <div>
                <label htmlFor="chartName" className="block text-sm font-semibold text-foreground mb-2">
                  Configuration Name
                </label>
                <input
                  id="chartName"
                  type="text"
                  value={chartName}
                  onChange={(e) => setChartName(e.target.value)}
                  placeholder="my-app"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="chartDescription" className="block text-sm font-semibold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  id="chartDescription"
                  value={chartDescription}
                  onChange={(e) => setChartDescription(e.target.value)}
                  placeholder="A brief description of your configuration..."
                  className="input-field resize-none h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="chartVersion" className="block text-sm font-semibold text-foreground mb-2">
                    Version
                  </label>
                  <input
                    id="chartVersion"
                    type="text"
                    value={chartVersion}
                    onChange={(e) => setChartVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="chartAuthor" className="block text-sm font-semibold text-foreground mb-2">
                    Author
                  </label>
                  <input
                    id="chartAuthor"
                    type="text"
                    value={chartAuthor}
                    onChange={(e) => setChartAuthor(e.target.value)}
                    placeholder="Your Name"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="repository" className="block text-sm font-semibold text-foreground mb-2">
                  Repository
                </label>
                <input
                  id="repository"
                  type="text"
                  value={repository}
                  onChange={(e) => setRepository(e.target.value)}
                  placeholder="kyverno-nirmata https://nirmata.github.io/kyverno-charts/"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="helmInstall" className="block text-sm font-semibold text-foreground mb-2">
                  Helm Install
                </label>
                <textarea
                  id="helmInstall"
                  value={helmInstall}
                  onChange={(e) => setHelmInstall(e.target.value)}
                  placeholder="my-nirmata-kyverno-operator kyverno-nirmata/nirmata-kyverno-operator --version 0.8.9-rc1"
                  className="input-field resize-none h-24"
                  required
                />
              </div>

              <div>
                <label htmlFor="kubectlCommand" className="block text-sm font-semibold text-foreground mb-2">
                  Kubectl Deploy Command
                </label>
                <textarea
                  id="kubectlCommand"
                  value={kubectlCommand}
                  onChange={(e) => setKubectlCommand(e.target.value)}
                  placeholder="kubectl apply -f https://..."
                  className="input-field resize-none h-24"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Deploying Configuration..." : "Deploy Configuration"}
              </button>
            </form>
          )}

          {/* Advanced Mode Form */}
          {mode === "advanced" && (
            <div className="space-y-8">
              {/* Two-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Workload */}
                <div className="space-y-8">
                  {/* Create Workload Section */}
                  <div className="bg-card border border-border rounded-xl p-8">
                    <h2 className="text-xl font-bold text-foreground mb-6">Create Workload</h2>
                    <div className="space-y-4 mb-6">
                      {/* Workload Type Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-3">Workload Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {workloadTypes.map((type) => (
                            <button
                              key={type}
                              onClick={() => setSelectedWorkloadType(type)}
                              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                selectedWorkloadType === type
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-foreground hover:border-primary/50"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Workload Name */}
                      <div>
                        <label htmlFor="workloadName" className="block text-sm font-semibold text-foreground mb-2">
                          Workload Name
                        </label>
                        <input
                          id="workloadName"
                          type="text"
                          value={newWorkloadName}
                          onChange={(e) => setNewWorkloadName(e.target.value)}
                          placeholder="e.g., api-server, database"
                          className="input-field"
                        />
                      </div>

                      {/* Add Workload Button */}
                      <button
                        onClick={addWorkload}
                        className="btn-primary w-full"
                      >
                        <Plus className="w-5 h-5 inline mr-2" />
                        Create {selectedWorkloadType}
                      </button>
                    </div>

                    {/* Workloads List */}
                    {workloads.length > 0 && (
                      <div className="space-y-2">
                        {workloads.map((workload) => (
                          <div
                            key={workload.id}
                            onClick={() => setActiveWorkloadId(workload.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setActiveWorkloadId(workload.id);
                              }
                            }}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                              activeWorkloadId === workload.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-foreground">{workload.name || "Unnamed"}</p>
                              <p className="text-sm text-foreground/60">
                                {workload.type} • {workload.containers.length} container(s)
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteWorkload(workload.id);
                              }}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded hover:opacity-75 transition-opacity"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Workload Configuration */}
                  {activeWorkload && (
                    <div className="bg-card border border-border rounded-xl p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-foreground">Configure "{activeWorkload.name}" ({activeWorkload.type})</h2>
                        <button
                          onClick={() => setActiveWorkloadId("")}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded hover:opacity-75 transition-opacity"
                          title="Close configuration"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Type-specific Configuration */}
                      <div className="space-y-4 mb-8 p-6 bg-muted/30 rounded-lg border border-border">
                        <h3 className="font-semibold text-foreground mb-4">Configuration</h3>

                        {activeWorkload.type === "Pod" && (
                          <div className="space-y-4">
                            <p className="text-foreground/60 text-sm font-medium mb-4">Pod Configuration</p>
                            <PodConfiguration
                              config={activeWorkload.config}
                              onConfigChange={(key, value) => updateWorkloadConfig(activeWorkload.id, key, value)}
                            />
                          </div>
                        )}

                        {activeWorkload.type === "Deployment" && (
                          <div className="space-y-4">
                            <p className="text-foreground/60 text-sm font-medium mb-4">Deployment Configuration</p>
                            <DeploymentConfiguration
                              config={{
                                namespace: activeWorkload.config.deploymentNamespace,
                                labels: activeWorkload.config.deploymentLabels,
                                annotations: activeWorkload.config.deploymentAnnotations,
                                deletionGracePeriodSeconds: activeWorkload.config.deploymentDeletionGracePeriodSeconds,
                                ownerReferences: activeWorkload.config.deploymentOwnerReferences,
                                spec: activeWorkload.config.deploymentSpec,
                                template: activeWorkload.config.deploymentTemplate,
                              }}
                              onConfigChange={(key, value) => {
                                if (key === "spec") {
                                  updateWorkloadConfig(activeWorkload.id, "deploymentSpec", value);
                                } else if (key === "template") {
                                  updateWorkloadConfig(activeWorkload.id, "deploymentTemplate", value);
                                } else {
                                  const configKey: keyof WorkloadConfig = `deployment${key.charAt(0).toUpperCase() + key.slice(1)}` as any;
                                  updateWorkloadConfig(activeWorkload.id, configKey, value);
                                }
                              }}
                            />
                          </div>
                        )}

                        {activeWorkload.type === "ReplicaSet" && (
                          <div className="space-y-4">
                            <p className="text-foreground/60 text-sm font-medium mb-4">ReplicaSet Configuration</p>
                            <ReplicaSetConfiguration
                              config={{
                                namespace: activeWorkload.config.replicaSetNamespace,
                                labels: activeWorkload.config.replicaSetLabels,
                                annotations: activeWorkload.config.replicaSetAnnotations,
                                deletionGracePeriodSeconds: activeWorkload.config.replicaSetDeletionGracePeriodSeconds,
                                ownerReferences: activeWorkload.config.replicaSetOwnerReferences,
                                spec: activeWorkload.config.replicaSetSpec,
                                template: activeWorkload.config.replicaSetTemplate,
                              }}
                              onConfigChange={(key, value) => {
                                if (key === "spec") {
                                  updateWorkloadConfig(activeWorkload.id, "replicaSetSpec", value);
                                } else if (key === "template") {
                                  updateWorkloadConfig(activeWorkload.id, "replicaSetTemplate", value);
                                } else {
                                  const configKey: keyof WorkloadConfig = `replicaSet${key.charAt(0).toUpperCase() + key.slice(1)}` as any;
                                  updateWorkloadConfig(activeWorkload.id, configKey, value);
                                }
                              }}
                            />
                          </div>
                        )}

                        {activeWorkload.type === "StatefulSet" && (
                          <div className="space-y-4">
                            <p className="text-foreground/60 text-sm font-medium mb-4">StatefulSet Configuration</p>
                            <StatefulSetConfiguration
                              config={{
                                namespace: activeWorkload.config.statefulSetNamespace,
                                labels: activeWorkload.config.statefulSetLabels,
                                annotations: activeWorkload.config.statefulSetAnnotations,
                                deletionGracePeriodSeconds: activeWorkload.config.statefulSetDeletionGracePeriodSeconds,
                                ownerReferences: activeWorkload.config.statefulSetOwnerReferences,
                                spec: activeWorkload.config.statefulSetSpec,
                                template: activeWorkload.config.statefulSetTemplate,
                              }}
                              onConfigChange={(key, value) => {
                                if (key === "spec") {
                                  updateWorkloadConfig(activeWorkload.id, "statefulSetSpec", value);
                                } else if (key === "template") {
                                  updateWorkloadConfig(activeWorkload.id, "statefulSetTemplate", value);
                                } else {
                                  const configKey: keyof WorkloadConfig = `statefulSet${key.charAt(0).toUpperCase() + key.slice(1)}` as any;
                                  updateWorkloadConfig(activeWorkload.id, configKey, value);
                                }
                              }}
                            />
                          </div>
                        )}

                        {activeWorkload.type === "DaemonSet" && (
                          <div className="space-y-4">
                            <p className="text-foreground/60 text-sm font-medium mb-4">DaemonSet Configuration</p>
                            <DaemonSetConfiguration
                              config={{
                                namespace: activeWorkload.config.daemonSetNamespace,
                                labels: activeWorkload.config.daemonSetLabels,
                                annotations: activeWorkload.config.daemonSetAnnotations,
                                deletionGracePeriodSeconds: activeWorkload.config.daemonSetDeletionGracePeriodSeconds,
                                ownerReferences: activeWorkload.config.daemonSetOwnerReferences,
                                spec: activeWorkload.config.daemonSetSpec,
                                template: activeWorkload.config.daemonSetTemplate,
                              }}
                              onConfigChange={(key, value) => {
                                if (key === "spec") {
                                  updateWorkloadConfig(activeWorkload.id, "daemonSetSpec", value);
                                } else if (key === "template") {
                                  updateWorkloadConfig(activeWorkload.id, "daemonSetTemplate", value);
                                } else {
                                  const configKey: keyof WorkloadConfig = `daemonSet${key.charAt(0).toUpperCase() + key.slice(1)}` as any;
                                  updateWorkloadConfig(activeWorkload.id, configKey, value);
                                }
                              }}
                            />
                          </div>
                        )}

                        {activeWorkload.type === "Job" && (
                          <div className="space-y-4">
                            <p className="text-foreground/60 text-sm font-medium mb-4">Job Configuration</p>
                            <JobConfiguration
                              config={{
                                namespace: activeWorkload.config.jobNamespace,
                                labels: activeWorkload.config.jobLabels,
                                annotations: activeWorkload.config.jobAnnotations,
                                deletionGracePeriodSeconds: activeWorkload.config.jobDeletionGracePeriodSeconds,
                                ownerReferences: activeWorkload.config.jobOwnerReferences,
                                spec: activeWorkload.config.jobSpec,
                                template: activeWorkload.config.jobTemplate,
                              }}
                              onConfigChange={(key, value) => {
                                if (key === "spec") {
                                  updateWorkloadConfig(activeWorkload.id, "jobSpec", value);
                                } else if (key === "template") {
                                  updateWorkloadConfig(activeWorkload.id, "jobTemplate", value);
                                } else {
                                  const configKey: keyof WorkloadConfig = `job${key.charAt(0).toUpperCase() + key.slice(1)}` as any;
                                  updateWorkloadConfig(activeWorkload.id, configKey, value);
                                }
                              }}
                            />
                          </div>
                        )}

                        {activeWorkload.type === "CronJob" && (
                          <div className="space-y-4">
                            <p className="text-foreground/60 text-sm font-medium mb-4">CronJob Configuration</p>
                            <CronJobConfiguration
                              config={{
                                namespace: activeWorkload.config.cronJobNamespace,
                                labels: activeWorkload.config.cronJobLabels,
                                annotations: activeWorkload.config.cronJobAnnotations,
                                deletionGracePeriodSeconds: activeWorkload.config.cronJobDeletionGracePeriodSeconds,
                                ownerReferences: activeWorkload.config.cronJobOwnerReferences,
                                spec: activeWorkload.config.cronJobSpec,
                              }}
                              onConfigChange={(key, value) => {
                                if (key === "spec") {
                                  updateWorkloadConfig(activeWorkload.id, "cronJobSpec", value);
                                } else {
                                  const configKey: keyof WorkloadConfig = `cronJob${key.charAt(0).toUpperCase() + key.slice(1)}` as any;
                                  updateWorkloadConfig(activeWorkload.id, configKey, value);
                                }
                              }}
                              jobConfig={{
                                namespace: activeWorkload.config.jobNamespace,
                                labels: activeWorkload.config.jobLabels,
                                annotations: activeWorkload.config.jobAnnotations,
                                deletionGracePeriodSeconds: activeWorkload.config.jobDeletionGracePeriodSeconds,
                                ownerReferences: activeWorkload.config.jobOwnerReferences,
                                spec: activeWorkload.config.jobSpec,
                                template: activeWorkload.config.jobTemplate,
                              }}
                              onJobConfigChange={(key, value) => {
                                if (key === "spec") {
                                  updateWorkloadConfig(activeWorkload.id, "jobSpec", value);
                                } else if (key === "template") {
                                  updateWorkloadConfig(activeWorkload.id, "jobTemplate", value);
                                } else {
                                  const configKey: keyof WorkloadConfig = `job${key.charAt(0).toUpperCase() + key.slice(1)}` as any;
                                  updateWorkloadConfig(activeWorkload.id, configKey, value);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Init Containers Section */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Init Containers</h3>
                          <button
                            onClick={addInitContainer}
                            className="text-primary hover:opacity-70 text-sm flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Init Container
                          </button>
                        </div>

                        {(activeWorkload.config.initContainers || []).length > 0 ? (
                          <div className="space-y-3">
                            {(activeWorkload.config.initContainers || []).map((container) => {
                              const isValid = isContainerConfigValid(container);
                              return (
                                <div
                                  key={container.id}
                                  className={`p-4 bg-muted/20 border-2 rounded-lg transition-all cursor-pointer ${
                                    editingInitContainerId === container.id && editingInitWorkloadId === activeWorkload.id
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/30"
                                  }`}
                                >
                                  <div
                                    onClick={() => {
                                      setEditingInitContainerId(container.id);
                                      setEditingInitWorkloadId(activeWorkload.id);
                                    }}
                                    className="flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="font-semibold text-foreground">
                                        {container.name || "(unnamed)"}
                                      </p>
                                      <p className="text-sm text-foreground/60">{container.image || "No image"}</p>
                                      {!isValid && (
                                        <p className="text-sm text-destructive font-medium mt-1">Minimal config not set</p>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteInitContainer(activeWorkload.id, container.id);
                                      }}
                                      className="text-destructive hover:bg-destructive/10 p-1 rounded hover:opacity-75 transition-opacity"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-foreground/60 text-sm py-4">No init containers added yet</p>
                        )}
                      </div>

                      {/* Containers Section */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Containers</h3>
                          <button
                            onClick={addContainer}
                            className="text-primary hover:opacity-70 text-sm flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Container
                          </button>
                        </div>

                        {activeWorkload.containers.length > 0 ? (
                          <div className="space-y-3">
                            {activeWorkload.containers.map((container) => {
                              const isValid = isContainerConfigValid(container);
                              return (
                                <div
                                  key={container.id}
                                  className={`p-4 bg-muted/20 border-2 rounded-lg transition-all cursor-pointer ${
                                    editingContainerId === container.id && editingWorkloadId === activeWorkload.id
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/30"
                                  }`}
                                >
                                  <div
                                    onClick={() => {
                                      setEditingContainerId(container.id);
                                      setEditingWorkloadId(activeWorkload.id);
                                    }}
                                    className="flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="font-semibold text-foreground">
                                        {container.name || "(unnamed)"}
                                      </p>
                                      <p className="text-sm text-foreground/60">{container.image || "No image"}</p>
                                      {!isValid && (
                                        <p className="text-sm text-destructive font-medium mt-1">Minimal config not set</p>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteContainer(activeWorkload.id, container.id);
                                      }}
                                      className="text-destructive hover:bg-destructive/10 p-1 rounded hover:opacity-75 transition-opacity"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-foreground/60 text-sm py-4">No containers added yet</p>
                        )}
                      </div>

                      {/* Container Configuration */}
                      {editingContainerId && editingWorkloadId === activeWorkload.id && (
                        <div className="mb-8 p-6 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">
                              Configure Container: {activeWorkload.containers.find((c) => c.id === editingContainerId)?.name || "(unnamed)"}
                            </h3>
                            <button
                              onClick={() => {
                                setEditingContainerId("");
                                setEditingWorkloadId("");
                              }}
                              className="text-foreground/60 hover:text-foreground"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <ContainerConfiguration
                            container={activeWorkload.containers.find((c) => c.id === editingContainerId) || {}}
                            onConfigChange={(key, value) =>
                              updateContainerConfig(activeWorkload.id, editingContainerId, key, value)
                            }
                          />
                        </div>
                      )}

                      {/* Init Container Configuration */}
                      {editingInitContainerId && editingInitWorkloadId === activeWorkload.id && (
                        <div className="mb-8 p-6 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">
                              Configure Init Container: {(activeWorkload.config.initContainers || []).find((c) => c.id === editingInitContainerId)?.name || "(unnamed)"}
                            </h3>
                            <button
                              onClick={() => {
                                setEditingInitContainerId("");
                                setEditingInitWorkloadId("");
                              }}
                              className="text-foreground/60 hover:text-foreground"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <ContainerConfiguration
                            container={(activeWorkload.config.initContainers || []).find((c) => c.id === editingInitContainerId) || {}}
                            onConfigChange={(key, value) =>
                              updateInitContainerConfig(activeWorkload.id, editingInitContainerId, key, value)
                            }
                          />
                        </div>
                      )}

                      {/* Ephemeral Containers Section */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Ephemeral Containers</h3>
                          <button
                            onClick={addEphemeralContainer}
                            className="text-primary hover:opacity-70 text-sm flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Ephemeral Container
                          </button>
                        </div>

                        {(activeWorkload.config.ephemeralContainers || []).length > 0 ? (
                          <div className="space-y-3">
                            {(activeWorkload.config.ephemeralContainers || []).map((container) => {
                              const isValid = isContainerConfigValid(container);
                              return (
                                <div
                                  key={container.id}
                                  className={`p-4 bg-muted/20 border-2 rounded-lg transition-all cursor-pointer ${
                                    editingEphemeralContainerId === container.id && editingEphemeralWorkloadId === activeWorkload.id
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/30"
                                  }`}
                                >
                                  <div
                                    onClick={() => {
                                      setEditingEphemeralContainerId(container.id);
                                      setEditingEphemeralWorkloadId(activeWorkload.id);
                                    }}
                                    className="flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="font-semibold text-foreground">
                                        {container.name || "(unnamed)"}
                                      </p>
                                      <p className="text-sm text-foreground/60">{container.image || "No image"}</p>
                                      {container.targetContainerName && (
                                        <p className="text-xs text-foreground/50 mt-1">Target: {container.targetContainerName}</p>
                                      )}
                                      {!isValid && (
                                        <p className="text-sm text-destructive font-medium mt-1">Minimal config not set</p>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteEphemeralContainer(activeWorkload.id, container.id);
                                      }}
                                      className="text-destructive hover:bg-destructive/10 p-1 rounded hover:opacity-75 transition-opacity"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-foreground/60 text-sm py-4">No ephemeral containers added yet</p>
                        )}
                      </div>

                      {/* Ephemeral Container Configuration */}
                      {editingEphemeralContainerId && editingEphemeralWorkloadId === activeWorkload.id && (
                        <div className="mb-8 p-6 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">
                              Configure Ephemeral Container: {(activeWorkload.config.ephemeralContainers || []).find((c) => c.id === editingEphemeralContainerId)?.name || "(unnamed)"}
                            </h3>
                            <button
                              onClick={() => {
                                setEditingEphemeralContainerId("");
                                setEditingEphemeralWorkloadId("");
                              }}
                              className="text-foreground/60 hover:text-foreground"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-6">
                            {/* Target Container Name */}
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Target Container Name</label>
                              <select
                                value={(
                                  (activeWorkload.config.ephemeralContainers || []).find(
                                    (c) => c.id === editingEphemeralContainerId
                                  )?.targetContainerName || ""
                                )}
                                onChange={(e) =>
                                  updateEphemeralContainerConfig(
                                    activeWorkload.id,
                                    editingEphemeralContainerId,
                                    "targetContainerName",
                                    e.target.value || undefined
                                  )
                                }
                                className="input-field"
                              >
                                <option value="">Select Target Container</option>
                                {activeWorkload.containers.map((c) => (
                                  <option key={c.id} value={c.name || "(unnamed)"}>
                                    {c.name || "(unnamed)"}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-foreground/50 mt-1">
                                The name of the container this ephemeral container targets for debugging
                              </p>
                            </div>

                            {/* Container Configuration */}
                            <ContainerConfiguration
                              container={
                                (activeWorkload.config.ephemeralContainers || []).find(
                                  (c) => c.id === editingEphemeralContainerId
                                ) || {}
                              }
                              onConfigChange={(key, value) =>
                                updateEphemeralContainerConfig(activeWorkload.id, editingEphemeralContainerId, key, value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Resource */}
                <div className="space-y-8">
                  {/* Create Resource Section */}
                  <div className="bg-card border border-border rounded-xl p-8">
                    <h2 className="text-xl font-bold text-foreground mb-6">Create Resource</h2>
                    <div className="space-y-4 mb-6">
                      {/* Resource Type Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-3">Resource Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {resourceTypes.map((type) => (
                            <button
                              key={type}
                              onClick={() => setSelectedResourceType(type)}
                              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                selectedResourceType === type
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-foreground hover:border-primary/50"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Resource Name */}
                      <div>
                        <label htmlFor="resourceName" className="block text-sm font-semibold text-foreground mb-2">
                          Resource Name
                        </label>
                        <input
                          id="resourceName"
                          type="text"
                          value={newResourceName}
                          onChange={(e) => setNewResourceName(e.target.value)}
                          placeholder="e.g., my-service, app-config"
                          className="input-field"
                        />
                      </div>

                      {/* Add Resource Button */}
                      <button
                        onClick={addResource}
                        className="btn-primary w-full"
                      >
                        <Plus className="w-5 h-5 inline mr-2" />
                        Create {selectedResourceType}
                      </button>
                    </div>

                    {/* Resources List */}
                    {resources.length > 0 && (
                      <div className="space-y-2">
                        {resources.map((resource) => (
                          <div
                            key={resource.id}
                            onClick={() => setActiveResourceId(resource.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setActiveResourceId(resource.id);
                              }
                            }}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                              activeResourceId === resource.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-foreground">{resource.name || "Unnamed"}</p>
                              <p className="text-sm text-foreground/60">{resource.type}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteResource(resource.id);
                              }}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded hover:opacity-75 transition-opacity"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resource Configuration */}
                  {activeResource && (
                    <div className="bg-card border border-border rounded-xl p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-foreground">Configure "{activeResource.name}" ({activeResource.type})</h2>
                        <button
                          onClick={() => setActiveResourceId("")}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded hover:opacity-75 transition-opacity"
                          title="Close configuration"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <ResourceConfiguration
                        config={{
                          id: activeResource.id,
                          name: activeResource.name,
                          type: activeResource.type,
                          namespace: activeResource.namespace,
                          labels: activeResource.labels,
                          annotations: activeResource.annotations,
                          deletionGracePeriodSeconds: activeResource.deletionGracePeriodSeconds,
                          ownerReferences: activeResource.ownerReferences,
                          spec: activeResource.spec,
                        }}
                        onConfigChange={updateResourceConfig}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              {workloads.length > 0 && (
                <div>
                  <button
                    onClick={handleAdvancedSubmit}
                    disabled={isCreating}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Deploying Advanced Configuration..." : "Deploy Advanced Configuration"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
