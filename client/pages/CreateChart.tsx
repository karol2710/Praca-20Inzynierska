import { useState } from "react";
import Layout from "@/components/Layout";
import PodConfiguration from "@/components/PodConfiguration";
import ContainerConfiguration, { ContainerConfig } from "@/components/ContainerConfiguration";
import DeploymentConfiguration from "@/components/DeploymentConfiguration";
import ReplicaSetConfiguration from "@/components/ReplicaSetConfiguration";
import StatefulSetConfiguration from "@/components/StatefulSetConfiguration";
import { Upload, Plus, X, Zap } from "lucide-react";

type ChartMode = "standard" | "advanced";
type InputType = "file" | "repo";
type WorkloadType = "Pod" | "Deployment" | "ReplicaSet" | "StatefulSet" | "DaemonSet" | "Job" | "CronJob";
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

  // Scheduling
  nodeName?: string;
  nodeSelector?: Record<string, string>;
  priority?: number;
  priorityClassName?: string;
  schedulerName?: string;

  // Security
  automountServiceAccountToken?: boolean;
  serviceAccountName?: string;

  // Networking
  hostname?: string;
  subdomain?: string;
  dnsPolicy?: DNSPolicy;
  enableServiceLinks?: boolean;
  hostNetwork?: boolean;
  hostIPC?: boolean;
  hostPID?: boolean;
  shareProcessNamespace?: boolean;
  hostUsers?: boolean;

  // Storage
  imagePullSecrets?: string[];

  // Init Containers
  initContainers?: InitContainer[];

  // Ephemeral Containers
  ephemeralContainers?: EphemeralContainer[];

  // Advanced
  restartPolicy?: RestartPolicy;
  runtimeClassName?: string;
}

interface DeploymentSpecSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: {
    key: string;
    operator: string;
    values?: string[];
  }[];
}

interface RollingUpdateStrategy {
  maxSurge?: string;
  maxUnavailable?: string;
}

interface DeploymentStrategy {
  type?: string;
  rollingUpdate?: RollingUpdateStrategy;
}

interface DeploymentSpec {
  minReadySeconds?: number;
  progressDeadlineSeconds?: number;
  revisionHistoryLimit?: number;
  selector?: DeploymentSpecSelector;
  strategy?: DeploymentStrategy;
}

interface WorkloadConfig extends PodConfig {
  replicas?: number;
  serviceName?: string;
  schedule?: string;
  parallelism?: number;
  completions?: number;
  backoffLimit?: number;
  selector?: Record<string, string>;
  // Deployment Metadata
  deploymentNamespace?: string;
  deploymentLabels?: Record<string, string>;
  deploymentAnnotations?: Record<string, string>;
  deploymentDeletionGracePeriodSeconds?: number;
  deploymentOwnerReferences?: OwnerReference[];
  // Deployment Spec
  deploymentSpec?: DeploymentSpec;
  // Deployment Template (Pod)
  deploymentTemplate?: PodConfig;
  // ReplicaSet Metadata
  replicaSetNamespace?: string;
  replicaSetLabels?: Record<string, string>;
  replicaSetAnnotations?: Record<string, string>;
  replicaSetDeletionGracePeriodSeconds?: number;
  replicaSetOwnerReferences?: OwnerReference[];
  // ReplicaSet Spec
  replicaSetSpec?: DeploymentSpec;
  // ReplicaSet Template (Pod)
  replicaSetTemplate?: PodConfig;
}

interface Workload {
  id: string;
  name: string;
  type: WorkloadType;
  containers: Container[];
  config: WorkloadConfig;
}

