import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

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

interface ResourceConfig {
  id: string;
  name?: string;
  type: "Service" | "HTTPRoute" | "GRPCRoute" | "Gateway" | "NetworkPolicy" | "StorageClass" | "PersistentVolume" | "PersistentVolumeClaim" | "VolumeAttributesClass" | "ConfigMap" | "Secret" | "LimitRange" | "RuntimeClass";
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  deletionGracePeriodSeconds?: number;
  ownerReferences?: OwnerReference[];
  data?: Record<string, any>;
  spec?: ServiceSpec;
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

              {/* Deletion Grace Period in Seconds */}
              <div className="border-t border-border pt-4">
                <label htmlFor="deletionGracePeriod" className="block text-sm font-medium text-foreground mb-2">
                  Deletion Grace Period (Seconds)
                </label>
                <input
                  id="deletionGracePeriod"
                  type="number"
                  value={config.deletionGracePeriodSeconds || ""}
                  onChange={(e) => {
                    onConfigChange(
                      "deletionGracePeriodSeconds",
                      e.target.value ? parseInt(e.target.value) : undefined
                    );
                  }}
                  placeholder="30"
                  min="0"
                  className="input-field"
                />
                <p className="text-xs text-foreground/50 mt-1">Grace period in seconds for graceful deletion</p>
              </div>

              {/* Owner References */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Owner References</label>
                  <button
                    onClick={() => {
                      const ownerRefs = config.ownerReferences || [];
                      onConfigChange("ownerReferences", [
                        ...ownerRefs,
                        { apiVersion: "v1", kind: "", name: "" },
                      ]);
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Reference
                  </button>
                </div>

                {(config.ownerReferences && config.ownerReferences.length > 0) ? (
                  <div className="space-y-3">
                    {config.ownerReferences.map((ref, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">API Version</label>
                            <input
                              type="text"
                              value={ref.apiVersion || ""}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...ref, apiVersion: e.target.value || undefined };
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
                              value={ref.kind || ""}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...ref, kind: e.target.value || undefined };
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
                              value={ref.name || ""}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...ref, name: e.target.value || undefined };
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
                              value={ref.uid || ""}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...ref, uid: e.target.value || undefined };
                                onConfigChange("ownerReferences", updated);
                              }}
                              placeholder="550e8400-e29b-41d4-a716-446655440000"
                              className="input-field text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ref.controller || false}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...ref, controller: e.target.checked || undefined };
                                onConfigChange("ownerReferences", updated);
                              }}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs font-medium text-foreground">Controller</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ref.blockOwnerDeletion || false}
                              onChange={(e) => {
                                const updated = [...(config.ownerReferences || [])];
                                updated[idx] = { ...ref, blockOwnerDeletion: e.target.checked || undefined };
                                onConfigChange("ownerReferences", updated);
                              }}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs font-medium text-foreground">Block Owner Deletion</span>
                          </label>
                        </div>

