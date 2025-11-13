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

interface HTTPRouteMatch {
  path?: { type?: string; value?: string };
  headers?: { name?: string; value?: string }[];
  queryParams?: { name?: string; value?: string }[];
  method?: string;
}

interface HTTPRouteRule {
  sectionName?: string;
  matches?: HTTPRouteMatch[];
  backendRefs?: HTTPRouteBackendRef[];
  filters?: HTTPRouteFilter[];
  timeouts?: HTTPRouteTimeout;
}

interface HTTPRouteBackendRef {
  name?: string;
  namespace?: string;
  port?: number;
  weight?: number;
  group?: string;
  kind?: string;
  filters?: HTTPRouteFilter[];
}

interface HTTPRouteFilter {
  type: "RequestHeaderModifier" | "ResponseHeaderModifier" | "RequestMirror" | "RequestRedirect" | "URLRewrite";
  requestHeaderModifier?: { set?: Record<string, string>; add?: Record<string, string>; remove?: string[] };
  responseHeaderModifier?: { set?: Record<string, string>; add?: Record<string, string>; remove?: string[] };
  requestMirror?: { backendRef: { name?: string; namespace?: string; port?: number }; percent?: number; fraction?: { numerator?: number; denominator?: string } };
  requestRedirect?: { scheme?: string; hostname?: string; path?: { type?: string; value?: string }; port?: number; statusCode?: number };
  urlRewrite?: { hostname?: string; path?: { type?: string; value?: string } };
}

interface HTTPRouteTimeout {
  requestDuration?: string;
  backendRequestDuration?: string;
}

interface HTTPRouteParentReference {
  name?: string;
  namespace?: string;
  kind?: string;
  group?: string;
  sectionName?: string;
  port?: number;
}

interface HTTPRouteSpec {
  parentReferences?: HTTPRouteParentReference[];
  hostnames?: string[];
  rules?: HTTPRouteRule[];
  timeouts?: HTTPRouteTimeout;
}

interface GRPCRouteMethod {
  type?: string;
  service?: string;
  method?: string;
}

interface GRPCRouteHeader {
  type?: string;
  name?: string;
  value?: string;
}

interface GRPCRouteMatch {
  method?: GRPCRouteMethod;
  headers?: GRPCRouteHeader[];
}

interface GRPCRouteFilter {
  type: "RequestHeaderModifier" | "ResponseHeaderModifier" | "RequestMirror";
  requestHeaderModifier?: { set?: Record<string, string>; add?: Record<string, string>; remove?: string[] };
  responseHeaderModifier?: { set?: Record<string, string>; add?: Record<string, string>; remove?: string[] };
  requestMirror?: { backendRef: { name?: string; namespace?: string; port?: number }; percent?: number; fraction?: { numerator?: number; denominator?: string } };
}

interface GRPCRouteBackendRef {
  name?: string;
  namespace?: string;
  port?: number;
  weight?: number;
  group?: string;
  kind?: string;
  filters?: GRPCRouteFilter[];
}

interface GRPCRouteRule {
  sectionName?: string;
  matches?: GRPCRouteMatch[];
  filters?: GRPCRouteFilter[];
  backendRefs?: GRPCRouteBackendRef[];
}

interface GRPCRouteSpec {
  parentReferences?: HTTPRouteParentReference[];
  hostnames?: string[];
  rules?: GRPCRouteRule[];
}

interface GatewayListener {
  name?: string;
  hostname?: string;
  port?: number;
  protocol?: string;
  tlsConfig?: {
    mode?: string;
    certificateRef?: {
      name?: string;
      namespace?: string;
      kind?: string;
      group?: string;
    };
    options?: Record<string, string>;
  };
  allowedRoutes?: {
    namespaces?: string[];
    kinds?: string[];
  };
}

interface GatewayAddress {
  addressType?: string; // IPAddress, Hostname, Named Address
  value?: string;
}

interface GatewayInfrastructure {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  parametersRef?: {
    group?: string;
    kind?: string;
    name?: string;
  };
}

interface GatewaySpec {
  gatewayClassName?: string;
  listeners?: GatewayListener[];
  addresses?: GatewayAddress[];
  infrastructure?: GatewayInfrastructure;
}

interface LabelSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: {
    key?: string;
    operator?: string;
    values?: string[];
  }[];
}

interface NetworkPolicyPort {
  protocol?: string;
  port?: number | string;
  endPort?: number;
}

interface NetworkPolicyPeer {
  ipBlock?: {
    cidr?: string;
    except?: string[];
  };
  namespaceSelector?: LabelSelector;
  podSelector?: LabelSelector;
}

interface NetworkPolicyRule {
  ports?: NetworkPolicyPort[];
  peers?: NetworkPolicyPeer[];
}

