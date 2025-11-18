import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import PodConfiguration from "./PodConfiguration";

interface OwnerReference {
  apiVersion?: string;
  blockOwnerDeletion?: boolean;
  controller?: boolean;
  kind?: string;
  name?: string;
  uid?: string;
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

interface PodConfig {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  namespace?: string;
  [key: string]: any;
}

interface VolumeClaimTemplate {
  metadata?: {
    name?: string;
    namespace?: string;
    deletionGracePeriodSeconds?: number;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
    ownerReferences?: OwnerReference[];
  };
  spec?: {
    accessModes?: string[];
    storageClassName?: string;
    volumeName?: string;
    volumeMode?: string;
    volumeAttributesClassName?: string;
    resources?: {
      limits?: Record<string, string>;
      requests?: Record<string, string>;
    };
    dataSource?: {
      apiGroup?: string;
      kind?: string;
      name?: string;
    };
    dataSourceRef?: {
      apiGroup?: string;
      kind?: string;
      name?: string;
      namespace?: string;
    };
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: LabelSelectorRequirement[];
    };
  };
}

interface RollingUpdateStrategy {
  maxSurge?: string;
  maxUnavailable?: string;
  partition?: number;
}

interface UpdateStrategy {
  type?: string;
  rollingUpdate?: RollingUpdateStrategy;
}

interface PVCRetentionPolicy {
  whenDeleted?: string;
  whenScaled?: string;
}

interface StatefulSetSpec {
  minReadySeconds?: number;
  ordinals?: {
    start?: number;
  };
  persistentVolumeClaimRetentionPolicy?: PVCRetentionPolicy;
  podManagementPolicy?: string;
  replicas?: number;
  revisionHistoryLimit?: number;
  selector?: LabelSelector;
  serviceName?: string;
  updateStrategy?: UpdateStrategy;
  volumeClaimTemplates?: VolumeClaimTemplate[];
}

interface StatefulSetConfig {
  annotations?: Record<string, string>;
  deletionGracePeriodSeconds?: number;
  labels?: Record<string, string>;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  spec?: StatefulSetSpec;
  template?: PodConfig;
}

interface StatefulSetConfigurationProps {
  config: StatefulSetConfig;
  onConfigChange: (key: keyof StatefulSetConfig, value: any) => void;
}

interface ConfigSection {
  id: string;
  title: string;
  description: string;
}

const configSections: ConfigSection[] = [
  {
    id: "metadata",
    title: "Metadata",
    description: "Configure StatefulSet metadata including labels, annotations, and namespace",
  },
  {
    id: "spec",
    title: "Spec",
    description: "Configure StatefulSet specification including replicas, service, and update strategy",
  },
  {
    id: "template",
    title: "Template",
    description: "Configure the Pod template that the StatefulSet will use",
  },
];