export default function CreateChart() {
  const [mode, setMode] = useState<ChartMode>("standard");
  const [inputType, setInputType] = useState<InputType>("file");
  const [fileName, setFileName] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState<string>("");
  const [kubectlCommand, setKubectlCommand] = useState<string>("");
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [selectedWorkloadType, setSelectedWorkloadType] = useState<WorkloadType>("Pod");
  const [newWorkloadName, setNewWorkloadName] = useState<string>("");
  const [activeWorkloadId, setActiveWorkloadId] = useState<string>("");
  const [editingContainerId, setEditingContainerId] = useState<string>("");
  const [editingWorkloadId, setEditingWorkloadId] = useState<string>("");
  const [editingInitContainerId, setEditingInitContainerId] = useState<string>("");
  const [editingInitWorkloadId, setEditingInitWorkloadId] = useState<string>("");
  const [editingEphemeralContainerId, setEditingEphemeralContainerId] = useState<string>("");
  const [editingEphemeralWorkloadId, setEditingEphemeralWorkloadId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const workloadTypes: WorkloadType[] = ["Pod", "Deployment", "ReplicaSet", "StatefulSet", "DaemonSet", "Job", "CronJob"];

  // Standard mode handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      alert(`Chart created successfully!\nInput: ${inputType === "file" ? `File: ${fileName}` : `Repo: ${repoUrl}`}\nKubectl command: ${kubectlCommand}`);
    }, 1500);
  };

  // Advanced mode handlers
  const addWorkload = () => {
    if (!newWorkloadName.trim()) return;

    const defaultConfig: WorkloadConfig = {};
    if (["Deployment", "ReplicaSet", "StatefulSet"].includes(selectedWorkloadType)) {
      defaultConfig.replicas = 1;
    }
    if (selectedWorkloadType === "StatefulSet") {
      defaultConfig.serviceName = "default";
    }
    if (selectedWorkloadType === "CronJob") {
      defaultConfig.schedule = "0 0 * * *";
    }
    if (selectedWorkloadType === "Job") {
      defaultConfig.parallelism = 1;
      defaultConfig.completions = 1;
      defaultConfig.backoffLimit = 3;
    }

    const newWorkload: Workload = {
      id: Date.now().toString(),
      name: newWorkloadName,
      type: selectedWorkloadType,
      containers: [],
      config: defaultConfig,
    };
    setWorkloads([...workloads, newWorkload]);
    setActiveWorkloadId(newWorkload.id);
    setNewWorkloadName("");
  };

  const deleteWorkload = (id: string) => {
    setWorkloads(workloads.filter((w) => w.id !== id));
    if (activeWorkloadId === id) {
      setActiveWorkloadId(workloads.find((w) => w.id !== id)?.id || "");
    }
  };

  const addContainer = () => {
    if (!activeWorkloadId) return;

    const newContainer: Container = {
      id: Date.now().toString(),
      name: "",
      image: "",
      imagePullPolicy: "IfNotPresent",
    };

    setWorkloads(
      workloads.map((w) =>
        w.id === activeWorkloadId
          ? { ...w, containers: [...w.containers, newContainer] }
          : w
      )
    );
    setEditingContainerId(newContainer.id);
    setEditingWorkloadId(activeWorkloadId);
  };

  const updateContainerConfig = (
    workloadId: string,
    containerId: string,
    key: keyof ContainerConfig,
    value: any
  ) => {
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

  const deleteContainer = (workloadId: string, containerId: string) => {
    setWorkloads(
      workloads.map((w) =>
        w.id === workloadId
          ? { ...w, containers: w.containers.filter((c) => c.id !== containerId) }
          : w
      )
    );
    if (editingContainerId === containerId) {
      setEditingContainerId("");
      setEditingWorkloadId("");
    }
  };

  const addEphemeralContainer = () => {
    if (!activeWorkloadId) return;

    const newEphemeralContainer: EphemeralContainer = {
      id: Date.now().toString(),
      name: "",
      image: "",
      imagePullPolicy: "IfNotPresent",
      targetContainerName: "",
    };

    setWorkloads(
      workloads.map((w) =>
        w.id === activeWorkloadId
          ? { ...w, config: { ...w.config, ephemeralContainers: [...(w.config.ephemeralContainers || []), newEphemeralContainer] } }
          : w
      )
    );
    setEditingEphemeralContainerId(newEphemeralContainer.id);
    setEditingEphemeralWorkloadId(activeWorkloadId);
  };

  const updateEphemeralContainerConfig = (
    workloadId: string,
    containerId: string,
    key: keyof ContainerConfig | "targetContainerName",
    value: any
  ) => {
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
    if (editingEphemeralContainerId === containerId) {
      setEditingEphemeralContainerId("");
      setEditingEphemeralWorkloadId("");
    }
  };

  const addInitContainer = () => {
    if (!activeWorkloadId) return;

    const newInitContainer: InitContainer = {
      id: Date.now().toString(),
      name: "",
      image: "",
      imagePullPolicy: "IfNotPresent",
    };

    setWorkloads(
      workloads.map((w) =>
        w.id === activeWorkloadId
          ? { ...w, config: { ...w.config, initContainers: [...(w.config.initContainers || []), newInitContainer] } }
          : w
      )
    );
    setEditingInitContainerId(newInitContainer.id);
    setEditingInitWorkloadId(activeWorkloadId);
  };

  const updateInitContainerConfig = (
    workloadId: string,
    containerId: string,
    key: keyof ContainerConfig,
    value: any
  ) => {
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
    if (editingInitContainerId === containerId) {
      setEditingInitContainerId("");
      setEditingInitWorkloadId("");
    }
  };

  const updateWorkloadConfig = (workloadId: string, key: keyof WorkloadConfig, value: any) => {
    setWorkloads(
      workloads.map((w) =>
        w.id === workloadId
          ? { ...w, config: { ...w.config, [key]: value } }
          : w
      )
    );
  };

  const handleAdvancedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workloads.length === 0) {
      alert("Please add at least one workload");
      return;
    }
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      alert(`Advanced chart created with ${workloads.length} workload(s)`);
    }, 1500);
  };

  const activeWorkload = workloads.find((w) => w.id === activeWorkloadId);

  const isContainerConfigValid = (container: Container): boolean => {
    const hasName = !!container.name?.trim();
    const hasImage = !!container.image?.trim();
    const hasPort = container.ports && container.ports.length > 0 && container.ports.some((p) => p.containerPort);
    return hasName && hasImage && hasPort;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Kubernetes Chart</h1>
          <p className="text-foreground/60 text-lg">Choose between Standard or Advanced configuration</p>
        </div>

        {/* Mode Selector */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Standard Mode Card */}
          <div
            onClick={() => setMode("standard")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setMode("standard");
              }
            }}
            className={`p-8 rounded-xl border-2 transition-all text-left cursor-pointer ${
              mode === "standard"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Standard</h2>
                <p className="text-foreground/60 mt-1">Simple and Quick</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
            </div>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>✓ Upload existing chart file</li>
              <li>✓ Provide repository link</li>
              <li>✓ Add kubectl install command</li>
              <li>✓ Deploy in minutes</li>
            </ul>
          </div>

          {/* Advanced Mode Card */}
          <div
            onClick={() => setMode("advanced")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setMode("advanced");
              }
            }}
            className={`p-8 rounded-xl border-2 transition-all text-left cursor-pointer ${
              mode === "advanced"
                ? "border-accent bg-accent/5"
                : "border-border bg-card hover:border-accent/30"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Advanced</h2>
                <p className="text-foreground/60 mt-1">Full Customization</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent" />
              </div>
            </div>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>✓ Create multiple workloads</li>
              <li>✓ Configure containers</li>
              <li>✓ Manage environment variables</li>
              <li>✓ Complete control</li>
            </ul>
          </div>
        </div>

        {/* Standard Mode Form */}
        {mode === "standard" && (
          <div className="bg-card border border-border rounded-xl p-8 max-w-2xl">
            <form onSubmit={handleStandardSubmit} className="space-y-6">
              {/* Input Type Selector */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-4">Input Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={inputType === "file"}
                      onChange={() => setInputType("file")}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-foreground">Upload File</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={inputType === "repo"}
                      onChange={() => setInputType("repo")}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-foreground">Repository Link</span>
                  </label>
                </div>
              </div>

              {/* File Upload or Repo URL */}
              {inputType === "file" ? (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Chart File</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".yaml,.yml,.tgz,.tar.gz"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <Upload className="w-8 h-8 text-foreground/40 mx-auto mb-2" />
                      <p className="text-foreground font-medium">Click to upload or drag and drop</p>
                      <p className="text-foreground/60 text-sm mt-1">YAML, TGZ, or TAR.GZ files</p>
                      {fileName && <p className="text-primary font-semibold mt-2">{fileName}</p>}
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="repoUrl" className="block text-sm font-semibold text-foreground mb-2">
                    Repository URL
                  </label>
                  <input
                    id="repoUrl"
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/your-org/your-repo"
                    className="input-field"
                    required
                  />
                </div>
              )}

              {/* Kubectl Command */}
              <div>
                <label htmlFor="kubectlCommand" className="block text-sm font-semibold text-foreground mb-2">
                  Kubectl Install Command
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating Chart..." : "Create Chart"}
              </button>
            </form>
          </div>
        )}

        {/* Advanced Mode Form */}
        {mode === "advanced" && (
          <div className="space-y-8">
            {/* Add Workload */}
            <div className="bg-card border border-border rounded-xl p-8 max-w-3xl">
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

            {/* Configure Workload */}
            {activeWorkload && (
              <div className="space-y-8">
                {/* Workload Configuration */}
                <div className="bg-card border border-border rounded-xl p-8 max-w-3xl">
                  <h2 className="text-xl font-bold text-foreground mb-6">Configure "{activeWorkload.name}" ({activeWorkload.type})</h2>

                  {/* Type-specific Configuration */}
                  <div className="space-y-4 mb-8 p-6 bg-muted/30 rounded-lg border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Configuration</h3>

                    {["Deployment", "ReplicaSet", "StatefulSet"].includes(activeWorkload.type) && (
                      <div>
                        <label htmlFor="replicas" className="block text-sm font-medium text-foreground mb-2">
                          Replicas
                        </label>
                        <input
                          id="replicas"
                          type="number"
                          min="1"
                          value={activeWorkload.config.replicas || 1}
                          onChange={(e) => updateWorkloadConfig(activeWorkload.id, "replicas", parseInt(e.target.value) || 1)}
                          className="input-field"
                        />
                      </div>
                    )}

                    {activeWorkload.type === "StatefulSet" && (
                      <div>
                        <label htmlFor="serviceName" className="block text-sm font-medium text-foreground mb-2">
                          Service Name
                        </label>
                        <input
                          id="serviceName"
                          type="text"
                          value={activeWorkload.config.serviceName || ""}
                          onChange={(e) => updateWorkloadConfig(activeWorkload.id, "serviceName", e.target.value)}
                          placeholder="headless-service"
                          className="input-field"
                        />
                      </div>
                    )}

                    {activeWorkload.type === "CronJob" && (
                      <div>
                        <label htmlFor="schedule" className="block text-sm font-medium text-foreground mb-2">
                          Cron Schedule
                        </label>
                        <input
                          id="schedule"
                          type="text"
                          value={activeWorkload.config.schedule || ""}
                          onChange={(e) => updateWorkloadConfig(activeWorkload.id, "schedule", e.target.value)}
                          placeholder="0 0 * * *"
                          className="input-field"
                        />
                        <p className="text-xs text-foreground/50 mt-1">Format: minute hour day month weekday</p>
                      </div>
                    )}

                    {activeWorkload.type === "Job" && (
                      <>
                        <div>
                          <label htmlFor="parallelism" className="block text-sm font-medium text-foreground mb-2">
                            Parallelism
                          </label>
                          <input
                            id="parallelism"
                            type="number"
                            min="1"
                            value={activeWorkload.config.parallelism || 1}
                            onChange={(e) => updateWorkloadConfig(activeWorkload.id, "parallelism", parseInt(e.target.value) || 1)}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label htmlFor="completions" className="block text-sm font-medium text-foreground mb-2">
                            Completions
                          </label>
                          <input
                            id="completions"
                            type="number"
                            min="1"
                            value={activeWorkload.config.completions || 1}
                            onChange={(e) => updateWorkloadConfig(activeWorkload.id, "completions", parseInt(e.target.value) || 1)}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label htmlFor="backoffLimit" className="block text-sm font-medium text-foreground mb-2">
                            Backoff Limit
                          </label>
                          <input
                            id="backoffLimit"
                            type="number"
                            min="0"
                            value={activeWorkload.config.backoffLimit || 3}
                            onChange={(e) => updateWorkloadConfig(activeWorkload.id, "backoffLimit", parseInt(e.target.value) || 3)}
                            className="input-field"
                          />
                        </div>
                      </>
                    )}

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
              </div>
            )}

            {/* Submit Button */}
            {workloads.length > 0 && (
              <div className="max-w-3xl">
                <button
                  onClick={handleAdvancedSubmit}
                  disabled={isCreating}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating Advanced Chart..." : "Create Advanced Chart"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
