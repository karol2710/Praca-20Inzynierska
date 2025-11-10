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
    description: "Labels and annotations for the Pod",
    fields: [
      { key: "labels", label: "Labels", type: "tags", description: "Key-value labels for Pod selection" },
      { key: "annotations", label: "Annotations", type: "tags", description: "Metadata annotations" },
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
    id: "storage",
    title: "Storage & Images",
    description: "Volumes and image pull settings",
    fields: [
      { key: "imagePullSecrets", label: "Image Pull Secrets", type: "tags", description: "Names of image pull secrets" },
    ],
  },
  {
    id: "tolerations",
    title: "Tolerations",
    description: "Pod tolerations for node taints",
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
