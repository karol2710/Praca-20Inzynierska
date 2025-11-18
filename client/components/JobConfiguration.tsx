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

interface PodFailurePolicyRule {
  action?: string;
  onExitCodes?: {
    containerName?: string;
    operator?: string;
    values?: number[];
  };
  onPodConditions?: Array<{
    status?: string;
    type?: string;
  }>;
}

interface PodFailurePolicy {
  rules?: PodFailurePolicyRule[];
}

interface JobSpec {
  activeDeadlineSeconds?: number;
  backoffLimit?: number;
  backoffLimitPerIndex?: number;
  completionMode?: string;
  completions?: number;
  manualSelector?: boolean;
  maxFailedIndexes?: number;
  parallelism?: number;
  podFailurePolicy?: PodFailurePolicy;
  podReplacementPolicy?: string;
  selector?: LabelSelector;
  ttlSecondsAfterFinished?: number;
}

interface JobConfig {
  annotations?: Record<string, string>;
  deletionGracePeriodSeconds?: number;
  labels?: Record<string, string>;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  spec?: JobSpec;
  template?: PodConfig;
}

interface JobConfigurationProps {
  config: JobConfig;
  onConfigChange: (key: keyof JobConfig, value: any) => void;
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
    description: "Configure Job metadata including labels, annotations, and namespace",
  },
  {
    id: "spec",
    title: "Spec",
    description: "Configure Job specification including parallelism, completions, and failure policies",
  },
  {
    id: "template",
    title: "Template",
    description: "Configure the Pod template that the Job will use",
  },
];

