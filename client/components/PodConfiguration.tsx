import { useState } from "react";
import { ChevronDown } from "lucide-react";
import AffinityConfiguration from "./AffinityConfiguration";

interface PodSecurityContext {
  runAsUser?: number;
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  fsGroup?: number;
  fsGroupChangePolicy?: string;
  supplementalGroups?: number[];
  seLinuxOptions?: {
    level?: string;
    role?: string;
    type?: string;
    user?: string;
  };
  seccompProfile?: {
    type?: string;
    localhostProfile?: string;
  };
  appArmor?: {
    type?: string;
    localhostProfile?: string;
  };
  sysctls?: {
    name: string;
    value: string;
  }[];
}

interface Toleration {
  key?: string;
  operator?: string;
  value?: string;
  effect?: string;
  tolerationSeconds?: number;
}

interface LabelSelectorRequirement {
  key: string;
  operator: string;
  values?: string[];
}

interface LabelSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: LabelSelectorRequirement[];
}

interface TopologySpreadConstraint {
  maxSkew: number;
  topologyKey: string;
  whenUnsatisfiable?: string;
  labelSelector?: LabelSelector;
  minDomains?: number;
  nodeAffinityPolicy?: string;
  nodeTaintsPolicy?: string;
}

interface VolumeItem {
  key?: string;
  mode?: number;
  path?: string;
}

interface OwnerReference {
  apiVersion?: string;
  blockOwnerDeletion?: boolean;
  controller?: boolean;
  kind?: string;
  name?: string;
  uid?: string;
}

interface VolumeMetadata {
  annotations?: Record<string, string>;
  creationTimestamp?: string;
  deletionGracePeriodSeconds?: number;
  labels?: Record<string, string>;
  name?: string;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  uid?: string;
}

interface DataSource {
  apiGroup?: string;
  kind?: string;
  name?: string;
}

interface ResourceRequirements {
  limits?: Record<string, string>;
  requests?: Record<string, string>;
}

interface VolumeClaimSpec {
  accessModes?: string[];
  dataSource?: DataSource;
  dataSourceRef?: {
    apiGroup?: string;
    kind?: string;
    name?: string;
    namespace?: string;
  };
  resources?: ResourceRequirements;
  selector?: LabelSelector;
  storageClassName?: string;
  volumeAttributesClassName?: string;
  volumeMode?: string;
  volumeName?: string;
}

interface VolumeClaimTemplate {
  metadata?: VolumeMetadata;
  spec?: VolumeClaimSpec;
}

interface Volume {
  name: string;
  configMap?: {
    defaultMode?: number;
    name?: string;
    items?: VolumeItem[];
  };
  emptyDir?: {
    medium?: string;
    sizeLimit?: string;
  };
  ephemeral?: {
    volumeClaimTemplate?: VolumeClaimTemplate;
  };
  hostPath?: {
    path?: string;
    type?: string;
  };
  persistentVolumeClaim?: {
    claimName?: string;
    readOnly?: boolean;
  };
  secret?: {
    defaultMode?: number;
    items?: VolumeItem[];
    secretName?: string;
  };
}

interface PodConfig {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  podDeathTime?: number;
  terminationGracePeriodSeconds?: number;
  nodeName?: string;
  nodeSelector?: Record<string, string>;
  priority?: number;
  priorityClassName?: string;
  schedulerName?: string;
  automountServiceAccountToken?: boolean;
  serviceAccountName?: string;
  hostname?: string;
  subdomain?: string;
  dnsPolicy?: string;
  dnsConfig?: {
    nameServers?: string[];
    searches?: string[];
    options?: {
      name: string;
      value?: string;
    }[];
  };
  hostAliases?: {
    ip: string;
    hostnames: string[];
  }[];
  resourceClaims?: {
    name: string;
    source?: {
      resourceClaimName?: string;
      resourceClaimTemplateName?: string;
    };
  }[];
  securityContext?: PodSecurityContext;
  tolerations?: Toleration[];
  topologySpreadConstraints?: TopologySpreadConstraint[];
  volumes?: Volume[];
  enableServiceLinks?: boolean;
  hostNetwork?: boolean;
  hostIPC?: boolean;
  hostPID?: boolean;
  shareProcessNamespace?: boolean;
  hostUsers?: boolean;
  imagePullSecrets?: string[];
  restartPolicy?: string;
  runtimeClassName?: string;
  affinity?: any;
}

interface PodConfigurationProps {
  config: PodConfig;
  onConfigChange: (key: keyof PodConfig, value: any) => void;
}

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  fields: ConfigField[];
}