                        <button
                          onClick={() => {
                            const updated = (config.ownerReferences || []).filter((_, i) => i !== idx);
                            onConfigChange(
                              "ownerReferences",
                              updated.length > 0 ? updated : undefined
                            );
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                        >
                          Remove Reference
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No owner references defined</p>
                )}
                <p className="text-xs text-foreground/50 mt-2">Define ownership relationships for this resource</p>
              </div>
            </div>
          )}

          {/* Service Spec Section */}
          {expandedSections.has(section.id) && section.id === "spec" && config.type === "Service" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              {/* Service Type */}
              <div>
                <label htmlFor="serviceType" className="block text-sm font-medium text-foreground mb-2">
                  Type
                </label>
                <select
                  id="serviceType"
                  value={config.spec?.type || "ClusterIP"}
                  onChange={(e) => {
                    const newType = e.target.value as "ClusterIP" | "NodePort" | "ExternalName";
                    const updatedSpec = { ...(config.spec || {}), type: newType };
                    if (newType === "ExternalName") {
                      updatedSpec.clusterIP = undefined;
                      updatedSpec.clusterIPs = undefined;
                    }
                    onConfigChange("spec", updatedSpec);
                  }}
                  className="input-field"
                >
                  <option value="ClusterIP">ClusterIP</option>
                  <option value="NodePort">NodePort</option>
                  <option value="ExternalName">ExternalName</option>
                </select>
                <p className="text-xs text-foreground/50 mt-1">Service type determines how the service is exposed</p>
              </div>

              {/* ClusterIP - Hidden when Type is ExternalName */}
              {config.spec?.type !== "ExternalName" && (
                <div className="border-t border-border pt-4">
                  <label htmlFor="clusterIP" className="block text-sm font-medium text-foreground mb-2">
                    Cluster IP
                  </label>
                  <input
                    id="clusterIP"
                    type="text"
                    value={config.spec?.clusterIP || ""}
                    onChange={(e) => {
                      onConfigChange("spec", {
                        ...(config.spec || {}),
                        clusterIP: e.target.value || undefined,
                      });
                    }}
                    placeholder="10.0.0.1"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">Virtual IP address assigned to the service</p>
                </div>
              )}

              {/* ClusterIPs - Hidden when Type is ExternalName */}
              {config.spec?.type !== "ExternalName" && (
                <div className="border-t border-border pt-4">
                  <label className="block text-sm font-medium text-foreground mb-3">Cluster IPs</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(config.spec?.clusterIPs || []).map((ip, idx) => (
                      <div
                        key={idx}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {ip}
                        <button
                          onClick={() => {
                            const updated = (config.spec?.clusterIPs || []).filter((_, i) => i !== idx);
                            onConfigChange("spec", {
                              ...config.spec,
                              clusterIPs: updated.length > 0 ? updated : undefined,
                            });
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
                    placeholder="Enter IP address and press Enter (max 2)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const input = e.currentTarget;
                        const newIP = input.value.trim();
                        if (newIP && (config.spec?.clusterIPs?.length ?? 0) < 2) {
                          const updated = [...(config.spec?.clusterIPs || []), newIP];
                          onConfigChange("spec", { ...config.spec, clusterIPs: updated });
                          input.value = "";
                        }
                      }
                    }}
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">Cluster IPs (maximum 2 addresses)</p>
                </div>
              )}

              {/* ExternalName - Only visible when Type is ExternalName */}
              {config.spec?.type === "ExternalName" && (
                <div className="border-t border-border pt-4">
                  <label htmlFor="externalName" className="block text-sm font-medium text-foreground mb-2">
                    External Name
                  </label>
                  <input
                    id="externalName"
                    type="text"
                    value={config.spec?.externalName || ""}
                    onChange={(e) => {
                      onConfigChange("spec", {
                        ...config.spec,
                        externalName: e.target.value || undefined,
                      });
                    }}
                    placeholder="example.com"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">CNAME hostname to point to</p>
                </div>
              )}

              {/* IP Family Policy */}
              <div className="border-t border-border pt-4">
                <label htmlFor="ipFamilyPolicy" className="block text-sm font-medium text-foreground mb-2">
                  IP Family Policy
                </label>
                <input
                  id="ipFamilyPolicy"
                  type="text"
                  value={config.spec?.ipFamilyPolicy || ""}
                  onChange={(e) => {
                    onConfigChange("spec", {
                      ...(config.spec || {}),
                      ipFamilyPolicy: e.target.value || undefined,
                    });
                  }}
                  placeholder="SingleStack, PreferDualStack, RequireDualStack"
                  className="input-field"
                />
                <p className="text-xs text-foreground/50 mt-1">IP family policy for the service</p>
              </div>

              {/* Ports */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Ports</label>
                  <button
                    onClick={() => {
                      const ports = config.spec?.ports || [];
                      onConfigChange("spec", {
                        ...(config.spec || {}),
                        ports: [...ports, { port: 80, protocol: "TCP" }],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Port
                  </button>
                </div>
                <div className="space-y-3">
                  {config.spec?.ports?.map((port, idx) => (
                    <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                          <input
                            type="text"
                            value={port.name || ""}
                            onChange={(e) => {
                              const updated = [...(config.spec?.ports || [])];
                              updated[idx] = { ...port, name: e.target.value || undefined };
                              onConfigChange("spec", { ...(config.spec || {}), ports: updated });
                            }}
                            placeholder="http"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Port*</label>
                          <input
                            type="number"
                            value={port.port}
                            onChange={(e) => {
                              const updated = [...(config.spec?.ports || [])];
                              updated[idx] = { ...port, port: parseInt(e.target.value) || 80 };
                              onConfigChange("spec", { ...(config.spec || {}), ports: updated });
                            }}
                            placeholder="80"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Target Port</label>
                          <input
                            type="text"
                            value={port.targetPort || ""}
                            onChange={(e) => {
                              const updated = [...(config.spec?.ports || [])];
                              const value = e.target.value;
                              updated[idx] = {
                                ...port,
                                targetPort: value ? (isNaN(Number(value)) ? value : parseInt(value)) : undefined,
                              };
                              onConfigChange("spec", { ...(config.spec || {}), ports: updated });
                            }}
                            placeholder="8080"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Protocol</label>
                          <select
                            value={port.protocol || "TCP"}
                            onChange={(e) => {
                              const updated = [...(config.spec?.ports || [])];
                              updated[idx] = { ...port, protocol: e.target.value as "TCP" | "UDP" | "SCTP" };
                              onConfigChange("spec", { ...(config.spec || {}), ports: updated });
                            }}
                            className="input-field text-sm"
                          >
                            <option value="TCP">TCP</option>
                            <option value="UDP">UDP</option>
                            <option value="SCTP">SCTP</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Node Port</label>
                          <input
                            type="number"
                            value={port.nodePort || ""}
                            onChange={(e) => {
                              const updated = [...(config.spec?.ports || [])];
                              updated[idx] = {
                                ...port,
                                nodePort: e.target.value ? parseInt(e.target.value) : undefined,
                              };
                              onConfigChange("spec", { ...(config.spec || {}), ports: updated });
                            }}
                            placeholder="30000"
                            className="input-field text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">App Protocol</label>
                        <input
                          type="text"
                          value={port.appProtocol || ""}
                          onChange={(e) => {
                            const updated = [...(config.spec?.ports || [])];
                            updated[idx] = { ...port, appProtocol: e.target.value || undefined };
                            onConfigChange("spec", { ...config.spec, ports: updated });
                          }}
                          placeholder="http, https, grpc"
                          className="input-field text-sm"
                        />
                      </div>
                      <button
                        onClick={() => {
                          onConfigChange(
                            "spec",
                            {
                              ...config.spec,
                              ports: config.spec?.ports?.filter((_, i) => i !== idx),
                            }
                          );
                        }}
                        className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                      >
                        Remove Port
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publish Not Ready Addresses */}
              <div className="border-t border-border pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.spec?.publishNotReadyAddresses || false}
                    onChange={(e) => {
                      onConfigChange("spec", {
                        ...(config.spec || {}),
                        publishNotReadyAddresses: e.target.checked || undefined,
                      });
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground">Publish Not Ready Addresses</span>
                </label>
                <p className="text-xs text-foreground/50 mt-1 ml-7">Publish service endpoints even if not ready</p>
              </div>

              {/* Selector */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">Selector</label>
                {renderTagsField(
                  config.spec?.selector,
                  (value) => onConfigChange("spec", { ...(config.spec || {}), selector: value }),
                  "Selector",
                  "Add selector (key=value)"
                )}
                <p className="text-xs text-foreground/50 mt-1">Labels to select pods for the service</p>
              </div>

              {/* Session Affinity */}
              <div className="border-t border-border pt-4">
                <label htmlFor="sessionAffinity" className="block text-sm font-medium text-foreground mb-2">
                  Session Affinity
                </label>
                <select
                  id="sessionAffinity"
                  value={config.spec?.sessionAffinity || "None"}
                  onChange={(e) => {
                    onConfigChange("spec", {
                      ...(config.spec || {}),
                      sessionAffinity: e.target.value as "ClientIP" | "None",
                    });
                  }}
                  className="input-field"
                >
                  <option value="None">None</option>
                  <option value="ClientIP">ClientIP</option>
                </select>
                <p className="text-xs text-foreground/50 mt-1">Affinity for session persistence</p>
              </div>

              {/* Traffic Distribution */}
              <div className="border-t border-border pt-4">
                <label htmlFor="trafficDistribution" className="block text-sm font-medium text-foreground mb-2">
                  Traffic Distribution
                </label>
                <input
                  id="trafficDistribution"
                  type="text"
                  value={config.spec?.trafficDistribution || ""}
                  onChange={(e) => {
                    onConfigChange("spec", {
                      ...(config.spec || {}),
                      trafficDistribution: e.target.value || undefined,
                    });
                  }}
                  placeholder="PreferClose"
                  className="input-field"
                />
                <p className="text-xs text-foreground/50 mt-1">Traffic distribution policy</p>
              </div>
            </div>
          )}

          {/* Resource-specific sections will be rendered here based on type */}
          {expandedSections.has(section.id) && section.id !== "metadata" && config.type !== "Service" && (
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