interface NetworkPolicySpec {
  podSelector?: LabelSelector;
  policyTypes?: string[];
  ingress?: NetworkPolicyRule[];
  egress?: NetworkPolicyRule[];
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
  spec?: ServiceSpec | HTTPRouteSpec | GRPCRouteSpec | GatewaySpec | NetworkPolicySpec | Record<string, any>;
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
      id: "warning",
      title: "Important",
      description: "Important: Gateway should not be configured unless necessary",
    },
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

          {/* Gateway Warning Section */}
          {expandedSections.has(section.id) && section.id === "warning" && config.type === "Gateway" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 font-medium">⚠️ Important: Gateway should not be configured unless necessary</p>
                <p className="text-xs text-amber-800 mt-2">Only configure if you're managing gateway infrastructure for your cluster.</p>
              </div>
            </div>
          )}

          {/* HTTPRoute Spec Section */}
          {expandedSections.has(section.id) && section.id === "spec" && config.type === "HTTPRoute" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              {/* Parent References */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Parent References</label>
                  <button
                    onClick={() => {
                      const parentRefs = (config.spec as HTTPRouteSpec)?.parentReferences || [];
                      onConfigChange("spec", {
                        ...(config.spec as HTTPRouteSpec || {}),
                        parentReferences: [
                          ...parentRefs,
                          { name: "", namespace: "", kind: "", group: "" },
                        ],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Reference
                  </button>
                </div>

                {((config.spec as HTTPRouteSpec)?.parentReferences && (config.spec as HTTPRouteSpec).parentReferences.length > 0) ? (
                  <div className="space-y-3">
                    {((config.spec as HTTPRouteSpec)?.parentReferences || []).map((ref, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Name*</label>
                            <input
                              type="text"
                              value={ref.name || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as HTTPRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, name: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="gateway-name"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Namespace</label>
                            <input
                              type="text"
                              value={ref.namespace || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as HTTPRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, namespace: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="default"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Kind</label>
                            <input
                              type="text"
                              value={ref.kind || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as HTTPRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, kind: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="Gateway"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Group</label>
                            <input
                              type="text"
                              value={ref.group || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as HTTPRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, group: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="gateway.networking.k8s.io"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Section Name</label>
                            <input
                              type="text"
                              value={ref.sectionName || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as HTTPRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, sectionName: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="http"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Port</label>
                            <input
                              type="number"
                              value={ref.port || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as HTTPRouteSpec)?.parentReferences || [])];
                                updated[idx] = {
                                  ...ref,
                                  port: e.target.value ? parseInt(e.target.value) : undefined,
                                };
                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="80"
                              className="input-field text-sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updated = ((config.spec as HTTPRouteSpec)?.parentReferences || []).filter((_, i) => i !== idx);
                            onConfigChange("spec", {
                              ...(config.spec as HTTPRouteSpec || {}),
                              parentReferences: updated.length > 0 ? updated : undefined,
                            });
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                        >
                          Remove Reference
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No parent references defined</p>
                )}
              </div>

              {/* Hostnames */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">Hostnames</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {((config.spec as HTTPRouteSpec)?.hostnames || []).map((hostname, idx) => (
                      <div
                        key={idx}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {hostname}
                        <button
                          onClick={() => {
                            const updated = ((config.spec as HTTPRouteSpec)?.hostnames || []).filter((_, i) => i !== idx);
                            onConfigChange("spec", {
                              ...(config.spec as HTTPRouteSpec || {}),
                              hostnames: updated.length > 0 ? updated : undefined,
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
                    placeholder="example.com (press Enter to add)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const input = e.currentTarget;
                        const newHostname = input.value.trim();
                        if (newHostname) {
                          const updated = [...((config.spec as HTTPRouteSpec)?.hostnames || []), newHostname];
                          onConfigChange("spec", {
                            ...(config.spec as HTTPRouteSpec || {}),
                            hostnames: updated,
                          });
                          input.value = "";
                        }
                      }
                    }}
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50">Hostnames that HTTPRoute should match</p>
                </div>
              </div>

              {/* Rules */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Rules</label>
                  <button
                    onClick={() => {
                      const rules = ((config.spec as HTTPRouteSpec)?.rules || []);
                      onConfigChange("spec", {
                        ...(config.spec as HTTPRouteSpec || {}),
                        rules: [...rules, { matches: [], backendRefs: [], filters: [] }],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Rule
                  </button>
                </div>

                {((config.spec as HTTPRouteSpec)?.rules && (config.spec as HTTPRouteSpec).rules.length > 0) ? (
                  <div className="space-y-3">
                    {((config.spec as HTTPRouteSpec)?.rules || []).map((rule, rIdx) => (
                      <div key={rIdx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-4">
                        <h4 className="font-semibold text-foreground text-sm">Rule {rIdx + 1}</h4>

                        {/* Section Name */}
                        <div className="border-t border-border/50 pt-3">
                          <label className="block text-xs font-medium text-foreground mb-2">Section Name</label>
                          <input
                            type="text"
                            value={rule.sectionName || ""}
                            onChange={(e) => {
                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                              updated[rIdx] = { ...rule, sectionName: e.target.value || undefined };
                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                            }}
                            placeholder="http"
                            className="input-field text-sm"
                          />
                        </div>

                        {/* Matches */}
                        <div className="border-t border-border/50 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Matches</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                updated[rIdx] = {
                                  ...rule,
                                  matches: [...(rule.matches || []), { method: "" }],
                                };
                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Match
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(rule.matches || []).map((match, mIdx) => (
                              <div key={mIdx} className="p-3 bg-muted/10 border border-border/30 rounded-lg space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Path Type</label>
                                    <input
                                      type="text"
                                      value={match.path?.type || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const matches = [...(updated[rIdx]?.matches || [])];
                                        matches[mIdx] = {
                                          ...match,
                                          path: { ...match.path, type: e.target.value || undefined },
                                        };
                                        updated[rIdx] = { ...rule, matches };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="Exact, PathPrefix"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Path Value</label>
                                    <input
                                      type="text"
                                      value={match.path?.value || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const matches = [...(updated[rIdx]?.matches || [])];
                                        matches[mIdx] = {
                                          ...match,
                                          path: { ...match.path, value: e.target.value || undefined },
                                        };
                                        updated[rIdx] = { ...rule, matches };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="/api"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-2">Method</label>
                                  <input
                                    type="text"
                                    value={match.method || ""}
                                    onChange={(e) => {
                                      const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                      const matches = [...(updated[rIdx]?.matches || [])];
                                      matches[mIdx] = { ...match, method: e.target.value || undefined };
                                      updated[rIdx] = { ...rule, matches };
                                      onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                    }}
                                    placeholder="GET, POST, PUT, DELETE"
                                    className="input-field text-xs"
                                  />
                                </div>

                                {/* Headers */}
                                <div className="border-t border-border/30 pt-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-medium text-foreground">Headers</label>
                                    <button
                                      onClick={() => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const matches = [...(updated[rIdx]?.matches || [])];
                                        matches[mIdx] = {
                                          ...match,
                                          headers: [...(match.headers || []), { name: "", value: "" }],
                                        };
                                        updated[rIdx] = { ...rule, matches };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      className="text-primary hover:opacity-70 text-xs"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  {(match.headers || []).map((header, hIdx) => (
                                    <div key={hIdx} className="flex gap-2 items-center mb-2">
                                      <input
                                        type="text"
                                        value={header.name || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const headers = [...(matches[mIdx]?.headers || [])];
                                          headers[hIdx] = { ...header, name: e.target.value || undefined };
                                          matches[mIdx] = { ...match, headers };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="Header name"
                                        className="input-field text-xs flex-1"
                                      />
                                      <input
                                        type="text"
                                        value={header.value || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const headers = [...(matches[mIdx]?.headers || [])];
                                          headers[hIdx] = { ...header, value: e.target.value || undefined };
                                          matches[mIdx] = { ...match, headers };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="Header value"
                                        className="input-field text-xs flex-1"
                                      />
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const headers = (matches[mIdx]?.headers || []).filter((_, i) => i !== hIdx);
                                          matches[mIdx] = {
                                            ...match,
                                            headers: headers.length > 0 ? headers : undefined,
                                          };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-destructive hover:opacity-70 text-xs"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Query Parameters */}
                                <div className="border-t border-border/30 pt-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-medium text-foreground">Query Parameters</label>
                                    <button
                                      onClick={() => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const matches = [...(updated[rIdx]?.matches || [])];
                                        matches[mIdx] = {
                                          ...match,
                                          queryParams: [...(match.queryParams || []), { name: "", value: "" }],
                                        };
                                        updated[rIdx] = { ...rule, matches };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      className="text-primary hover:opacity-70 text-xs"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  {(match.queryParams || []).map((param, pIdx) => (
                                    <div key={pIdx} className="flex gap-2 items-center mb-2">
                                      <input
                                        type="text"
                                        value={param.name || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const queryParams = [...(matches[mIdx]?.queryParams || [])];
                                          queryParams[pIdx] = { ...param, name: e.target.value || undefined };
                                          matches[mIdx] = { ...match, queryParams };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="Param name"
                                        className="input-field text-xs flex-1"
                                      />
                                      <input
                                        type="text"
                                        value={param.value || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const queryParams = [...(matches[mIdx]?.queryParams || [])];
                                          queryParams[pIdx] = { ...param, value: e.target.value || undefined };
                                          matches[mIdx] = { ...match, queryParams };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="Param value"
                                        className="input-field text-xs flex-1"
                                      />
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const queryParams = (matches[mIdx]?.queryParams || []).filter((_, i) => i !== pIdx);
                                          matches[mIdx] = {
                                            ...match,
                                            queryParams: queryParams.length > 0 ? queryParams : undefined,
                                          };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-destructive hover:opacity-70 text-xs"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                    const matches = (updated[rIdx]?.matches || []).filter((_, i) => i !== mIdx);
                                    updated[rIdx] = { ...rule, matches: matches.length > 0 ? matches : undefined };
                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                  }}
                                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                >
                                  Remove Match
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Filters */}
                        <div className="border-t border-border/50 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Filters</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                updated[rIdx] = {
                                  ...rule,
                                  filters: [...(rule.filters || []), { type: "RequestHeaderModifier" }],
                                };
                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Filter
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(rule.filters || []).map((filter, fIdx) => (
                              <div key={fIdx} className="p-3 bg-muted/10 border border-border/30 rounded-lg space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Filter Type</label>
                                  <select
                                    value={filter.type || "RequestHeaderModifier"}
                                    onChange={(e) => {
                                      const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                      const filters = [...(updated[rIdx]?.filters || [])];
                                      filters[fIdx] = { type: e.target.value as HTTPRouteFilter["type"] };
                                      updated[rIdx] = { ...rule, filters };
                                      onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                    }}
                                    className="input-field text-xs"
                                  >
                                    <option value="RequestHeaderModifier">Request Header Modifier</option>
                                    <option value="ResponseHeaderModifier">Response Header Modifier</option>
                                    <option value="RequestMirror">Request Mirror</option>
                                    <option value="RequestRedirect">Request Redirect</option>
                                    <option value="URLRewrite">URL Rewrite</option>
                                  </select>
                                </div>

                                {/* Request Header Modifier */}
                                {filter.type === "RequestHeaderModifier" && (
                                  <div className="space-y-3 border-t border-border/30 pt-2">
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-2">Set Headers</label>
                                      {Object.entries(filter.requestHeaderModifier?.set || {}).map(([key, val], idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.requestHeaderModifier?.set };
                                              if (e.target.value !== key) {
                                                delete set[key];
                                                set[e.target.value] = val;
                                              }
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  set,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.requestHeaderModifier?.set };
                                              set[key] = e.target.value;
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  set,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header value"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.requestHeaderModifier?.set };
                                              delete set[key];
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  set: Object.keys(set).length > 0 ? set : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            requestHeaderModifier: {
                                              ...filter.requestHeaderModifier,
                                              set: { ...filter.requestHeaderModifier?.set, "": "" },
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Set Header
                                      </button>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <label className="block text-xs font-medium text-foreground mb-2">Add Headers</label>
                                      {Object.entries(filter.requestHeaderModifier?.add || {}).map(([key, val], idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.requestHeaderModifier?.add };
                                              if (e.target.value !== key) {
                                                delete add[key];
                                                add[e.target.value] = val;
                                              }
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  add,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.requestHeaderModifier?.add };
                                              add[key] = e.target.value;
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  add,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header value"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.requestHeaderModifier?.add };
                                              delete add[key];
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  add: Object.keys(add).length > 0 ? add : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            requestHeaderModifier: {
                                              ...filter.requestHeaderModifier,
                                              add: { ...filter.requestHeaderModifier?.add, "": "" },
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Header
                                      </button>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <label className="block text-xs font-medium text-foreground mb-2">Remove Headers</label>
                                      {(filter.requestHeaderModifier?.remove || []).map((header, idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={header}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const remove = [...(filters[fIdx]?.requestHeaderModifier?.remove || [])];
                                              remove[idx] = e.target.value;
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  remove,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name to remove"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const remove = (filters[fIdx]?.requestHeaderModifier?.remove || []).filter((_, i) => i !== idx);
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  remove: remove.length > 0 ? remove : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            requestHeaderModifier: {
                                              ...filter.requestHeaderModifier,
                                              remove: [...(filter.requestHeaderModifier?.remove || []), ""],
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Remove Header
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Response Header Modifier */}
                                {filter.type === "ResponseHeaderModifier" && (
                                  <div className="space-y-3 border-t border-border/30 pt-2">
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-2">Set Headers</label>
                                      {Object.entries(filter.responseHeaderModifier?.set || {}).map(([key, val], idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.responseHeaderModifier?.set };
                                              if (e.target.value !== key) {
                                                delete set[key];
                                                set[e.target.value] = val;
                                              }
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  set,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.responseHeaderModifier?.set };
                                              set[key] = e.target.value;
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  set,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header value"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.responseHeaderModifier?.set };
                                              delete set[key];
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  set: Object.keys(set).length > 0 ? set : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            responseHeaderModifier: {
                                              ...filter.responseHeaderModifier,
                                              set: { ...filter.responseHeaderModifier?.set, "": "" },
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Set Header
                                      </button>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <label className="block text-xs font-medium text-foreground mb-2">Add Headers</label>
                                      {Object.entries(filter.responseHeaderModifier?.add || {}).map(([key, val], idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.responseHeaderModifier?.add };
                                              if (e.target.value !== key) {
                                                delete add[key];
                                                add[e.target.value] = val;
                                              }
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  add,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.responseHeaderModifier?.add };
                                              add[key] = e.target.value;
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  add,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header value"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.responseHeaderModifier?.add };
                                              delete add[key];
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  add: Object.keys(add).length > 0 ? add : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            responseHeaderModifier: {
                                              ...filter.responseHeaderModifier,
                                              add: { ...filter.responseHeaderModifier?.add, "": "" },
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Header
                                      </button>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <label className="block text-xs font-medium text-foreground mb-2">Remove Headers</label>
                                      {(filter.responseHeaderModifier?.remove || []).map((header, idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={header}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const remove = [...(filters[fIdx]?.responseHeaderModifier?.remove || [])];
                                              remove[idx] = e.target.value;
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  remove,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name to remove"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const remove = (filters[fIdx]?.responseHeaderModifier?.remove || []).filter((_, i) => i !== idx);
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  remove: remove.length > 0 ? remove : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            responseHeaderModifier: {
                                              ...filter.responseHeaderModifier,
                                              remove: [...(filter.responseHeaderModifier?.remove || []), ""],
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Remove Header
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Request Mirror */}
                                {filter.type === "RequestMirror" && (
                                  <div className="space-y-3 border-t border-border/30 pt-2">
                                    <div>
                                      <p className="text-xs text-foreground/60 mb-2">Backend Reference (required)</p>
                                      <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div>
                                          <label className="block text-xs font-medium text-foreground mb-1">Service Name</label>
                                          <input
                                            type="text"
                                            value={filter.requestMirror?.backendRef?.name || ""}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              filters[fIdx] = {
                                                ...filter,
                                                requestMirror: {
                                                  ...filter.requestMirror,
                                                  backendRef: {
                                                    ...filter.requestMirror?.backendRef,
                                                    name: e.target.value || undefined,
                                                  },
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="service-name"
                                            className="input-field text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-foreground mb-1">Namespace</label>
                                          <input
                                            type="text"
                                            value={filter.requestMirror?.backendRef?.namespace || ""}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              filters[fIdx] = {
                                                ...filter,
                                                requestMirror: {
                                                  ...filter.requestMirror,
                                                  backendRef: {
                                                    ...filter.requestMirror?.backendRef,
                                                    namespace: e.target.value || undefined,
                                                  },
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="default"
                                            className="input-field text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-foreground mb-1">Port</label>
                                          <input
                                            type="number"
                                            value={filter.requestMirror?.backendRef?.port || ""}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              filters[fIdx] = {
                                                ...filter,
                                                requestMirror: {
                                                  ...filter.requestMirror,
                                                  backendRef: {
                                                    ...filter.requestMirror?.backendRef,
                                                    port: e.target.value ? parseInt(e.target.value) : undefined,
                                                  },
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="80"
                                            className="input-field text-xs"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <p className="text-xs text-foreground/60 mb-2">Traffic Mirror Percentage (optional - only one of Percent or Fraction can be specified)</p>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Percent (0-100)</label>
                                        <input
                                          type="number"
                                          value={filter.requestMirror?.percent || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestMirror: {
                                                ...filter.requestMirror,
                                                percent: e.target.value ? parseInt(e.target.value) : undefined,
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="50"
                                          min="0"
                                          max="100"
                                          className="input-field text-xs"
                                        />
                                        <p className="text-xs text-foreground/50 mt-1">Percentage of traffic to mirror (0-100)</p>
                                      </div>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <label className="block text-xs font-medium text-foreground mb-2">Fraction (optional)</label>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs font-medium text-foreground mb-1">Numerator</label>
                                          <input
                                            type="number"
                                            value={filter.requestMirror?.fraction?.numerator || ""}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              filters[fIdx] = {
                                                ...filter,
                                                requestMirror: {
                                                  ...filter.requestMirror,
                                                  fraction: {
                                                    ...filter.requestMirror?.fraction,
                                                    numerator: e.target.value ? parseInt(e.target.value) : undefined,
                                                  },
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="1"
                                            min="0"
                                            className="input-field text-xs"
                                          />
                                          <p className="text-xs text-foreground/50 mt-1">Numerator of fraction</p>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-foreground mb-1">Denominator</label>
                                          <input
                                            type="text"
                                            value={filter.requestMirror?.fraction?.denominator || ""}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              filters[fIdx] = {
                                                ...filter,
                                                requestMirror: {
                                                  ...filter.requestMirror,
                                                  fraction: {
                                                    ...filter.requestMirror?.fraction,
                                                    denominator: e.target.value || undefined,
                                                  },
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="2"
                                            className="input-field text-xs"
                                          />
                                          <p className="text-xs text-foreground/50 mt-1">Denominator of fraction</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Request Redirect */}
                                {filter.type === "RequestRedirect" && (
                                  <div className="space-y-3 border-t border-border/30 pt-2">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Scheme</label>
                                        <input
                                          type="text"
                                          value={filter.requestRedirect?.scheme || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestRedirect: {
                                                ...filter.requestRedirect,
                                                scheme: e.target.value || undefined,
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="https"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Hostname</label>
                                        <input
                                          type="text"
                                          value={filter.requestRedirect?.hostname || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestRedirect: {
                                                ...filter.requestRedirect,
                                                hostname: e.target.value || undefined,
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="example.com"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Path Type</label>
                                        <input
                                          type="text"
                                          value={filter.requestRedirect?.path?.type || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestRedirect: {
                                                ...filter.requestRedirect,
                                                path: {
                                                  ...filter.requestRedirect?.path,
                                                  type: e.target.value || undefined,
                                                },
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="Exact, ReplacePrefixMatch"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Path Value</label>
                                        <input
                                          type="text"
                                          value={filter.requestRedirect?.path?.value || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestRedirect: {
                                                ...filter.requestRedirect,
                                                path: {
                                                  ...filter.requestRedirect?.path,
                                                  value: e.target.value || undefined,
                                                },
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="/new-path"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Port</label>
                                        <input
                                          type="number"
                                          value={filter.requestRedirect?.port || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestRedirect: {
                                                ...filter.requestRedirect,
                                                port: e.target.value ? parseInt(e.target.value) : undefined,
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="8080"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Status Code</label>
                                        <input
                                          type="number"
                                          value={filter.requestRedirect?.statusCode || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestRedirect: {
                                                ...filter.requestRedirect,
                                                statusCode: e.target.value ? parseInt(e.target.value) : undefined,
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="301"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* URL Rewrite */}
                                {filter.type === "URLRewrite" && (
                                  <div className="space-y-3 border-t border-border/30 pt-2">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Hostname</label>
                                        <input
                                          type="text"
                                          value={filter.urlRewrite?.hostname || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              urlRewrite: {
                                                ...filter.urlRewrite,
                                                hostname: e.target.value || undefined,
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="example.com"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Path Type</label>
                                        <input
                                          type="text"
                                          value={filter.urlRewrite?.path?.type || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              urlRewrite: {
                                                ...filter.urlRewrite,
                                                path: {
                                                  ...filter.urlRewrite?.path,
                                                  type: e.target.value || undefined,
                                                },
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="Exact, ReplacePrefixMatch"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <label className="block text-xs font-medium text-foreground mb-1">Path Value</label>
                                        <input
                                          type="text"
                                          value={filter.urlRewrite?.path?.value || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              urlRewrite: {
                                                ...filter.urlRewrite,
                                                path: {
                                                  ...filter.urlRewrite?.path,
                                                  value: e.target.value || undefined,
                                                },
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="/new-path"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                    const filters = (updated[rIdx]?.filters || []).filter((_, i) => i !== fIdx);
                                    updated[rIdx] = { ...rule, filters: filters.length > 0 ? filters : undefined };
                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                  }}
                                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                >
                                  Remove Filter
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Backend Refs */}
                        <div className="border-t border-border/50 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Backend References</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                updated[rIdx] = {
                                  ...rule,
                                  backendRefs: [...(rule.backendRefs || []), { name: "" }],
                                };
                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Backend
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(rule.backendRefs || []).map((backend, bIdx) => (
                              <div key={bIdx} className="p-3 bg-muted/10 border border-border/30 rounded-lg space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={backend.name || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = { ...backend, name: e.target.value || undefined };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="service-name"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Namespace</label>
                                    <input
                                      type="text"
                                      value={backend.namespace || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = { ...backend, namespace: e.target.value || undefined };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="default"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Port</label>
                                    <input
                                      type="number"
                                      value={backend.port || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = {
                                          ...backend,
                                          port: e.target.value ? parseInt(e.target.value) : undefined,
                                        };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="80"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Weight</label>
                                    <input
                                      type="number"
                                      value={backend.weight || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = {
                                          ...backend,
                                          weight: e.target.value ? parseInt(e.target.value) : undefined,
                                        };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="100"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Group</label>
                                    <input
                                      type="text"
                                      value={backend.group || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = { ...backend, group: e.target.value || undefined };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="core"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Kind</label>
                                    <input
                                      type="text"
                                      value={backend.kind || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = { ...backend, kind: e.target.value || undefined };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="Service"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                </div>

                                {/* Backend Filters */}
                                <div className="border-t border-border/30 pt-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-medium text-foreground">Filters</label>
                                    <button
                                      onClick={() => {
                                        const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = {
                                          ...backend,
                                          filters: [...(backend.filters || []), { type: "RequestHeaderModifier" }],
                                        };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                      }}
                                      className="text-primary hover:opacity-70 text-xs"
                                    >
                                      + Add Filter
                                    </button>
                                  </div>
                                  {(backend.filters || []).map((bFilter, bfIdx) => (
                                    <div key={bfIdx} className="p-2 bg-muted/5 border border-border/20 rounded mb-2 space-y-2">
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Filter Type</label>
                                        <select
                                          value={bFilter.type || "RequestHeaderModifier"}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                            const backends = [...(updated[rIdx]?.backendRefs || [])];
                                            const filters = [...(backends[bIdx]?.filters || [])];
                                            filters[bfIdx] = { type: e.target.value as HTTPRouteFilter["type"] };
                                            backends[bIdx] = { ...backend, filters };
                                            updated[rIdx] = { ...rule, backendRefs: backends };
                                            onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                          }}
                                          className="input-field text-xs"
                                        >
                                          <option value="RequestHeaderModifier">Request Header Modifier</option>
                                          <option value="ResponseHeaderModifier">Response Header Modifier</option>
                                          <option value="RequestMirror">Request Mirror</option>
                                          <option value="RequestRedirect">Request Redirect</option>
                                          <option value="URLRewrite">URL Rewrite</option>
                                        </select>
                                      </div>

                                      {/* Request Header Modifier */}
                                      {bFilter.type === "RequestHeaderModifier" && (
                                        <div className="space-y-2 border-t border-border/20 pt-2">
                                          <div>
                                            <label className="block text-xs font-medium text-foreground mb-1">Set Headers</label>
                                            {Object.entries(bFilter.requestHeaderModifier?.set || {}).map(([key, val], idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={key}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.requestHeaderModifier?.set };
                                                    if (e.target.value !== key) {
                                                      delete set[key];
                                                      set[e.target.value] = val;
                                                    }
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      requestHeaderModifier: {
                                                        ...bFilter.requestHeaderModifier,
                                                        set,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <input
                                                  type="text"
                                                  value={val}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.requestHeaderModifier?.set };
                                                    set[key] = e.target.value;
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      requestHeaderModifier: {
                                                        ...bFilter.requestHeaderModifier,
                                                        set,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header value"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.requestHeaderModifier?.set };
                                                    delete set[key];
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      requestHeaderModifier: {
                                                        ...bFilter.requestHeaderModifier,
                                                        set: Object.keys(set).length > 0 ? set : undefined,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestHeaderModifier: {
                                                    ...bFilter.requestHeaderModifier,
                                                    set: { ...bFilter.requestHeaderModifier?.set, "": "" },
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Add Set Header
                                            </button>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <label className="block text-xs font-medium text-foreground mb-1">Add Headers</label>
                                            {Object.entries(bFilter.requestHeaderModifier?.add || {}).map(([key, val], idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={key}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.requestHeaderModifier?.add };
                                                    if (e.target.value !== key) {
                                                      delete add[key];
                                                      add[e.target.value] = val;
                                                    }
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      requestHeaderModifier: {
                                                        ...bFilter.requestHeaderModifier,
                                                        add,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <input
                                                  type="text"
                                                  value={val}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.requestHeaderModifier?.add };
                                                    add[key] = e.target.value;
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      requestHeaderModifier: {
                                                        ...bFilter.requestHeaderModifier,
                                                        add,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header value"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.requestHeaderModifier?.add };
                                                    delete add[key];
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      requestHeaderModifier: {
                                                        ...bFilter.requestHeaderModifier,
                                                        add: Object.keys(add).length > 0 ? add : undefined,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestHeaderModifier: {
                                                    ...bFilter.requestHeaderModifier,
                                                    add: { ...bFilter.requestHeaderModifier?.add, "": "" },
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Add Header
                                            </button>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <label className="block text-xs font-medium text-foreground mb-1">Remove Headers</label>
                                            {(bFilter.requestHeaderModifier?.remove || []).map((header, idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={header}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const remove = [...(filters[bfIdx]?.requestHeaderModifier?.remove || [])];
                                                    remove[idx] = e.target.value;
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      requestHeaderModifier: {
                                                        ...bFilter.requestHeaderModifier,
                                                        remove,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name to remove"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const remove = (filters[bfIdx]?.requestHeaderModifier?.remove || []).filter((_, i) => i !== idx);
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      requestHeaderModifier: {
                                                        ...bFilter.requestHeaderModifier,
                                                        remove: remove.length > 0 ? remove : undefined,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestHeaderModifier: {
                                                    ...bFilter.requestHeaderModifier,
                                                    remove: [...(bFilter.requestHeaderModifier?.remove || []), ""],
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Remove Header
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Response Header Modifier */}
                                      {bFilter.type === "ResponseHeaderModifier" && (
                                        <div className="space-y-2 border-t border-border/20 pt-2">
                                          <div>
                                            <label className="block text-xs font-medium text-foreground mb-1">Set Headers</label>
                                            {Object.entries(bFilter.responseHeaderModifier?.set || {}).map(([key, val], idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={key}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.responseHeaderModifier?.set };
                                                    if (e.target.value !== key) {
                                                      delete set[key];
                                                      set[e.target.value] = val;
                                                    }
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      responseHeaderModifier: {
                                                        ...bFilter.responseHeaderModifier,
                                                        set,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <input
                                                  type="text"
                                                  value={val}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.responseHeaderModifier?.set };
                                                    set[key] = e.target.value;
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      responseHeaderModifier: {
                                                        ...bFilter.responseHeaderModifier,
                                                        set,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header value"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.responseHeaderModifier?.set };
                                                    delete set[key];
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      responseHeaderModifier: {
                                                        ...bFilter.responseHeaderModifier,
                                                        set: Object.keys(set).length > 0 ? set : undefined,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  responseHeaderModifier: {
                                                    ...bFilter.responseHeaderModifier,
                                                    set: { ...bFilter.responseHeaderModifier?.set, "": "" },
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Add Set Header
                                            </button>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <label className="block text-xs font-medium text-foreground mb-1">Add Headers</label>
                                            {Object.entries(bFilter.responseHeaderModifier?.add || {}).map(([key, val], idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={key}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.responseHeaderModifier?.add };
                                                    if (e.target.value !== key) {
                                                      delete add[key];
                                                      add[e.target.value] = val;
                                                    }
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      responseHeaderModifier: {
                                                        ...bFilter.responseHeaderModifier,
                                                        add,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <input
                                                  type="text"
                                                  value={val}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.responseHeaderModifier?.add };
                                                    add[key] = e.target.value;
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      responseHeaderModifier: {
                                                        ...bFilter.responseHeaderModifier,
                                                        add,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header value"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.responseHeaderModifier?.add };
                                                    delete add[key];
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      responseHeaderModifier: {
                                                        ...bFilter.responseHeaderModifier,
                                                        add: Object.keys(add).length > 0 ? add : undefined,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  responseHeaderModifier: {
                                                    ...bFilter.responseHeaderModifier,
                                                    add: { ...bFilter.responseHeaderModifier?.add, "": "" },
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Add Header
                                            </button>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <label className="block text-xs font-medium text-foreground mb-1">Remove Headers</label>
                                            {(bFilter.responseHeaderModifier?.remove || []).map((header, idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={header}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const remove = [...(filters[bfIdx]?.responseHeaderModifier?.remove || [])];
                                                    remove[idx] = e.target.value;
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      responseHeaderModifier: {
                                                        ...bFilter.responseHeaderModifier,
                                                        remove,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name to remove"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const remove = (filters[bfIdx]?.responseHeaderModifier?.remove || []).filter((_, i) => i !== idx);
                                                    filters[bfIdx] = {
                                                      ...bFilter,
                                                      responseHeaderModifier: {
                                                        ...bFilter.responseHeaderModifier,
                                                        remove: remove.length > 0 ? remove : undefined,
                                                      },
                                                    };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  responseHeaderModifier: {
                                                    ...bFilter.responseHeaderModifier,
                                                    remove: [...(bFilter.responseHeaderModifier?.remove || []), ""],
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Remove Header
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Request Mirror */}
                                      {bFilter.type === "RequestMirror" && (
                                        <div className="space-y-2 border-t border-border/20 pt-2">
                                          <div>
                                            <p className="text-xs text-foreground/60 mb-2">Backend Reference (required)</p>
                                            <div className="grid grid-cols-3 gap-2">
                                              <input
                                                type="text"
                                                value={bFilter.requestMirror?.backendRef?.name || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = {
                                                    ...bFilter,
                                                    requestMirror: {
                                                      ...bFilter.requestMirror,
                                                      backendRef: {
                                                        ...bFilter.requestMirror?.backendRef,
                                                        name: e.target.value || undefined,
                                                      },
                                                    },
                                                  };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Service name"
                                                className="input-field text-xs"
                                              />
                                              <input
                                                type="text"
                                                value={bFilter.requestMirror?.backendRef?.namespace || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = {
                                                    ...bFilter,
                                                    requestMirror: {
                                                      ...bFilter.requestMirror,
                                                      backendRef: {
                                                        ...bFilter.requestMirror?.backendRef,
                                                        namespace: e.target.value || undefined,
                                                      },
                                                    },
                                                  };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Namespace"
                                                className="input-field text-xs"
                                              />
                                              <input
                                                type="number"
                                                value={bFilter.requestMirror?.backendRef?.port || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = {
                                                    ...bFilter,
                                                    requestMirror: {
                                                      ...bFilter.requestMirror,
                                                      backendRef: {
                                                        ...bFilter.requestMirror?.backendRef,
                                                        port: e.target.value ? parseInt(e.target.value) : undefined,
                                                      },
                                                    },
                                                  };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Port"
                                                className="input-field text-xs"
                                              />
                                            </div>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <p className="text-xs text-foreground/60 mb-1">Traffic Mirror Percentage (optional)</p>
                                            <input
                                              type="number"
                                              value={bFilter.requestMirror?.percent || ""}
                                              onChange={(e) => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestMirror: {
                                                    ...bFilter.requestMirror,
                                                    percent: e.target.value ? parseInt(e.target.value) : undefined,
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              placeholder="Percent (0-100)"
                                              min="0"
                                              max="100"
                                              className="input-field text-xs"
                                            />
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <p className="text-xs text-foreground/60 mb-1">Fraction (optional)</p>
                                            <div className="grid grid-cols-2 gap-2">
                                              <input
                                                type="number"
                                                value={bFilter.requestMirror?.fraction?.numerator || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = {
                                                    ...bFilter,
                                                    requestMirror: {
                                                      ...bFilter.requestMirror,
                                                      fraction: {
                                                        ...bFilter.requestMirror?.fraction,
                                                        numerator: e.target.value ? parseInt(e.target.value) : undefined,
                                                      },
                                                    },
                                                  };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Numerator"
                                                className="input-field text-xs"
                                              />
                                              <input
                                                type="text"
                                                value={bFilter.requestMirror?.fraction?.denominator || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = {
                                                    ...bFilter,
                                                    requestMirror: {
                                                      ...bFilter.requestMirror,
                                                      fraction: {
                                                        ...bFilter.requestMirror?.fraction,
                                                        denominator: e.target.value || undefined,
                                                      },
                                                    },
                                                  };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Denominator"
                                                className="input-field text-xs"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Request Redirect */}
                                      {bFilter.type === "RequestRedirect" && (
                                        <div className="space-y-2 border-t border-border/20 pt-2">
                                          <div className="grid grid-cols-2 gap-2">
                                            <input
                                              type="text"
                                              value={bFilter.requestRedirect?.scheme || ""}
                                              onChange={(e) => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestRedirect: {
                                                    ...bFilter.requestRedirect,
                                                    scheme: e.target.value || undefined,
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              placeholder="Scheme (https)"
                                              className="input-field text-xs"
                                            />
                                            <input
                                              type="text"
                                              value={bFilter.requestRedirect?.hostname || ""}
                                              onChange={(e) => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestRedirect: {
                                                    ...bFilter.requestRedirect,
                                                    hostname: e.target.value || undefined,
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              placeholder="Hostname (example.com)"
                                              className="input-field text-xs"
                                            />
                                            <input
                                              type="text"
                                              value={bFilter.requestRedirect?.path?.type || ""}
                                              onChange={(e) => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestRedirect: {
                                                    ...bFilter.requestRedirect,
                                                    path: {
                                                      ...bFilter.requestRedirect?.path,
                                                      type: e.target.value || undefined,
                                                    },
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              placeholder="Path Type"
                                              className="input-field text-xs"
                                            />
                                            <input
                                              type="text"
                                              value={bFilter.requestRedirect?.path?.value || ""}
                                              onChange={(e) => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestRedirect: {
                                                    ...bFilter.requestRedirect,
                                                    path: {
                                                      ...bFilter.requestRedirect?.path,
                                                      value: e.target.value || undefined,
                                                    },
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              placeholder="Path Value"
                                              className="input-field text-xs"
                                            />
                                            <input
                                              type="number"
                                              value={bFilter.requestRedirect?.port || ""}
                                              onChange={(e) => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestRedirect: {
                                                    ...bFilter.requestRedirect,
                                                    port: e.target.value ? parseInt(e.target.value) : undefined,
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              placeholder="Port (8080)"
                                              className="input-field text-xs"
                                            />
                                            <input
                                              type="number"
                                              value={bFilter.requestRedirect?.statusCode || ""}
                                              onChange={(e) => {
                                                const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = {
                                                  ...bFilter,
                                                  requestRedirect: {
                                                    ...bFilter.requestRedirect,
                                                    statusCode: e.target.value ? parseInt(e.target.value) : undefined,
                                                  },
                                                };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                              }}
                                              placeholder="Status Code (301)"
                                              className="input-field text-xs"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* URL Rewrite */}
                                      {bFilter.type === "URLRewrite" && (
                                        <div className="space-y-2 border-t border-border/20 pt-2">
                                          <input
                                            type="text"
                                            value={bFilter.urlRewrite?.hostname || ""}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const backends = [...(updated[rIdx]?.backendRefs || [])];
                                              const filters = [...(backends[bIdx]?.filters || [])];
                                              filters[bfIdx] = {
                                                ...bFilter,
                                                urlRewrite: {
                                                  ...bFilter.urlRewrite,
                                                  hostname: e.target.value || undefined,
                                                },
                                              };
                                              backends[bIdx] = { ...backend, filters };
                                              updated[rIdx] = { ...rule, backendRefs: backends };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Hostname (example.com)"
                                            className="input-field text-xs"
                                          />
                                          <input
                                            type="text"
                                            value={bFilter.urlRewrite?.path?.type || ""}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const backends = [...(updated[rIdx]?.backendRefs || [])];
                                              const filters = [...(backends[bIdx]?.filters || [])];
                                              filters[bfIdx] = {
                                                ...bFilter,
                                                urlRewrite: {
                                                  ...bFilter.urlRewrite,
                                                  path: {
                                                    ...bFilter.urlRewrite?.path,
                                                    type: e.target.value || undefined,
                                                  },
                                                },
                                              };
                                              backends[bIdx] = { ...backend, filters };
                                              updated[rIdx] = { ...rule, backendRefs: backends };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Path Type"
                                            className="input-field text-xs"
                                          />
                                          <input
                                            type="text"
                                            value={bFilter.urlRewrite?.path?.value || ""}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                              const backends = [...(updated[rIdx]?.backendRefs || [])];
                                              const filters = [...(backends[bIdx]?.filters || [])];
                                              filters[bfIdx] = {
                                                ...bFilter,
                                                urlRewrite: {
                                                  ...bFilter.urlRewrite,
                                                  path: {
                                                    ...bFilter.urlRewrite?.path,
                                                    value: e.target.value || undefined,
                                                  },
                                                },
                                              };
                                              backends[bIdx] = { ...backend, filters };
                                              updated[rIdx] = { ...rule, backendRefs: backends };
                                              onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Path Value"
                                            className="input-field text-xs"
                                          />
                                        </div>
                                      )}

                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                          const backends = [...(updated[rIdx]?.backendRefs || [])];
                                          const filters = (backends[bIdx]?.filters || []).filter((_, i) => i !== bfIdx);
                                          backends[bIdx] = { ...backend, filters: filters.length > 0 ? filters : undefined };
                                          updated[rIdx] = { ...rule, backendRefs: backends };
                                          onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                        }}
                                        className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                      >
                                        Remove Filter
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                    const backends = (updated[rIdx]?.backendRefs || []).filter((_, i) => i !== bIdx);
                                    updated[rIdx] = { ...rule, backendRefs: backends.length > 0 ? backends : undefined };
                                    onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                  }}
                                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                >
                                  Remove Backend
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Timeouts */}
                        <div className="border-t border-border/50 pt-3">
                          <label className="block text-xs font-medium text-foreground mb-2">Timeouts</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Request Duration</label>
                              <input
                                type="text"
                                value={rule.timeouts?.requestDuration || ""}
                                onChange={(e) => {
                                  const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                  updated[rIdx] = {
                                    ...rule,
                                    timeouts: {
                                      ...rule.timeouts,
                                      requestDuration: e.target.value || undefined,
                                    },
                                  };
                                  onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                }}
                                placeholder="30s"
                                className="input-field text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Backend Request Duration</label>
                              <input
                                type="text"
                                value={rule.timeouts?.backendRequestDuration || ""}
                                onChange={(e) => {
                                  const updated = [...((config.spec as HTTPRouteSpec)?.rules || [])];
                                  updated[rIdx] = {
                                    ...rule,
                                    timeouts: {
                                      ...rule.timeouts,
                                      backendRequestDuration: e.target.value || undefined,
                                    },
                                  };
                                  onConfigChange("spec", { ...(config.spec as HTTPRouteSpec || {}), rules: updated });
                                }}
                                placeholder="5s"
                                className="input-field text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Remove Rule Button */}
                        <button
                          onClick={() => {
                            const updated = ((config.spec as HTTPRouteSpec)?.rules || []).filter((_, i) => i !== rIdx);
                            onConfigChange("spec", {
                              ...(config.spec as HTTPRouteSpec || {}),
                              rules: updated.length > 0 ? updated : undefined,
                            });
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors border-t border-border/50"
                        >
                          Remove Rule
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No rules defined</p>
                )}
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
                            onConfigChange("spec", { ...(config.spec || {}), ports: updated });
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
                              ...(config.spec || {}),
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
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Selector</label>
                  <button
                    onClick={() => {
                      const selector = { ...config.spec?.selector, "": "" };
                      onConfigChange("spec", { ...(config.spec || {}), selector });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-2">
                  {Object.entries(config.spec?.selector || {}).map(([key, val], idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const selector = { ...config.spec?.selector };
                          if (e.target.value !== key) {
                            delete selector[key];
                            selector[e.target.value] = val;
                          } else {
                            selector[key] = val;
                          }
                          onConfigChange("spec", { ...(config.spec || {}), selector });
                        }}
                        placeholder="key"
                        className="input-field text-sm flex-1"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => {
                          const selector = { ...config.spec?.selector };
                          selector[key] = e.target.value;
                          onConfigChange("spec", { ...(config.spec || {}), selector });
                        }}
                        placeholder="value"
                        className="input-field text-sm flex-1"
                      />
                      <button
                        onClick={() => {
                          const selector = { ...config.spec?.selector };
                          delete selector[key];
                          onConfigChange("spec", {
                            ...(config.spec || {}),
                            selector: Object.keys(selector).length > 0 ? selector : undefined,
                          });
                        }}
                        className="text-destructive hover:bg-destructive/10 p-2 rounded hover:opacity-75 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-foreground/50 mt-2">Labels to select pods for the service</p>
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

          {/* GRPCRoute Spec Section */}
          {expandedSections.has(section.id) && section.id === "spec" && config.type === "GRPCRoute" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              {/* Parent References */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Parent References</label>
                  <button
                    onClick={() => {
                      const parentRefs = (config.spec as GRPCRouteSpec)?.parentReferences || [];
                      onConfigChange("spec", {
                        ...(config.spec as GRPCRouteSpec || {}),
                        parentReferences: [
                          ...parentRefs,
                          { name: "", namespace: "", kind: "", group: "" },
                        ],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Reference
                  </button>
                </div>

                {((config.spec as GRPCRouteSpec)?.parentReferences && (config.spec as GRPCRouteSpec).parentReferences.length > 0) ? (
                  <div className="space-y-3">
                    {((config.spec as GRPCRouteSpec)?.parentReferences || []).map((ref, idx) => (
                      <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Name*</label>
                            <input
                              type="text"
                              value={ref.name || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GRPCRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, name: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="gateway-name"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Namespace</label>
                            <input
                              type="text"
                              value={ref.namespace || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GRPCRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, namespace: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="default"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Kind</label>
                            <input
                              type="text"
                              value={ref.kind || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GRPCRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, kind: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="Gateway"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Group</label>
                            <input
                              type="text"
                              value={ref.group || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GRPCRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, group: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="gateway.networking.k8s.io"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Section Name</label>
                            <input
                              type="text"
                              value={ref.sectionName || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GRPCRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, sectionName: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="grpc"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Port</label>
                            <input
                              type="number"
                              value={ref.port || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GRPCRouteSpec)?.parentReferences || [])];
                                updated[idx] = { ...ref, port: e.target.value ? parseInt(e.target.value) : undefined };
                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), parentReferences: updated });
                              }}
                              placeholder="5000"
                              className="input-field text-sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updated = ((config.spec as GRPCRouteSpec)?.parentReferences || []).filter((_, i) => i !== idx);
                            onConfigChange("spec", {
                              ...(config.spec as GRPCRouteSpec || {}),
                              parentReferences: updated.length > 0 ? updated : undefined,
                            });
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                        >
                          Remove Reference
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No parent references defined</p>
                )}
              </div>

              {/* Hostnames */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-3">Hostnames</label>
                <div className="space-y-2">
                  {((config.spec as GRPCRouteSpec)?.hostnames || []).map((hostname, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={hostname}
                        onChange={(e) => {
                          const updated = [...((config.spec as GRPCRouteSpec)?.hostnames || [])];
                          updated[idx] = e.target.value || "";
                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), hostnames: updated });
                        }}
                        placeholder="api.example.com"
                        className="input-field flex-1"
                      />
                      <button
                        onClick={() => {
                          const updated = ((config.spec as GRPCRouteSpec)?.hostnames || []).filter((_, i) => i !== idx);
                          onConfigChange("spec", {
                            ...(config.spec as GRPCRouteSpec || {}),
                            hostnames: updated.length > 0 ? updated : undefined,
                          });
                        }}
                        className="text-destructive hover:opacity-70"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const hostnames = (config.spec as GRPCRouteSpec)?.hostnames || [];
                      onConfigChange("spec", {
                        ...(config.spec as GRPCRouteSpec || {}),
                        hostnames: [...hostnames, ""],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Hostname
                  </button>
                </div>
              </div>

              {/* Rules */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Rules</label>
                  <button
                    onClick={() => {
                      const rules = ((config.spec as GRPCRouteSpec)?.rules || []);
                      onConfigChange("spec", {
                        ...(config.spec as GRPCRouteSpec || {}),
                        rules: [...rules, { matches: [], filters: [], backendRefs: [] }],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Rule
                  </button>
                </div>

                {((config.spec as GRPCRouteSpec)?.rules && (config.spec as GRPCRouteSpec).rules.length > 0) ? (
                  <div className="space-y-3">
                    {((config.spec as GRPCRouteSpec)?.rules || []).map((rule, rIdx) => (
                      <div key={rIdx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-4">
                        <h4 className="font-semibold text-foreground text-sm">Rule {rIdx + 1}</h4>

                        {/* Section Name */}
                        <div className="border-t border-border/50 pt-3">
                          <label className="block text-xs font-medium text-foreground mb-2">Section Name</label>
                          <input
                            type="text"
                            value={rule.sectionName || ""}
                            onChange={(e) => {
                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                              updated[rIdx] = { ...rule, sectionName: e.target.value || undefined };
                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                            }}
                            placeholder="grpc"
                            className="input-field text-sm"
                          />
                        </div>

                        {/* Matches */}
                        <div className="border-t border-border/50 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Matches</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                updated[rIdx] = {
                                  ...rule,
                                  matches: [...(rule.matches || []), { method: {} }],
                                };
                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Match
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(rule.matches || []).map((match, mIdx) => (
                              <div key={mIdx} className="p-3 bg-muted/10 border border-border/30 rounded-lg space-y-3">
                                <div>
                                  <p className="text-xs font-medium text-foreground mb-2">Method</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                                      <input
                                        type="text"
                                        value={match.method?.type || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          matches[mIdx] = {
                                            ...match,
                                            method: { ...match.method, type: e.target.value || undefined },
                                          };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="Exact"
                                        className="input-field text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-1">Service</label>
                                      <input
                                        type="text"
                                        value={match.method?.service || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          matches[mIdx] = {
                                            ...match,
                                            method: { ...match.method, service: e.target.value || undefined },
                                          };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="com.example.MyService"
                                        className="input-field text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-1">Method</label>
                                      <input
                                        type="text"
                                        value={match.method?.method || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          matches[mIdx] = {
                                            ...match,
                                            method: { ...match.method, method: e.target.value || undefined },
                                          };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="MyMethod"
                                        className="input-field text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Headers */}
                                <div className="border-t border-border/30 pt-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-medium text-foreground">Headers</label>
                                    <button
                                      onClick={() => {
                                        const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                        const matches = [...(updated[rIdx]?.matches || [])];
                                        matches[mIdx] = {
                                          ...match,
                                          headers: [...(match.headers || []), { type: "", name: "", value: "" }],
                                        };
                                        updated[rIdx] = { ...rule, matches };
                                        onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                      }}
                                      className="text-primary hover:opacity-70 text-xs"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  {(match.headers || []).map((header, hIdx) => (
                                    <div key={hIdx} className="flex gap-2 items-center mb-2">
                                      <input
                                        type="text"
                                        value={header.type || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const headers = [...(matches[mIdx]?.headers || [])];
                                          headers[hIdx] = { ...header, type: e.target.value || undefined };
                                          matches[mIdx] = { ...match, headers };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="Exact"
                                        className="input-field text-xs flex-1"
                                      />
                                      <input
                                        type="text"
                                        value={header.name || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const headers = [...(matches[mIdx]?.headers || [])];
                                          headers[hIdx] = { ...header, name: e.target.value || undefined };
                                          matches[mIdx] = { ...match, headers };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="Header name"
                                        className="input-field text-xs flex-1"
                                      />
                                      <input
                                        type="text"
                                        value={header.value || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const headers = [...(matches[mIdx]?.headers || [])];
                                          headers[hIdx] = { ...header, value: e.target.value || undefined };
                                          matches[mIdx] = { ...match, headers };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="Header value"
                                        className="input-field text-xs flex-1"
                                      />
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const matches = [...(updated[rIdx]?.matches || [])];
                                          const headers = (matches[mIdx]?.headers || []).filter((_, i) => i !== hIdx);
                                          matches[mIdx] = {
                                            ...match,
                                            headers: headers.length > 0 ? headers : undefined,
                                          };
                                          updated[rIdx] = { ...rule, matches };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-destructive hover:opacity-70 text-xs"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                    const matches = (updated[rIdx]?.matches || []).filter((_, i) => i !== mIdx);
                                    updated[rIdx] = { ...rule, matches: matches.length > 0 ? matches : undefined };
                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                  }}
                                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                >
                                  Remove Match
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Filters */}
                        <div className="border-t border-border/50 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Filters</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                updated[rIdx] = {
                                  ...rule,
                                  filters: [...(rule.filters || []), { type: "RequestHeaderModifier" }],
                                };
                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Filter
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(rule.filters || []).map((filter, fIdx) => (
                              <div key={fIdx} className="p-3 bg-muted/10 border border-border/30 rounded-lg space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Filter Type</label>
                                  <select
                                    value={filter.type || "RequestHeaderModifier"}
                                    onChange={(e) => {
                                      const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                      const filters = [...(updated[rIdx]?.filters || [])];
                                      filters[fIdx] = { type: e.target.value as GRPCRouteFilter["type"] };
                                      updated[rIdx] = { ...rule, filters };
                                      onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                    }}
                                    className="input-field text-xs"
                                  >
                                    <option value="RequestHeaderModifier">Request Header Modifier</option>
                                    <option value="ResponseHeaderModifier">Response Header Modifier</option>
                                    <option value="RequestMirror">Request Mirror</option>
                                  </select>
                                </div>

                                {/* Request Header Modifier */}
                                {filter.type === "RequestHeaderModifier" && (
                                  <div className="space-y-3 border-t border-border/30 pt-2">
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-2">Set Headers</label>
                                      {Object.entries(filter.requestHeaderModifier?.set || {}).map(([key, val], idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.requestHeaderModifier?.set };
                                              if (e.target.value !== key) {
                                                delete set[key];
                                                set[e.target.value] = val;
                                              }
                                              filters[fIdx] = { ...filter, requestHeaderModifier: { ...filter.requestHeaderModifier, set } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.requestHeaderModifier?.set };
                                              set[key] = e.target.value;
                                              filters[fIdx] = { ...filter, requestHeaderModifier: { ...filter.requestHeaderModifier, set } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header value"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.requestHeaderModifier?.set };
                                              delete set[key];
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  set: Object.keys(set).length > 0 ? set : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            requestHeaderModifier: {
                                              ...filter.requestHeaderModifier,
                                              set: { ...filter.requestHeaderModifier?.set, "": "" },
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Set Header
                                      </button>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <label className="block text-xs font-medium text-foreground mb-2">Add Headers</label>
                                      {Object.entries(filter.requestHeaderModifier?.add || {}).map(([key, val], idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.requestHeaderModifier?.add };
                                              if (e.target.value !== key) {
                                                delete add[key];
                                                add[e.target.value] = val;
                                              }
                                              filters[fIdx] = { ...filter, requestHeaderModifier: { ...filter.requestHeaderModifier, add } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.requestHeaderModifier?.add };
                                              add[key] = e.target.value;
                                              filters[fIdx] = { ...filter, requestHeaderModifier: { ...filter.requestHeaderModifier, add } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header value"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.requestHeaderModifier?.add };
                                              delete add[key];
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  add: Object.keys(add).length > 0 ? add : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            requestHeaderModifier: {
                                              ...filter.requestHeaderModifier,
                                              add: { ...filter.requestHeaderModifier?.add, "": "" },
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Header
                                      </button>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <label className="block text-xs font-medium text-foreground mb-2">Remove Headers</label>
                                      {(filter.requestHeaderModifier?.remove || []).map((header, idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={header}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const remove = [...(filters[fIdx]?.requestHeaderModifier?.remove || [])];
                                              remove[idx] = e.target.value;
                                              filters[fIdx] = { ...filter, requestHeaderModifier: { ...filter.requestHeaderModifier, remove } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name to remove"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const remove = (filters[fIdx]?.requestHeaderModifier?.remove || []).filter((_, i) => i !== idx);
                                              filters[fIdx] = {
                                                ...filter,
                                                requestHeaderModifier: {
                                                  ...filter.requestHeaderModifier,
                                                  remove: remove.length > 0 ? remove : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            requestHeaderModifier: {
                                              ...filter.requestHeaderModifier,
                                              remove: [...(filter.requestHeaderModifier?.remove || []), ""],
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Remove Header
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Response Header Modifier */}
                                {filter.type === "ResponseHeaderModifier" && (
                                  <div className="space-y-3 border-t border-border/30 pt-2">
                                    <div>
                                      <label className="block text-xs font-medium text-foreground mb-2">Set Headers</label>
                                      {Object.entries(filter.responseHeaderModifier?.set || {}).map(([key, val], idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.responseHeaderModifier?.set };
                                              if (e.target.value !== key) {
                                                delete set[key];
                                                set[e.target.value] = val;
                                              }
                                              filters[fIdx] = { ...filter, responseHeaderModifier: { ...filter.responseHeaderModifier, set } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.responseHeaderModifier?.set };
                                              set[key] = e.target.value;
                                              filters[fIdx] = { ...filter, responseHeaderModifier: { ...filter.responseHeaderModifier, set } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header value"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const set = { ...filters[fIdx]?.responseHeaderModifier?.set };
                                              delete set[key];
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  set: Object.keys(set).length > 0 ? set : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            responseHeaderModifier: {
                                              ...filter.responseHeaderModifier,
                                              set: { ...filter.responseHeaderModifier?.set, "": "" },
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Set Header
                                      </button>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <label className="block text-xs font-medium text-foreground mb-2">Add Headers</label>
                                      {Object.entries(filter.responseHeaderModifier?.add || {}).map(([key, val], idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.responseHeaderModifier?.add };
                                              if (e.target.value !== key) {
                                                delete add[key];
                                                add[e.target.value] = val;
                                              }
                                              filters[fIdx] = { ...filter, responseHeaderModifier: { ...filter.responseHeaderModifier, add } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name"
                                            className="input-field text-xs flex-1"
                                          />
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.responseHeaderModifier?.add };
                                              add[key] = e.target.value;
                                              filters[fIdx] = { ...filter, responseHeaderModifier: { ...filter.responseHeaderModifier, add } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header value"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const add = { ...filters[fIdx]?.responseHeaderModifier?.add };
                                              delete add[key];
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  add: Object.keys(add).length > 0 ? add : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            responseHeaderModifier: {
                                              ...filter.responseHeaderModifier,
                                              add: { ...filter.responseHeaderModifier?.add, "": "" },
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Header
                                      </button>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <label className="block text-xs font-medium text-foreground mb-2">Remove Headers</label>
                                      {(filter.responseHeaderModifier?.remove || []).map((header, idx) => (
                                        <div key={idx} className="flex gap-2 items-center mb-2">
                                          <input
                                            type="text"
                                            value={header}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const remove = [...(filters[fIdx]?.responseHeaderModifier?.remove || [])];
                                              remove[idx] = e.target.value;
                                              filters[fIdx] = { ...filter, responseHeaderModifier: { ...filter.responseHeaderModifier, remove } };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            placeholder="Header name to remove"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                              const filters = [...(updated[rIdx]?.filters || [])];
                                              const remove = (filters[fIdx]?.responseHeaderModifier?.remove || []).filter((_, i) => i !== idx);
                                              filters[fIdx] = {
                                                ...filter,
                                                responseHeaderModifier: {
                                                  ...filter.responseHeaderModifier,
                                                  remove: remove.length > 0 ? remove : undefined,
                                                },
                                              };
                                              updated[rIdx] = { ...rule, filters };
                                              onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                            }}
                                            className="text-destructive hover:opacity-70 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            responseHeaderModifier: {
                                              ...filter.responseHeaderModifier,
                                              remove: [...(filter.responseHeaderModifier?.remove || []), ""],
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Remove Header
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Request Mirror */}
                                {filter.type === "RequestMirror" && (
                                  <div className="space-y-3 border-t border-border/30 pt-2">
                                    <div>
                                      <p className="text-xs text-foreground/60 mb-2">Backend Reference (required)</p>
                                      <div className="grid grid-cols-3 gap-2 mb-3">
                                        <input
                                          type="text"
                                          value={filter.requestMirror?.backendRef?.name || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestMirror: {
                                                ...filter.requestMirror,
                                                backendRef: {
                                                  ...filter.requestMirror?.backendRef,
                                                  name: e.target.value || undefined,
                                                },
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="Service name"
                                          className="input-field text-xs"
                                        />
                                        <input
                                          type="text"
                                          value={filter.requestMirror?.backendRef?.namespace || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestMirror: {
                                                ...filter.requestMirror,
                                                backendRef: {
                                                  ...filter.requestMirror?.backendRef,
                                                  namespace: e.target.value || undefined,
                                                },
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="Namespace"
                                          className="input-field text-xs"
                                        />
                                        <input
                                          type="number"
                                          value={filter.requestMirror?.backendRef?.port || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestMirror: {
                                                ...filter.requestMirror,
                                                backendRef: {
                                                  ...filter.requestMirror?.backendRef,
                                                  port: e.target.value ? parseInt(e.target.value) : undefined,
                                                },
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="Port"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <p className="text-xs text-foreground/60 mb-2">Traffic Mirror Percentage (optional)</p>
                                      <input
                                        type="number"
                                        value={filter.requestMirror?.percent || ""}
                                        onChange={(e) => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const filters = [...(updated[rIdx]?.filters || [])];
                                          filters[fIdx] = {
                                            ...filter,
                                            requestMirror: {
                                              ...filter.requestMirror,
                                              percent: e.target.value ? parseInt(e.target.value) : undefined,
                                            },
                                          };
                                          updated[rIdx] = { ...rule, filters };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        placeholder="Percent (0-100)"
                                        min="0"
                                        max="100"
                                        className="input-field text-xs"
                                      />
                                    </div>

                                    <div className="border-t border-border/30 pt-2">
                                      <p className="text-xs text-foreground/60 mb-1">Fraction (optional)</p>
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="number"
                                          value={filter.requestMirror?.fraction?.numerator || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestMirror: {
                                                ...filter.requestMirror,
                                                fraction: {
                                                  ...filter.requestMirror?.fraction,
                                                  numerator: e.target.value ? parseInt(e.target.value) : undefined,
                                                },
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="Numerator"
                                          className="input-field text-xs"
                                        />
                                        <input
                                          type="text"
                                          value={filter.requestMirror?.fraction?.denominator || ""}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                            const filters = [...(updated[rIdx]?.filters || [])];
                                            filters[fIdx] = {
                                              ...filter,
                                              requestMirror: {
                                                ...filter.requestMirror,
                                                fraction: {
                                                  ...filter.requestMirror?.fraction,
                                                  denominator: e.target.value || undefined,
                                                },
                                              },
                                            };
                                            updated[rIdx] = { ...rule, filters };
                                            onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                          }}
                                          placeholder="Denominator"
                                          className="input-field text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                    const filters = (updated[rIdx]?.filters || []).filter((_, i) => i !== fIdx);
                                    updated[rIdx] = { ...rule, filters: filters.length > 0 ? filters : undefined };
                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                  }}
                                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                >
                                  Remove Filter
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Backend References */}
                        <div className="border-t border-border/50 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Backend References</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                updated[rIdx] = {
                                  ...rule,
                                  backendRefs: [...(rule.backendRefs || []), { name: "" }],
                                };
                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Backend
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(rule.backendRefs || []).map((backend, bIdx) => (
                              <div key={bIdx} className="p-3 bg-muted/10 border border-border/30 rounded-lg space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={backend.name || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = { ...backend, name: e.target.value || undefined };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="service-name"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Namespace</label>
                                    <input
                                      type="text"
                                      value={backend.namespace || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = { ...backend, namespace: e.target.value || undefined };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="default"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Port</label>
                                    <input
                                      type="number"
                                      value={backend.port || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = {
                                          ...backend,
                                          port: e.target.value ? parseInt(e.target.value) : undefined,
                                        };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="50051"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Weight</label>
                                    <input
                                      type="number"
                                      value={backend.weight || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = {
                                          ...backend,
                                          weight: e.target.value ? parseInt(e.target.value) : undefined,
                                        };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="100"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Group</label>
                                    <input
                                      type="text"
                                      value={backend.group || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = { ...backend, group: e.target.value || undefined };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="core"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Kind</label>
                                    <input
                                      type="text"
                                      value={backend.kind || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = { ...backend, kind: e.target.value || undefined };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                      }}
                                      placeholder="Service"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                </div>

                                {/* Backend Filters */}
                                <div className="border-t border-border/30 pt-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-medium text-foreground">Filters</label>
                                    <button
                                      onClick={() => {
                                        const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                        const backends = [...(updated[rIdx]?.backendRefs || [])];
                                        backends[bIdx] = {
                                          ...backend,
                                          filters: [...(backend.filters || []), { type: "RequestHeaderModifier" }],
                                        };
                                        updated[rIdx] = { ...rule, backendRefs: backends };
                                        onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                      }}
                                      className="text-primary hover:opacity-70 text-xs"
                                    >
                                      + Add Filter
                                    </button>
                                  </div>
                                  {(backend.filters || []).map((bFilter, bfIdx) => (
                                    <div key={bfIdx} className="p-3 bg-muted/5 border border-border/20 rounded mb-3 space-y-3">
                                      <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">Filter Type</label>
                                        <select
                                          value={bFilter.type || "RequestHeaderModifier"}
                                          onChange={(e) => {
                                            const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                            const backends = [...(updated[rIdx]?.backendRefs || [])];
                                            const filters = [...(backends[bIdx]?.filters || [])];
                                            filters[bfIdx] = { type: e.target.value as GRPCRouteFilter["type"] };
                                            backends[bIdx] = { ...backend, filters };
                                            updated[rIdx] = { ...rule, backendRefs: backends };
                                            onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                          }}
                                          className="input-field text-xs"
                                        >
                                          <option value="RequestHeaderModifier">Request Header Modifier</option>
                                          <option value="ResponseHeaderModifier">Response Header Modifier</option>
                                          <option value="RequestMirror">Request Mirror</option>
                                        </select>
                                      </div>

                                      {/* Request Header Modifier */}
                                      {bFilter.type === "RequestHeaderModifier" && (
                                        <div className="space-y-2 border-t border-border/20 pt-2">
                                          <div>
                                            <label className="block text-xs font-medium text-foreground mb-1">Set Headers</label>
                                            {Object.entries(bFilter.requestHeaderModifier?.set || {}).map(([key, val], idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={key}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.requestHeaderModifier?.set };
                                                    if (e.target.value !== key) {
                                                      delete set[key];
                                                      set[e.target.value] = val;
                                                    }
                                                    filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, set } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <input
                                                  type="text"
                                                  value={val}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.requestHeaderModifier?.set };
                                                    set[key] = e.target.value;
                                                    filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, set } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header value"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.requestHeaderModifier?.set };
                                                    delete set[key];
                                                    filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, set: Object.keys(set).length > 0 ? set : undefined } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, set: { ...bFilter.requestHeaderModifier?.set, "": "" } } };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Add Set Header
                                            </button>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <label className="block text-xs font-medium text-foreground mb-1">Add Headers</label>
                                            {Object.entries(bFilter.requestHeaderModifier?.add || {}).map(([key, val], idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={key}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.requestHeaderModifier?.add };
                                                    if (e.target.value !== key) {
                                                      delete add[key];
                                                      add[e.target.value] = val;
                                                    }
                                                    filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, add } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <input
                                                  type="text"
                                                  value={val}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.requestHeaderModifier?.add };
                                                    add[key] = e.target.value;
                                                    filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, add } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header value"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.requestHeaderModifier?.add };
                                                    delete add[key];
                                                    filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, add: Object.keys(add).length > 0 ? add : undefined } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, add: { ...bFilter.requestHeaderModifier?.add, "": "" } } };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Add Header
                                            </button>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <label className="block text-xs font-medium text-foreground mb-1">Remove Headers</label>
                                            {(bFilter.requestHeaderModifier?.remove || []).map((header, idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={header}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const remove = [...(filters[bfIdx]?.requestHeaderModifier?.remove || [])];
                                                    remove[idx] = e.target.value;
                                                    filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, remove } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name to remove"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const remove = (filters[bfIdx]?.requestHeaderModifier?.remove || []).filter((_, i) => i !== idx);
                                                    filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, remove: remove.length > 0 ? remove : undefined } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = { ...bFilter, requestHeaderModifier: { ...bFilter.requestHeaderModifier, remove: [...(bFilter.requestHeaderModifier?.remove || []), ""] } };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Remove Header
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Response Header Modifier */}
                                      {bFilter.type === "ResponseHeaderModifier" && (
                                        <div className="space-y-2 border-t border-border/20 pt-2">
                                          <div>
                                            <label className="block text-xs font-medium text-foreground mb-1">Set Headers</label>
                                            {Object.entries(bFilter.responseHeaderModifier?.set || {}).map(([key, val], idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={key}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.responseHeaderModifier?.set };
                                                    if (e.target.value !== key) {
                                                      delete set[key];
                                                      set[e.target.value] = val;
                                                    }
                                                    filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, set } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <input
                                                  type="text"
                                                  value={val}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.responseHeaderModifier?.set };
                                                    set[key] = e.target.value;
                                                    filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, set } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header value"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const set = { ...filters[bfIdx]?.responseHeaderModifier?.set };
                                                    delete set[key];
                                                    filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, set: Object.keys(set).length > 0 ? set : undefined } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, set: { ...bFilter.responseHeaderModifier?.set, "": "" } } };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Add Set Header
                                            </button>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <label className="block text-xs font-medium text-foreground mb-1">Add Headers</label>
                                            {Object.entries(bFilter.responseHeaderModifier?.add || {}).map(([key, val], idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={key}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.responseHeaderModifier?.add };
                                                    if (e.target.value !== key) {
                                                      delete add[key];
                                                      add[e.target.value] = val;
                                                    }
                                                    filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, add } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <input
                                                  type="text"
                                                  value={val}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.responseHeaderModifier?.add };
                                                    add[key] = e.target.value;
                                                    filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, add } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header value"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const add = { ...filters[bfIdx]?.responseHeaderModifier?.add };
                                                    delete add[key];
                                                    filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, add: Object.keys(add).length > 0 ? add : undefined } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, add: { ...bFilter.responseHeaderModifier?.add, "": "" } } };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Add Header
                                            </button>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <label className="block text-xs font-medium text-foreground mb-1">Remove Headers</label>
                                            {(bFilter.responseHeaderModifier?.remove || []).map((header, idx) => (
                                              <div key={idx} className="flex gap-2 items-center mb-1">
                                                <input
                                                  type="text"
                                                  value={header}
                                                  onChange={(e) => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const remove = [...(filters[bfIdx]?.responseHeaderModifier?.remove || [])];
                                                    remove[idx] = e.target.value;
                                                    filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, remove } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  placeholder="Header name to remove"
                                                  className="input-field text-xs flex-1"
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                    const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                    const filters = [...(backends[bIdx]?.filters || [])];
                                                    const remove = (filters[bfIdx]?.responseHeaderModifier?.remove || []).filter((_, i) => i !== idx);
                                                    filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, remove: remove.length > 0 ? remove : undefined } };
                                                    backends[bIdx] = { ...backend, filters };
                                                    updated[rIdx] = { ...rule, backendRefs: backends };
                                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                  }}
                                                  className="text-destructive hover:opacity-70 text-xs"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              onClick={() => {
                                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = { ...bFilter, responseHeaderModifier: { ...bFilter.responseHeaderModifier, remove: [...(bFilter.responseHeaderModifier?.remove || []), ""] } };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                              }}
                                              className="text-primary hover:opacity-70 text-xs"
                                            >
                                              + Remove Header
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Request Mirror */}
                                      {bFilter.type === "RequestMirror" && (
                                        <div className="space-y-2 border-t border-border/20 pt-2">
                                          <div>
                                            <p className="text-xs text-foreground/60 mb-2">Backend Reference (required)</p>
                                            <div className="grid grid-cols-3 gap-2">
                                              <input
                                                type="text"
                                                value={bFilter.requestMirror?.backendRef?.name || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = { ...bFilter, requestMirror: { ...bFilter.requestMirror, backendRef: { ...bFilter.requestMirror?.backendRef, name: e.target.value || undefined } } };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Service name"
                                                className="input-field text-xs"
                                              />
                                              <input
                                                type="text"
                                                value={bFilter.requestMirror?.backendRef?.namespace || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = { ...bFilter, requestMirror: { ...bFilter.requestMirror, backendRef: { ...bFilter.requestMirror?.backendRef, namespace: e.target.value || undefined } } };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Namespace"
                                                className="input-field text-xs"
                                              />
                                              <input
                                                type="number"
                                                value={bFilter.requestMirror?.backendRef?.port || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = { ...bFilter, requestMirror: { ...bFilter.requestMirror, backendRef: { ...bFilter.requestMirror?.backendRef, port: e.target.value ? parseInt(e.target.value) : undefined } } };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Port"
                                                className="input-field text-xs"
                                              />
                                            </div>
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <p className="text-xs text-foreground/60 mb-1">Traffic Mirror Percentage (optional)</p>
                                            <input
                                              type="number"
                                              value={bFilter.requestMirror?.percent || ""}
                                              onChange={(e) => {
                                                const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                const filters = [...(backends[bIdx]?.filters || [])];
                                                filters[bfIdx] = { ...bFilter, requestMirror: { ...bFilter.requestMirror, percent: e.target.value ? parseInt(e.target.value) : undefined } };
                                                backends[bIdx] = { ...backend, filters };
                                                updated[rIdx] = { ...rule, backendRefs: backends };
                                                onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                              }}
                                              placeholder="Percent (0-100)"
                                              min="0"
                                              max="100"
                                              className="input-field text-xs"
                                            />
                                          </div>

                                          <div className="border-t border-border/20 pt-1">
                                            <p className="text-xs text-foreground/60 mb-1">Fraction (optional)</p>
                                            <div className="grid grid-cols-2 gap-2">
                                              <input
                                                type="number"
                                                value={bFilter.requestMirror?.fraction?.numerator || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = { ...bFilter, requestMirror: { ...bFilter.requestMirror, fraction: { ...bFilter.requestMirror?.fraction, numerator: e.target.value ? parseInt(e.target.value) : undefined } } };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Numerator"
                                                className="input-field text-xs"
                                              />
                                              <input
                                                type="text"
                                                value={bFilter.requestMirror?.fraction?.denominator || ""}
                                                onChange={(e) => {
                                                  const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                                  const backends = [...(updated[rIdx]?.backendRefs || [])];
                                                  const filters = [...(backends[bIdx]?.filters || [])];
                                                  filters[bfIdx] = { ...bFilter, requestMirror: { ...bFilter.requestMirror, fraction: { ...bFilter.requestMirror?.fraction, denominator: e.target.value || undefined } } };
                                                  backends[bIdx] = { ...backend, filters };
                                                  updated[rIdx] = { ...rule, backendRefs: backends };
                                                  onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                                }}
                                                placeholder="Denominator"
                                                className="input-field text-xs"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                          const backends = [...(updated[rIdx]?.backendRefs || [])];
                                          const filters = (backends[bIdx]?.filters || []).filter((_, i) => i !== bfIdx);
                                          backends[bIdx] = { ...backend, filters: filters.length > 0 ? filters : undefined };
                                          updated[rIdx] = { ...rule, backendRefs: backends };
                                          onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                        }}
                                        className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                      >
                                        Remove Filter
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as GRPCRouteSpec)?.rules || [])];
                                    const backends = (updated[rIdx]?.backendRefs || []).filter((_, i) => i !== bIdx);
                                    updated[rIdx] = { ...rule, backendRefs: backends.length > 0 ? backends : undefined };
                                    onConfigChange("spec", { ...(config.spec as GRPCRouteSpec || {}), rules: updated });
                                  }}
                                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                >
                                  Remove Backend
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Remove Rule Button */}
                        <button
                          onClick={() => {
                            const updated = ((config.spec as GRPCRouteSpec)?.rules || []).filter((_, i) => i !== rIdx);
                            onConfigChange("spec", {
                              ...(config.spec as GRPCRouteSpec || {}),
                              rules: updated.length > 0 ? updated : undefined,
                            });
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors border-t border-border/50"
                        >
                          Remove Rule
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No rules defined</p>
                )}
              </div>
            </div>
          )}

          {/* Gateway Spec Section */}
          {expandedSections.has(section.id) && section.id === "spec" && config.type === "Gateway" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              {/* Gateway Class Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Gateway Class Name*</label>
                <input
                  type="text"
                  value={(config.spec as GatewaySpec)?.gatewayClassName || ""}
                  onChange={(e) => {
                    onConfigChange("spec", {
                      ...(config.spec as GatewaySpec || {}),
                      gatewayClassName: e.target.value || undefined,
                    });
                  }}
                  placeholder="nginx (predefined)"
                  className="input-field text-sm"
                />
                <p className="text-xs text-foreground/60 mt-1">The class of gateway this configuration represents (usually predefined)</p>
              </div>

              {/* Listeners */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Listeners</label>
                  <button
                    onClick={() => {
                      const listeners = ((config.spec as GatewaySpec)?.listeners || []);
                      onConfigChange("spec", {
                        ...(config.spec as GatewaySpec || {}),
                        listeners: [...listeners, { name: "", port: 80, protocol: "HTTP" }],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Listener
                  </button>
                </div>

                {((config.spec as GatewaySpec)?.listeners && (config.spec as GatewaySpec).listeners.length > 0) ? (
                  <div className="space-y-3">
                    {((config.spec as GatewaySpec)?.listeners || []).map((listener, lIdx) => (
                      <div key={lIdx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <h4 className="font-semibold text-foreground text-sm">Listener {lIdx + 1}</h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Name*</label>
                            <input
                              type="text"
                              value={listener.name || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                updated[lIdx] = { ...listener, name: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                              }}
                              placeholder="http"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Hostname</label>
                            <input
                              type="text"
                              value={listener.hostname || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                updated[lIdx] = { ...listener, hostname: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                              }}
                              placeholder="*.example.com"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Port*</label>
                            <input
                              type="number"
                              value={listener.port || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                updated[lIdx] = { ...listener, port: e.target.value ? parseInt(e.target.value) : undefined };
                                onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                              }}
                              placeholder="80"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Protocol*</label>
                            <select
                              value={listener.protocol || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                updated[lIdx] = { ...listener, protocol: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                              }}
                              className="input-field text-sm"
                            >
                              <option value="">Select Protocol</option>
                              <option value="HTTP">HTTP</option>
                              <option value="HTTPS">HTTPS</option>
                              <option value="TCP">TCP</option>
                              <option value="TLS">TLS</option>
                              <option value="UDP">UDP</option>
                            </select>
                          </div>
                        </div>

                        {/* TLS Config */}
                        <div className="border-t border-border/50 pt-3">
                          <label className="block text-xs font-medium text-foreground mb-2">TLS Config</label>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Mode</label>
                              <input
                                type="text"
                                value={listener.tlsConfig?.mode || ""}
                                onChange={(e) => {
                                  const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                  updated[lIdx] = {
                                    ...listener,
                                    tlsConfig: { ...listener.tlsConfig, mode: e.target.value || undefined },
                                  };
                                  onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                }}
                                placeholder="Terminate, Passthrough"
                                className="input-field text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Certificate Name</label>
                                <input
                                  type="text"
                                  value={listener.tlsConfig?.certificateRef?.name || ""}
                                  onChange={(e) => {
                                    const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                    updated[lIdx] = {
                                      ...listener,
                                      tlsConfig: {
                                        ...listener.tlsConfig,
                                        certificateRef: {
                                          ...listener.tlsConfig?.certificateRef,
                                          name: e.target.value || undefined,
                                        },
                                      },
                                    };
                                    onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                  }}
                                  placeholder="tls-cert"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Certificate Namespace</label>
                                <input
                                  type="text"
                                  value={listener.tlsConfig?.certificateRef?.namespace || ""}
                                  onChange={(e) => {
                                    const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                    updated[lIdx] = {
                                      ...listener,
                                      tlsConfig: {
                                        ...listener.tlsConfig,
                                        certificateRef: {
                                          ...listener.tlsConfig?.certificateRef,
                                          namespace: e.target.value || undefined,
                                        },
                                      },
                                    };
                                    onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                  }}
                                  placeholder="default"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Certificate Kind</label>
                                <input
                                  type="text"
                                  value={listener.tlsConfig?.certificateRef?.kind || ""}
                                  onChange={(e) => {
                                    const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                    updated[lIdx] = {
                                      ...listener,
                                      tlsConfig: {
                                        ...listener.tlsConfig,
                                        certificateRef: {
                                          ...listener.tlsConfig?.certificateRef,
                                          kind: e.target.value || undefined,
                                        },
                                      },
                                    };
                                    onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                  }}
                                  placeholder="Secret"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Certificate Group</label>
                                <input
                                  type="text"
                                  value={listener.tlsConfig?.certificateRef?.group || ""}
                                  onChange={(e) => {
                                    const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                    updated[lIdx] = {
                                      ...listener,
                                      tlsConfig: {
                                        ...listener.tlsConfig,
                                        certificateRef: {
                                          ...listener.tlsConfig?.certificateRef,
                                          group: e.target.value || undefined,
                                        },
                                      },
                                    };
                                    onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                  }}
                                  placeholder="core"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-foreground mb-2">TLS Options</label>
                              <div className="space-y-2">
                                {Object.entries(listener.tlsConfig?.options || {}).map(([key, val], idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={key}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                        const options = { ...listener.tlsConfig?.options };
                                        if (e.target.value !== key) {
                                          delete options[key];
                                          options[e.target.value] = val;
                                        }
                                        updated[lIdx] = {
                                          ...listener,
                                          tlsConfig: { ...listener.tlsConfig, options },
                                        };
                                        onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                      }}
                                      placeholder="Option name"
                                      className="input-field text-xs flex-1"
                                    />
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                        const options = { ...listener.tlsConfig?.options };
                                        options[key] = e.target.value;
                                        updated[lIdx] = {
                                          ...listener,
                                          tlsConfig: { ...listener.tlsConfig, options },
                                        };
                                        onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                      }}
                                      placeholder="Option value"
                                      className="input-field text-xs flex-1"
                                    />
                                    <button
                                      onClick={() => {
                                        const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                        const options = { ...listener.tlsConfig?.options };
                                        delete options[key];
                                        updated[lIdx] = {
                                          ...listener,
                                          tlsConfig: { ...listener.tlsConfig, options: Object.keys(options).length > 0 ? options : undefined },
                                        };
                                        onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                      }}
                                      className="text-destructive hover:opacity-70"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                    updated[lIdx] = {
                                      ...listener,
                                      tlsConfig: {
                                        ...listener.tlsConfig,
                                        options: { ...listener.tlsConfig?.options, "": "" },
                                      },
                                    };
                                    onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                  }}
                                  className="text-primary hover:opacity-70 text-sm"
                                >
                                  + Add Option
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Allowed Routes */}
                        <div className="border-t border-border/50 pt-3">
                          <label className="block text-xs font-medium text-foreground mb-2">Allowed Routes</label>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-2">Namespaces</label>
                              <div className="space-y-2">
                                {(listener.allowedRoutes?.namespaces || []).map((ns, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={ns}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                        const namespaces = [...(listener.allowedRoutes?.namespaces || [])];
                                        namespaces[idx] = e.target.value || "";
                                        updated[lIdx] = {
                                          ...listener,
                                          allowedRoutes: { ...listener.allowedRoutes, namespaces },
                                        };
                                        onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                      }}
                                      placeholder="default"
                                      className="input-field text-sm flex-1"
                                    />
                                    <button
                                      onClick={() => {
                                        const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                        const namespaces = (listener.allowedRoutes?.namespaces || []).filter((_, i) => i !== idx);
                                        updated[lIdx] = {
                                          ...listener,
                                          allowedRoutes: { ...listener.allowedRoutes, namespaces: namespaces.length > 0 ? namespaces : undefined },
                                        };
                                        onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                      }}
                                      className="text-destructive hover:opacity-70"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                    updated[lIdx] = {
                                      ...listener,
                                      allowedRoutes: {
                                        ...listener.allowedRoutes,
                                        namespaces: [...(listener.allowedRoutes?.namespaces || []), ""],
                                      },
                                    };
                                    onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                  }}
                                  className="text-primary hover:opacity-70 text-sm"
                                >
                                  + Add Namespace
                                </button>
                              </div>
                            </div>

                            <div className="border-t border-border/30 pt-2">
                              <label className="block text-xs font-medium text-foreground mb-2">Kinds</label>
                              <div className="space-y-2">
                                {(listener.allowedRoutes?.kinds || []).map((kind, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={kind}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                        const kinds = [...(listener.allowedRoutes?.kinds || [])];
                                        kinds[idx] = e.target.value || "";
                                        updated[lIdx] = {
                                          ...listener,
                                          allowedRoutes: { ...listener.allowedRoutes, kinds },
                                        };
                                        onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                      }}
                                      placeholder="HTTPRoute"
                                      className="input-field text-sm flex-1"
                                    />
                                    <button
                                      onClick={() => {
                                        const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                        const kinds = (listener.allowedRoutes?.kinds || []).filter((_, i) => i !== idx);
                                        updated[lIdx] = {
                                          ...listener,
                                          allowedRoutes: { ...listener.allowedRoutes, kinds: kinds.length > 0 ? kinds : undefined },
                                        };
                                        onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                      }}
                                      className="text-destructive hover:opacity-70"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as GatewaySpec)?.listeners || [])];
                                    updated[lIdx] = {
                                      ...listener,
                                      allowedRoutes: {
                                        ...listener.allowedRoutes,
                                        kinds: [...(listener.allowedRoutes?.kinds || []), ""],
                                      },
                                    };
                                    onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), listeners: updated });
                                  }}
                                  className="text-primary hover:opacity-70 text-sm"
                                >
                                  + Add Kind
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const updated = ((config.spec as GatewaySpec)?.listeners || []).filter((_, i) => i !== lIdx);
                            onConfigChange("spec", {
                              ...(config.spec as GatewaySpec || {}),
                              listeners: updated.length > 0 ? updated : undefined,
                            });
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors border-t border-border/50"
                        >
                          Remove Listener
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No listeners defined</p>
                )}
              </div>

              {/* Addresses */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Addresses</label>
                  <button
                    onClick={() => {
                      const addresses = ((config.spec as GatewaySpec)?.addresses || []);
                      onConfigChange("spec", {
                        ...(config.spec as GatewaySpec || {}),
                        addresses: [...addresses, { addressType: "IPAddress", value: "" }],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Address
                  </button>
                </div>

                {((config.spec as GatewaySpec)?.addresses && (config.spec as GatewaySpec).addresses.length > 0) ? (
                  <div className="space-y-3">
                    {((config.spec as GatewaySpec)?.addresses || []).map((address, aIdx) => (
                      <div key={aIdx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Address Type</label>
                            <select
                              value={address.addressType || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GatewaySpec)?.addresses || [])];
                                updated[aIdx] = { ...address, addressType: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), addresses: updated });
                              }}
                              className="input-field text-sm"
                            >
                              <option value="">Select Type</option>
                              <option value="IPAddress">IPAddress</option>
                              <option value="Hostname">Hostname</option>
                              <option value="Named Address">Named Address</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Value</label>
                            <input
                              type="text"
                              value={address.value || ""}
                              onChange={(e) => {
                                const updated = [...((config.spec as GatewaySpec)?.addresses || [])];
                                updated[aIdx] = { ...address, value: e.target.value || undefined };
                                onConfigChange("spec", { ...(config.spec as GatewaySpec || {}), addresses: updated });
                              }}
                              placeholder="192.168.1.100 or example.com or address-name"
                              className="input-field text-sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updated = ((config.spec as GatewaySpec)?.addresses || []).filter((_, i) => i !== aIdx);
                            onConfigChange("spec", {
                              ...(config.spec as GatewaySpec || {}),
                              addresses: updated.length > 0 ? updated : undefined,
                            });
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                        >
                          Remove Address
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No addresses defined</p>
                )}
                <p className="text-xs text-foreground/50 mt-2">Gateway addresses that can be accessed by clients</p>
              </div>

              {/* Infrastructure */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-3">Infrastructure</label>

                {/* Labels */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-foreground mb-2">Labels</label>
                  {renderTagsField(
                    (config.spec as GatewaySpec)?.infrastructure?.labels,
                    (value) => {
                      onConfigChange("spec", {
                        ...(config.spec as GatewaySpec || {}),
                        infrastructure: {
                          ...(config.spec as GatewaySpec)?.infrastructure,
                          labels: value,
                        },
                      });
                    },
                    "Infrastructure Labels",
                    "Add label (key=value)"
                  )}
                  <p className="text-xs text-foreground/50 mt-1">Labels for infrastructure identification</p>
                </div>

                {/* Annotations */}
                <div className="border-t border-border/50 pt-4 mb-4">
                  <label className="block text-xs font-medium text-foreground mb-2">Annotations</label>
                  {renderTagsField(
                    (config.spec as GatewaySpec)?.infrastructure?.annotations,
                    (value) => {
                      onConfigChange("spec", {
                        ...(config.spec as GatewaySpec || {}),
                        infrastructure: {
                          ...(config.spec as GatewaySpec)?.infrastructure,
                          annotations: value,
                        },
                      });
                    },
                    "Infrastructure Annotations",
                    "Add annotation (key=value)"
                  )}
                  <p className="text-xs text-foreground/50 mt-1">Annotations for infrastructure metadata</p>
                </div>

                {/* Parameters Reference */}
                <div className="border-t border-border/50 pt-4">
                  <label className="block text-xs font-medium text-foreground mb-3">Parameters Reference</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Group</label>
                      <input
                        type="text"
                        value={(config.spec as GatewaySpec)?.infrastructure?.parametersRef?.group || ""}
                        onChange={(e) => {
                          onConfigChange("spec", {
                            ...(config.spec as GatewaySpec || {}),
                            infrastructure: {
                              ...(config.spec as GatewaySpec)?.infrastructure,
                              parametersRef: {
                                ...(config.spec as GatewaySpec)?.infrastructure?.parametersRef,
                                group: e.target.value || undefined,
                              },
                            },
                          });
                        }}
                        placeholder="networking.x-k8s.io"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Kind</label>
                      <input
                        type="text"
                        value={(config.spec as GatewaySpec)?.infrastructure?.parametersRef?.kind || ""}
                        onChange={(e) => {
                          onConfigChange("spec", {
                            ...(config.spec as GatewaySpec || {}),
                            infrastructure: {
                              ...(config.spec as GatewaySpec)?.infrastructure,
                              parametersRef: {
                                ...(config.spec as GatewaySpec)?.infrastructure?.parametersRef,
                                kind: e.target.value || undefined,
                              },
                            },
                          });
                        }}
                        placeholder="GatewayClassParameters"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                      <input
                        type="text"
                        value={(config.spec as GatewaySpec)?.infrastructure?.parametersRef?.name || ""}
                        onChange={(e) => {
                          onConfigChange("spec", {
                            ...(config.spec as GatewaySpec || {}),
                            infrastructure: {
                              ...(config.spec as GatewaySpec)?.infrastructure,
                              parametersRef: {
                                ...(config.spec as GatewaySpec)?.infrastructure?.parametersRef,
                                name: e.target.value || undefined,
                              },
                            },
                          });
                        }}
                        placeholder="default-params"
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-foreground/50 mt-2">Reference to gateway class parameters configuration</p>
                </div>
              </div>
            </div>
          )}

          {/* NetworkPolicy Spec Section */}
          {expandedSections.has(section.id) && section.id === "spec" && config.type === "NetworkPolicy" && (
            <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
              {/* Pod Selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Pod Selector</label>

                {/* Match Labels */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-foreground mb-2">Match Labels</label>
                  {renderTagsField(
                    (config.spec as NetworkPolicySpec)?.podSelector?.matchLabels,
                    (value) => {
                      onConfigChange("spec", {
                        ...(config.spec as NetworkPolicySpec || {}),
                        podSelector: {
                          ...(config.spec as NetworkPolicySpec)?.podSelector,
                          matchLabels: value,
                        },
                      });
                    },
                    "Pod Selector Labels",
                    "Add label (key=value)"
                  )}
                  <p className="text-xs text-foreground/50 mt-1">Labels that pods must match</p>
                </div>

                {/* Match Expressions */}
                <div className="border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-medium text-foreground">Match Expressions</label>
                    <button
                      onClick={() => {
                        const expressions = (config.spec as NetworkPolicySpec)?.podSelector?.matchExpressions || [];
                        onConfigChange("spec", {
                          ...(config.spec as NetworkPolicySpec || {}),
                          podSelector: {
                            ...(config.spec as NetworkPolicySpec)?.podSelector,
                            matchExpressions: [...expressions, { key: "", operator: "", values: [] }],
                          },
                        });
                      }}
                      className="text-primary hover:opacity-70 text-sm"
                    >
                      + Add Expression
                    </button>
                  </div>

                  {((config.spec as NetworkPolicySpec)?.podSelector?.matchExpressions && (config.spec as NetworkPolicySpec).podSelector!.matchExpressions.length > 0) ? (
                    <div className="space-y-3">
                      {((config.spec as NetworkPolicySpec)?.podSelector?.matchExpressions || []).map((expr, exprIdx) => (
                        <div key={exprIdx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Key</label>
                              <input
                                type="text"
                                value={expr.key || ""}
                                onChange={(e) => {
                                  const updated = [...((config.spec as NetworkPolicySpec)?.podSelector?.matchExpressions || [])];
                                  updated[exprIdx] = { ...expr, key: e.target.value || undefined };
                                  onConfigChange("spec", {
                                    ...(config.spec as NetworkPolicySpec || {}),
                                    podSelector: {
                                      ...(config.spec as NetworkPolicySpec)?.podSelector,
                                      matchExpressions: updated,
                                    },
                                  });
                                }}
                                placeholder="app"
                                className="input-field text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">Operator</label>
                              <select
                                value={expr.operator || ""}
                                onChange={(e) => {
                                  const updated = [...((config.spec as NetworkPolicySpec)?.podSelector?.matchExpressions || [])];
                                  updated[exprIdx] = { ...expr, operator: e.target.value || undefined };
                                  onConfigChange("spec", {
                                    ...(config.spec as NetworkPolicySpec || {}),
                                    podSelector: {
                                      ...(config.spec as NetworkPolicySpec)?.podSelector,
                                      matchExpressions: updated,
                                    },
                                  });
                                }}
                                className="input-field text-sm"
                              >
                                <option value="">Select Operator</option>
                                <option value="In">In</option>
                                <option value="NotIn">NotIn</option>
                                <option value="Exists">Exists</option>
                                <option value="DoesNotExist">DoesNotExist</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-2">Values</label>
                            <div className="space-y-2">
                              {(expr.values || []).map((val, valIdx) => (
                                <div key={valIdx} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => {
                                      const updated = [...((config.spec as NetworkPolicySpec)?.podSelector?.matchExpressions || [])];
                                      const values = [...(expr.values || [])];
                                      values[valIdx] = e.target.value || "";
                                      updated[exprIdx] = { ...expr, values };
                                      onConfigChange("spec", {
                                        ...(config.spec as NetworkPolicySpec || {}),
                                        podSelector: {
                                          ...(config.spec as NetworkPolicySpec)?.podSelector,
                                          matchExpressions: updated,
                                        },
                                      });
                                    }}
                                    placeholder="production"
                                    className="input-field text-sm flex-1"
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = [...((config.spec as NetworkPolicySpec)?.podSelector?.matchExpressions || [])];
                                      const values = (expr.values || []).filter((_, i) => i !== valIdx);
                                      updated[exprIdx] = { ...expr, values: values.length > 0 ? values : undefined };
                                      onConfigChange("spec", {
                                        ...(config.spec as NetworkPolicySpec || {}),
                                        podSelector: {
                                          ...(config.spec as NetworkPolicySpec)?.podSelector,
                                          matchExpressions: updated,
                                        },
                                      });
                                    }}
                                    className="text-destructive hover:opacity-70"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const updated = [...((config.spec as NetworkPolicySpec)?.podSelector?.matchExpressions || [])];
                                  updated[exprIdx] = { ...expr, values: [...(expr.values || []), ""] };
                                  onConfigChange("spec", {
                                    ...(config.spec as NetworkPolicySpec || {}),
                                    podSelector: {
                                      ...(config.spec as NetworkPolicySpec)?.podSelector,
                                      matchExpressions: updated,
                                    },
                                  });
                                }}
                                className="text-primary hover:opacity-70 text-sm"
                              >
                                + Add Value
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const updated = ((config.spec as NetworkPolicySpec)?.podSelector?.matchExpressions || []).filter((_, i) => i !== exprIdx);
                              onConfigChange("spec", {
                                ...(config.spec as NetworkPolicySpec || {}),
                                podSelector: {
                                  ...(config.spec as NetworkPolicySpec)?.podSelector,
                                  matchExpressions: updated.length > 0 ? updated : undefined,
                                },
                              });
                            }}
                            className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                          >
                            Remove Expression
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-foreground/60 text-sm py-2">No match expressions defined</p>
                  )}
                </div>
              </div>

              {/* Policy Types */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Policy Types</label>
                  <button
                    onClick={() => {
                      const types = (config.spec as NetworkPolicySpec)?.policyTypes || [];
                      onConfigChange("spec", {
                        ...(config.spec as NetworkPolicySpec || {}),
                        policyTypes: [...types, ""],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Type
                  </button>
                </div>

                {((config.spec as NetworkPolicySpec)?.policyTypes && (config.spec as NetworkPolicySpec).policyTypes.length > 0) ? (
                  <div className="space-y-2">
                    {((config.spec as NetworkPolicySpec)?.policyTypes || []).map((type, typeIdx) => (
                      <div key={typeIdx} className="flex gap-2 items-center">
                        <select
                          value={type || ""}
                          onChange={(e) => {
                            const updated = [...((config.spec as NetworkPolicySpec)?.policyTypes || [])];
                            updated[typeIdx] = e.target.value || "";
                            onConfigChange("spec", {
                              ...(config.spec as NetworkPolicySpec || {}),
                              policyTypes: updated,
                            });
                          }}
                          className="input-field text-sm flex-1"
                        >
                          <option value="">Select Type</option>
                          <option value="Ingress">Ingress</option>
                          <option value="Egress">Egress</option>
                        </select>
                        <button
                          onClick={() => {
                            const updated = ((config.spec as NetworkPolicySpec)?.policyTypes || []).filter((_, i) => i !== typeIdx);
                            onConfigChange("spec", {
                              ...(config.spec as NetworkPolicySpec || {}),
                              policyTypes: updated.length > 0 ? updated : undefined,
                            });
                          }}
                          className="text-destructive hover:opacity-70"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No policy types defined</p>
                )}
                <p className="text-xs text-foreground/50 mt-2">Ingress and/or Egress</p>
              </div>

              {/* Ingress Rules */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Ingress Rules</label>
                  <button
                    onClick={() => {
                      const rules = (config.spec as NetworkPolicySpec)?.ingress || [];
                      onConfigChange("spec", {
                        ...(config.spec as NetworkPolicySpec || {}),
                        ingress: [...rules, { ports: [], peers: [] }],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Rule
                  </button>
                </div>

                {((config.spec as NetworkPolicySpec)?.ingress && (config.spec as NetworkPolicySpec).ingress.length > 0) ? (
                  <div className="space-y-3">
                    {((config.spec as NetworkPolicySpec)?.ingress || []).map((rule, ruleIdx) => (
                      <div key={ruleIdx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <h4 className="font-semibold text-foreground text-sm">Ingress Rule {ruleIdx + 1}</h4>

                        {/* Ports */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Ports</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                const ports = [...(rule.ports || [])];
                                ports.push({ protocol: "TCP", port: undefined });
                                updated[ruleIdx] = { ...rule, ports };
                                onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Port
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(rule.ports || []).map((port, portIdx) => (
                              <div key={portIdx} className="p-2 bg-background/50 rounded space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Protocol</label>
                                    <input
                                      type="text"
                                      value={port.protocol || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                        const ports = [...(rule.ports || [])];
                                        ports[portIdx] = { ...port, protocol: e.target.value || undefined };
                                        updated[ruleIdx] = { ...rule, ports };
                                        onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                      }}
                                      placeholder="TCP"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Port</label>
                                    <input
                                      type="number"
                                      value={port.port || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                        const ports = [...(rule.ports || [])];
                                        ports[portIdx] = { ...port, port: e.target.value ? parseInt(e.target.value) : undefined };
                                        updated[ruleIdx] = { ...rule, ports };
                                        onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                      }}
                                      placeholder="80"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">EndPort</label>
                                    <input
                                      type="number"
                                      value={port.endPort || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                        const ports = [...(rule.ports || [])];
                                        ports[portIdx] = { ...port, endPort: e.target.value ? parseInt(e.target.value) : undefined };
                                        updated[ruleIdx] = { ...rule, ports };
                                        onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                      }}
                                      placeholder="443"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                    const ports = (rule.ports || []).filter((_, i) => i !== portIdx);
                                    updated[ruleIdx] = { ...rule, ports: ports.length > 0 ? ports : undefined };
                                    onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                  }}
                                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                >
                                  Remove Port
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Peers */}
                        <div className="border-t border-border/30 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Peers</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                const peers = [...(rule.peers || [])];
                                peers.push({});
                                updated[ruleIdx] = { ...rule, peers };
                                onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Peer
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(rule.peers || []).map((peer, peerIdx) => (
                              <div key={peerIdx} className="bg-background/50 p-3 rounded space-y-3">
                                {/* IP Block */}
                                <div className="space-y-2">
                                  <label className="block text-xs font-medium text-foreground">IP Block</label>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground/70 mb-1">CIDR</label>
                                    <input
                                      type="text"
                                      value={peer.ipBlock?.cidr || ""}
                                      onChange={(e) => {
                                        const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                        const peers = [...(rule.peers || [])];
                                        peers[peerIdx] = {
                                          ...peer,
                                          ipBlock: { ...peer.ipBlock, cidr: e.target.value || undefined },
                                        };
                                        updated[ruleIdx] = { ...rule, peers };
                                        onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                      }}
                                      placeholder="192.168.0.0/24"
                                      className="input-field text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-foreground/70 mb-1">Except</label>
                                    <div className="space-y-1">
                                      {(peer.ipBlock?.except || []).map((exceptCidr, exceptIdx) => (
                                        <div key={exceptIdx} className="flex gap-2 items-center">
                                          <input
                                            type="text"
                                            value={exceptCidr}
                                            onChange={(e) => {
                                              const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                              const peers = [...(rule.peers || [])];
                                              const exceptList = [...(peer.ipBlock?.except || [])];
                                              exceptList[exceptIdx] = e.target.value || "";
                                              peers[peerIdx] = {
                                                ...peer,
                                                ipBlock: { ...peer.ipBlock, except: exceptList },
                                              };
                                              updated[ruleIdx] = { ...rule, peers };
                                              onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                            }}
                                            placeholder="192.168.0.128/25"
                                            className="input-field text-xs flex-1"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                              const peers = [...(rule.peers || [])];
                                              const exceptList = (peer.ipBlock?.except || []).filter((_, i) => i !== exceptIdx);
                                              peers[peerIdx] = {
                                                ...peer,
                                                ipBlock: { ...peer.ipBlock, except: exceptList.length > 0 ? exceptList : undefined },
                                              };
                                              updated[ruleIdx] = { ...rule, peers };
                                              onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                            }}
                                            className="text-destructive hover:opacity-70"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                          const peers = [...(rule.peers || [])];
                                          peers[peerIdx] = {
                                            ...peer,
                                            ipBlock: { ...peer.ipBlock, except: [...(peer.ipBlock?.except || []), ""] },
                                          };
                                          updated[ruleIdx] = { ...rule, peers };
                                          onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Exception
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Namespace Selector */}
                                <div className="border-t border-border/30 pt-2">
                                  <label className="block text-xs font-medium text-foreground mb-2">Namespace Selector</label>
                                  <div className="space-y-2">
                                    <div>
                                      <label className="block text-xs font-medium text-foreground/70 mb-1">Match Labels</label>
                                      {renderTagsField(
                                        peer.namespaceSelector?.matchLabels,
                                        (value) => {
                                          const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                          const peers = [...(rule.peers || [])];
                                          peers[peerIdx] = {
                                            ...peer,
                                            namespaceSelector: { ...peer.namespaceSelector, matchLabels: value },
                                          };
                                          updated[ruleIdx] = { ...rule, peers };
                                          onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                        },
                                        "Namespace Labels",
                                        "Add label (key=value)"
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-foreground/70 mb-1">Match Expressions</label>
                                      {(peer.namespaceSelector?.matchExpressions || []).length > 0 ? (
                                        <div className="space-y-1">
                                          {(peer.namespaceSelector?.matchExpressions || []).map((expr, exprIdx) => (
                                            <div key={exprIdx} className="flex gap-1 items-center text-xs">
                                              <span className="text-foreground/70">{expr.key}</span>
                                              <span className="text-foreground/50">{expr.operator}</span>
                                              <span className="text-foreground/70">{expr.values?.join(", ")}</span>
                                              <button
                                                onClick={() => {
                                                  const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                                  const peers = [...(rule.peers || [])];
                                                  const exprs = (peer.namespaceSelector?.matchExpressions || []).filter((_, i) => i !== exprIdx);
                                                  peers[peerIdx] = {
                                                    ...peer,
                                                    namespaceSelector: { ...peer.namespaceSelector, matchExpressions: exprs.length > 0 ? exprs : undefined },
                                                  };
                                                  updated[ruleIdx] = { ...rule, peers };
                                                  onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                                }}
                                                className="text-destructive hover:opacity-70 ml-auto"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                          const peers = [...(rule.peers || [])];
                                          peers[peerIdx] = {
                                            ...peer,
                                            namespaceSelector: {
                                              ...peer.namespaceSelector,
                                              matchExpressions: [...(peer.namespaceSelector?.matchExpressions || []), { key: "", operator: "", values: [] }],
                                            },
                                          };
                                          updated[ruleIdx] = { ...rule, peers };
                                          onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Expression
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Pod Selector */}
                                <div className="border-t border-border/30 pt-2">
                                  <label className="block text-xs font-medium text-foreground mb-2">Pod Selector</label>
                                  <div className="space-y-2">
                                    <div>
                                      <label className="block text-xs font-medium text-foreground/70 mb-1">Match Labels</label>
                                      {renderTagsField(
                                        peer.podSelector?.matchLabels,
                                        (value) => {
                                          const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                          const peers = [...(rule.peers || [])];
                                          peers[peerIdx] = {
                                            ...peer,
                                            podSelector: { ...peer.podSelector, matchLabels: value },
                                          };
                                          updated[ruleIdx] = { ...rule, peers };
                                          onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                        },
                                        "Pod Labels",
                                        "Add label (key=value)"
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-foreground/70 mb-1">Match Expressions</label>
                                      {(peer.podSelector?.matchExpressions || []).length > 0 ? (
                                        <div className="space-y-1">
                                          {(peer.podSelector?.matchExpressions || []).map((expr, exprIdx) => (
                                            <div key={exprIdx} className="flex gap-1 items-center text-xs">
                                              <span className="text-foreground/70">{expr.key}</span>
                                              <span className="text-foreground/50">{expr.operator}</span>
                                              <span className="text-foreground/70">{expr.values?.join(", ")}</span>
                                              <button
                                                onClick={() => {
                                                  const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                                  const peers = [...(rule.peers || [])];
                                                  const exprs = (peer.podSelector?.matchExpressions || []).filter((_, i) => i !== exprIdx);
                                                  peers[peerIdx] = {
                                                    ...peer,
                                                    podSelector: { ...peer.podSelector, matchExpressions: exprs.length > 0 ? exprs : undefined },
                                                  };
                                                  updated[ruleIdx] = { ...rule, peers };
                                                  onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                                }}
                                                className="text-destructive hover:opacity-70 ml-auto"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                      <button
                                        onClick={() => {
                                          const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                          const peers = [...(rule.peers || [])];
                                          peers[peerIdx] = {
                                            ...peer,
                                            podSelector: {
                                              ...peer.podSelector,
                                              matchExpressions: [...(peer.podSelector?.matchExpressions || []), { key: "", operator: "", values: [] }],
                                            },
                                          };
                                          updated[ruleIdx] = { ...rule, peers };
                                          onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                        }}
                                        className="text-primary hover:opacity-70 text-xs"
                                      >
                                        + Add Expression
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as NetworkPolicySpec)?.ingress || [])];
                                    const peers = (rule.peers || []).filter((_, i) => i !== peerIdx);
                                    updated[ruleIdx] = { ...rule, peers: peers.length > 0 ? peers : undefined };
                                    onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), ingress: updated });
                                  }}
                                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors border-t border-border/30"
                                >
                                  Remove Peer
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const updated = ((config.spec as NetworkPolicySpec)?.ingress || []).filter((_, i) => i !== ruleIdx);
                            onConfigChange("spec", {
                              ...(config.spec as NetworkPolicySpec || {}),
                              ingress: updated.length > 0 ? updated : undefined,
                            });
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors border-t border-border/50"
                        >
                          Remove Rule
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No ingress rules defined</p>
                )}
              </div>

              {/* Egress Rules */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Egress Rules</label>
                  <button
                    onClick={() => {
                      const rules = (config.spec as NetworkPolicySpec)?.egress || [];
                      onConfigChange("spec", {
                        ...(config.spec as NetworkPolicySpec || {}),
                        egress: [...rules, { ports: [], peers: [] }],
                      });
                    }}
                    className="text-primary hover:opacity-70 text-sm"
                  >
                    + Add Rule
                  </button>
                </div>

                {((config.spec as NetworkPolicySpec)?.egress && (config.spec as NetworkPolicySpec).egress.length > 0) ? (
                  <div className="space-y-3">
                    {((config.spec as NetworkPolicySpec)?.egress || []).map((rule, ruleIdx) => (
                      <div key={ruleIdx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                        <h4 className="font-semibold text-foreground text-sm">Egress Rule {ruleIdx + 1}</h4>

                        {/* Ports */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Ports</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                const ports = [...(rule.ports || [])];
                                ports.push({ protocol: "TCP", port: undefined });
                                updated[ruleIdx] = { ...rule, ports };
                                onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Port
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(rule.ports || []).map((port, portIdx) => (
                              <div key={portIdx} className="flex gap-2 items-center bg-background/50 p-2 rounded">
                                <input
                                  type="text"
                                  value={port.protocol || ""}
                                  onChange={(e) => {
                                    const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                    const ports = [...(rule.ports || [])];
                                    ports[portIdx] = { ...port, protocol: e.target.value || undefined };
                                    updated[ruleIdx] = { ...rule, ports };
                                    onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                                  }}
                                  placeholder="TCP"
                                  className="input-field text-xs flex-1"
                                />
                                <input
                                  type="number"
                                  value={port.port || ""}
                                  onChange={(e) => {
                                    const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                    const ports = [...(rule.ports || [])];
                                    ports[portIdx] = { ...port, port: e.target.value ? parseInt(e.target.value) : undefined };
                                    updated[ruleIdx] = { ...rule, ports };
                                    onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                                  }}
                                  placeholder="80"
                                  className="input-field text-xs flex-1"
                                />
                                <input
                                  type="number"
                                  value={port.endPort || ""}
                                  onChange={(e) => {
                                    const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                    const ports = [...(rule.ports || [])];
                                    ports[portIdx] = { ...port, endPort: e.target.value ? parseInt(e.target.value) : undefined };
                                    updated[ruleIdx] = { ...rule, ports };
                                    onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                                  }}
                                  placeholder="443"
                                  className="input-field text-xs flex-1"
                                />
                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                    const ports = (rule.ports || []).filter((_, i) => i !== portIdx);
                                    updated[ruleIdx] = { ...rule, ports: ports.length > 0 ? ports : undefined };
                                    onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                                  }}
                                  className="text-destructive hover:opacity-70"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Peers */}
                        <div className="border-t border-border/30 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-foreground">Peers</label>
                            <button
                              onClick={() => {
                                const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                const peers = [...(rule.peers || [])];
                                peers.push({});
                                updated[ruleIdx] = { ...rule, peers };
                                onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                              }}
                              className="text-primary hover:opacity-70 text-xs"
                            >
                              + Add Peer
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(rule.peers || []).map((peer, peerIdx) => (
                              <div key={peerIdx} className="bg-background/50 p-2 rounded space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">IP Block (CIDR)</label>
                                  <input
                                    type="text"
                                    value={peer.ipBlock?.cidr || ""}
                                    onChange={(e) => {
                                      const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                      const peers = [...(rule.peers || [])];
                                      peers[peerIdx] = {
                                        ...peer,
                                        ipBlock: { ...peer.ipBlock, cidr: e.target.value || undefined },
                                      };
                                      updated[ruleIdx] = { ...rule, peers };
                                      onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                                    }}
                                    placeholder="192.168.0.0/24"
                                    className="input-field text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Namespace Selector</label>
                                  {renderTagsField(
                                    peer.namespaceSelector?.matchLabels,
                                    (value) => {
                                      const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                      const peers = [...(rule.peers || [])];
                                      peers[peerIdx] = {
                                        ...peer,
                                        namespaceSelector: { ...peer.namespaceSelector, matchLabels: value },
                                      };
                                      updated[ruleIdx] = { ...rule, peers };
                                      onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                                    },
                                    "Namespace Labels",
                                    "Add label (key=value)"
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-foreground mb-1">Pod Selector</label>
                                  {renderTagsField(
                                    peer.podSelector?.matchLabels,
                                    (value) => {
                                      const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                      const peers = [...(rule.peers || [])];
                                      peers[peerIdx] = {
                                        ...peer,
                                        podSelector: { ...peer.podSelector, matchLabels: value },
                                      };
                                      updated[ruleIdx] = { ...rule, peers };
                                      onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                                    },
                                    "Pod Labels",
                                    "Add label (key=value)"
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = [...((config.spec as NetworkPolicySpec)?.egress || [])];
                                    const peers = (rule.peers || []).filter((_, i) => i !== peerIdx);
                                    updated[ruleIdx] = { ...rule, peers: peers.length > 0 ? peers : undefined };
                                    onConfigChange("spec", { ...(config.spec as NetworkPolicySpec || {}), egress: updated });
                                  }}
                                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded transition-colors"
                                >
                                  Remove Peer
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const updated = ((config.spec as NetworkPolicySpec)?.egress || []).filter((_, i) => i !== ruleIdx);
                            onConfigChange("spec", {
                              ...(config.spec as NetworkPolicySpec || {}),
                              egress: updated.length > 0 ? updated : undefined,
                            });
                          }}
                          className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors border-t border-border/50"
                        >
                          Remove Rule
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm py-2">No egress rules defined</p>
                )}
              </div>
            </div>
          )}

          {/* Resource-specific sections will be rendered here based on type */}
          {expandedSections.has(section.id) && section.id !== "metadata" && config.type !== "Service" && config.type !== "HTTPRoute" && config.type !== "GRPCRoute" && config.type !== "Gateway" && config.type !== "NetworkPolicy" && (
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
