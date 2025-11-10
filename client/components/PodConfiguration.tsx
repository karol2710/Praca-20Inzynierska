import { useState } from "react";
import { ChevronDown } from "lucide-react";
import AffinityConfiguration from "./AffinityConfiguration";

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
    id: "storage",
    title: "Storage & Images",
    description: "Volumes and image pull settings",
    fields: [
      { key: "imagePullSecrets", label: "Image Pull Secrets", type: "tags", description: "Names of image pull secrets" },
    ],
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