export default function StatefulSetConfiguration({ config, onConfigChange }: StatefulSetConfigurationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["metadata", "spec", "template"]));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderTagsField = (
    value: Record<string, string> | undefined,
    onChange: (value: Record<string, string> | undefined) => void,
    label: string,
    placeholder: string
  ) => {
    const tags = value || {};
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {Object.entries(tags).map(([key, val], idx) => (
            <div
              key={idx}
              className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {key}={val}
              <button
                onClick={() => {
                  const newTags = { ...tags };
                  delete newTags[key];
                  onChange(Object.keys(newTags).length > 0 ? newTags : undefined);
                }}
                className="text-primary hover:opacity-70"
              >
                ��
              </button>
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const input = e.currentTarget;
              const newValue = input.value.trim();
              if (newValue && newValue.includes("=")) {
                const [k, v] = newValue.split("=", 2);
                if (k && v) {
                  onChange({ ...tags, [k]: v });
                  input.value = "";
                }
              }
            }
          }}
          className="input-field"
        />
        <p className="text-xs text-foreground/50">Format: key=value (press Enter to add)</p>
      </div>
    );
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

          {/* Metadata Section Content */}
          {expandedSections.has(section.id) && section.id === "metadata" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Labels</label>
                {renderTagsField(
                  config.labels,
                  (value) => onConfigChange("labels", value),
                  "Labels",
                  "Add label (key=value)"
                )}
                <p className="text-xs text-foreground/50 mt-1">Key-value labels for StatefulSet selection</p>
              </div>

              {/* Annotations */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">Annotations</label>
                {renderTagsField(
                  config.annotations,
                  (value) => onConfigChange("annotations", value),
                  "Annotations",
                  "Add annotation (key=value)"
                )}
                <p className="text-xs text-foreground/50 mt-1">Metadata annotations</p>
              </div>

              {/* Deletion Grace Period */}
              <div className="border-t border-border pt-4">
                <label htmlFor="deletionGracePeriodSeconds" className="block text-sm font-medium text-foreground mb-2">
                  Deletion Grace Period (seconds)
                </label>
                <input
                  id="deletionGracePeriodSeconds"
                  type="number"
                  value={config.deletionGracePeriodSeconds || ""}
                  onChange={(e) =>
                    onConfigChange("deletionGracePeriodSeconds", e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="30"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Grace period in seconds for pod termination (0-3600)</p>
              </div>

              {/* Owner References */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-foreground">Owner References</label>
                  <button
                    onClick={() => {
                      const ownerReferences = config.ownerReferences || [];
                      onConfigChange("ownerReferences", [
                        ...ownerReferences,
                        {
                          apiVersion: "",
                          kind: "",
                          name: "",
                          uid: "",
                          blockOwnerDeletion: false,
                          controller: false,
                        },
                      ]);
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Owner Reference
                  </button>
                </div>
                <p className="text-xs text-foreground/50 mb-4">Objects this StatefulSet is owned by</p>

                {(config.ownerReferences || []).length > 0 ? (
                  <div className="space-y-4">
                    {(config.ownerReferences || []).map((owner, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">API Version*</label>
                            <input
                              type="text"
                              value={owner.apiVersion || ""}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...owner, apiVersion: e.target.value || undefined };
                                onConfigChange("ownerReferences", updated);
                              }}
                              placeholder="apps/v1"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Kind*</label>
                            <input
                              type="text"
                              value={owner.kind || ""}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...owner, kind: e.target.value || undefined };
                                onConfigChange("ownerReferences", updated);
                              }}
                              placeholder="StatefulSet"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Name*</label>
                            <input
                              type="text"
                              value={owner.name || ""}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...owner, name: e.target.value || undefined };
                                onConfigChange("ownerReferences", updated);
                              }}
                              placeholder="my-statefulset"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">UID*</label>
                            <input
                              type="text"
                              value={owner.uid || ""}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...owner, uid: e.target.value || undefined };
                                onConfigChange("ownerReferences", updated);
                              }}
                              placeholder="12345678-1234-1234-1234-123456789012"
                              className="input-field text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={owner.blockOwnerDeletion || false}
                                onChange={(e) => {
                                  const updated = [...(config.ownerReferences || [])];
                                  updated[idx] = { ...owner, blockOwnerDeletion: e.target.checked ? true : undefined };
                                  onConfigChange("ownerReferences", updated);
                                }}
                                className="w-4 h-4 rounded border-border bg-input cursor-pointer"
                              />
                              <span className="text-xs font-medium text-foreground">Block Owner Deletion</span>
                            </label>
                          </div>
                          <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={owner.controller || false}
                                onChange={(e) => {
                                  const updated = [...(config.ownerReferences || [])];
                                  updated[idx] = { ...owner, controller: e.target.checked ? true : undefined };
                                  onConfigChange("ownerReferences", updated);
                                }}
                                className="w-4 h-4 rounded border-border bg-input cursor-pointer"
                              />
                              <span className="text-xs font-medium text-foreground">Controller</span>
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onConfigChange(
                              "ownerReferences",
                              config.ownerReferences?.filter((_, i) => i !== idx)
                            );
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Remove Owner Reference
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2 text-center">No owner references added yet</p>
                )}
              </div>
            </div>
          )}

          {/* Spec Section Content */}
          {expandedSections.has(section.id) && section.id === "spec" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              {/* Replicas */}
              <div>
                <label htmlFor="replicas" className="block text-sm font-medium text-foreground mb-2">
                  Replicas
                </label>
                <input
                  id="replicas"
                  type="number"
                  value={config.spec?.replicas || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      replicas: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="1"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Number of desired pods</p>
              </div>

              {/* Service Name */}
              <div className="border-t border-border pt-4">
                <label htmlFor="serviceName" className="block text-sm font-medium text-foreground mb-2">
                  Service Name
                </label>
                <input
                  id="serviceName"
                  type="text"
                  value={config.spec?.serviceName || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      serviceName: e.target.value || undefined,
                    })
                  }
                  placeholder="my-service"
                  className="input-field"
                />
                <p className="text-xs text-foreground/50 mt-1">Name of the service that governs this StatefulSet</p>
              </div>

              {/* Min Ready Seconds */}
              <div className="border-t border-border pt-4">
                <label htmlFor="minReadySeconds" className="block text-sm font-medium text-foreground mb-2">
                  Min Ready Seconds
                </label>
                <input
                  id="minReadySeconds"
                  type="number"
                  value={config.spec?.minReadySeconds || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      minReadySeconds: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="0"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Minimum number of seconds for which a newly created pod should be ready</p>
              </div>

              {/* Pod Management Policy */}
              <div className="border-t border-border pt-4">
                <label htmlFor="podManagementPolicy" className="block text-sm font-medium text-foreground mb-2">
                  Pod Management Policy
                </label>
                <select
                  id="podManagementPolicy"
                  value={config.spec?.podManagementPolicy || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      podManagementPolicy: e.target.value || undefined,
                    })
                  }
                  className="input-field"
                >
                  <option value="">Select policy</option>
                  <option value="OrderedReady">OrderedReady (default)</option>
                  <option value="Parallel">Parallel</option>
                </select>
                <p className="text-xs text-foreground/50 mt-1">Policy for pod creation and termination</p>
              </div>

              {/* Revision History Limit */}
              <div className="border-t border-border pt-4">
                <label htmlFor="revisionHistoryLimit" className="block text-sm font-medium text-foreground mb-2">
                  Revision History Limit
                </label>
                <input
                  id="revisionHistoryLimit"
                  type="number"
                  value={config.spec?.revisionHistoryLimit || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      revisionHistoryLimit: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="10"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">The number of old ControllerRevisions to retain</p>
              </div>

              {/* Ordinals */}
              <div className="border-t border-border pt-4">
                <label htmlFor="ordinalsStart" className="block text-sm font-medium text-foreground mb-2">
                  Ordinals Start
                </label>
                <input
                  id="ordinalsStart"
                  type="number"
                  value={config.spec?.ordinals?.start || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      ordinals: {
                        ...config.spec?.ordinals,
                        start: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="0"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">The start ordinal index for pods</p>
              </div>

              {/* Persistent Volume Claim Retention Policy */}
              <div className="border-t border-border pt-4">
                <h5 className="text-sm font-medium text-foreground mb-3">PVC Retention Policy</h5>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="whenDeleted" className="block text-xs font-medium text-foreground mb-1">
                      When Deleted
                    </label>
                    <select
                      id="whenDeleted"
                      value={config.spec?.persistentVolumeClaimRetentionPolicy?.whenDeleted || ""}
                      onChange={(e) =>
                        onConfigChange("spec", {
                          ...config.spec,
                          persistentVolumeClaimRetentionPolicy: {
                            ...config.spec?.persistentVolumeClaimRetentionPolicy,
                            whenDeleted: e.target.value || undefined,
                          },
                        })
                      }
                      className="input-field text-sm"
                    >
                      <option value="">Select policy</option>
                      <option value="Retain">Retain</option>
                      <option value="Delete">Delete</option>
                    </select>
                    <p className="text-xs text-foreground/50 mt-0.5">Policy when StatefulSet is deleted</p>
                  </div>
                  <div>
                    <label htmlFor="whenScaled" className="block text-xs font-medium text-foreground mb-1">
                      When Scaled
                    </label>
                    <select
                      id="whenScaled"
                      value={config.spec?.persistentVolumeClaimRetentionPolicy?.whenScaled || ""}
                      onChange={(e) =>
                        onConfigChange("spec", {
                          ...config.spec,
                          persistentVolumeClaimRetentionPolicy: {
                            ...config.spec?.persistentVolumeClaimRetentionPolicy,
                            whenScaled: e.target.value || undefined,
                          },
                        })
                      }
                      className="input-field text-sm"
                    >
                      <option value="">Select policy</option>
                      <option value="Retain">Retain</option>
                      <option value="Delete">Delete</option>
                    </select>
                    <p className="text-xs text-foreground/50 mt-0.5">Policy when replicas are scaled down</p>
                  </div>
                </div>
              </div>

              {/* Selector */}
              <div className="border-t border-border pt-4">
                <h5 className="text-sm font-medium text-foreground mb-3">Selector</h5>

                {/* Match Labels */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-foreground">Match Labels</label>
                    <button
                      onClick={() => {
                        const selector = { ...config.spec?.selector };
                        const labels = { ...selector.matchLabels, "": "" };
                        onConfigChange("spec", { ...config.spec, selector: { ...selector, matchLabels: labels } });
                      }}
                      className="text-primary hover:opacity-70 text-xs"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(config.spec?.selector?.matchLabels || {}).map(([key, val], lIdx) => (
                      <div key={lIdx} className="flex gap-1">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const selector = { ...config.spec?.selector };
                            const labels = { ...selector.matchLabels };
                            delete labels[key];
                            labels[e.target.value] = val;
                            onConfigChange("spec", { ...config.spec, selector: { ...selector, matchLabels: labels } });
                          }}
                          placeholder="key"
                          className="input-field text-xs flex-1"
                        />
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const selector = { ...config.spec?.selector };
                            const labels = { ...selector.matchLabels };
                            labels[key] = e.target.value;
                            onConfigChange("spec", { ...config.spec, selector: { ...selector, matchLabels: labels } });
                          }}
                          placeholder="value"
                          className="input-field text-xs flex-1"
                        />
                        <button
                          onClick={() => {
                            const selector = { ...config.spec?.selector };
                            const labels = { ...selector.matchLabels };
                            delete labels[key];
                            onConfigChange("spec", { ...config.spec, selector: { ...selector, matchLabels: Object.keys(labels).length > 0 ? labels : undefined } });
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
                        const selector = { ...config.spec?.selector };
                        const expressions = [...(selector.matchExpressions || []), { key: "", operator: "In", values: [] }];
                        onConfigChange("spec", { ...config.spec, selector: { ...selector, matchExpressions: expressions } });
                      }}
                      className="text-primary hover:opacity-70 text-xs"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(config.spec?.selector?.matchExpressions || []).map((expr, eIdx) => (
                      <div key={eIdx} className="p-2 bg-muted/5 rounded border border-border/30 space-y-1">
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-0.5">Key</label>
                            <input
                              type="text"
                              value={expr.key}
                              onChange={(e) => {
                                const selector = { ...config.spec?.selector };
                                const expressions = [...(selector.matchExpressions || [])];
                                expressions[eIdx] = { ...expr, key: e.target.value };
                                onConfigChange("spec", { ...config.spec, selector: { ...selector, matchExpressions: expressions } });
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
                                const selector = { ...config.spec?.selector };
                                const expressions = [...(selector.matchExpressions || [])];
                                expressions[eIdx] = { ...expr, operator: e.target.value };
                                onConfigChange("spec", { ...config.spec, selector: { ...selector, matchExpressions: expressions } });
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
                                    const selector = { ...config.spec?.selector };
                                    const expressions = [...(selector.matchExpressions || [])];
                                    const values = [...(expr.values || [])];
                                    values[vIdx] = e.target.value;
                                    expressions[eIdx] = { ...expr, values };
                                    onConfigChange("spec", { ...config.spec, selector: { ...selector, matchExpressions: expressions } });
                                  }}
                                  placeholder="value"
                                  className="input-field text-xs flex-1"
                                />
                                <button
                                  onClick={() => {
                                    const selector = { ...config.spec?.selector };
                                    const expressions = [...(selector.matchExpressions || [])];
                                    const values = (expr.values || []).filter((_, i) => i !== vIdx);
                                    expressions[eIdx] = { ...expr, values };
                                    onConfigChange("spec", { ...config.spec, selector: { ...selector, matchExpressions: expressions } });
                                  }}
                                  className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const selector = { ...config.spec?.selector };
                                const expressions = [...(selector.matchExpressions || [])];
                                const values = [...(expr.values || []), ""];
                                expressions[eIdx] = { ...expr, values };
                                onConfigChange("spec", { ...config.spec, selector: { ...selector, matchExpressions: expressions } });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Value
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const selector = { ...config.spec?.selector };
                            const expressions = (selector.matchExpressions || []).filter((_, i) => i !== eIdx);
                            onConfigChange("spec", { ...config.spec, selector: { ...selector, matchExpressions: expressions.length > 0 ? expressions : undefined } });
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

              {/* Update Strategy */}
              <div className="border-t border-border pt-4">
                <h5 className="text-sm font-medium text-foreground mb-3">Update Strategy</h5>

                <div className="mb-3">
                  <label htmlFor="updateStrategyType" className="block text-xs font-medium text-foreground mb-1">
                    Type
                  </label>
                  <select
                    id="updateStrategyType"
                    value={config.spec?.updateStrategy?.type || ""}
                    onChange={(e) =>
                      onConfigChange("spec", {
                        ...config.spec,
                        updateStrategy: { ...config.spec?.updateStrategy, type: e.target.value || undefined },
                      })
                    }
                    className="input-field"
                  >
                    <option value="">Select strategy type</option>
                    <option value="RollingUpdate">RollingUpdate</option>
                    <option value="OnDelete">OnDelete</option>
                  </select>
                  <p className="text-xs text-foreground/50 mt-1">Strategy for updating pods</p>
                </div>

                {config.spec?.updateStrategy?.type === "RollingUpdate" && (
                  <div className="p-3 bg-muted/5 rounded border border-border/30 space-y-2">
                    <h6 className="text-xs font-medium text-foreground">Rolling Update</h6>

                    <div>
                      <label htmlFor="maxUnavailable" className="block text-xs font-medium text-foreground mb-1">
                        Max Unavailable
                      </label>
                      <input
                        id="maxUnavailable"
                        type="text"
                        value={config.spec?.updateStrategy?.rollingUpdate?.maxUnavailable || ""}
                        onChange={(e) =>
                          onConfigChange("spec", {
                            ...config.spec,
                            updateStrategy: {
                              ...config.spec?.updateStrategy,
                              rollingUpdate: {
                                ...config.spec?.updateStrategy?.rollingUpdate,
                                maxUnavailable: e.target.value || undefined,
                              },
                            },
                          })
                        }
                        placeholder="1"
                        className="input-field text-xs"
                      />
                      <p className="text-xs text-foreground/50 mt-0.5">Maximum number/percentage of pods that can be unavailable</p>
                    </div>

                    <div>
                      <label htmlFor="partition" className="block text-xs font-medium text-foreground mb-1">
                        Partition
                      </label>
                      <input
                        id="partition"
                        type="number"
                        value={config.spec?.updateStrategy?.rollingUpdate?.partition || ""}
                        onChange={(e) =>
                          onConfigChange("spec", {
                            ...config.spec,
                            updateStrategy: {
                              ...config.spec?.updateStrategy,
                              rollingUpdate: {
                                ...config.spec?.updateStrategy?.rollingUpdate,
                                partition: e.target.value ? parseInt(e.target.value) : undefined,
                              },
                            },
                          })
                        }
                        placeholder="0"
                        className="input-field text-xs"
                        min="0"
                      />
                      <p className="text-xs text-foreground/50 mt-0.5">The ordinal at which the StatefulSet should be partitioned for updates</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Volume Claim Templates */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-foreground">Volume Claim Templates</label>
                  <button
                    onClick={() => {
                      const templates = config.spec?.volumeClaimTemplates || [];
                      onConfigChange("spec", {
                        ...config.spec,
                        volumeClaimTemplates: [
                          ...templates,
                          {
                            metadata: { name: "" },
                            spec: { accessModes: ["ReadWriteOnce"], resources: { requests: {} } },
                          },
                        ],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Template
                  </button>
                </div>
                <p className="text-xs text-foreground/50 mb-4">Templates for PersistentVolumeClaims</p>

                {(config.spec?.volumeClaimTemplates || []).length > 0 ? (
                  <div className="space-y-4">
                    {(config.spec?.volumeClaimTemplates || []).map((template, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-4">
                        {/* Metadata Section */}
                        <div className="bg-muted/10 rounded-lg p-3 space-y-3">
                          <h6 className="text-sm font-medium text-foreground">Metadata</h6>

                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                            <input
                              type="text"
                              value={template.metadata?.name || ""}
                              onChange={(e) => {
                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                updated[idx] = {
                                  ...template,
                                  metadata: { ...template.metadata, name: e.target.value || undefined },
                                };
                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                              }}
                              placeholder="data"
                              className="input-field text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Namespace</label>
                            <input
                              type="text"
                              value={template.metadata?.namespace || ""}
                              onChange={(e) => {
                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                updated[idx] = {
                                  ...template,
                                  metadata: { ...template.metadata, namespace: e.target.value || undefined },
                                };
                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                              }}
                              placeholder="default"
                              className="input-field text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Annotations</label>
                            {renderTagsField(
                              template.metadata?.annotations,
                              (value) => {
                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                updated[idx] = {
                                  ...template,
                                  metadata: { ...template.metadata, annotations: value },
                                };
                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                              },
                              "Annotations",
                              "Add annotation (key=value)"
                            )}
                            <p className="text-xs text-foreground/50 mt-1">Metadata annotations for VolumeClaimTemplate</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Labels</label>
                            {renderTagsField(
                              template.metadata?.labels,
                              (value) => {
                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                updated[idx] = {
                                  ...template,
                                  metadata: { ...template.metadata, labels: value },
                                };
                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                              },
                              "Labels",
                              "Add label (key=value)"
                            )}
                            <p className="text-xs text-foreground/50 mt-1">Key-value labels for VolumeClaimTemplate selection</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Deletion Grace Period (seconds)</label>
                            <input
                              type="number"
                              value={template.metadata?.deletionGracePeriodSeconds || ""}
                              onChange={(e) => {
                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                updated[idx] = {
                                  ...template,
                                  metadata: { ...template.metadata, deletionGracePeriodSeconds: e.target.value ? parseInt(e.target.value) : undefined },
                                };
                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                              }}
                              placeholder="30"
                              className="input-field text-xs"
                              min="0"
                            />
                            <p className="text-xs text-foreground/50 mt-1">Grace period in seconds for PVC termination</p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs font-medium text-foreground">Owner References</label>
                              <button
                                onClick={() => {
                                  const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                  const ownerReferences = [...(template.metadata?.ownerReferences || []), {
                                    apiVersion: "",
                                    kind: "",
                                    name: "",
                                    uid: "",
                                    blockOwnerDeletion: false,
                                    controller: false,
                                  }];
                                  updated[idx] = {
                                    ...template,
                                    metadata: { ...template.metadata, ownerReferences },
                                  };
                                  onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                }}
                                className="text-primary hover:opacity-70 text-xs"
                              >
                                + Add Owner Reference
                              </button>
                            </div>
                            <p className="text-xs text-foreground/50 mb-2">Objects this VolumeClaimTemplate is owned by</p>

                            {(template.metadata?.ownerReferences || []).length > 0 ? (
                              <div className="space-y-2">
                                {(template.metadata?.ownerReferences || []).map((owner, oIdx) => (
                                  <div key={oIdx} className="p-2 bg-muted/20 border border-border rounded-lg space-y-2">
                                    <div className="grid grid-cols-2 gap-1">
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-0.5">API Version*</label>
                                        <input
                                          type="text"
                                          value={owner.apiVersion || ""}
                                          onChange={(e) => {
                                            const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                            const ownerRefs = [...(template.metadata?.ownerReferences || [])];
                                            ownerRefs[oIdx] = { ...owner, apiVersion: e.target.value || undefined };
                                            updated[idx] = {
                                              ...template,
                                              metadata: { ...template.metadata, ownerReferences: ownerRefs },
                                            };
                                            onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                          }}
                                          placeholder="apps/v1"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-0.5">Kind*</label>
                                        <input
                                          type="text"
                                          value={owner.kind || ""}
                                          onChange={(e) => {
                                            const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                            const ownerRefs = [...(template.metadata?.ownerReferences || [])];
                                            ownerRefs[oIdx] = { ...owner, kind: e.target.value || undefined };
                                            updated[idx] = {
                                              ...template,
                                              metadata: { ...template.metadata, ownerReferences: ownerRefs },
                                            };
                                            onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                          }}
                                          placeholder="StatefulSet"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-0.5">Name*</label>
                                        <input
                                          type="text"
                                          value={owner.name || ""}
                                          onChange={(e) => {
                                            const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                            const ownerRefs = [...(template.metadata?.ownerReferences || [])];
                                            ownerRefs[oIdx] = { ...owner, name: e.target.value || undefined };
                                            updated[idx] = {
                                              ...template,
                                              metadata: { ...template.metadata, ownerReferences: ownerRefs },
                                            };
                                            onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                          }}
                                          placeholder="my-statefulset"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-0.5">UID*</label>
                                        <input
                                          type="text"
                                          value={owner.uid || ""}
                                          onChange={(e) => {
                                            const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                            const ownerRefs = [...(template.metadata?.ownerReferences || [])];
                                            ownerRefs[oIdx] = { ...owner, uid: e.target.value || undefined };
                                            updated[idx] = {
                                              ...template,
                                              metadata: { ...template.metadata, ownerReferences: ownerRefs },
                                            };
                                            onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                          }}
                                          placeholder="12345678-1234-1234-1234-123456789012"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={owner.blockOwnerDeletion || false}
                                          onChange={(e) => {
                                            const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                            const ownerRefs = [...(template.metadata?.ownerReferences || [])];
                                            ownerRefs[oIdx] = { ...owner, blockOwnerDeletion: e.target.checked ? true : undefined };
                                            updated[idx] = {
                                              ...template,
                                              metadata: { ...template.metadata, ownerReferences: ownerRefs },
                                            };
                                            onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                          }}
                                          className="w-3 h-3 rounded border-border bg-input cursor-pointer"
                                        />
                                        <span className="text-xs font-medium text-foreground">Block Owner Deletion</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={owner.controller || false}
                                          onChange={(e) => {
                                            const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                            const ownerRefs = [...(template.metadata?.ownerReferences || [])];
                                            ownerRefs[oIdx] = { ...owner, controller: e.target.checked ? true : undefined };
                                            updated[idx] = {
                                              ...template,
                                              metadata: { ...template.metadata, ownerReferences: ownerRefs },
                                            };
                                            onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                          }}
                                          className="w-3 h-3 rounded border-border bg-input cursor-pointer"
                                        />
                                        <span className="text-xs font-medium text-foreground">Controller</span>
                                      </label>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                        updated[idx] = {
                                          ...template,
                                          metadata: {
                                            ...template.metadata,
                                            ownerReferences: template.metadata?.ownerReferences?.filter((_, i) => i !== oIdx),
                                          },
                                        };
                                        onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                      }}
                                      className="w-full text-xs text-destructive hover:bg-destructive/10 py-0.5 rounded transition-colors flex items-center justify-center gap-1"
                                    >
                                      <X className="w-3 h-3" />
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-foreground/60 text-xs py-1">No owner references added yet</p>
                            )}
                          </div>
                        </div>

                        {/* Spec Section */}
                        <div className="bg-muted/10 rounded-lg p-3 space-y-3">
                          <h6 className="text-sm font-medium text-foreground">Spec</h6>

                          {/* Access Modes */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-medium text-foreground">Access Modes</label>
                              <button
                                onClick={() => {
                                  const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                  const modes = [...(template.spec?.accessModes || []), ""];
                                  updated[idx] = { ...template, spec: { ...template.spec, accessModes: modes } };
                                  onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                }}
                                className="text-primary hover:opacity-70 text-xs"
                              >
                                + Add
                              </button>
                            </div>
                            <div className="space-y-1">
                              {(template.spec?.accessModes || []).map((mode, mIdx) => (
                                <div key={mIdx} className="flex gap-1">
                                  <select
                                    value={mode}
                                    onChange={(e) => {
                                      const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                      const modes = [...(template.spec?.accessModes || [])];
                                      modes[mIdx] = e.target.value;
                                      updated[idx] = { ...template, spec: { ...template.spec, accessModes: modes } };
                                      onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
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
                                      const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                      const modes = (template.spec?.accessModes || []).filter((_, i) => i !== mIdx);
                                      updated[idx] = { ...template, spec: { ...template.spec, accessModes: modes } };
                                      onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                    }}
                                    className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Volume Name */}
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Volume Name</label>
                            <input
                              type="text"
                              value={template.spec?.volumeName || ""}
                              onChange={(e) => {
                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                updated[idx] = {
                                  ...template,
                                  spec: { ...template.spec, volumeName: e.target.value || undefined },
                                };
                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                              }}
                              placeholder="pv-name"
                              className="input-field text-xs"
                            />
                          </div>

                          {/* Storage Class Name */}
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Storage Class Name</label>
                            <input
                              type="text"
                              value={template.spec?.storageClassName || ""}
                              onChange={(e) => {
                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                updated[idx] = {
                                  ...template,
                                  spec: { ...template.spec, storageClassName: e.target.value || undefined },
                                };
                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                              }}
                              placeholder="standard"
                              className="input-field text-xs"
                            />
                          </div>

                          {/* Volume Mode */}
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Volume Mode</label>
                            <select
                              value={template.spec?.volumeMode || ""}
                              onChange={(e) => {
                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                updated[idx] = {
                                  ...template,
                                  spec: { ...template.spec, volumeMode: e.target.value || undefined },
                                };
                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                              }}
                              className="input-field text-xs"
                            >
                              <option value="">Select</option>
                              <option value="Filesystem">Filesystem</option>
                              <option value="Block">Block</option>
                            </select>
                          </div>

                          {/* Volume Attributes Class Name */}
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Volume Attributes Class Name</label>
                            <input
                              type="text"
                              value={template.spec?.volumeAttributesClassName || ""}
                              onChange={(e) => {
                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                updated[idx] = {
                                  ...template,
                                  spec: { ...template.spec, volumeAttributesClassName: e.target.value || undefined },
                                };
                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                              }}
                              placeholder="custom-attributes"
                              className="input-field text-xs"
                            />
                          </div>

                          {/* Resources */}
                          <div>
                            <h6 className="text-xs font-medium text-foreground mb-2">Resources</h6>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Limits</label>
                                {renderTagsField(
                                  template.spec?.resources?.limits,
                                  (value) => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    updated[idx] = {
                                      ...template,
                                      spec: {
                                        ...template.spec,
                                        resources: {
                                          ...template.spec?.resources,
                                          limits: value,
                                        },
                                      },
                                    };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  },
                                  "Limits",
                                  "Add limit (key=value)"
                                )}
                                <p className="text-xs text-foreground/50 mt-1">e.g., storage=10Gi</p>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Requests</label>
                                {renderTagsField(
                                  template.spec?.resources?.requests,
                                  (value) => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    updated[idx] = {
                                      ...template,
                                      spec: {
                                        ...template.spec,
                                        resources: {
                                          ...template.spec?.resources,
                                          requests: value,
                                        },
                                      },
                                    };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  },
                                  "Requests",
                                  "Add request (key=value)"
                                )}
                                <p className="text-xs text-foreground/50 mt-1">e.g., storage=10Gi</p>
                              </div>
                            </div>
                          </div>

                          {/* Data Source */}
                          <div>
                            <h6 className="text-xs font-medium text-foreground mb-2">Data Source</h6>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">API Group</label>
                                <input
                                  type="text"
                                  value={template.spec?.dataSource?.apiGroup || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    updated[idx] = {
                                      ...template,
                                      spec: { ...template.spec, dataSource: { ...template.spec?.dataSource, apiGroup: e.target.value || undefined } },
                                    };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  }}
                                  placeholder="snapshot.storage.k8s.io"
                                  className="input-field text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Kind</label>
                                <input
                                  type="text"
                                  value={template.spec?.dataSource?.kind || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    updated[idx] = {
                                      ...template,
                                      spec: { ...template.spec, dataSource: { ...template.spec?.dataSource, kind: e.target.value || undefined } },
                                    };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  }}
                                  placeholder="VolumeSnapshot"
                                  className="input-field text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                <input
                                  type="text"
                                  value={template.spec?.dataSource?.name || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    updated[idx] = {
                                      ...template,
                                      spec: { ...template.spec, dataSource: { ...template.spec?.dataSource, name: e.target.value || undefined } },
                                    };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  }}
                                  placeholder="my-snapshot"
                                  className="input-field text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Data Source Reference */}
                          <div>
                            <h6 className="text-xs font-medium text-foreground mb-2">Data Source Reference</h6>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">API Group</label>
                                <input
                                  type="text"
                                  value={template.spec?.dataSourceRef?.apiGroup || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    updated[idx] = {
                                      ...template,
                                      spec: { ...template.spec, dataSourceRef: { ...template.spec?.dataSourceRef, apiGroup: e.target.value || undefined } },
                                    };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  }}
                                  placeholder="snapshot.storage.k8s.io"
                                  className="input-field text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Kind</label>
                                <input
                                  type="text"
                                  value={template.spec?.dataSourceRef?.kind || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    updated[idx] = {
                                      ...template,
                                      spec: { ...template.spec, dataSourceRef: { ...template.spec?.dataSourceRef, kind: e.target.value || undefined } },
                                    };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  }}
                                  placeholder="VolumeSnapshot"
                                  className="input-field text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                <input
                                  type="text"
                                  value={template.spec?.dataSourceRef?.name || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    updated[idx] = {
                                      ...template,
                                      spec: { ...template.spec, dataSourceRef: { ...template.spec?.dataSourceRef, name: e.target.value || undefined } },
                                    };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  }}
                                  placeholder="my-snapshot"
                                  className="input-field text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Namespace</label>
                                <input
                                  type="text"
                                  value={template.spec?.dataSourceRef?.namespace || ""}
                                  onChange={(e) => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    updated[idx] = {
                                      ...template,
                                      spec: { ...template.spec, dataSourceRef: { ...template.spec?.dataSourceRef, namespace: e.target.value || undefined } },
                                    };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  }}
                                  placeholder="default"
                                  className="input-field text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Selector */}
                          <div>
                            <h6 className="text-xs font-medium text-foreground mb-2">Selector</h6>

                            {/* Match Labels */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-foreground">Match Labels</label>
                                <button
                                  onClick={() => {
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    const selector = { ...template.spec?.selector };
                                    const labels = { ...selector.matchLabels, "": "" };
                                    updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchLabels: labels } } };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  }}
                                  className="text-primary hover:opacity-70 text-xs"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="space-y-1">
                                {Object.entries(template.spec?.selector?.matchLabels || {}).map(([key, val], lIdx) => (
                                  <div key={lIdx} className="flex gap-1">
                                    <input
                                      type="text"
                                      value={key}
                                      onChange={(e) => {
                                        const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                        const selector = { ...template.spec?.selector };
                                        const labels = { ...selector.matchLabels };
                                        delete labels[key];
                                        labels[e.target.value] = val;
                                        updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchLabels: labels } } };
                                        onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                      }}
                                      placeholder="key"
                                      className="input-field text-xs flex-1"
                                    />
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={(e) => {
                                        const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                        const selector = { ...template.spec?.selector };
                                        const labels = { ...selector.matchLabels };
                                        labels[key] = e.target.value;
                                        updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchLabels: labels } } };
                                        onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                      }}
                                      placeholder="value"
                                      className="input-field text-xs flex-1"
                                    />
                                    <button
                                      onClick={() => {
                                        const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                        const selector = { ...template.spec?.selector };
                                        const labels = { ...selector.matchLabels };
                                        delete labels[key];
                                        updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchLabels: Object.keys(labels).length > 0 ? labels : undefined } } };
                                        onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
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
                                    const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                    const selector = { ...template.spec?.selector };
                                    const expressions = [...(selector.matchExpressions || []), { key: "", operator: "In", values: [] }];
                                    updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchExpressions: expressions } } };
                                    onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                  }}
                                  className="text-primary hover:opacity-70 text-xs"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(template.spec?.selector?.matchExpressions || []).map((expr, eIdx) => (
                                  <div key={eIdx} className="p-2 bg-muted/10 rounded border border-border/30 space-y-1">
                                    <div className="grid grid-cols-2 gap-1">
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-0.5">Key</label>
                                        <input
                                          type="text"
                                          value={expr.key}
                                          onChange={(e) => {
                                            const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                            const selector = { ...template.spec?.selector };
                                            const expressions = [...(selector.matchExpressions || [])];
                                            expressions[eIdx] = { ...expr, key: e.target.value };
                                            updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchExpressions: expressions } } };
                                            onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
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
                                            const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                            const selector = { ...template.spec?.selector };
                                            const expressions = [...(selector.matchExpressions || [])];
                                            expressions[eIdx] = { ...expr, operator: e.target.value };
                                            updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchExpressions: expressions } } };
                                            onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
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
                                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                                const selector = { ...template.spec?.selector };
                                                const expressions = [...(selector.matchExpressions || [])];
                                                const values = [...(expr.values || [])];
                                                values[vIdx] = e.target.value;
                                                expressions[eIdx] = { ...expr, values };
                                                updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchExpressions: expressions } } };
                                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                              }}
                                              placeholder="value"
                                              className="input-field text-xs flex-1"
                                            />
                                            <button
                                              onClick={() => {
                                                const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                                const selector = { ...template.spec?.selector };
                                                const expressions = [...(selector.matchExpressions || [])];
                                                const values = (expr.values || []).filter((_, i) => i !== vIdx);
                                                expressions[eIdx] = { ...expr, values };
                                                updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchExpressions: expressions } } };
                                                onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                              }}
                                              className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-xs"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          onClick={() => {
                                            const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                            const selector = { ...template.spec?.selector };
                                            const expressions = [...(selector.matchExpressions || [])];
                                            const values = [...(expr.values || []), ""];
                                            expressions[eIdx] = { ...expr, values };
                                            updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchExpressions: expressions } } };
                                            onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
                                          }}
                                          className="text-primary hover:opacity-70 text-xs"
                                        >
                                          + Add Value
                                        </button>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const updated = [...(config.spec?.volumeClaimTemplates || [])];
                                        const selector = { ...template.spec?.selector };
                                        const expressions = (selector.matchExpressions || []).filter((_, i) => i !== eIdx);
                                        updated[idx] = { ...template, spec: { ...template.spec, selector: { ...selector, matchExpressions: expressions.length > 0 ? expressions : undefined } } };
                                        onConfigChange("spec", { ...config.spec, volumeClaimTemplates: updated });
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

                        <button
                          onClick={() => {
                            onConfigChange(
                              "spec",
                              {
                                ...config.spec,
                                volumeClaimTemplates: (config.spec?.volumeClaimTemplates || []).filter((_, i) => i !== idx),
                              }
                            );
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Remove Template
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2 text-center">No templates added yet</p>
                )}
              </div>
            </div>
          )}

          {/* Template Section Content */}
          {expandedSections.has(section.id) && section.id === "template" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              <PodConfiguration
                config={config.template || {}}
                onConfigChange={(key, value) => {
                  onConfigChange("template", {
                    ...config.template,
                    [key]: value,
                  });
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
