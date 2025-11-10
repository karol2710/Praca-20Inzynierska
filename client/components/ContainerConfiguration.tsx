import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface ContainerConfig {
  name?: string;
  image?: string;
  imagePullPolicy?: "Always" | "Never" | "IfNotPresent";
  workingDirectory?: string;
  
  // Ports
  ports?: {
    name?: string;
    containerPort: number;
    hostPort?: number;
    hostIP?: string;
    protocol?: "TCP" | "UDP" | "SCTP"
  }[];
  
  // Command
  command?: string[];
  args?: string[];
  
  // Environment
  env?: {
    name: string;
    value?: string;
    valueFrom?: {
      configMapKeyRef?: { name: string; key: string };
      fieldRef?: { apiVersion: string; fieldPath: string };
      resourceFieldRef?: { containerName?: string; divisor?: string; resource: string };
      secretKeyRef?: { name: string; key: string };
    };
  }[];
  envFrom?: {
    configMapRef?: { name: string };
    secretRef?: { name: string };
    prefix?: string;
  }[];
  
  // Resources
  resources?: {
    limits?: {
      cpu?: string;
      memory?: string;
      storage?: string;
      ephemeralStorage?: string;
    };
    requests?: {
      cpu?: string;
      memory?: string;
      storage?: string;
      ephemeralStorage?: string;
    };
  };
  
  // Probes
  livenessProbe?: ProbeConfig;
  readinessProbe?: ProbeConfig;
  startupProbe?: ProbeConfig;
  
  // Lifecycle
  lifecycle?: {
    postStart?: LifecycleHook;
    preStop?: LifecycleHook;
  };
  
  // I/O
  stdin?: boolean;
  stdinOnce?: boolean;
  tty?: boolean;
  
  // Termination
  terminationMessagePath?: string;
  terminationMessagePolicy?: "File" | "FallbackToLogsOnError";
  
  // Advanced
  resizePolicy?: { type: string; resourceName: string }[];
  restartPolicy?: "Always" | "OnFailure" | "Never";
}

interface ProbeConfig {
  exec?: { command: string[] };
  httpGet?: { path: string; port: number; scheme?: string };
  tcpSocket?: { host?: string; port: number };
  grpc?: { port: number; service?: string };
  initialDelaySeconds?: number;
  timeoutSeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
  terminationGracePeriodSeconds?: number;
}

interface LifecycleHook {
  exec?: { command: string[] };
  httpGet?: {
    host?: string;
    httpHeaders?: { name: string; value: string }[];
    path: string;
    port: number;
    scheme?: string;
  };
  tcpSocket?: { host?: string; port: number };
  sleep?: { seconds: number };
}

interface ContainerConfigurationProps {
  container: ContainerConfig;
  onConfigChange: (key: keyof ContainerConfig, value: any) => void;
}

interface ConfigSection {
  id: string;
  title: string;
  description: string;
}

interface LifecycleHookEditorProps {
  title: string;
  hook?: LifecycleHook;
  onHookChange: (hook?: LifecycleHook) => void;
}