interface ConfigField {
  key: keyof PodConfig;
  label: string;
  type: "text" | "number" | "checkbox" | "select" | "tags";
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

const configSections: ConfigSection[] = [
  {
    id: "metadata",
    title: "Metadata",
    description: "Labels, annotations, and namespace for the Pod",
    fields: [
      { key: "labels", label: "Labels", type: "tags", description: "Key-value labels for Pod selection" },
      { key: "annotations", label: "Annotations", type: "tags", description: "Metadata annotations" },
      { key: "namespace", label: "Namespace", type: "text", placeholder: "default", description: "The namespace where the Pod will be created" },
    ],
  },
  {
    id: "lifecycle",
    title: "Lifecycle",
    description: "Pod lifecycle and termination settings",
    fields: [
      { key: "podDeathTime", label: "Pod Death Time (seconds)", type: "number", placeholder: "300" },
      { key: "terminationGracePeriodSeconds", label: "Termination Grace Period (seconds)", type: "number", placeholder: "30" },
      {
        key: "restartPolicy",
        label: "Restart Policy",
        type: "select",
        options: [
          { value: "Always", label: "Always" },
          { value: "OnFailure", label: "OnFailure" },
          { value: "Never", label: "Never" },
        ],
      },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling",
    description: "Node affinity and priority settings",
    fields: [
      { key: "nodeName", label: "Node Name", type: "text", placeholder: "worker-node-1" },
      { key: "priority", label: "Priority", type: "number", placeholder: "0" },
      { key: "priorityClassName", label: "Priority Class Name", type: "text" },
      { key: "schedulerName", label: "Scheduler Name", type: "text" },
    ],
  },
  {
    id: "security",
    title: "Security",
    description: "Service account and security settings",
    fields: [
      { key: "serviceAccountName", label: "Service Account Name", type: "text" },
      { key: "automountServiceAccountToken", label: "Automount Service Account Token", type: "checkbox" },
    ],
  },
  {
    id: "securityContext",
    title: "Security Context",
    description: "Pod-level security policies",
    fields: [],
  },
  {
    id: "networking",
    title: "Networking",
    description: "DNS, hostname, and network settings",
    fields: [
      { key: "hostname", label: "Hostname", type: "text" },
      { key: "subdomain", label: "Subdomain", type: "text" },
      {
        key: "dnsPolicy",
        label: "DNS Policy",
        type: "select",
        options: [
          { value: "ClusterFirstWithHostNet", label: "ClusterFirstWithHostNet" },
          { value: "ClusterFirst", label: "ClusterFirst" },
          { value: "Default", label: "Default" },
          { value: "None", label: "None" },
        ],
      },
      { key: "enableServiceLinks", label: "Enable Service Links", type: "checkbox" },
      { key: "hostNetwork", label: "Host Network", type: "checkbox" },
      { key: "hostIPC", label: "Host IPC", type: "checkbox" },
      { key: "hostPID", label: "Host PID", type: "checkbox" },
      { key: "hostUsers", label: "Host Users", type: "checkbox" },
      { key: "shareProcessNamespace", label: "Share Process Namespace", type: "checkbox" },
    ],
  },
  {
    id: "dns",
    title: "DNS Config",
    description: "DNS configuration for the Pod",
    fields: [],
  },
  {
    id: "hostAliases",
    title: "Host Aliases",
    description: "Static host entries for DNS resolution",
    fields: [],
  },
  {
    id: "resourceClaims",
    title: "Resource Claims",
    description: "Resource claims for the Pod",
    fields: [],
  },
  {
    id: "volumes",
    title: "Volumes",
    description: "Pod volumes configuration",
    fields: [],
  },
  {
    id: "tolerations",
    title: "Tolerations",
    description: "Pod tolerations for node taints",
    fields: [],
  },
  {
    id: "topologySpreadConstraints",
    title: "Topology Spread Constraints",
    description: "Pod topology spread constraints",
    fields: [],
  },
  {
    id: "affinity",
    title: "Pod Affinity",
    description: "Node and pod affinity/anti-affinity rules",
    fields: [],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Runtime and advanced settings",
    fields: [
      { key: "runtimeClassName", label: "Runtime Class Name", type: "text" },
      { key: "imagePullSecrets", label: "Image Pull Secrets", type: "tags", description: "Names of image pull secrets" },
    ],
  },
];

export default function PodConfiguration({ config, onConfigChange }: PodConfigurationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderField = (field: ConfigField) => {
    const value = config[field.key];

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onConfigChange(field.key, e.target.value || undefined)}
            placeholder={field.placeholder}
            className="input-field"
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={(value as number) || ""}
            onChange={(e) => onConfigChange(field.key, e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder={field.placeholder}
            className="input-field"
          />
        );

      case "checkbox":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => onConfigChange(field.key, e.target.checked ? true : undefined)}
              className="w-4 h-4 rounded border-border bg-input cursor-pointer"
            />
            <span className="text-foreground text-sm">{field.label}</span>
          </label>
        );

      case "select":
        return (
          <select
            value={(value as string) || ""}
            onChange={(e) => onConfigChange(field.key, e.target.value || undefined)}
            className="input-field"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "tags":
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {Array.isArray(value)
                ? value.map((tag, idx) => (
                    <div
                      key={idx}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => {
                          const newValue = (value as string[]).filter((_, i) => i !== idx);
                          onConfigChange(field.key, newValue.length > 0 ? newValue : undefined);
                        }}
                        className="text-primary hover:opacity-70"
                      >
                        ×
                      </button>
                    </div>
                  ))
                : null}
            </div>
            <input
              type="text"
              placeholder={`Add ${field.label} (key=value)`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const input = e.currentTarget;
                  const newValue = input.value.trim();
                  if (newValue) {
                    const currentArray = Array.isArray(value) ? (value as string[]) : [];
                    onConfigChange(field.key, [...currentArray, newValue]);
                    input.value = "";
                  }
                }
              }}
              className="input-field"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {configSections.map((section) => (
        <div key={section.id} className="bg-muted/20 border border-border rounded-lg overflow-hidden">
          {/* Section Header */}
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="text-left">
              <h4 className="font-semibold text-foreground">{section.title}</h4>
              <p className="text-sm text-foreground/60">{section.description}</p>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-foreground/60 transition-transform ${
                expandedSections.has(section.id) ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Section Content */}
          {expandedSections.has(section.id) && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              {section.id === "affinity" ? (
                <AffinityConfiguration
                  affinity={config.affinity || {}}
                  onAffinityChange={(affinity) => onConfigChange("affinity", affinity)}
                />
              ) : section.id === "tolerations" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-foreground text-sm">Tolerations</h5>
                    <button
                      onClick={() => {
                        const tolerations = config.tolerations || [];
                        onConfigChange("tolerations", [...tolerations, { key: "", operator: "Equal", value: "" }]);
                      }}
                      className="text-primary hover:opacity-70 text-sm"
                    >
                      + Add Toleration
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(config.tolerations || []).map((toleration, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Key</label>
                            <input
                              type="text"
                              value={toleration.key || ""}
                              onChange={(e) => {
                                const updated = [...(config.tolerations || [])];
                                updated[idx] = { ...toleration, key: e.target.value || undefined };
                                onConfigChange("tolerations", updated);
                              }}
                              placeholder="node.kubernetes.io/not-ready"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Operator</label>
                            <select
                              value={toleration.operator || "Equal"}
                              onChange={(e) => {
                                const updated = [...(config.tolerations || [])];
                                updated[idx] = { ...toleration, operator: e.target.value };
                                onConfigChange("tolerations", updated);
                              }}
                              className="input-field text-sm"
                            >
                              <option value="Equal">Equal</option>
                              <option value="Exists">Exists</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Value</label>
                            <input
                              type="text"
                              value={toleration.value || ""}
                              onChange={(e) => {
                                const updated = [...(config.tolerations || [])];
                                updated[idx] = { ...toleration, value: e.target.value || undefined };
                                onConfigChange("tolerations", updated);
                              }}
                              placeholder="true"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Effect</label>
                            <select
                              value={toleration.effect || ""}
                              onChange={(e) => {
                                const updated = [...(config.tolerations || [])];
                                updated[idx] = { ...toleration, effect: e.target.value || undefined };
                                onConfigChange("tolerations", updated);
                              }}
                              className="input-field text-sm"
                            >
                              <option value="">Select Effect</option>
                              <option value="NoSchedule">NoSchedule</option>
                              <option value="NoExecute">NoExecute</option>
                              <option value="PreferNoSchedule">PreferNoSchedule</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Toleration Seconds</label>
                          <input
                            type="number"
                            value={toleration.tolerationSeconds || ""}
                            onChange={(e) => {
                              const updated = [...(config.tolerations || [])];
                              updated[idx] = { ...toleration, tolerationSeconds: e.target.value ? parseInt(e.target.value) : undefined };
                              onConfigChange("tolerations", updated);
                            }}
                            placeholder="300"
                            className="input-field text-sm"
                          />
                          <p className="text-xs text-foreground/50 mt-1">For NoExecute effect only</p>
                        </div>
                        <button
                          onClick={() => {
                            onConfigChange(
                              "tolerations",
                              config.tolerations?.filter((_, i) => i !== idx)
                            );
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                        >
                          Remove Toleration
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : section.id === "topologySpreadConstraints" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-foreground text-sm">Topology Spread Constraints</h5>
                    <button
                      onClick={() => {
                        const constraints = config.topologySpreadConstraints || [];
                        onConfigChange("topologySpreadConstraints", [...constraints, { maxSkew: 1, topologyKey: "" }]);
                      }}
                      className="text-primary hover:opacity-70 text-sm"
                    >
                      + Add Constraint
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(config.topologySpreadConstraints || []).map((constraint, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-4">
                        {/* Basic Fields */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Max Skew*</label>
                            <input
                              type="number"
                              value={constraint.maxSkew}
                              onChange={(e) => {
                                const updated = [...(config.topologySpreadConstraints || [])];
                                updated[idx] = { ...constraint, maxSkew: parseInt(e.target.value) || 1 };
                                onConfigChange("topologySpreadConstraints", updated);
                              }}
                              placeholder="1"
                              className="input-field text-sm"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Topology Key*</label>
                            <input
                              type="text"
                              value={constraint.topologyKey}
                              onChange={(e) => {
                                const updated = [...(config.topologySpreadConstraints || [])];
                                updated[idx] = { ...constraint, topologyKey: e.target.value };
                                onConfigChange("topologySpreadConstraints", updated);
                              }}
                              placeholder="kubernetes.io/hostname"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Min Domains</label>
                            <input
                              type="number"
                              value={constraint.minDomains || ""}
                              onChange={(e) => {
                                const updated = [...(config.topologySpreadConstraints || [])];
                                updated[idx] = { ...constraint, minDomains: e.target.value ? parseInt(e.target.value) : undefined };
                                onConfigChange("topologySpreadConstraints", updated);
                              }}
                              placeholder="1"
                              className="input-field text-sm"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">When Unsatisfiable</label>
                            <select
                              value={constraint.whenUnsatisfiable || ""}
                              onChange={(e) => {
                                const updated = [...(config.topologySpreadConstraints || [])];
                                updated[idx] = { ...constraint, whenUnsatisfiable: e.target.value || undefined };
                                onConfigChange("topologySpreadConstraints", updated);
                              }}
                              className="input-field text-sm"
                            >
                              <option value="">Select</option>
                              <option value="DoNotSchedule">DoNotSchedule</option>
                              <option value="ScheduleAnyway">ScheduleAnyway</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Node Affinity Policy</label>
                            <select
                              value={constraint.nodeAffinityPolicy || ""}
                              onChange={(e) => {
                                const updated = [...(config.topologySpreadConstraints || [])];
                                updated[idx] = { ...constraint, nodeAffinityPolicy: e.target.value || undefined };
                                onConfigChange("topologySpreadConstraints", updated);
                              }}
                              className="input-field text-sm"
                            >
                              <option value="">Select</option>
                              <option value="Honor">Honor</option>
                              <option value="Ignore">Ignore</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Node Taints Policy</label>
                            <select
                              value={constraint.nodeTaintsPolicy || ""}
                              onChange={(e) => {
                                const updated = [...(config.topologySpreadConstraints || [])];
                                updated[idx] = { ...constraint, nodeTaintsPolicy: e.target.value || undefined };
                                onConfigChange("topologySpreadConstraints", updated);
                              }}
                              className="input-field text-sm"
                            >
                              <option value="">Select</option>
                              <option value="Honor">Honor</option>
                              <option value="Ignore">Ignore</option>
                            </select>
                          </div>
                        </div>

                        {/* Label Selector Section */}
                        <div className="border-t border-border pt-4">
                          <h6 className="text-sm font-semibold text-foreground mb-3">Label Selector</h6>

                          {/* Match Labels */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs font-medium text-foreground">Match Labels</label>
                              <button
                                onClick={() => {
                                  const updated = [...(config.topologySpreadConstraints || [])];
                                  const labels = { ...constraint.labelSelector?.matchLabels } || {};
                                  labels[""] = "";
                                  updated[idx] = {
                                    ...constraint,
                                    labelSelector: { ...constraint.labelSelector, matchLabels: labels },
                                  };
                                  onConfigChange("topologySpreadConstraints", updated);
                                }}
                                className="text-primary hover:opacity-70 text-xs"
                              >
                                + Add
                              </button>
                            </div>
                            <div className="space-y-2">
                              {Object.entries(constraint.labelSelector?.matchLabels || {}).map(([key, value], lIdx) => (
                                <div key={lIdx} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => {
                                      const updated = [...(config.topologySpreadConstraints || [])];
                                      const labels = { ...constraint.labelSelector?.matchLabels } || {};
                                      delete labels[key];
                                      labels[e.target.value] = value;
                                      updated[idx] = {
                                        ...constraint,
                                        labelSelector: { ...constraint.labelSelector, matchLabels: labels },
                                      };
                                      onConfigChange("topologySpreadConstraints", updated);
                                    }}
                                    placeholder="key"
                                    className="input-field text-sm flex-1"
                                  />
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => {
                                      const updated = [...(config.topologySpreadConstraints || [])];
                                      const labels = { ...constraint.labelSelector?.matchLabels } || {};
                                      labels[key] = e.target.value;
                                      updated[idx] = {
                                        ...constraint,
                                        labelSelector: { ...constraint.labelSelector, matchLabels: labels },
                                      };
                                      onConfigChange("topologySpreadConstraints", updated);
                                    }}
                                    placeholder="value"
                                    className="input-field text-sm flex-1"
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = [...(config.topologySpreadConstraints || [])];
                                      const labels = { ...constraint.labelSelector?.matchLabels } || {};
                                      delete labels[key];
                                      updated[idx] = {
                                        ...constraint,
                                        labelSelector: { ...constraint.labelSelector, matchLabels: Object.keys(labels).length > 0 ? labels : undefined },
                                      };
                                      onConfigChange("topologySpreadConstraints", updated);
                                    }}
                                    className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Match Expressions */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs font-medium text-foreground">Match Expressions</label>
                              <button
                                onClick={() => {
                                  const updated = [...(config.topologySpreadConstraints || [])];
                                  const expressions = [...(constraint.labelSelector?.matchExpressions || [])];
                                  expressions.push({ key: "", operator: "In", values: [] });
                                  updated[idx] = {
                                    ...constraint,
                                    labelSelector: { ...constraint.labelSelector, matchExpressions: expressions },
                                  };
                                  onConfigChange("topologySpreadConstraints", updated);
                                }}
                                className="text-primary hover:opacity-70 text-xs"
                              >
                                + Add
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(constraint.labelSelector?.matchExpressions || []).map((expr, eIdx) => (
                                <div key={eIdx} className="p-2 bg-muted/30 border border-border/50 rounded space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-1">Key</label>
                                      <input
                                        type="text"
                                        value={expr.key}
                                        onChange={(e) => {
                                          const updated = [...(config.topologySpreadConstraints || [])];
                                          const expressions = [...(constraint.labelSelector?.matchExpressions || [])];
                                          expressions[eIdx] = { ...expr, key: e.target.value };
                                          updated[idx] = {
                                            ...constraint,
                                            labelSelector: { ...constraint.labelSelector, matchExpressions: expressions },
                                          };
                                          onConfigChange("topologySpreadConstraints", updated);
                                        }}
                                        placeholder="key"
                                        className="input-field text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-1">Operator</label>
                                      <select
                                        value={expr.operator}
                                        onChange={(e) => {
                                          const updated = [...(config.topologySpreadConstraints || [])];
                                          const expressions = [...(constraint.labelSelector?.matchExpressions || [])];
                                          expressions[eIdx] = { ...expr, operator: e.target.value };
                                          updated[idx] = {
                                            ...constraint,
                                            labelSelector: { ...constraint.labelSelector, matchExpressions: expressions },
                                          };
                                          onConfigChange("topologySpreadConstraints", updated);
                                        }}
                                        className="input-field text-xs"
                                      >
                                        <option value="In">In</option>
                                        <option value="NotIn">NotIn</option>
                                        <option value="Exists">Exists</option>
                                        <option value="DoesNotExist">DoesNotExist</option>
                                        <option value="Gt">Gt</option>
                                        <option value="Lt">Lt</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="block text-xs font-medium text-foreground">Values</label>
                                      <button
                                        onClick={() => {
                                          const updated = [...(config.topologySpreadConstraints || [])];
                                          const expressions = [...(constraint.labelSelector?.matchExpressions || [])];
                                          expressions[eIdx] = { ...expr, values: [...(expr.values || []), ""] };
                                          updated[idx] = {
                                            ...constraint,
                                            labelSelector: { ...constraint.labelSelector, matchExpressions: expressions },
                                          };
                                          onConfigChange("topologySpreadConstraints", updated);
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add
                                      </button>
                                    </div>
                                    <div className="space-y-1">
                                      {(expr.values || []).map((val, vIdx) => (
                                        <div key={vIdx} className="flex gap-2">
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...(config.topologySpreadConstraints || [])];
                                              const expressions = [...(constraint.labelSelector?.matchExpressions || [])];
                                              const values = [...(expr.values || [])];
                                              values[vIdx] = e.target.value;
                                              expressions[eIdx] = { ...expr, values };
                                              updated[idx] = {
                                                ...constraint,
                                                labelSelector: { ...constraint.labelSelector, matchExpressions: expressions },
                                              };
                                              onConfigChange("topologySpreadConstraints", updated);
                                            }}
                                            placeholder="value"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...(config.topologySpreadConstraints || [])];
                                              const expressions = [...(constraint.labelSelector?.matchExpressions || [])];
                                              const values = (expr.values || []).filter((_, i) => i !== vIdx);
                                              expressions[eIdx] = { ...expr, values: values.length > 0 ? values : undefined };
                                              updated[idx] = {
                                                ...constraint,
                                                labelSelector: { ...constraint.labelSelector, matchExpressions: expressions },
                                              };
                                              onConfigChange("topologySpreadConstraints", updated);
                                            }}
                                            className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const updated = [...(config.topologySpreadConstraints || [])];
                                      const expressions = (constraint.labelSelector?.matchExpressions || []).filter((_, i) => i !== eIdx);
                                      updated[idx] = {
                                        ...constraint,
                                        labelSelector: { ...constraint.labelSelector, matchExpressions: expressions.length > 0 ? expressions : undefined },
                                      };
                                      onConfigChange("topologySpreadConstraints", updated);
                                    }}
                                    className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                  >
                                    Remove Expression
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onConfigChange(
                              "topologySpreadConstraints",
                              config.topologySpreadConstraints?.filter((_, i) => i !== idx)
                            );
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                        >
                          Remove Constraint
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : section.id === "resourceClaims" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-foreground text-sm">Resource Claims</h5>
                    <button
                      onClick={() => {
                        const claims = config.resourceClaims || [];
                        onConfigChange("resourceClaims", [...claims, { name: "", source: {} }]);
                      }}
                      className="text-primary hover:opacity-70 text-sm"
                    >
                      + Add Claim
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(config.resourceClaims || []).map((claim, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Name*</label>
                          <input
                            type="text"
                            value={claim.name}
                            onChange={(e) => {
                              const updated = [...(config.resourceClaims || [])];
                              updated[idx] = { ...claim, name: e.target.value };
                              onConfigChange("resourceClaims", updated);
                            }}
                            placeholder="claim-name"
                            className="input-field text-sm"
                          />
                        </div>

                        <div className="border-t border-border pt-3">
                          <h6 className="text-xs font-semibold text-foreground mb-3">Source</h6>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Resource Claim Name</label>
                              <input
                                type="text"
                                value={claim.source?.resourceClaimName || ""}
                                onChange={(e) => {
                                  const updated = [...(config.resourceClaims || [])];
                                  updated[idx] = {
                                    ...claim,
                                    source: {
                                      ...claim.source,
                                      resourceClaimName: e.target.value || undefined,
                                    },
                                  };
                                  onConfigChange("resourceClaims", updated);
                                }}
                                placeholder="existing-claim"
                                className="input-field text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Resource Claim Template Name</label>
                              <input
                                type="text"
                                value={claim.source?.resourceClaimTemplateName || ""}
                                onChange={(e) => {
                                  const updated = [...(config.resourceClaims || [])];
                                  updated[idx] = {
                                    ...claim,
                                    source: {
                                      ...claim.source,
                                      resourceClaimTemplateName: e.target.value || undefined,
                                    },
                                  };
                                  onConfigChange("resourceClaims", updated);
                                }}
                                placeholder="claim-template"
                                className="input-field text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onConfigChange(
                              "resourceClaims",
                              config.resourceClaims?.filter((_, i) => i !== idx)
                            );
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                        >
                          Remove Claim
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : section.id === "hostAliases" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-foreground text-sm">Host Aliases</h5>
                    <button
                      onClick={() => {
                        const aliases = config.hostAliases || [];
                        onConfigChange("hostAliases", [...aliases, { ip: "", hostnames: [] }]);
                      }}
                      className="text-primary hover:opacity-70 text-sm"
                    >
                      + Add Alias
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(config.hostAliases || []).map((alias, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">IP Address*</label>
                          <input
                            type="text"
                            value={alias.ip}
                            onChange={(e) => {
                              const updated = [...(config.hostAliases || [])];
                              updated[idx] = { ...alias, ip: e.target.value };
                              onConfigChange("hostAliases", updated);
                            }}
                            placeholder="127.0.0.1"
                            className="input-field text-sm"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Hostnames</label>
                            <button
                              onClick={() => {
                                const updated = [...(config.hostAliases || [])];
                                updated[idx] = { ...alias, hostnames: [...(alias.hostnames || []), ""] };
                                onConfigChange("hostAliases", updated);
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Hostname
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(alias.hostnames || []).map((hostname, hIdx) => (
                              <div key={hIdx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={hostname}
                                  onChange={(e) => {
                                    const updated = [...(config.hostAliases || [])];
                                    const hostnames = [...(alias.hostnames || [])];
                                    hostnames[hIdx] = e.target.value;
                                    updated[idx] = { ...alias, hostnames };
                                    onConfigChange("hostAliases", updated);
                                  }}
                                  placeholder="localhost.example.com"
                                  className="input-field text-sm flex-1"
                                />
                                <button
                                  onClick={() => {
                                    const updated = [...(config.hostAliases || [])];
                                    const hostnames = (alias.hostnames || []).filter((_, i) => i !== hIdx);
                                    updated[idx] = { ...alias, hostnames };
                                    onConfigChange("hostAliases", updated);
                                  }}
                                  className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onConfigChange(
                              "hostAliases",
                              config.hostAliases?.filter((_, i) => i !== idx)
                            );
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                        >
                          Remove Alias
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : section.id === "dns" ? (
                <div className="space-y-6">
                  {/* Name Servers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-foreground">Name Servers</label>
                      <button
                        onClick={() => {
                          const nameServers = config.dnsConfig?.nameServers || [];
                          onConfigChange("dnsConfig", {
                            ...config.dnsConfig,
                            nameServers: [...nameServers, ""],
                          });
                        }}
                        className="text-primary hover:opacity-70 text-xs"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(config.dnsConfig?.nameServers || []).map((server, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={server}
                            onChange={(e) => {
                              const updated = [...(config.dnsConfig?.nameServers || [])];
                              updated[idx] = e.target.value;
                              onConfigChange("dnsConfig", {
                                ...config.dnsConfig,
                                nameServers: updated,
                              });
                            }}
                            placeholder="8.8.8.8"
                            className="input-field flex-1"
                          />
                          <button
                            onClick={() => {
                              const updated = (config.dnsConfig?.nameServers || []).filter((_, i) => i !== idx);
                              onConfigChange("dnsConfig", {
                                ...config.dnsConfig,
                                nameServers: updated.length > 0 ? updated : undefined,
                              });
                            }}
                            className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Searches */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-foreground">Searches</label>
                      <button
                        onClick={() => {
                          const searches = config.dnsConfig?.searches || [];
                          onConfigChange("dnsConfig", {
                            ...config.dnsConfig,
                            searches: [...searches, ""],
                          });
                        }}
                        className="text-primary hover:opacity-70 text-xs"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(config.dnsConfig?.searches || []).map((search, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                              const updated = [...(config.dnsConfig?.searches || [])];
                              updated[idx] = e.target.value;
                              onConfigChange("dnsConfig", {
                                ...config.dnsConfig,
                                searches: updated,
                              });
                            }}
                            placeholder="default.svc.cluster.local"
                            className="input-field flex-1"
                          />
                          <button
                            onClick={() => {
                              const updated = (config.dnsConfig?.searches || []).filter((_, i) => i !== idx);
                              onConfigChange("dnsConfig", {
                                ...config.dnsConfig,
                                searches: updated.length > 0 ? updated : undefined,
                              });
                            }}
                            className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-foreground">Options</label>
                      <button
                        onClick={() => {
                          const options = config.dnsConfig?.options || [];
                          onConfigChange("dnsConfig", {
                            ...config.dnsConfig,
                            options: [...options, { name: "", value: "" }],
                          });
                        }}
                        className="text-primary hover:opacity-70 text-xs"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(config.dnsConfig?.options || []).map((option, idx) => (
                        <div key={idx} className="p-3 bg-muted/20 border border-border rounded-lg space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => {
                                  const updated = [...(config.dnsConfig?.options || [])];
                                  updated[idx] = { ...option, name: e.target.value };
                                  onConfigChange("dnsConfig", {
                                    ...config.dnsConfig,
                                    options: updated,
                                  });
                                }}
                                placeholder="ndots"
                                className="input-field text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Value</label>
                              <input
                                type="text"
                                value={option.value || ""}
                                onChange={(e) => {
                                  const updated = [...(config.dnsConfig?.options || [])];
                                  updated[idx] = { ...option, value: e.target.value || undefined };
                                  onConfigChange("dnsConfig", {
                                    ...config.dnsConfig,
                                    options: updated,
                                  });
                                }}
                                placeholder="2"
                                className="input-field text-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const updated = (config.dnsConfig?.options || []).filter((_, i) => i !== idx);
                              onConfigChange("dnsConfig", {
                                ...config.dnsConfig,
                                options: updated.length > 0 ? updated : undefined,
                              });
                            }}
                            className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                          >
                            Remove Option
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : section.id === "securityContext" ? (
                <div className="space-y-6">
                  {/* Run as User */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Run as User</label>
                    <input
                      type="number"
                      value={config.securityContext?.runAsUser || ""}
                      onChange={(e) =>
                        onConfigChange("securityContext", {
                          ...config.securityContext,
                          runAsUser: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g., 1000"
                      className="input-field"
                    />
                  </div>

                  {/* Run as Group */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Run as Group</label>
                    <input
                      type="number"
                      value={config.securityContext?.runAsGroup || ""}
                      onChange={(e) =>
                        onConfigChange("securityContext", {
                          ...config.securityContext,
                          runAsGroup: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g., 3000"
                      className="input-field"
                    />
                  </div>

                  {/* Run as Non-Root */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.securityContext?.runAsNonRoot || false}
                        onChange={(e) =>
                          onConfigChange("securityContext", {
                            ...config.securityContext,
                            runAsNonRoot: e.target.checked ? true : undefined,
                          })
                        }
                        className="w-4 h-4 rounded border-border bg-input cursor-pointer"
                      />
                      <span className="text-foreground font-medium">Run as Non-Root</span>
                    </label>
                  </div>

                  {/* FS Group */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">FS Group</label>
                    <input
                      type="number"
                      value={config.securityContext?.fsGroup || ""}
                      onChange={(e) =>
                        onConfigChange("securityContext", {
                          ...config.securityContext,
                          fsGroup: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g., 2000"
                      className="input-field"
                    />
                  </div>

                  {/* FS Group Change Policy */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">FS Group Change Policy</label>
                    <select
                      value={config.securityContext?.fsGroupChangePolicy || ""}
                      onChange={(e) =>
                        onConfigChange("securityContext", {
                          ...config.securityContext,
                          fsGroupChangePolicy: e.target.value || undefined,
                        })
                      }
                      className="input-field"
                    >
                      <option value="">Select Policy</option>
                      <option value="OnRootMismatch">OnRootMismatch</option>
                      <option value="Always">Always</option>
                    </select>
                  </div>

                  {/* Supplemental Groups */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-foreground">Supplemental Groups</label>
                      <button
                        onClick={() => {
                          const groups = config.securityContext?.supplementalGroups || [];
                          onConfigChange("securityContext", {
                            ...config.securityContext,
                            supplementalGroups: [...groups, 0],
                          });
                        }}
                        className="text-primary hover:opacity-70 text-xs"
                      >
                        + Add Group
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(config.securityContext?.supplementalGroups || []).map((group, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="number"
                            value={group}
                            onChange={(e) => {
                              const updated = [...(config.securityContext?.supplementalGroups || [])];
                              updated[idx] = parseInt(e.target.value) || 0;
                              onConfigChange("securityContext", {
                                ...config.securityContext,
                                supplementalGroups: updated,
                              });
                            }}
                            placeholder="2000"
                            className="input-field flex-1"
                          />
                          <button
                            onClick={() => {
                              onConfigChange("securityContext", {
                                ...config.securityContext,
                                supplementalGroups: (config.securityContext?.supplementalGroups || []).filter((_, i) => i !== idx),
                              });
                            }}
                            className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SELinux Options */}
                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-foreground mb-4">SELinux Options</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">User</label>
                        <input
                          type="text"
                          value={config.securityContext?.seLinuxOptions?.user || ""}
                          onChange={(e) =>
                            onConfigChange("securityContext", {
                              ...config.securityContext,
                              seLinuxOptions: {
                                ...config.securityContext?.seLinuxOptions,
                                user: e.target.value || undefined,
                              },
                            })
                          }
                          placeholder="system_u"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                        <input
                          type="text"
                          value={config.securityContext?.seLinuxOptions?.role || ""}
                          onChange={(e) =>
                            onConfigChange("securityContext", {
                              ...config.securityContext,
                              seLinuxOptions: {
                                ...config.securityContext?.seLinuxOptions,
                                role: e.target.value || undefined,
                              },
                            })
                          }
                          placeholder="system_r"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                        <input
                          type="text"
                          value={config.securityContext?.seLinuxOptions?.type || ""}
                          onChange={(e) =>
                            onConfigChange("securityContext", {
                              ...config.securityContext,
                              seLinuxOptions: {
                                ...config.securityContext?.seLinuxOptions,
                                type: e.target.value || undefined,
                              },
                            })
                          }
                          placeholder="container_t"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Level</label>
                        <input
                          type="text"
                          value={config.securityContext?.seLinuxOptions?.level || ""}
                          onChange={(e) =>
                            onConfigChange("securityContext", {
                              ...config.securityContext,
                              seLinuxOptions: {
                                ...config.securityContext?.seLinuxOptions,
                                level: e.target.value || undefined,
                              },
                            })
                          }
                          placeholder="s0:c123,c456"
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AppArmor Profile */}
                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-foreground mb-4">AppArmor Profile</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                        <select
                          value={config.securityContext?.appArmor?.type || ""}
                          onChange={(e) =>
                            onConfigChange("securityContext", {
                              ...config.securityContext,
                              appArmor: {
                                ...config.securityContext?.appArmor,
                                type: e.target.value || undefined,
                              },
                            })
                          }
                          className="input-field text-sm"
                        >
                          <option value="">Select Type</option>
                          <option value="runtime/default">runtime/default</option>
                          <option value="localhost">localhost</option>
                          <option value="unconfined">unconfined</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">LocalHost Profile</label>
                        <input
                          type="text"
                          value={config.securityContext?.appArmor?.localhostProfile || ""}
                          onChange={(e) =>
                            onConfigChange("securityContext", {
                              ...config.securityContext,
                              appArmor: {
                                ...config.securityContext?.appArmor,
                                localhostProfile: e.target.value || undefined,
                              },
                            })
                          }
                          placeholder="my-profile"
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seccomp Profile */}
                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-foreground mb-4">Seccomp Profile</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                        <select
                          value={config.securityContext?.seccompProfile?.type || ""}
                          onChange={(e) =>
                            onConfigChange("securityContext", {
                              ...config.securityContext,
                              seccompProfile: {
                                ...config.securityContext?.seccompProfile,
                                type: e.target.value || undefined,
                              },
                            })
                          }
                          className="input-field text-sm"
                        >
                          <option value="">Select Type</option>
                          <option value="RuntimeDefault">RuntimeDefault</option>
                          <option value="Unconfined">Unconfined</option>
                          <option value="Localhost">Localhost</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">LocalHost Profile</label>
                        <input
                          type="text"
                          value={config.securityContext?.seccompProfile?.localhostProfile || ""}
                          onChange={(e) =>
                            onConfigChange("securityContext", {
                              ...config.securityContext,
                              seccompProfile: {
                                ...config.securityContext?.seccompProfile,
                                localhostProfile: e.target.value || undefined,
                              },
                            })
                          }
                          placeholder="my-seccomp.json"
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sysctls */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-foreground">Sysctls</h4>
                      <button
                        onClick={() => {
                          const sysctls = config.securityContext?.sysctls || [];
                          onConfigChange("securityContext", {
                            ...config.securityContext,
                            sysctls: [...sysctls, { name: "", value: "" }],
                          });
                        }}
                        className="text-primary hover:opacity-70 text-sm"
                      >
                        + Add Sysctl
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(config.securityContext?.sysctls || []).map((sysctl, idx) => (
                        <div key={idx} className="p-3 bg-muted/20 border border-border rounded-lg space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                              <input
                                type="text"
                                value={sysctl.name}
                                onChange={(e) => {
                                  const updated = [...(config.securityContext?.sysctls || [])];
                                  updated[idx] = { ...sysctl, name: e.target.value };
                                  onConfigChange("securityContext", {
                                    ...config.securityContext,
                                    sysctls: updated,
                                  });
                                }}
                                placeholder="kernel.shm_rmid_forced"
                                className="input-field text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Value</label>
                              <input
                                type="text"
                                value={sysctl.value}
                                onChange={(e) => {
                                  const updated = [...(config.securityContext?.sysctls || [])];
                                  updated[idx] = { ...sysctl, value: e.target.value };
                                  onConfigChange("securityContext", {
                                    ...config.securityContext,
                                    sysctls: updated,
                                  });
                                }}
                                placeholder="1"
                                className="input-field text-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              onConfigChange("securityContext", {
                                ...config.securityContext,
                                sysctls: (config.securityContext?.sysctls || []).filter((_, i) => i !== idx),
                              });
                            }}
                            className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                          >
                            Remove Sysctl
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : section.id === "volumes" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-foreground text-sm">Volumes</h5>
                    <button
                      onClick={() => {
                        const volumes = config.volumes || [];
                        onConfigChange("volumes", [...volumes, { name: "" }]);
                      }}
                      className="text-primary hover:opacity-70 text-sm"
                    >
                      + Add Volume
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(config.volumes || []).map((volume, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-4">
                        {/* Volume Name */}
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Name*</label>
                          <input
                            type="text"
                            value={volume.name}
                            onChange={(e) => {
                              const updated = [...(config.volumes || [])];
                              updated[idx] = { ...volume, name: e.target.value };
                              onConfigChange("volumes", updated);
                            }}
                            placeholder="volume-name"
                            className="input-field text-sm"
                          />
                        </div>

                        {/* Volume Type Selection */}
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-2">Volume Type</label>
                          <select
                            value={
                              volume.configMap ? "configMap" :
                              volume.emptyDir ? "emptyDir" :
                              volume.ephemeral ? "ephemeral" :
                              volume.hostPath ? "hostPath" :
                              volume.persistentVolumeClaim ? "persistentVolumeClaim" :
                              volume.secret ? "secret" : ""
                            }
                            onChange={(e) => {
                              const updated = [...(config.volumes || [])];
                              const newVolume: Volume = { name: volume.name };

                              switch(e.target.value) {
                                case "configMap":
                                  newVolume.configMap = { name: "" };
                                  break;
                                case "emptyDir":
                                  newVolume.emptyDir = {};
                                  break;
                                case "ephemeral":
                                  newVolume.ephemeral = { volumeClaimTemplate: { metadata: {}, spec: {} } };
                                  break;
                                case "hostPath":
                                  newVolume.hostPath = { path: "" };
                                  break;
                                case "persistentVolumeClaim":
                                  newVolume.persistentVolumeClaim = { claimName: "" };
                                  break;
                                case "secret":
                                  newVolume.secret = { secretName: "" };
                                  break;
                              }
                              updated[idx] = newVolume;
                              onConfigChange("volumes", updated);
                            }}
                            className="input-field text-sm"
                          >
                            <option value="">Select Type</option>
                            <option value="configMap">ConfigMap</option>
                            <option value="emptyDir">Empty Directory</option>
                            <option value="ephemeral">Ephemeral</option>
                            <option value="hostPath">Host Path</option>
                            <option value="persistentVolumeClaim">Persistent Volume Claim</option>
                            <option value="secret">Secret</option>
                          </select>
                        </div>

                        {/* ConfigMap */}
                        {volume.configMap && (
                          <div className="border-t border-border pt-3 space-y-3">
                            <h6 className="text-xs font-semibold text-foreground">ConfigMap</h6>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                <input
                                  type="text"
                                  value={volume.configMap.name || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.volumes || [])];
                                    updated[idx] = { ...volume, configMap: { ...volume.configMap, name: e.target.value || undefined } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  placeholder="configmap-name"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Default Mode</label>
                                <input
                                  type="number"
                                  value={volume.configMap.defaultMode || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.volumes || [])];
                                    updated[idx] = { ...volume, configMap: { ...volume.configMap, defaultMode: e.target.value ? parseInt(e.target.value) : undefined } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  placeholder="420"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>

                            {/* ConfigMap Items */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium text-foreground">Items</label>
                                <button
                                  onClick={() => {
                                    const updated = [...(config.volumes || [])];
                                    const items = [...(volume.configMap?.items || [])];
                                    items.push({ key: "", path: "" });
                                    updated[idx] = { ...volume, configMap: { ...volume.configMap, items } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  className="text-primary hover:opacity-70 text-xs"
                                >
                                  + Add Item
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(volume.configMap?.items || []).map((item, iIdx) => (
                                  <div key={iIdx} className="p-2 bg-muted/30 border border-border/50 rounded space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                      <input
                                        type="text"
                                        value={item.key || ""}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const items = [...(volume.configMap?.items || [])];
                                          items[iIdx] = { ...item, key: e.target.value || undefined };
                                          updated[idx] = { ...volume, configMap: { ...volume.configMap, items } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="key"
                                        className="input-field text-xs"
                                      />
                                      <input
                                        type="text"
                                        value={item.path || ""}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const items = [...(volume.configMap?.items || [])];
                                          items[iIdx] = { ...item, path: e.target.value || undefined };
                                          updated[idx] = { ...volume, configMap: { ...volume.configMap, items } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="path"
                                        className="input-field text-xs"
                                      />
                                      <input
                                        type="number"
                                        value={item.mode || ""}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const items = [...(volume.configMap?.items || [])];
                                          items[iIdx] = { ...item, mode: e.target.value ? parseInt(e.target.value) : undefined };
                                          updated[idx] = { ...volume, configMap: { ...volume.configMap, items } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="mode"
                                        className="input-field text-xs"
                                      />
                                    </div>
                                    <button
                                      onClick={() => {
                                        const updated = [...(config.volumes || [])];
                                        const items = (volume.configMap?.items || []).filter((_, i) => i !== iIdx);
                                        updated[idx] = { ...volume, configMap: { ...volume.configMap, items: items.length > 0 ? items : undefined } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Empty Directory */}
                        {volume.emptyDir && (
                          <div className="border-t border-border pt-3 space-y-3">
                            <h6 className="text-xs font-semibold text-foreground">Empty Directory</h6>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Medium</label>
                                <select
                                  value={volume.emptyDir.medium || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.volumes || [])];
                                    updated[idx] = { ...volume, emptyDir: { ...volume.emptyDir, medium: e.target.value || undefined } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  className="input-field text-sm"
                                >
                                  <option value="">Default</option>
                                  <option value="Memory">Memory</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Size Limit</label>
                                <input
                                  type="text"
                                  value={volume.emptyDir.sizeLimit || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.volumes || [])];
                                    updated[idx] = { ...volume, emptyDir: { ...volume.emptyDir, sizeLimit: e.target.value || undefined } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  placeholder="1Gi"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Host Path */}
                        {volume.hostPath && (
                          <div className="border-t border-border pt-3 space-y-3">
                            <h6 className="text-xs font-semibold text-foreground">Host Path</h6>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Path</label>
                                <input
                                  type="text"
                                  value={volume.hostPath.path || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.volumes || [])];
                                    updated[idx] = { ...volume, hostPath: { ...volume.hostPath, path: e.target.value || undefined } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  placeholder="/var/log"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                                <select
                                  value={volume.hostPath.type || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.volumes || [])];
                                    updated[idx] = { ...volume, hostPath: { ...volume.hostPath, type: e.target.value || undefined } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  className="input-field text-sm"
                                >
                                  <option value="">Select Type</option>
                                  <option value="Directory">Directory</option>
                                  <option value="File">File</option>
                                  <option value="Socket">Socket</option>
                                  <option value="CharDevice">CharDevice</option>
                                  <option value="BlockDevice">BlockDevice</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Persistent Volume Claim */}
                        {volume.persistentVolumeClaim && (
                          <div className="border-t border-border pt-3 space-y-3">
                            <h6 className="text-xs font-semibold text-foreground">Persistent Volume Claim</h6>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Claim Name</label>
                                <input
                                  type="text"
                                  value={volume.persistentVolumeClaim.claimName || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.volumes || [])];
                                    updated[idx] = { ...volume, persistentVolumeClaim: { ...volume.persistentVolumeClaim, claimName: e.target.value || undefined } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  placeholder="pvc-name"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={volume.persistentVolumeClaim.readOnly || false}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      updated[idx] = { ...volume, persistentVolumeClaim: { ...volume.persistentVolumeClaim, readOnly: e.target.checked ? true : undefined } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    className="w-4 h-4 rounded border-border bg-input cursor-pointer"
                                  />
                                  <span className="text-xs font-medium text-foreground">Read-Only</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Secret */}
                        {volume.secret && (
                          <div className="border-t border-border pt-3 space-y-3">
                            <h6 className="text-xs font-semibold text-foreground">Secret</h6>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Secret Name</label>
                                <input
                                  type="text"
                                  value={volume.secret.secretName || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.volumes || [])];
                                    updated[idx] = { ...volume, secret: { ...volume.secret, secretName: e.target.value || undefined } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  placeholder="secret-name"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Default Mode</label>
                                <input
                                  type="number"
                                  value={volume.secret.defaultMode || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.volumes || [])];
                                    updated[idx] = { ...volume, secret: { ...volume.secret, defaultMode: e.target.value ? parseInt(e.target.value) : undefined } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  placeholder="420"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>

                            {/* Secret Items */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium text-foreground">Items</label>
                                <button
                                  onClick={() => {
                                    const updated = [...(config.volumes || [])];
                                    const items = [...(volume.secret?.items || [])];
                                    items.push({ key: "", path: "" });
                                    updated[idx] = { ...volume, secret: { ...volume.secret, items } };
                                    onConfigChange("volumes", updated);
                                  }}
                                  className="text-primary hover:opacity-70 text-xs"
                                >
                                  + Add Item
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(volume.secret?.items || []).map((item, iIdx) => (
                                  <div key={iIdx} className="p-2 bg-muted/30 border border-border/50 rounded space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                      <input
                                        type="text"
                                        value={item.key || ""}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const items = [...(volume.secret?.items || [])];
                                          items[iIdx] = { ...item, key: e.target.value || undefined };
                                          updated[idx] = { ...volume, secret: { ...volume.secret, items } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="key"
                                        className="input-field text-xs"
                                      />
                                      <input
                                        type="text"
                                        value={item.path || ""}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const items = [...(volume.secret?.items || [])];
                                          items[iIdx] = { ...item, path: e.target.value || undefined };
                                          updated[idx] = { ...volume, secret: { ...volume.secret, items } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="path"
                                        className="input-field text-xs"
                                      />
                                      <input
                                        type="number"
                                        value={item.mode || ""}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const items = [...(volume.secret?.items || [])];
                                          items[iIdx] = { ...item, mode: e.target.value ? parseInt(e.target.value) : undefined };
                                          updated[idx] = { ...volume, secret: { ...volume.secret, items } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="mode"
                                        className="input-field text-xs"
                                      />
                                    </div>
                                    <button
                                      onClick={() => {
                                        const updated = [...(config.volumes || [])];
                                        const items = (volume.secret?.items || []).filter((_, i) => i !== iIdx);
                                        updated[idx] = { ...volume, secret: { ...volume.secret, items: items.length > 0 ? items : undefined } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Ephemeral */}
                        {volume.ephemeral && (
                          <div className="border-t border-border pt-3 space-y-4">
                            <h6 className="text-xs font-semibold text-foreground">Ephemeral - Volume Claim Template</h6>

                            {/* MetaData Section */}
                            <div className="border border-border/50 rounded p-3 space-y-3 bg-muted/10">
                              <h6 className="text-xs font-medium text-foreground">MetaData</h6>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                  <input
                                    type="text"
                                    value={volume.ephemeral?.volumeClaimTemplate?.metadata?.name || ""}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                      meta.name = e.target.value || undefined;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    placeholder="name"
                                    className="input-field text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Namespace</label>
                                  <input
                                    type="text"
                                    value={volume.ephemeral?.volumeClaimTemplate?.metadata?.namespace || ""}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                      meta.namespace = e.target.value || undefined;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    placeholder="namespace"
                                    className="input-field text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">UID</label>
                                  <input
                                    type="text"
                                    value={volume.ephemeral?.volumeClaimTemplate?.metadata?.uid || ""}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                      meta.uid = e.target.value || undefined;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    placeholder="uid"
                                    className="input-field text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Deletion Grace Period (sec)</label>
                                  <input
                                    type="number"
                                    value={volume.ephemeral?.volumeClaimTemplate?.metadata?.deletionGracePeriodSeconds || ""}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                      meta.deletionGracePeriodSeconds = e.target.value ? parseInt(e.target.value) : undefined;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    placeholder="30"
                                    className="input-field text-xs"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-foreground mb-1">Creation Timestamp</label>
                                  <input
                                    type="text"
                                    value={volume.ephemeral?.volumeClaimTemplate?.metadata?.creationTimestamp || ""}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                      meta.creationTimestamp = e.target.value || undefined;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    placeholder="2024-01-01T00:00:00Z"
                                    className="input-field text-xs"
                                  />
                                </div>
                              </div>

                              {/* Annotations */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-xs font-medium text-foreground">Annotations</label>
                                  <button
                                    onClick={() => {
                                      const updated = [...(config.volumes || [])];
                                      const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                      const annot = { ...meta.annotations } || {};
                                      annot[""] = "";
                                      meta.annotations = annot;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    className="text-primary hover:opacity-70 text-xs"
                                  >
                                    + Add
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  {Object.entries(volume.ephemeral?.volumeClaimTemplate?.metadata?.annotations || {}).map(([key, value], aIdx) => (
                                    <div key={aIdx} className="flex gap-1">
                                      <input
                                        type="text"
                                        value={key}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                          const annot = { ...meta.annotations } || {};
                                          delete annot[key];
                                          annot[e.target.value] = value;
                                          meta.annotations = annot;
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="key"
                                        className="input-field text-xs flex-1"
                                      />
                                      <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                          const annot = { ...meta.annotations } || {};
                                          annot[key] = e.target.value;
                                          meta.annotations = annot;
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="value"
                                        className="input-field text-xs flex-1"
                                      />
                                      <button
                                        onClick={() => {
                                          const updated = [...(config.volumes || [])];
                                          const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                          const annot = { ...meta.annotations } || {};
                                          delete annot[key];
                                          meta.annotations = Object.keys(annot).length > 0 ? annot : undefined;
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Labels */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-xs font-medium text-foreground">Labels</label>
                                  <button
                                    onClick={() => {
                                      const updated = [...(config.volumes || [])];
                                      const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                      const labels = { ...meta.labels } || {};
                                      labels[""] = "";
                                      meta.labels = labels;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    className="text-primary hover:opacity-70 text-xs"
                                  >
                                    + Add
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  {Object.entries(volume.ephemeral?.volumeClaimTemplate?.metadata?.labels || {}).map(([key, value], lIdx) => (
                                    <div key={lIdx} className="flex gap-1">
                                      <input
                                        type="text"
                                        value={key}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                          const labels = { ...meta.labels } || {};
                                          delete labels[key];
                                          labels[e.target.value] = value;
                                          meta.labels = labels;
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="key"
                                        className="input-field text-xs flex-1"
                                      />
                                      <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                          const labels = { ...meta.labels } || {};
                                          labels[key] = e.target.value;
                                          meta.labels = labels;
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        placeholder="value"
                                        className="input-field text-xs flex-1"
                                      />
                                      <button
                                        onClick={() => {
                                          const updated = [...(config.volumes || [])];
                                          const meta = { ...volume.ephemeral?.volumeClaimTemplate?.metadata };
                                          const labels = { ...meta.labels } || {};
                                          delete labels[key];
                                          meta.labels = Object.keys(labels).length > 0 ? labels : undefined;
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, metadata: meta } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Spec Section */}
                            <div className="border border-border/50 rounded p-3 space-y-3 bg-muted/10">
                              <h6 className="text-xs font-medium text-foreground">Spec</h6>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Storage Class Name</label>
                                  <input
                                    type="text"
                                    value={volume.ephemeral?.volumeClaimTemplate?.spec?.storageClassName || ""}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                      spec.storageClassName = e.target.value || undefined;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    placeholder="standard"
                                    className="input-field text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Volume Attributes Class Name</label>
                                  <input
                                    type="text"
                                    value={volume.ephemeral?.volumeClaimTemplate?.spec?.volumeAttributesClassName || ""}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                      spec.volumeAttributesClassName = e.target.value || undefined;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    placeholder="class-name"
                                    className="input-field text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Volume Mode</label>
                                  <input
                                    type="text"
                                    value={volume.ephemeral?.volumeClaimTemplate?.spec?.volumeMode || ""}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                      spec.volumeMode = e.target.value || undefined;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    placeholder="Filesystem"
                                    className="input-field text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Volume Name</label>
                                  <input
                                    type="text"
                                    value={volume.ephemeral?.volumeClaimTemplate?.spec?.volumeName || ""}
                                    onChange={(e) => {
                                      const updated = [...(config.volumes || [])];
                                      const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                      spec.volumeName = e.target.value || undefined;
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    placeholder="volume-name"
                                    className="input-field text-xs"
                                  />
                                </div>
                              </div>

                              {/* Access Modes */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-xs font-medium text-foreground">Access Modes</label>
                                  <button
                                    onClick={() => {
                                      const updated = [...(config.volumes || [])];
                                      const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                      spec.accessModes = [...(spec.accessModes || []), ""];
                                      updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                      onConfigChange("volumes", updated);
                                    }}
                                    className="text-primary hover:opacity-70 text-xs"
                                  >
                                    + Add
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  {(volume.ephemeral?.volumeClaimTemplate?.spec?.accessModes || []).map((mode, mIdx) => (
                                    <div key={mIdx} className="flex gap-1">
                                      <select
                                        value={mode}
                                        onChange={(e) => {
                                          const updated = [...(config.volumes || [])];
                                          const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                          const modes = [...(spec.accessModes || [])];
                                          modes[mIdx] = e.target.value;
                                          spec.accessModes = modes;
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        className="input-field text-xs flex-1"
                                      >
                                        <option value="">Select</option>
                                        <option value="ReadWriteOnce">ReadWriteOnce</option>
                                        <option value="ReadOnlyMany">ReadOnlyMany</option>
                                        <option value="ReadWriteMany">ReadWriteMany</option>
                                      </select>
                                      <button
                                        onClick={() => {
                                          const updated = [...(config.volumes || [])];
                                          const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                          spec.accessModes = (spec.accessModes || []).filter((_, i) => i !== mIdx);
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Data Source */}
                              <div className="border-t border-border/50 pt-3">
                                <h6 className="text-xs font-medium text-foreground mb-2">Data Source</h6>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">API Group</label>
                                    <input
                                      type="text"
                                      value={volume.ephemeral?.volumeClaimTemplate?.spec?.dataSource?.apiGroup || ""}
                                      onChange={(e) => {
                                        const updated = [...(config.volumes || [])];
                                        const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                        spec.dataSource = { ...spec.dataSource, apiGroup: e.target.value || undefined };
                                        updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      placeholder="snapshot.storage.k8s.io"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Kind</label>
                                    <input
                                      type="text"
                                      value={volume.ephemeral?.volumeClaimTemplate?.spec?.dataSource?.kind || ""}
                                      onChange={(e) => {
                                        const updated = [...(config.volumes || [])];
                                        const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                        spec.dataSource = { ...spec.dataSource, kind: e.target.value || undefined };
                                        updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      placeholder="VolumeSnapshot"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={volume.ephemeral?.volumeClaimTemplate?.spec?.dataSource?.name || ""}
                                      onChange={(e) => {
                                        const updated = [...(config.volumes || [])];
                                        const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                        spec.dataSource = { ...spec.dataSource, name: e.target.value || undefined };
                                        updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      placeholder="my-snapshot"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Data Source Reference */}
                              <div className="border-t border-border/50 pt-3">
                                <h6 className="text-xs font-medium text-foreground mb-2">Data Source Reference</h6>
                                <div className="grid grid-cols-4 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">API Group</label>
                                    <input
                                      type="text"
                                      value={volume.ephemeral?.volumeClaimTemplate?.spec?.dataSourceRef?.apiGroup || ""}
                                      onChange={(e) => {
                                        const updated = [...(config.volumes || [])];
                                        const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                        spec.dataSourceRef = { ...spec.dataSourceRef, apiGroup: e.target.value || undefined };
                                        updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      placeholder="snapshot.storage.k8s.io"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Kind</label>
                                    <input
                                      type="text"
                                      value={volume.ephemeral?.volumeClaimTemplate?.spec?.dataSourceRef?.kind || ""}
                                      onChange={(e) => {
                                        const updated = [...(config.volumes || [])];
                                        const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                        spec.dataSourceRef = { ...spec.dataSourceRef, kind: e.target.value || undefined };
                                        updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      placeholder="VolumeSnapshot"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={volume.ephemeral?.volumeClaimTemplate?.spec?.dataSourceRef?.name || ""}
                                      onChange={(e) => {
                                        const updated = [...(config.volumes || [])];
                                        const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                        spec.dataSourceRef = { ...spec.dataSourceRef, name: e.target.value || undefined };
                                        updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      placeholder="my-snapshot"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Namespace</label>
                                    <input
                                      type="text"
                                      value={volume.ephemeral?.volumeClaimTemplate?.spec?.dataSourceRef?.namespace || ""}
                                      onChange={(e) => {
                                        const updated = [...(config.volumes || [])];
                                        const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                        spec.dataSourceRef = { ...spec.dataSourceRef, namespace: e.target.value || undefined };
                                        updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      placeholder="default"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Resources */}
                              <div className="border-t border-border/50 pt-3">
                                <h6 className="text-xs font-medium text-foreground mb-2">Resources</h6>
                                <div className="space-y-2">
                                  {/* Limits */}
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Limits</label>
                                    <div className="space-y-1">
                                      {Object.entries(volume.ephemeral?.volumeClaimTemplate?.spec?.resources?.limits || {}).map(([key, val], lIdx) => (
                                        <div key={lIdx} className="flex gap-1">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...(config.volumes || [])];
                                              const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                              const limits = { ...spec.resources?.limits };
                                              delete limits[key];
                                              limits[e.target.value] = val;
                                              spec.resources = { ...spec.resources, limits };
                                              updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                              onConfigChange("volumes", updated);
                                            }}
                                            placeholder="storage"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...(config.volumes || [])];
                                              const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                              const limits = { ...spec.resources?.limits };
                                              limits[key] = e.target.value;
                                              spec.resources = { ...spec.resources, limits };
                                              updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                              onConfigChange("volumes", updated);
                                            }}
                                            placeholder="10Gi"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...(config.volumes || [])];
                                              const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                              const limits = { ...spec.resources?.limits };
                                              delete limits[key];
                                              spec.resources = { ...spec.resources, limits: Object.keys(limits).length > 0 ? limits : undefined };
                                              updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                              onConfigChange("volumes", updated);
                                            }}
                                            className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...(config.volumes || [])];
                                          const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                          const limits = { ...spec.resources?.limits, "": "" };
                                          spec.resources = { ...spec.resources, limits };
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Limit
                                      </button>
                                    </div>
                                  </div>

                                  {/* Requests */}
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Requests</label>
                                    <div className="space-y-1">
                                      {Object.entries(volume.ephemeral?.volumeClaimTemplate?.spec?.resources?.requests || {}).map(([key, val], rIdx) => (
                                        <div key={rIdx} className="flex gap-1">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...(config.volumes || [])];
                                              const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                              const requests = { ...spec.resources?.requests };
                                              delete requests[key];
                                              requests[e.target.value] = val;
                                              spec.resources = { ...spec.resources, requests };
                                              updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                              onConfigChange("volumes", updated);
                                            }}
                                            placeholder="storage"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...(config.volumes || [])];
                                              const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                              const requests = { ...spec.resources?.requests };
                                              requests[key] = e.target.value;
                                              spec.resources = { ...spec.resources, requests };
                                              updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                              onConfigChange("volumes", updated);
                                            }}
                                            placeholder="5Gi"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...(config.volumes || [])];
                                              const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                              const requests = { ...spec.resources?.requests };
                                              delete requests[key];
                                              spec.resources = { ...spec.resources, requests: Object.keys(requests).length > 0 ? requests : undefined };
                                              updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                              onConfigChange("volumes", updated);
                                            }}
                                            className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...(config.volumes || [])];
                                          const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                          const requests = { ...spec.resources?.requests, "": "" };
                                          spec.resources = { ...spec.resources, requests };
                                          updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                          onConfigChange("volumes", updated);
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Request
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Selector */}
                              <div className="border-t border-border/50 pt-3">
                                <h6 className="text-xs font-medium text-foreground mb-2">Selector</h6>

                                {/* Match Labels */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-foreground">Match Labels</label>
                                    <button
                                      onClick={() => {
                                        const updated = [...(config.volumes || [])];
                                        const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                        const labels = { ...spec.selector?.matchLabels, "": "" };
                                        spec.selector = { ...spec.selector, matchLabels: labels };
                                        updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      className="text-primary hover:opacity-70 text-xs"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    {Object.entries(volume.ephemeral?.volumeClaimTemplate?.spec?.selector?.matchLabels || {}).map(([key, val], lIdx) => (
                                      <div key={lIdx} className="flex gap-1">
                                        <input
                                          type="text"
                                          value={key}
                                          onChange={(e) => {
                                            const updated = [...(config.volumes || [])];
                                            const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                            const labels = { ...spec.selector?.matchLabels };
                                            delete labels[key];
                                            labels[e.target.value] = val;
                                            spec.selector = { ...spec.selector, matchLabels: labels };
                                            updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                            onConfigChange("volumes", updated);
                                          }}
                                          placeholder="key"
                                          className="input-field text-xs flex-1"
                                        />
                                        <input
                                          type="text"
                                          value={val}
                                          onChange={(e) => {
                                            const updated = [...(config.volumes || [])];
                                            const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                            const labels = { ...spec.selector?.matchLabels };
                                            labels[key] = e.target.value;
                                            spec.selector = { ...spec.selector, matchLabels: labels };
                                            updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                            onConfigChange("volumes", updated);
                                          }}
                                          placeholder="value"
                                          className="input-field text-xs flex-1"
                                        />
                                        <button
                                          onClick={() => {
                                            const updated = [...(config.volumes || [])];
                                            const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                            const labels = { ...spec.selector?.matchLabels };
                                            delete labels[key];
                                            spec.selector = { ...spec.selector, matchLabels: Object.keys(labels).length > 0 ? labels : undefined };
                                            updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                            onConfigChange("volumes", updated);
                                          }}
                                          className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Match Expressions */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-foreground">Match Expressions</label>
                                    <button
                                      onClick={() => {
                                        const updated = [...(config.volumes || [])];
                                        const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                        const expressions = [...(spec.selector?.matchExpressions || []), { key: "", operator: "In", values: [] }];
                                        spec.selector = { ...spec.selector, matchExpressions: expressions };
                                        updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                        onConfigChange("volumes", updated);
                                      }}
                                      className="text-primary hover:opacity-70 text-xs"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(volume.ephemeral?.volumeClaimTemplate?.spec?.selector?.matchExpressions || []).map((expr, eIdx) => (
                                      <div key={eIdx} className="p-2 bg-muted/5 rounded border border-border/30 space-y-1">
                                        <div className="grid grid-cols-2 gap-1">
                                          <div>
                                            <label className="block text-xs font-medium text-foreground mb-0.5">Key</label>
                                            <input
                                              type="text"
                                              value={expr.key}
                                              onChange={(e) => {
                                                const updated = [...(config.volumes || [])];
                                                const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                                const expressions = [...(spec.selector?.matchExpressions || [])];
                                                expressions[eIdx] = { ...expr, key: e.target.value };
                                                spec.selector = { ...spec.selector, matchExpressions: expressions };
                                                updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                                onConfigChange("volumes", updated);
                                              }}
                                              placeholder="app"
                                              className="input-field text-xs"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-foreground mb-0.5">Operator</label>
                                            <select
                                              value={expr.operator}
                                              onChange={(e) => {
                                                const updated = [...(config.volumes || [])];
                                                const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                                const expressions = [...(spec.selector?.matchExpressions || [])];
                                                expressions[eIdx] = { ...expr, operator: e.target.value };
                                                spec.selector = { ...spec.selector, matchExpressions: expressions };
                                                updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                                onConfigChange("volumes", updated);
                                              }}
                                              className="input-field text-xs"
                                            >
                                              <option value="In">In</option>
                                              <option value="NotIn">NotIn</option>
                                              <option value="Exists">Exists</option>
                                              <option value="DoesNotExist">DoesNotExist</option>
                                              <option value="Gt">Gt</option>
                                              <option value="Lt">Lt</option>
                                            </select>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-foreground mb-0.5">Values</label>
                                          <div className="space-y-1">
                                            {(expr.values || []).map((val, vIdx) => (
                                              <div key={vIdx} className="flex gap-1">
                                                <input
                                                  type="text"
                                                  value={val}
                                                  onChange={(e) => {
                                                    const updated = [...(config.volumes || [])];
                                                    const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                                    const expressions = [...(spec.selector?.matchExpressions || [])];
                                                    const values = [...(expr.values || [])];
                                                    values[vIdx] = e.target.value;
                                                    expressions[eIdx] = { ...expr, values };
                                                    spec.selector = { ...spec.selector, matchExpressions: expressions };
                                                    updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                                    onConfigChange("volumes", updated);
                                                  }}
                                                  placeholder="value"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...(config.volumes || [])];
                                                    const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                                    const expressions = [...(spec.selector?.matchExpressions || [])];
                                                    const values = (expr.values || []).filter((_, i) => i !== vIdx);
                                                    expressions[eIdx] = { ...expr, values };
                                                    spec.selector = { ...spec.selector, matchExpressions: expressions };
                                                    updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                                    onConfigChange("volumes", updated);
                                                  }}
                                                  className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...(config.volumes || [])];
                                                const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                                const expressions = [...(spec.selector?.matchExpressions || [])];
                                                const values = [...(expr.values || []), ""];
                                                expressions[eIdx] = { ...expr, values };
                                                spec.selector = { ...spec.selector, matchExpressions: expressions };
                                                updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                                onConfigChange("volumes", updated);
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Add Value
                                            </button>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => {
                                            const updated = [...(config.volumes || [])];
                                            const spec = { ...volume.ephemeral?.volumeClaimTemplate?.spec };
                                            const expressions = (spec.selector?.matchExpressions || []).filter((_, i) => i !== eIdx);
                                            spec.selector = { ...spec.selector, matchExpressions: expressions.length > 0 ? expressions : undefined };
                                            updated[idx] = { ...volume, ephemeral: { volumeClaimTemplate: { ...volume.ephemeral?.volumeClaimTemplate, spec } } };
                                            onConfigChange("volumes", updated);
                                          }}
                                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-0.5 rounded"
                                        >
                                          Remove Expression
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            onConfigChange(
                              "volumes",
                              config.volumes?.filter((_, i) => i !== idx)
                            );
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                        >
                          Remove Volume
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                section.fields.map((field) => (
                  <div key={String(field.key)}>
                    {field.type === "checkbox" ? (
                      renderField(field)
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {field.label}
                        </label>
                        {renderField(field)}
                      </>
                    )}
                    {field.description && (
                      <p className="text-xs text-foreground/50 mt-1">{field.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
