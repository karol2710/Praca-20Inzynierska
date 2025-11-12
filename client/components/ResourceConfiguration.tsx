import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface ResourceConfig {
  id: string;
  name?: string;
  type: "Service" | "HTTPRoute" | "GRPCRoute" | "Gateway" | "NetworkPolicy" | "StorageClass" | "PersistentVolume" | "PersistentVolumeClaim" | "VolumeAttributesClass" | "ConfigMap" | "Secret" | "LimitRange" | "RuntimeClass";
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  data?: Record<string, any>;
}

interface ResourceConfigurationProps {
  config: ResourceConfig;
  onConfigChange: (key: keyof ResourceConfig, value: any) => void;
}

const configSections: { [key: string]: { id: string; title: string; description: string }[] } = {
  Service: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure Service metadata including name, labels, and annotations",
    },
    {
      id: "spec",
      title: "Spec",
      description: "Configure Service specification including type, ports, and selectors",
    },
  ],
  HTTPRoute: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure HTTPRoute metadata",
    },
    {
      id: "spec",
      title: "Spec",
      description: "Configure HTTPRoute specification",
    },
  ],
  GRPCRoute: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure GRPCRoute metadata",
    },
    {
      id: "spec",
      title: "Spec",
      description: "Configure GRPCRoute specification",
    },
  ],
  Gateway: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure Gateway metadata",
    },
    {
      id: "spec",
      title: "Spec",
      description: "Configure Gateway specification",
    },
  ],
  NetworkPolicy: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure NetworkPolicy metadata",
    },
    {
      id: "spec",
      title: "Spec",
      description: "Configure NetworkPolicy specification",
    },
  ],
  StorageClass: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure StorageClass metadata",
    },
    {
      id: "provisioner",
      title: "Provisioner",
      description: "Configure provisioner and parameters",
    },
  ],
  PersistentVolume: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure PersistentVolume metadata",
    },
    {
      id: "spec",
      title: "Spec",
      description: "Configure PersistentVolume specification",
    },
  ],
  PersistentVolumeClaim: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure PersistentVolumeClaim metadata",
    },
    {
      id: "spec",
      title: "Spec",
      description: "Configure PersistentVolumeClaim specification",
    },
  ],
  VolumeAttributesClass: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure VolumeAttributesClass metadata",
    },
    {
      id: "driverName",
      title: "Driver Name",
      description: "Configure driver and parameters",
    },
  ],
  ConfigMap: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure ConfigMap metadata",
    },
    {
      id: "data",
      title: "Data",
      description: "Configure key-value data",
    },
  ],
  Secret: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure Secret metadata",
    },
    {
      id: "data",
      title: "Data",
      description: "Configure secret data",
    },
  ],
  LimitRange: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure LimitRange metadata",
    },
    {
      id: "limits",
      title: "Limits",
      description: "Configure resource limits",
    },
  ],
  RuntimeClass: [
    {
      id: "metadata",
      title: "Metadata",
      description: "Configure RuntimeClass metadata",
    },
    {
      id: "handler",
      title: "Handler",
      description: "Configure runtime handler and scheduling",
    },
  ],
};

export default function ResourceConfiguration({ config, onConfigChange }: ResourceConfigurationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["metadata"]));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const sections = configSections[config.type] || [];

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
      {sections.map((section) => (
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

          {/* Metadata Section */}
          {expandedSections.has(section.id) && section.id === "metadata" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              {/* Resource Name */}
              <div>
                <label htmlFor="resourceName" className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  id="resourceName"
                  type="text"
                  value={config.name || ""}
                  onChange={(e) => onConfigChange("name", e.target.value || undefined)}
                  placeholder="e.g., my-service"
                  className="input-field"
                />
                <p className="text-xs text-foreground/50 mt-1">Resource name</p>
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
                <p className="text-xs text-foreground/50 mt-1">Kubernetes namespace</p>
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
                <p className="text-xs text-foreground/50 mt-1">Key-value labels for resource selection</p>
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
                <p className="text-xs text-foreground/50 mt-1">Resource annotations</p>
              </div>
            </div>
          )}

          {/* Resource-specific sections will be rendered here based on type */}
          {expandedSections.has(section.id) && section.id !== "metadata" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              <div className="bg-muted/20 border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-3">{section.title}</p>
                <div className="text-xs text-foreground/60">
                  <p>{config.type} {section.title} configuration section (to be configured)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
