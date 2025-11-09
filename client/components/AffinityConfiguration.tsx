import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";

type Operator = "In" | "NotIn" | "Exists" | "DoesNotExist" | "Gt" | "Lt";

interface MatchExpression {
  id: string;
  key: string;
  operator: Operator;
  values: string[];
  weight?: number;
}

interface RequiredScheduling {
  matchExpressions: MatchExpression[];
}

interface PreferredScheduling {
  matchExpressions: MatchExpression[];
}

interface NodeAffinityConfig {
  requiredDuringScheduling?: RequiredScheduling;
  preferredDuringScheduling?: PreferredScheduling;
}

interface PodAffinityConfig {
  topologyKey?: string;
  requiredDuringScheduling?: RequiredScheduling;
  preferredDuringScheduling?: PreferredScheduling;
}

interface AffinityConfig {
  nodeAffinity?: NodeAffinityConfig;
  podAffinity?: PodAffinityConfig;
  podAntiAffinity?: PodAffinityConfig;
}

interface AffinityConfigurationProps {
  affinity: AffinityConfig;
  onAffinityChange: (affinity: AffinityConfig) => void;
}

const operators: Operator[] = ["In", "NotIn", "Exists", "DoesNotExist", "Gt", "Lt"];

export default function AffinityConfiguration({
  affinity = {},
  onAffinityChange,
}: AffinityConfigurationProps) {
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

  const updateNodeAffinity = (config: NodeAffinityConfig) => {
    onAffinityChange({ ...affinity, nodeAffinity: config });
  };

  const updatePodAffinity = (config: PodAffinityConfig) => {
    onAffinityChange({ ...affinity, podAffinity: config });
  };

  const updatePodAntiAffinity = (config: PodAffinityConfig) => {
    onAffinityChange({ ...affinity, podAntiAffinity: config });
  };

  const MatchExpressionField = ({
    expr,
    onUpdate,
    onDelete,
    showWeight,
    showTopologyKey,
    topologyKey,
    onTopologyKeyChange,
  }: {
    expr: MatchExpression;
    onUpdate: (expr: MatchExpression) => void;
    onDelete: () => void;
    showWeight?: boolean;
    showTopologyKey?: boolean;
    topologyKey?: string;
    onTopologyKeyChange?: (key: string) => void;
  }) => (
    <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Key</label>
          <input
            type="text"
            value={expr.key}
            onChange={(e) => onUpdate({ ...expr, key: e.target.value })}
            placeholder="kubernetes.io/hostname"
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Operator</label>
          <select
            value={expr.operator}
            onChange={(e) => onUpdate({ ...expr, operator: e.target.value as Operator })}
            className="input-field text-sm"
          >
            {operators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>
        {showWeight && (
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Weight</label>
            <input
              type="number"
              min="1"
              max="100"
              value={expr.weight || 1}
              onChange={(e) => onUpdate({ ...expr, weight: parseInt(e.target.value) || 1 })}
              className="input-field text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground mb-2">Values</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {expr.values.map((val, idx) => (
            <div key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
              {val}
              <button
                onClick={() => {
                  const newValues = expr.values.filter((_, i) => i !== idx);
                  onUpdate({ ...expr, values: newValues });
                }}
                className="hover:opacity-70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add value and press Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              onUpdate({
                ...expr,
                values: [...expr.values, e.currentTarget.value.trim()],
              });
              e.currentTarget.value = "";
            }
          }}
          className="input-field text-sm"
        />
      </div>

      {showTopologyKey && (
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Topology Key</label>
          <input
            type="text"
            value={topologyKey || ""}
            onChange={(e) => onTopologyKeyChange?.(e.target.value)}
            placeholder="kubernetes.io/hostname"
            className="input-field text-sm"
          />
        </div>
      )}

      <button
        onClick={onDelete}
        className="w-full py-2 text-destructive hover:bg-destructive/10 rounded transition-colors text-sm"
      >
        Remove Expression
      </button>
    </div>
  );

  const SchedulingSection = ({
    title,
    expressions,
    onExpressionsChange,
    showWeight,
    showTopologyKey,
    topologyKey,
    onTopologyKeyChange,
  }: {
    title: string;
    expressions: MatchExpression[];
    onExpressionsChange: (exprs: MatchExpression[]) => void;
    showWeight?: boolean;
    showTopologyKey?: boolean;
    topologyKey?: string;
    onTopologyKeyChange?: (key: string) => void;
  }) => (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-foreground text-sm">{title}</h5>
        <button
          onClick={() => {
            const newExpr: MatchExpression = {
              id: Date.now().toString(),
              key: "",
              operator: "In",
              values: [],
              ...(showWeight && { weight: 1 }),
            };
            onExpressionsChange([...expressions, newExpr]);
          }}
          className="text-primary hover:opacity-70 text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Expression
        </button>
      </div>

      {expressions.length > 0 ? (
        <div className="space-y-3">
          {expressions.map((expr) => (
            <MatchExpressionField
              key={expr.id}
              expr={expr}
              onUpdate={(updated) => {
                onExpressionsChange(expressions.map((e) => (e.id === expr.id ? updated : e)));
              }}
              onDelete={() => {
                onExpressionsChange(expressions.filter((e) => e.id !== expr.id));
              }}
              showWeight={showWeight}
              showTopologyKey={showTopologyKey}
              topologyKey={topologyKey}
              onTopologyKeyChange={onTopologyKeyChange}
            />
          ))}
        </div>
      ) : (
        <p className="text-foreground/50 text-sm">No expressions added yet</p>
      )}
    </div>
  );

  const AffinityTypeSection = ({
    type,
    title,
    config,
    onConfigChange,
    showTopologyKey,
  }: {
    type: "node" | "pod" | "podAntiAffinity";
    title: string;
    config?: NodeAffinityConfig | PodAffinityConfig;
    onConfigChange: (config: NodeAffinityConfig | PodAffinityConfig) => void;
    showTopologyKey?: boolean;
  }) => (
    <div className="space-y-3">
      <button
        onClick={() => toggleSection(type)}
        className="w-full flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg hover:bg-muted/30 transition-colors"
      >
        <h4 className="font-semibold text-foreground">{title}</h4>
        <ChevronDown
          className={`w-5 h-5 text-foreground/60 transition-transform ${
            expandedSections.has(type) ? "rotate-180" : ""
          }`}
        />
      </button>

      {expandedSections.has(type) && (
        <div className="space-y-4 pl-4">
          {showTopologyKey && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Topology Key</label>
              <input
                type="text"
                value={(config as PodAffinityConfig)?.topologyKey || ""}
                onChange={(e) => {
                  onConfigChange({
                    ...config,
                    topologyKey: e.target.value,
                  });
                }}
                placeholder="kubernetes.io/hostname"
                className="input-field"
              />
              <p className="text-xs text-foreground/50 mt-1">Required for pod affinity/anti-affinity</p>
            </div>
          )}

          <SchedulingSection
            title="Required During Scheduling, Ignored During Execution"
            expressions={config?.requiredDuringScheduling?.matchExpressions || []}
            onExpressionsChange={(exprs) => {
              onConfigChange({
                ...config,
                requiredDuringScheduling: { matchExpressions: exprs },
              });
            }}
            showTopologyKey={false}
          />

          <SchedulingSection
            title="Preferred During Scheduling, Ignored During Execution"
            expressions={config?.preferredDuringScheduling?.matchExpressions || []}
            onExpressionsChange={(exprs) => {
              onConfigChange({
                ...config,
                preferredDuringScheduling: { matchExpressions: exprs },
              });
            }}
            showWeight={true}
            showTopologyKey={false}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-muted/20 border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-4">Affinity & Anti-Affinity</h3>
        <div className="space-y-3">
          <AffinityTypeSection
            type="node"
            title="Node Affinity"
            config={affinity.nodeAffinity}
            onConfigChange={(config) => updateNodeAffinity(config as NodeAffinityConfig)}
            showTopologyKey={false}
          />

          <AffinityTypeSection
            type="pod"
            title="Pod Affinity"
            config={affinity.podAffinity}
            onConfigChange={(config) => updatePodAffinity(config as PodAffinityConfig)}
            showTopologyKey={true}
          />

          <AffinityTypeSection
            type="podAntiAffinity"
            title="Pod Anti-Affinity"
            config={affinity.podAntiAffinity}
            onConfigChange={(config) => updatePodAntiAffinity(config as PodAffinityConfig)}
            showTopologyKey={true}
          />
        </div>
      </div>
    </div>
  );
}
