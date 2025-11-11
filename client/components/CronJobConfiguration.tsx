import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import JobConfiguration from "./JobConfiguration";

interface OwnerReference {
  apiVersion?: string;
  blockOwnerDeletion?: boolean;
  controller?: boolean;
  kind?: string;
  name?: string;
  uid?: string;
}

interface PodConfig {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  namespace?: string;
  [key: string]: any;
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
  podFailurePolicy?: any;
  podReplacementPolicy?: string;
  selector?: any;
  ttlSecondsAfterFinished?: number;
}

interface JobTemplateSpec {
  metadata?: {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: JobSpec;
}

interface JobTemplate {
  metadata?: {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: JobTemplateSpec;
}

interface CronJobSpec {
  concurrencyPolicy?: string;
  failedJobsHistoryLimit?: number;
  schedule?: string;
  startingDeadlineSeconds?: number;
  successfulJobsHistoryLimit?: number;
  timeZone?: string;
  jobTemplate?: JobTemplate;
}

interface CronJobConfig {
  annotations?: Record<string, string>;
  deletionGracePeriodSeconds?: number;
  labels?: Record<string, string>;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  spec?: CronJobSpec;
}

interface CronJobConfigurationProps {
  config: CronJobConfig;
  onConfigChange: (key: keyof CronJobConfig, value: any) => void;
  jobConfig?: any;
  onJobConfigChange?: (key: string, value: any) => void;
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
    description: "Configure CronJob metadata including labels, annotations, and namespace",
  },
  {
    id: "spec",
    title: "Spec",
    description: "Configure CronJob specification including schedule, concurrency, and history limits",
  },
  {
    id: "jobTemplate",
    title: "Job Template",
    description: "Configure the Job template that the CronJob will create",
  },
];

export default function CronJobConfiguration({ config, onConfigChange, jobConfig, onJobConfigChange }: CronJobConfigurationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["metadata", "spec", "jobTemplate"]));

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
                <p className="text-xs text-foreground/50 mt-1">Key-value labels for CronJob selection</p>
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

              {/* Namespace */}
              <div className="border-t border-border pt-4">
                <label htmlFor="namespace" className="block text-sm font-medium text-foreground mb-2">
                  Namespace
                </label>
                <input
                  id="namespace"
                  type="text"
                  value={config.namespace || ""}
                  onChange={(e) => onConfigChange("namespace", e.target.value || undefined)}
                  placeholder="default"
                  className="input-field"
                />
                <p className="text-xs text-foreground/50 mt-1">The namespace where the CronJob will be created</p>
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
                <p className="text-xs text-foreground/50 mb-4">Objects this CronJob is owned by</p>

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
                              placeholder="CronJob"
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
                              placeholder="my-cronjob"
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
              {/* Schedule */}
              <div>
                <label htmlFor="schedule" className="block text-sm font-medium text-foreground mb-2">
                  Schedule*
                </label>
                <input
                  id="schedule"
                  type="text"
                  value={config.spec?.schedule || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      schedule: e.target.value || undefined,
                    })
                  }
                  placeholder="0 0 * * *"
                  className="input-field"
                />
                <p className="text-xs text-foreground/50 mt-1">Cron schedule expression (required)</p>
              </div>

              {/* Concurrency Policy */}
              <div className="border-t border-border pt-4">
                <label htmlFor="concurrencyPolicy" className="block text-sm font-medium text-foreground mb-2">
                  Concurrency Policy
                </label>
                <select
                  id="concurrencyPolicy"
                  value={config.spec?.concurrencyPolicy || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      concurrencyPolicy: e.target.value || undefined,
                    })
                  }
                  className="input-field"
                >
                  <option value="">Select policy</option>
                  <option value="Allow">Allow</option>
                  <option value="Forbid">Forbid</option>
                  <option value="Replace">Replace</option>
                </select>
                <p className="text-xs text-foreground/50 mt-1">Policy for handling concurrent job executions</p>
              </div>

              {/* Starting Deadline Seconds */}
              <div className="border-t border-border pt-4">
                <label htmlFor="startingDeadlineSeconds" className="block text-sm font-medium text-foreground mb-2">
                  Starting Deadline Seconds
                </label>
                <input
                  id="startingDeadlineSeconds"
                  type="number"
                  value={config.spec?.startingDeadlineSeconds || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      startingDeadlineSeconds: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="0"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Deadline in seconds for starting the job</p>
              </div>

              {/* Successful Jobs History Limit */}
              <div className="border-t border-border pt-4">
                <label htmlFor="successfulJobsHistoryLimit" className="block text-sm font-medium text-foreground mb-2">
                  Successful Jobs History Limit
                </label>
                <input
                  id="successfulJobsHistoryLimit"
                  type="number"
                  value={config.spec?.successfulJobsHistoryLimit || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      successfulJobsHistoryLimit: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="3"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Number of successful job history to retain</p>
              </div>

              {/* Failed Jobs History Limit */}
              <div className="border-t border-border pt-4">
                <label htmlFor="failedJobsHistoryLimit" className="block text-sm font-medium text-foreground mb-2">
                  Failed Jobs History Limit
                </label>
                <input
                  id="failedJobsHistoryLimit"
                  type="number"
                  value={config.spec?.failedJobsHistoryLimit || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      failedJobsHistoryLimit: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="1"
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">Number of failed job history to retain</p>
              </div>

              {/* Time Zone */}
              <div className="border-t border-border pt-4">
                <label htmlFor="timeZone" className="block text-sm font-medium text-foreground mb-2">
                  Time Zone
                </label>
                <input
                  id="timeZone"
                  type="text"
                  value={config.spec?.timeZone || ""}
                  onChange={(e) =>
                    onConfigChange("spec", {
                      ...config.spec,
                      timeZone: e.target.value || undefined,
                    })
                  }
                  placeholder="UTC"
                  className="input-field"
                />
                <p className="text-xs text-foreground/50 mt-1">Time zone for schedule interpretation (e.g., America/New_York)</p>
              </div>
            </div>
          )}

          {/* Job Template Section Content */}
          {expandedSections.has(section.id) && section.id === "jobTemplate" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              <p className="text-xs text-foreground/60 mb-4">Configure the Job template that will be created by this CronJob</p>
              {jobConfig && onJobConfigChange ? (
                <JobConfiguration
                  config={jobConfig}
                  onConfigChange={(key, value) => {
                    if (onJobConfigChange) {
                      onJobConfigChange(key, value);
                    }
                  }}
                />
              ) : (
                <div className="bg-muted/20 border border-border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-3">Job Template Configuration</p>
                  <div className="text-xs text-foreground/60 space-y-2">
                    <p>Job template configuration will appear here when initialized.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
