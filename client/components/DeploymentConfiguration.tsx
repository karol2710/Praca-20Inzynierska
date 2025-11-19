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

interface RollingUpdateStrategy {
  maxSurge?: string;
  maxUnavailable?: string;
}

interface DeploymentStrategy {
  type?: string;
  rollingUpdate?: RollingUpdateStrategy;
}

interface DeploymentSpec {
  replicas?: number;
  minReadySeconds?: number;
  progressDeadlineSeconds?: number;
  revisionHistoryLimit?: number;
  selector?: LabelSelector;
  strategy?: DeploymentStrategy;
}

interface PodConfig {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  namespace?: string;
  [key: string]: any;
}

interface DeploymentConfig {
  annotations?: Record<string, string>;
  deletionGracePeriodSeconds?: number;
  labels?: Record<string, string>;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  spec?: DeploymentSpec;
  template?: PodConfig;
}

interface DeploymentConfigurationProps {
  config: DeploymentConfig;
  onConfigChange: (key: keyof DeploymentConfig, value: any) => void;
  globalNamespace?: string;
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
    description: "Configure deployment metadata including labels, annotations, and namespace",
  },
  {
    id: "spec",
    title: "Spec",
    description: "Configure deployment specification including strategy, selector, and timing parameters",
  },
  {
    id: "template",
    title: "Template",
    description: "Configure the Pod template that the deployment will use",
  },
];

export default function DeploymentConfiguration({ config, onConfigChange }: DeploymentConfigurationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["metadata", "spec"]));

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
                ×
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
              {/* Namespace */}
              <div>
                <label htmlFor="namespace" className="block text-sm font-medium text-foreground mb-2">
                  Namespace
                </label>
                <input
                  id="namespace"
                  type="text"
                  value={globalNamespace || ""}
                  disabled
                  placeholder="default"
                  className="input-field bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-foreground/50 mt-1">Set in Global Configuration</p>
              </div>

              {/* Labels */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">Labels</label>
                {renderTagsField(
                  config.labels,
                  (value) => onConfigChange("labels", value),
                  "Labels",
                  "Add label (key=value)"
                )}
                <p className="text-xs text-foreground/50 mt-1">Key-value labels for deployment selection</p>
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
                <p className="text-xs text-foreground/50 mb-4">Objects this deployment is owned by</p>

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
                              placeholder="v1"
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
                              placeholder="Pod"
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
                              placeholder="my-pod"
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

              {/* Progress Deadline Seconds */}
              <div className="border-t border-border pt-4">
                <label htmlFor="progressDeadlineSeconds" className="block text-sm font-medium text-foreground mb-2">
                  Progress Deadline (seconds)
                </label>
                <input
                  id="progressDeadlineSeconds"
                  type="number"
                  value={config.spec?.progressDeadlineSeconds || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      progressDeadlineSeconds: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="600"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Maximum time in seconds for a deployment to make progress</p>
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
                <p className="text-xs text-foreground/50 mt-1">The number of old ReplicaSets to retain to allow rollback</p>
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

              {/* Strategy */}
              <div className="border-t border-border pt-4">
                <h5 className="text-sm font-medium text-foreground mb-3">Strategy</h5>

                {/* Strategy Type */}
                <div className="mb-3">
                  <label htmlFor="strategyType" className="block text-xs font-medium text-foreground mb-1">
                    Type
                  </label>
                  <select
                    id="strategyType"
                    value={config.spec?.strategy?.type || ""}
                    onChange={(e) =>
                      onConfigChange("spec", {
                        ...config.spec,
                        strategy: { ...config.spec?.strategy, type: e.target.value || undefined },
                      })
                    }
                    className="input-field"
                  >
                    <option value="">Select strategy type</option>
                    <option value="RollingUpdate">RollingUpdate</option>
                    <option value="Recreate">Recreate</option>
                  </select>
                  <p className="text-xs text-foreground/50 mt-1">Strategy for replacing old pods with new ones</p>
                </div>

                {/* Rolling Update */}
                {config.spec?.strategy?.type === "RollingUpdate" && (
                  <div className="p-3 bg-muted/5 rounded border border-border/30 space-y-2">
                    <h6 className="text-xs font-medium text-foreground">Rolling Update</h6>

                    <div>
                      <label htmlFor="maxSurge" className="block text-xs font-medium text-foreground mb-1">
                        Max Surge
                      </label>
                      <input
                        id="maxSurge"
                        type="text"
                        value={config.spec?.strategy?.rollingUpdate?.maxSurge || ""}
                        onChange={(e) =>
                          onConfigChange("spec", {
                            ...config.spec,
                            strategy: {
                              ...config.spec?.strategy,
                              rollingUpdate: {
                                ...config.spec?.strategy?.rollingUpdate,
                                maxSurge: e.target.value || undefined,
                              },
                            },
                          })
                        }
                        placeholder="25% or 1"
                        className="input-field text-xs"
                      />
                      <p className="text-xs text-foreground/50 mt-0.5">Maximum number/percentage of pods that can be created over the desired number</p>
                    </div>

                    <div>
                      <label htmlFor="maxUnavailable" className="block text-xs font-medium text-foreground mb-1">
                        Max Unavailable
                      </label>
                      <input
                        id="maxUnavailable"
                        type="text"
                        value={config.spec?.strategy?.rollingUpdate?.maxUnavailable || ""}
                        onChange={(e) =>
                          onConfigChange("spec", {
                            ...config.spec,
                            strategy: {
                              ...config.spec?.strategy,
                              rollingUpdate: {
                                ...config.spec?.strategy?.rollingUpdate,
                                maxUnavailable: e.target.value || undefined,
                              },
                            },
                          })
                        }
                        placeholder="25% or 0"
                        className="input-field text-xs"
                      />
                      <p className="text-xs text-foreground/50 mt-0.5">Maximum number/percentage of pods that can be unavailable during the update</p>
                    </div>
                  </div>
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
                isTemplate={true}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