function LifecycleHookEditor({ title, hook, onHookChange }: LifecycleHookEditorProps) {
  const [hookType, setHookType] = useState<"exec" | "httpGet" | "sleep" | undefined>(
    hook?.exec ? "exec" : hook?.httpGet ? "httpGet" : hook?.sleep ? "sleep" : undefined
  );

  return (
    <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
      <h4 className="font-semibold text-foreground">{title}</h4>

      {/* Hook Type Selection */}
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            checked={!hookType}
            onChange={() => {
              setHookType(undefined);
              onHookChange(undefined);
            }}
            className="w-3 h-3 cursor-pointer"
          />
          <span className="text-foreground">None</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            checked={hookType === "exec"}
            onChange={() => setHookType("exec")}
            className="w-3 h-3 cursor-pointer"
          />
          <span className="text-foreground">Exec</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            checked={hookType === "httpGet"}
            onChange={() => setHookType("httpGet")}
            className="w-3 h-3 cursor-pointer"
          />
          <span className="text-foreground">HTTP Get</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            checked={hookType === "sleep"}
            onChange={() => setHookType("sleep")}
            className="w-3 h-3 cursor-pointer"
          />
          <span className="text-foreground">Sleep</span>
        </label>
      </div>

      {/* Exec */}
      {hookType === "exec" && (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-medium text-foreground">Command</label>
          <div className="space-y-1">
            {(hook?.exec?.command || []).map((cmd, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={cmd}
                  onChange={(e) => {
                    const updated = [...(hook?.exec?.command || [])];
                    updated[idx] = e.target.value;
                    onHookChange({ exec: { command: updated } });
                  }}
                  className="input-field text-sm flex-1"
                />
                <button
                  onClick={() => {
                    onHookChange({
                      exec: {
                        command: (hook?.exec?.command || []).filter((_, i) => i !== idx),
                      },
                    });
                  }}
                  className="text-destructive hover:opacity-70"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              onHookChange({
                exec: { command: [...(hook?.exec?.command || []), ""] },
              });
            }}
            className="text-primary hover:opacity-70 text-xs"
          >
            + Add Command
          </button>
        </div>
      )}

      {/* HTTP Get */}
      {hookType === "httpGet" && (
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Host</label>
              <input
                type="text"
                value={hook?.httpGet?.host || ""}
                onChange={(e) => {
                  onHookChange({
                    httpGet: { ...hook?.httpGet, host: e.target.value || undefined, path: hook?.httpGet?.path || "", port: hook?.httpGet?.port || 80 },
                  });
                }}
                placeholder="localhost"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Port</label>
              <input
                type="number"
                value={hook?.httpGet?.port || 80}
                onChange={(e) => {
                  onHookChange({
                    httpGet: { ...hook?.httpGet, port: parseInt(e.target.value) || 80, path: hook?.httpGet?.path || "" },
                  });
                }}
                className="input-field text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">Path</label>
              <input
                type="text"
                value={hook?.httpGet?.path || ""}
                onChange={(e) => {
                  onHookChange({
                    httpGet: { ...hook?.httpGet, path: e.target.value, port: hook?.httpGet?.port || 80 },
                  });
                }}
                placeholder="/healthz"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Scheme</label>
              <select
                value={hook?.httpGet?.scheme || "HTTP"}
                onChange={(e) => {
                  onHookChange({
                    httpGet: { ...hook?.httpGet, scheme: e.target.value, path: hook?.httpGet?.path || "", port: hook?.httpGet?.port || 80 },
                  });
                }}
                className="input-field text-sm"
              >
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">HTTP Headers</label>
            <div className="space-y-1">
              {(hook?.httpGet?.httpHeaders || []).map((header, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={header.name}
                    onChange={(e) => {
                      const updated = [...(hook?.httpGet?.httpHeaders || [])];
                      updated[idx] = { ...header, name: e.target.value };
                      onHookChange({
                        httpGet: { ...hook?.httpGet, httpHeaders: updated, path: hook?.httpGet?.path || "", port: hook?.httpGet?.port || 80 },
                      });
                    }}
                    placeholder="Header Name"
                    className="input-field text-sm flex-1"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => {
                      const updated = [...(hook?.httpGet?.httpHeaders || [])];
                      updated[idx] = { ...header, value: e.target.value };
                      onHookChange({
                        httpGet: { ...hook?.httpGet, httpHeaders: updated, path: hook?.httpGet?.path || "", port: hook?.httpGet?.port || 80 },
                      });
                    }}
                    placeholder="Header Value"
                    className="input-field text-sm flex-1"
                  />
                  <button
                    onClick={() => {
                      onHookChange({
                        httpGet: {
                          ...hook?.httpGet,
                          httpHeaders: (hook?.httpGet?.httpHeaders || []).filter((_, i) => i !== idx),
                          path: hook?.httpGet?.path || "",
                          port: hook?.httpGet?.port || 80,
                        },
                      });
                    }}
                    className="text-destructive hover:opacity-70"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                onHookChange({
                  httpGet: {
                    ...hook?.httpGet,
                    httpHeaders: [...(hook?.httpGet?.httpHeaders || []), { name: "", value: "" }],
                    path: hook?.httpGet?.path || "",
                    port: hook?.httpGet?.port || 80,
                  },
                });
              }}
              className="text-primary hover:opacity-70 text-xs"
            >
              + Add Header
            </button>
          </div>
        </div>
      )}

      {/* TCP Socket */}
      {hookType === "tcpSocket" && (
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Host</label>
              <input
                type="text"
                value={hook?.tcpSocket?.host || ""}
                onChange={(e) => {
                  onHookChange({
                    tcpSocket: { ...hook?.tcpSocket, host: e.target.value || undefined, port: hook?.tcpSocket?.port || 8080 },
                  });
                }}
                placeholder="localhost"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Port*</label>
              <input
                type="number"
                value={hook?.tcpSocket?.port || 8080}
                onChange={(e) => {
                  onHookChange({
                    tcpSocket: { ...hook?.tcpSocket, port: parseInt(e.target.value) || 8080 },
                  });
                }}
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sleep */}
      {hookType === "sleep" && (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-medium text-foreground mb-1">Sleep Duration (seconds)</label>
          <input
            type="number"
            value={hook?.sleep?.seconds || 5}
            onChange={(e) => {
              onHookChange({
                sleep: { seconds: parseInt(e.target.value) || 5 },
              });
            }}
            min="1"
            className="input-field text-sm"
          />
        </div>
      )}
    </div>
  );
}

const sections: ConfigSection[] = [
  { id: "basic", title: "Basic", description: "Name, image, and working directory" },
  { id: "ports", title: "Ports", description: "Exposed ports and protocols" },
  { id: "environment", title: "Environment", description: "Environment variables" },
  { id: "command", title: "Command & Args", description: "Entrypoint and arguments" },
  { id: "resources", title: "Resources", description: "CPU and memory limits" },
  { id: "image", title: "Image", description: "Image pull policy" },
  { id: "probes", title: "Health Probes", description: "Liveness, readiness, and startup probes" },
  { id: "lifecycle", title: "Lifecycle", description: "PostStart and preStop hooks" },
  { id: "io", title: "I/O", description: "STDIN and TTY settings" },
  { id: "termination", title: "Termination", description: "Termination behavior" },
  { id: "advanced", title: "Advanced", description: "Resize policy and restart policy" },
];

export default function ContainerConfiguration({
  container,
  onConfigChange,
}: ContainerConfigurationProps) {
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

  const renderSection = (section: ConfigSection) => {
    switch (section.id) {
      case "basic":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <input
                type="text"
                value={container.name || ""}
                onChange={(e) => onConfigChange("name", e.target.value || undefined)}
                placeholder="container-name"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Image</label>
              <input
                type="text"
                value={container.image || ""}
                onChange={(e) => onConfigChange("image", e.target.value || undefined)}
                placeholder="nginx:latest"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Working Directory</label>
              <input
                type="text"
                value={container.workingDirectory || ""}
                onChange={(e) => onConfigChange("workingDirectory", e.target.value || undefined)}
                placeholder="/app"
                className="input-field"
              />
            </div>
          </div>
        );

      case "ports":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium text-foreground text-sm">Ports</h5>
              <button
                onClick={() => {
                  const ports = container.ports || [];
                  onConfigChange("ports", [...ports, { containerPort: 8080, protocol: "TCP" }]);
                }}
                className="text-primary hover:opacity-70 text-sm"
              >
                + Add Port
              </button>
            </div>
            <div className="space-y-3">
              {container.ports?.map((port, idx) => (
                <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                      <input
                        type="text"
                        value={port.name || ""}
                        onChange={(e) => {
                          const updated = [...(container.ports || [])];
                          updated[idx] = { ...port, name: e.target.value || undefined };
                          onConfigChange("ports", updated);
                        }}
                        placeholder="http"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Container Port*</label>
                      <input
                        type="number"
                        value={port.containerPort}
                        onChange={(e) => {
                          const updated = [...(container.ports || [])];
                          updated[idx] = { ...port, containerPort: parseInt(e.target.value) || 8080 };
                          onConfigChange("ports", updated);
                        }}
                        placeholder="8080"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Host Port</label>
                      <input
                        type="number"
                        value={port.hostPort || ""}
                        onChange={(e) => {
                          const updated = [...(container.ports || [])];
                          updated[idx] = { ...port, hostPort: e.target.value ? parseInt(e.target.value) : undefined };
                          onConfigChange("ports", updated);
                        }}
                        placeholder="8080"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Host IP</label>
                      <input
                        type="text"
                        value={port.hostIP || ""}
                        onChange={(e) => {
                          const updated = [...(container.ports || [])];
                          updated[idx] = { ...port, hostIP: e.target.value || undefined };
                          onConfigChange("ports", updated);
                        }}
                        placeholder="0.0.0.0"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Protocol</label>
                      <select
                        value={port.protocol || "TCP"}
                        onChange={(e) => {
                          const updated = [...(container.ports || [])];
                          updated[idx] = { ...port, protocol: e.target.value as "TCP" | "UDP" | "SCTP" };
                          onConfigChange("ports", updated);
                        }}
                        className="input-field text-sm"
                      >
                        <option value="TCP">TCP</option>
                        <option value="UDP">UDP</option>
                        <option value="SCTP">SCTP</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onConfigChange(
                        "ports",
                        container.ports?.filter((_, i) => i !== idx)
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
        );

      case "environment":
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-foreground">Environment Variables</label>
                <button
                  onClick={() => {
                    const env = container.env || [];
                    onConfigChange("env", [...env, { name: "" }]);
                  }}
                  className="text-primary hover:opacity-70 text-sm"
                >
                  + Add Variable
                </button>
              </div>
              <div className="space-y-3">
                {container.env?.map((e, idx) => (
                  <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                    <div className="flex gap-2 items-end">
                      <input
                        type="text"
                        value={e.name}
                        onChange={(env) => {
                          const updated = [...(container.env || [])];
                          updated[idx].name = env.target.value;
                          onConfigChange("env", updated);
                        }}
                        placeholder="VARIABLE_NAME"
                        className="input-field flex-1"
                      />
                      <button
                        onClick={() => {
                          onConfigChange(
                            "env",
                            container.env?.filter((_, i) => i !== idx)
                          );
                        }}
                        className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded"
                      >
                        ×
                      </button>
                    </div>

                    {/* Value vs ValueFrom Toggle */}
                    <div className="flex gap-2 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={!e.valueFrom}
                          onChange={() => {
                            const updated = [...(container.env || [])];
                            updated[idx] = { ...e, value: "", valueFrom: undefined };
                            onConfigChange("env", updated);
                          }}
                          className="w-3 h-3 cursor-pointer"
                        />
                        <span className="text-foreground">Value</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={!!e.valueFrom}
                          onChange={() => {
                            const updated = [...(container.env || [])];
                            updated[idx] = { ...e, value: undefined, valueFrom: {} };
                            onConfigChange("env", updated);
                          }}
                          className="w-3 h-3 cursor-pointer"
                        />
                        <span className="text-foreground">Value From</span>
                      </label>
                    </div>

                    {/* Simple Value */}
                    {!e.valueFrom && (
                      <input
                        type="text"
                        value={e.value || ""}
                        onChange={(env) => {
                          const updated = [...(container.env || [])];
                          updated[idx].value = env.target.value || undefined;
                          onConfigChange("env", updated);
                        }}
                        placeholder="value"
                        className="input-field w-full"
                      />
                    )}

                    {/* ValueFrom Options */}
                    {e.valueFrom && (
                      <div className="space-y-3 pt-2 border-t border-border">
                        {/* ConfigMap Key Reference */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="radio"
                              checked={!!e.valueFrom?.configMapKeyRef && !e.valueFrom?.fieldRef && !e.valueFrom?.resourceFieldRef && !e.valueFrom?.secretKeyRef}
                              onChange={() => {
                                const updated = [...(container.env || [])];
                                updated[idx] = {
                                  ...e,
                                  valueFrom: { configMapKeyRef: { name: "", key: "" } },
                                };
                                onConfigChange("env", updated);
                              }}
                              className="w-3 h-3 cursor-pointer"
                            />
                            <span className="text-foreground font-medium">ConfigMap Key Reference</span>
                          </label>
                          {e.valueFrom?.configMapKeyRef && (
                            <div className="grid grid-cols-2 gap-2 pl-5">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                <input
                                  type="text"
                                  value={e.valueFrom.configMapKeyRef.name || ""}
                                  onChange={(ev) => {
                                    const updated = [...(container.env || [])];
                                    updated[idx] = {
                                      ...e,
                                      valueFrom: {
                                        ...e.valueFrom,
                                        configMapKeyRef: { ...e.valueFrom.configMapKeyRef, name: ev.target.value },
                                      },
                                    };
                                    onConfigChange("env", updated);
                                  }}
                                  placeholder="config-name"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Key</label>
                                <input
                                  type="text"
                                  value={e.valueFrom.configMapKeyRef.key || ""}
                                  onChange={(ev) => {
                                    const updated = [...(container.env || [])];
                                    updated[idx] = {
                                      ...e,
                                      valueFrom: {
                                        ...e.valueFrom,
                                        configMapKeyRef: { ...e.valueFrom.configMapKeyRef, key: ev.target.value },
                                      },
                                    };
                                    onConfigChange("env", updated);
                                  }}
                                  placeholder="config-key"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Field Reference */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="radio"
                              checked={!!e.valueFrom?.fieldRef && !e.valueFrom?.configMapKeyRef && !e.valueFrom?.resourceFieldRef && !e.valueFrom?.secretKeyRef}
                              onChange={() => {
                                const updated = [...(container.env || [])];
                                updated[idx] = {
                                  ...e,
                                  valueFrom: { fieldRef: { apiVersion: "v1", fieldPath: "" } },
                                };
                                onConfigChange("env", updated);
                              }}
                              className="w-3 h-3 cursor-pointer"
                            />
                            <span className="text-foreground font-medium">Field Reference</span>
                          </label>
                          {e.valueFrom?.fieldRef && (
                            <div className="grid grid-cols-2 gap-2 pl-5">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">API Version</label>
                                <input
                                  type="text"
                                  value={e.valueFrom.fieldRef.apiVersion || ""}
                                  onChange={(ev) => {
                                    const updated = [...(container.env || [])];
                                    updated[idx] = {
                                      ...e,
                                      valueFrom: {
                                        ...e.valueFrom,
                                        fieldRef: { ...e.valueFrom.fieldRef, apiVersion: ev.target.value },
                                      },
                                    };
                                    onConfigChange("env", updated);
                                  }}
                                  placeholder="v1"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Field Path</label>
                                <input
                                  type="text"
                                  value={e.valueFrom.fieldRef.fieldPath || ""}
                                  onChange={(ev) => {
                                    const updated = [...(container.env || [])];
                                    updated[idx] = {
                                      ...e,
                                      valueFrom: {
                                        ...e.valueFrom,
                                        fieldRef: { ...e.valueFrom.fieldRef, fieldPath: ev.target.value },
                                      },
                                    };
                                    onConfigChange("env", updated);
                                  }}
                                  placeholder="metadata.name"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Resource Field Reference */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="radio"
                              checked={!!e.valueFrom?.resourceFieldRef && !e.valueFrom?.configMapKeyRef && !e.valueFrom?.fieldRef && !e.valueFrom?.secretKeyRef}
                              onChange={() => {
                                const updated = [...(container.env || [])];
                                updated[idx] = {
                                  ...e,
                                  valueFrom: { resourceFieldRef: { resource: "" } },
                                };
                                onConfigChange("env", updated);
                              }}
                              className="w-3 h-3 cursor-pointer"
                            />
                            <span className="text-foreground font-medium">Resource Field Reference</span>
                          </label>
                          {e.valueFrom?.resourceFieldRef && (
                            <div className="grid grid-cols-3 gap-2 pl-5">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Container Name</label>
                                <input
                                  type="text"
                                  value={e.valueFrom.resourceFieldRef.containerName || ""}
                                  onChange={(ev) => {
                                    const updated = [...(container.env || [])];
                                    updated[idx] = {
                                      ...e,
                                      valueFrom: {
                                        ...e.valueFrom,
                                        resourceFieldRef: { ...e.valueFrom.resourceFieldRef, containerName: ev.target.value || undefined },
                                      },
                                    };
                                    onConfigChange("env", updated);
                                  }}
                                  placeholder="container-name"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Resource</label>
                                <input
                                  type="text"
                                  value={e.valueFrom.resourceFieldRef.resource || ""}
                                  onChange={(ev) => {
                                    const updated = [...(container.env || [])];
                                    updated[idx] = {
                                      ...e,
                                      valueFrom: {
                                        ...e.valueFrom,
                                        resourceFieldRef: { ...e.valueFrom.resourceFieldRef, resource: ev.target.value },
                                      },
                                    };
                                    onConfigChange("env", updated);
                                  }}
                                  placeholder="limits.cpu"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Divisor</label>
                                <input
                                  type="text"
                                  value={e.valueFrom.resourceFieldRef.divisor || ""}
                                  onChange={(ev) => {
                                    const updated = [...(container.env || [])];
                                    updated[idx] = {
                                      ...e,
                                      valueFrom: {
                                        ...e.valueFrom,
                                        resourceFieldRef: { ...e.valueFrom.resourceFieldRef, divisor: ev.target.value || undefined },
                                      },
                                    };
                                    onConfigChange("env", updated);
                                  }}
                                  placeholder="1m"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Secret Key Reference */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="radio"
                              checked={!!e.valueFrom?.secretKeyRef && !e.valueFrom?.configMapKeyRef && !e.valueFrom?.fieldRef && !e.valueFrom?.resourceFieldRef}
                              onChange={() => {
                                const updated = [...(container.env || [])];
                                updated[idx] = {
                                  ...e,
                                  valueFrom: { secretKeyRef: { name: "", key: "" } },
                                };
                                onConfigChange("env", updated);
                              }}
                              className="w-3 h-3 cursor-pointer"
                            />
                            <span className="text-foreground font-medium">Secret Key Reference</span>
                          </label>
                          {e.valueFrom?.secretKeyRef && (
                            <div className="grid grid-cols-2 gap-2 pl-5">
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                                <input
                                  type="text"
                                  value={e.valueFrom.secretKeyRef.name || ""}
                                  onChange={(ev) => {
                                    const updated = [...(container.env || [])];
                                    updated[idx] = {
                                      ...e,
                                      valueFrom: {
                                        ...e.valueFrom,
                                        secretKeyRef: { ...e.valueFrom.secretKeyRef, name: ev.target.value },
                                      },
                                    };
                                    onConfigChange("env", updated);
                                  }}
                                  placeholder="secret-name"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Key</label>
                                <input
                                  type="text"
                                  value={e.valueFrom.secretKeyRef.key || ""}
                                  onChange={(ev) => {
                                    const updated = [...(container.env || [])];
                                    updated[idx] = {
                                      ...e,
                                      valueFrom: {
                                        ...e.valueFrom,
                                        secretKeyRef: { ...e.valueFrom.secretKeyRef, key: ev.target.value },
                                      },
                                    };
                                    onConfigChange("env", updated);
                                  }}
                                  placeholder="secret-key"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-foreground">Environment From File</label>
                <button
                  onClick={() => {
                    const envFrom = container.envFrom || [];
                    onConfigChange("envFrom", [...envFrom, {}]);
                  }}
                  className="text-primary hover:opacity-70 text-sm"
                >
                  + Add Source
                </button>
              </div>
              <div className="space-y-3">
                {container.envFrom?.map((ef, idx) => (
                  <div key={idx} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                    {/* ConfigMap Reference */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-2">ConfigMap Reference</label>
                      <input
                        type="text"
                        value={ef.configMapRef?.name || ""}
                        onChange={(e) => {
                          const updated = [...(container.envFrom || [])];
                          updated[idx] = {
                            ...ef,
                            configMapRef: e.target.value ? { name: e.target.value } : undefined,
                          };
                          onConfigChange("envFrom", updated);
                        }}
                        placeholder="configmap-name"
                        className="input-field text-sm"
                      />
                      <p className="text-xs text-foreground/50 mt-1">Name of the ConfigMap to load</p>
                    </div>

                    {/* Prefix */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-2">Prefix</label>
                      <input
                        type="text"
                        value={ef.prefix || ""}
                        onChange={(e) => {
                          const updated = [...(container.envFrom || [])];
                          updated[idx] = { ...ef, prefix: e.target.value || undefined };
                          onConfigChange("envFrom", updated);
                        }}
                        placeholder="MYAPP_"
                        className="input-field text-sm"
                      />
                      <p className="text-xs text-foreground/50 mt-1">Optional prefix for all environment variables</p>
                    </div>

                    {/* Secret Reference */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-2">Secret Reference</label>
                      <input
                        type="text"
                        value={ef.secretRef?.name || ""}
                        onChange={(e) => {
                          const updated = [...(container.envFrom || [])];
                          updated[idx] = {
                            ...ef,
                            secretRef: e.target.value ? { name: e.target.value } : undefined,
                          };
                          onConfigChange("envFrom", updated);
                        }}
                        placeholder="secret-name"
                        className="input-field text-sm"
                      />
                      <p className="text-xs text-foreground/50 mt-1">Name of the Secret to load</p>
                    </div>

                    <button
                      onClick={() => {
                        onConfigChange(
                          "envFrom",
                          container.envFrom?.filter((_, i) => i !== idx)
                        );
                      }}
                      className="w-full text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded transition-colors"
                    >
                      Remove Source
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "command":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Command</label>
              <div className="space-y-2">
                {container.command?.map((cmd, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={cmd}
                      onChange={(e) => {
                        const updated = [...(container.command || [])];
                        updated[idx] = e.target.value;
                        onConfigChange("command", updated);
                      }}
                      className="input-field flex-1"
                    />
                    <button
                      onClick={() => {
                        onConfigChange(
                          "command",
                          container.command?.filter((_, i) => i !== idx)
                        );
                      }}
                      className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  onConfigChange("command", [...(container.command || []), ""]);
                }}
                className="text-primary hover:opacity-70 text-sm mt-2"
              >
                + Add Command
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Arguments</label>
              <div className="space-y-2">
                {container.args?.map((arg, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={arg}
                      onChange={(e) => {
                        const updated = [...(container.args || [])];
                        updated[idx] = e.target.value;
                        onConfigChange("args", updated);
                      }}
                      className="input-field flex-1"
                    />
                    <button
                      onClick={() => {
                        onConfigChange(
                          "args",
                          container.args?.filter((_, i) => i !== idx)
                        );
                      }}
                      className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  onConfigChange("args", [...(container.args || []), ""]);
                }}
                className="text-primary hover:opacity-70 text-sm mt-2"
              >
                + Add Argument
              </button>
            </div>
          </div>
        );

      case "resources":
        return (
          <div className="space-y-6">
            <div>
              <h5 className="font-semibold text-foreground mb-4">Limits</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">CPU</label>
                  <input
                    type="text"
                    value={container.resources?.limits?.cpu || ""}
                    onChange={(e) => {
                      onConfigChange("resources", {
                        ...container.resources,
                        limits: { ...container.resources?.limits, cpu: e.target.value || undefined },
                      });
                    }}
                    placeholder="500m"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">e.g., 100m, 1, 2.5</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Memory</label>
                  <input
                    type="text"
                    value={container.resources?.limits?.memory || ""}
                    onChange={(e) => {
                      onConfigChange("resources", {
                        ...container.resources,
                        limits: { ...container.resources?.limits, memory: e.target.value || undefined },
                      });
                    }}
                    placeholder="512Mi"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">e.g., 128Mi, 1Gi, 1024Mi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Storage</label>
                  <input
                    type="text"
                    value={container.resources?.limits?.storage || ""}
                    onChange={(e) => {
                      onConfigChange("resources", {
                        ...container.resources,
                        limits: { ...container.resources?.limits, storage: e.target.value || undefined },
                      });
                    }}
                    placeholder="10Gi"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">e.g., 1Gi, 100Mi, 10Gi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ephemeral Storage</label>
                  <input
                    type="text"
                    value={container.resources?.limits?.ephemeralStorage || ""}
                    onChange={(e) => {
                      onConfigChange("resources", {
                        ...container.resources,
                        limits: { ...container.resources?.limits, ephemeralStorage: e.target.value || undefined },
                      });
                    }}
                    placeholder="2Gi"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">e.g., 1Gi, 500Mi, 2Gi</p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-foreground mb-4">Requests</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">CPU</label>
                  <input
                    type="text"
                    value={container.resources?.requests?.cpu || ""}
                    onChange={(e) => {
                      onConfigChange("resources", {
                        ...container.resources,
                        requests: { ...container.resources?.requests, cpu: e.target.value || undefined },
                      });
                    }}
                    placeholder="250m"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">e.g., 100m, 1, 2.5</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Memory</label>
                  <input
                    type="text"
                    value={container.resources?.requests?.memory || ""}
                    onChange={(e) => {
                      onConfigChange("resources", {
                        ...container.resources,
                        requests: { ...container.resources?.requests, memory: e.target.value || undefined },
                      });
                    }}
                    placeholder="256Mi"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">e.g., 128Mi, 1Gi, 1024Mi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Storage</label>
                  <input
                    type="text"
                    value={container.resources?.requests?.storage || ""}
                    onChange={(e) => {
                      onConfigChange("resources", {
                        ...container.resources,
                        requests: { ...container.resources?.requests, storage: e.target.value || undefined },
                      });
                    }}
                    placeholder="5Gi"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">e.g., 1Gi, 100Mi, 10Gi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ephemeral Storage</label>
                  <input
                    type="text"
                    value={container.resources?.requests?.ephemeralStorage || ""}
                    onChange={(e) => {
                      onConfigChange("resources", {
                        ...container.resources,
                        requests: { ...container.resources?.requests, ephemeralStorage: e.target.value || undefined },
                      });
                    }}
                    placeholder="1Gi"
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/50 mt-1">e.g., 1Gi, 500Mi, 2Gi</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "image":
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Image Pull Policy</label>
            <select
              value={container.imagePullPolicy || "IfNotPresent"}
              onChange={(e) =>
                onConfigChange("imagePullPolicy", e.target.value as any)
              }
              className="input-field"
            >
              <option value="Always">Always</option>
              <option value="Never">Never</option>
              <option value="IfNotPresent">IfNotPresent</option>
            </select>
          </div>
        );

      case "probes":
        return (
          <div className="space-y-4 text-sm">
            <p className="text-foreground/60">Probe configuration details coming in depth - for now basic structure</p>
          </div>
        );

      case "lifecycle":
        return (
          <div className="space-y-6">
            {/* PostStart Hook */}
            <LifecycleHookEditor
              title="PostStart"
              hook={container.lifecycle?.postStart}
              onHookChange={(hook) => {
                onConfigChange("lifecycle", {
                  ...container.lifecycle,
                  postStart: hook,
                });
              }}
            />

            {/* PreStop Hook */}
            <LifecycleHookEditor
              title="PreStop"
              hook={container.lifecycle?.preStop}
              onHookChange={(hook) => {
                onConfigChange("lifecycle", {
                  ...container.lifecycle,
                  preStop: hook,
                });
              }}
            />
          </div>
        );

      case "io":
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={container.stdin || false}
                onChange={(e) => onConfigChange("stdin", e.target.checked ? true : undefined)}
                className="w-4 h-4 rounded border-border bg-input cursor-pointer"
              />
              <span className="text-foreground">STDIN</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={container.stdinOnce || false}
                onChange={(e) => onConfigChange("stdinOnce", e.target.checked ? true : undefined)}
                className="w-4 h-4 rounded border-border bg-input cursor-pointer"
              />
              <span className="text-foreground">STDIN Once</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={container.tty || false}
                onChange={(e) => onConfigChange("tty", e.target.checked ? true : undefined)}
                className="w-4 h-4 rounded border-border bg-input cursor-pointer"
              />
              <span className="text-foreground">TTY (requires STDIN)</span>
            </label>
          </div>
        );

      case "termination":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Termination Message Path</label>
              <input
                type="text"
                value={container.terminationMessagePath || ""}
                onChange={(e) => onConfigChange("terminationMessagePath", e.target.value || undefined)}
                placeholder="/dev/termination-log"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Termination Message Policy</label>
              <select
                value={container.terminationMessagePolicy || "File"}
                onChange={(e) => onConfigChange("terminationMessagePolicy", e.target.value as any)}
                className="input-field"
              >
                <option value="File">File</option>
                <option value="FallbackToLogsOnError">FallbackToLogsOnError</option>
              </select>
            </div>
          </div>
        );

      case "advanced":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Restart Policy</label>
              <select
                value={container.restartPolicy || "Always"}
                onChange={(e) => onConfigChange("restartPolicy", e.target.value as any)}
                className="input-field"
              >
                <option value="Always">Always</option>
                <option value="OnFailure">OnFailure</option>
                <option value="Never">Never</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.id} className="bg-muted/20 border border-border rounded-lg overflow-hidden">
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

          {expandedSections.has(section.id) && (
            <div className="px-4 py-4 border-t border-border bg-muted/10">
              {renderSection(section)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