export default function JobConfiguration({ config, onConfigChange }: JobConfigurationProps) {
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
              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Labels</label>
                {renderTagsField(
                  config.labels,
                  (value) => onConfigChange("labels", value),
                  "Labels",
                  "Add label (key=value)"
                )}
                <p className="text-xs text-foreground/50 mt-1">Key-value labels for Job selection</p>
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
                <p className="text-xs text-foreground/50 mb-4">Objects this Job is owned by</p>

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
                              placeholder="batch/v1"
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
                              placeholder="Job"
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
                              placeholder="my-job"
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
              {/* Active Deadline Seconds */}
              <div>
                <label htmlFor="activeDeadlineSeconds" className="block text-sm font-medium text-foreground mb-2">
                  Active Deadline Seconds
                </label>
                <input
                  id="activeDeadlineSeconds"
                  type="number"
                  value={config.spec?.activeDeadlineSeconds || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      activeDeadlineSeconds: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="3600"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Deadline in seconds for the job to run</p>
              </div>

              {/* Backoff Limit */}
              <div className="border-t border-border pt-4">
                <label htmlFor="backoffLimit" className="block text-sm font-medium text-foreground mb-2">
                  Backoff Limit
                </label>
                <input
                  id="backoffLimit"
                  type="number"
                  value={config.spec?.backoffLimit || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      backoffLimit: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="6"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Number of retries before marking job as failed</p>
              </div>

              {/* Backoff Limit Per Index */}
              <div className="border-t border-border pt-4">
                <label htmlFor="backoffLimitPerIndex" className="block text-sm font-medium text-foreground mb-2">
                  Backoff Limit Per Index
                </label>
                <input
                  id="backoffLimitPerIndex"
                  type="number"
                  value={config.spec?.backoffLimitPerIndex || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      backoffLimitPerIndex: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="3"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Number of retries per index before marking it as failed</p>
              </div>

              {/* Completion Mode */}
              <div className="border-t border-border pt-4">
                <label htmlFor="completionMode" className="block text-sm font-medium text-foreground mb-2">
                  Completion Mode
                </label>
                <select
                  id="completionMode"
                  value={config.spec?.completionMode || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      completionMode: e.target.value || undefined,
                    })
                  }
                  className="input-field"
                >
                  <option value="">Select completion mode</option>
                  <option value="NonIndexed">NonIndexed (default)</option>
                  <option value="Indexed">Indexed</option>
                </select>
                <p className="text-xs text-foreground/50 mt-1">Mode for tracking job completions</p>
              </div>

              {/* Completions */}
              <div className="border-t border-border pt-4">
                <label htmlFor="completions" className="block text-sm font-medium text-foreground mb-2">
                  Completions
                </label>
                <input
                  id="completions"
                  type="number"
                  value={config.spec?.completions || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      completions: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="1"
                  className="input-field"
                  min="1"
                />
                <p className="text-xs text-foreground/50 mt-1">Number of pods that must complete successfully</p>
              </div>

              {/* Parallelism */}
              <div className="border-t border-border pt-4">
                <label htmlFor="parallelism" className="block text-sm font-medium text-foreground mb-2">
                  Parallelism
                </label>
                <input
                  id="parallelism"
                  type="number"
                  value={config.spec?.parallelism || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      parallelism: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="1"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Maximum number of pods to run in parallel</p>
              </div>

              {/* Manual Selector */}
              <div className="border-t border-border pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.spec?.manualSelector || false}
                    onChange={(e) => {
                      onConfigChange("spec", {
                        ...config.spec,
                        manualSelector: e.target.checked ? true : undefined,
                      });
                    }}
                    className="w-4 h-4 rounded border-border bg-input cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground">Manual Selector</span>
                </label>
                <p className="text-xs text-foreground/50 mt-1">Allow manual pod selector specification</p>
              </div>

              {/* Max Failed Indexes */}
              <div className="border-t border-border pt-4">
                <label htmlFor="maxFailedIndexes" className="block text-sm font-medium text-foreground mb-2">
                  Max Failed Indexes
                </label>
                <input
                  id="maxFailedIndexes"
                  type="number"
                  value={config.spec?.maxFailedIndexes || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      maxFailedIndexes: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="0"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Maximum number of failed indexes in indexed jobs</p>
              </div>

              {/* Pod Replacement Policy */}
              <div className="border-t border-border pt-4">
                <label htmlFor="podReplacementPolicy" className="block text-sm font-medium text-foreground mb-2">
                  Pod Replacement Policy
                </label>
                <select
                  id="podReplacementPolicy"
                  value={config.spec?.podReplacementPolicy || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      podReplacementPolicy: e.target.value || undefined,
                    })
                  }
                  className="input-field"
                >
                  <option value="">Select policy</option>
                  <option value="TerminatingOrFailed">TerminatingOrFailed</option>
                  <option value="Failed">Failed</option>
                </select>
                <p className="text-xs text-foreground/50 mt-1">Policy for replacing failed pods</p>
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

              {/* TTL Seconds After Finished */}
              <div className="border-t border-border pt-4">
                <label htmlFor="ttlSecondsAfterFinished" className="block text-sm font-medium text-foreground mb-2">
                  TTL Seconds After Finished
                </label>
                <input
                  id="ttlSecondsAfterFinished"
                  type="number"
                  value={config.spec?.ttlSecondsAfterFinished || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      ttlSecondsAfterFinished: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="3600"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Seconds after which a finished job is deleted automatically</p>
              </div>

              {/* Pod Failure Policy */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-foreground">Pod Failure Policy</label>
                  <button
                    onClick={() => {
                      const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                      rules.push({
                        action: "Ignore",
                        onExitCodes: undefined,
                        onPodConditions: undefined,
                      });
                      onConfigChange("spec", {
                        ...config.spec,
                        podFailurePolicy: { rules },
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Rule
                  </button>
                </div>
                <p className="text-xs text-foreground/50 mb-4">Rules for handling pod failures</p>

                {(config.spec?.podFailurePolicy?.rules || []).length > 0 ? (
                  <div className="space-y-4">
                    {(config.spec?.podFailurePolicy?.rules || []).map((rule, rIdx) => (
                      <div key={rIdx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-4">
                        {/* Action */}
                        <div>
                          <label htmlFor={`action-${rIdx}`} className="block text-xs font-medium text-foreground mb-1">
                            Action*
                          </label>
                          <select
                            id={`action-${rIdx}`}
                            value={rule.action || ""}
                            onChange={(e) => {
                              const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                              rules[rIdx] = { ...rule, action: e.target.value || undefined };
                              onConfigChange("spec", {
                                ...config.spec,
                                podFailurePolicy: { rules },
                              });
                            }}
                            className="input-field text-xs"
                          >
                            <option value="">Select action</option>
                            <option value="Ignore">Ignore</option>
                            <option value="Count">Count</option>
                            <option value="FailJob">FailJob</option>
                          </select>
                        </div>

                        {/* On Exit Codes */}
                        <div className="bg-muted/10 rounded-lg p-3 space-y-3">
                          <h6 className="text-xs font-medium text-foreground">On Exit Codes</h6>

                          <div>
                            <label htmlFor={`containerName-${rIdx}`} className="block text-xs font-medium text-foreground mb-1">
                              Container Name
                            </label>
                            <input
                              id={`containerName-${rIdx}`}
                              type="text"
                              value={rule.onExitCodes?.containerName || ""}
                              onChange={(e) => {
                                const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                rules[rIdx] = {
                                  ...rule,
                                  onExitCodes: {
                                    ...rule.onExitCodes,
                                    containerName: e.target.value || undefined,
                                  },
                                };
                                onConfigChange("spec", {
                                  ...config.spec,
                                  podFailurePolicy: { rules },
                                });
                              }}
                              placeholder="container-name"
                              className="input-field text-xs"
                            />
                          </div>

                          <div>
                            <label htmlFor={`operator-${rIdx}`} className="block text-xs font-medium text-foreground mb-1">
                              Operator
                            </label>
                            <select
                              id={`operator-${rIdx}`}
                              value={rule.onExitCodes?.operator || ""}
                              onChange={(e) => {
                                const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                rules[rIdx] = {
                                  ...rule,
                                  onExitCodes: {
                                    ...rule.onExitCodes,
                                    operator: e.target.value || undefined,
                                  },
                                };
                                onConfigChange("spec", {
                                  ...config.spec,
                                  podFailurePolicy: { rules },
                                });
                              }}
                              className="input-field text-xs"
                            >
                              <option value="">Select operator</option>
                              <option value="In">In</option>
                              <option value="NotIn">NotIn</option>
                            </select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-medium text-foreground">Exit Code Values</label>
                              <button
                                onClick={() => {
                                  const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                  const values = [...(rule.onExitCodes?.values || []), 0];
                                  rules[rIdx] = {
                                    ...rule,
                                    onExitCodes: {
                                      ...rule.onExitCodes,
                                      values,
                                    },
                                  };
                                  onConfigChange("spec", {
                                    ...config.spec,
                                    podFailurePolicy: { rules },
                                  });
                                }}
                                className="text-primary hover:opacity-70 text-xs"
                              >
                                + Add
                              </button>
                            </div>
                            <div className="space-y-1">
                              {(rule.onExitCodes?.values || []).map((val, vIdx) => (
                                <div key={vIdx} className="flex gap-1">
                                  <input
                                    type="number"
                                    value={val}
                                    onChange={(e) => {
                                      const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                      const values = [...(rule.onExitCodes?.values || [])];
                                      values[vIdx] = parseInt(e.target.value) || 0;
                                      rules[rIdx] = {
                                        ...rule,
                                        onExitCodes: {
                                          ...rule.onExitCodes,
                                          values,
                                        },
                                      };
                                      onConfigChange("spec", {
                                        ...config.spec,
                                        podFailurePolicy: { rules },
                                      });
                                    }}
                                    placeholder="0"
                                    className="input-field text-xs flex-1"
                                  />
                                  <button
                                    onClick={() => {
                                      const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                      const values = (rule.onExitCodes?.values || []).filter((_, i) => i !== vIdx);
                                      rules[rIdx] = {
                                        ...rule,
                                        onExitCodes: {
                                          ...rule.onExitCodes,
                                          values,
                                        },
                                      };
                                      onConfigChange("spec", {
                                        ...config.spec,
                                        podFailurePolicy: { rules },
                                      });
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

                        {/* On Pod Conditions */}
                        <div className="bg-muted/10 rounded-lg p-3 space-y-3">
                          <h6 className="text-xs font-medium text-foreground">On Pod Conditions</h6>

                          {(rule.onPodConditions || []).length > 0 ? (
                            <div className="space-y-2">
                              {(rule.onPodConditions || []).map((condition, cIdx) => (
                                <div key={cIdx} className="p-2 bg-muted/20 border border-border rounded space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-0.5">Type*</label>
                                      <input
                                        type="text"
                                        value={condition.type || ""}
                                        onChange={(e) => {
                                          const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                          const conditions = [...(rule.onPodConditions || [])];
                                          conditions[cIdx] = { ...condition, type: e.target.value || undefined };
                                          rules[rIdx] = { ...rule, onPodConditions: conditions };
                                          onConfigChange("spec", {
                                            ...config.spec,
                                            podFailurePolicy: { rules },
                                          });
                                        }}
                                        placeholder="Ready"
                                        className="input-field text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-0.5">Status*</label>
                                      <select
                                        value={condition.status || ""}
                                        onChange={(e) => {
                                          const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                          const conditions = [...(rule.onPodConditions || [])];
                                          conditions[cIdx] = { ...condition, status: e.target.value || undefined };
                                          rules[rIdx] = { ...rule, onPodConditions: conditions };
                                          onConfigChange("spec", {
                                            ...config.spec,
                                            podFailurePolicy: { rules },
                                          });
                                        }}
                                        className="input-field text-xs"
                                      >
                                        <option value="">Select status</option>
                                        <option value="True">True</option>
                                        <option value="False">False</option>
                                      </select>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                      const conditions = (rule.onPodConditions || []).filter((_, i) => i !== cIdx);
                                      rules[rIdx] = { ...rule, onPodConditions: conditions };
                                      onConfigChange("spec", {
                                        ...config.spec,
                                        podFailurePolicy: { rules },
                                      });
                                    }}
                                    className="w-full text-xs text-destructive hover:bg-destructive/10 py-0.5 rounded transition-colors flex items-center justify-center gap-1"
                                  >
                                    <X className="w-3 h-3" />
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                  const conditions = [...(rule.onPodConditions || []), { type: "", status: "" }];
                                  rules[rIdx] = { ...rule, onPodConditions: conditions };
                                  onConfigChange("spec", {
                                    ...config.spec,
                                    podFailurePolicy: { rules },
                                  });
                                }}
                                className="w-full text-xs text-primary hover:bg-primary/10 py-1 rounded transition-colors"
                              >
                                + Add Condition
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const rules = [...(config.spec?.podFailurePolicy?.rules || [])];
                                rules[rIdx] = { ...rule, onPodConditions: [{ type: "", status: "" }] };
                                onConfigChange("spec", {
                                  ...config.spec,
                                  podFailurePolicy: { rules },
                                });
                              }}
                              className="w-full text-xs text-primary hover:bg-primary/10 py-1 rounded transition-colors"
                            >
                              + Add Condition
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            const rules = (config.spec?.podFailurePolicy?.rules || []).filter((_, i) => i !== rIdx);
                            onConfigChange("spec", {
                              ...config.spec,
                              podFailurePolicy: { rules },
                            });
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Remove Rule
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2 text-center">No rules added yet</p>
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
