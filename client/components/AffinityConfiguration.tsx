import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";

type Operator = "In" | "NotIn" | "Exists" | "DoesNotExist" | "Gt" | "Lt";

interface MatchItem {
  id: string;
  type: "label" | "expression";
  key: string;
  value?: string;
  operator?: Operator;
  values?: string[];
}

interface LabelSelectorItem {
  matches?: MatchItem[];
}

interface PodAffinityTerm {
  id: string;
  topologyKey: string;
  namespaces?: string[];
  labelSelector?: LabelSelectorItem;
  matchLabelKeys?: string[];
  mismatchLabelKeys?: string[];
  namespaceSelector?: LabelSelectorItem;
  weight?: number;
}

interface RequiredScheduling {
  podAffinityTerm?: PodAffinityTerm;
}

interface PreferredScheduling {
  podAffinityTerm?: PodAffinityTerm;
}

interface NodeAffinityExpr {
  id: string;
  key: string;
  operator: Operator;
  values: string[];
}

interface RequiredSchedulingNode {
  nodeAffinityTerm?: {
    matchExpressions?: NodeAffinityExpr[];
    matchFields?: NodeAffinityExpr[];
  };
}

interface PreferredSchedulingNode {
  nodeAffinityTerm?: {
    matchExpressions?: NodeAffinityExpr[];
    matchFields?: NodeAffinityExpr[];
    weight?: number;
  };
}

interface NodeAffinityConfig {
  requiredDuringScheduling?: RequiredSchedulingNode;
  preferredDuringScheduling?: PreferredSchedulingNode;
}

interface PodAffinityConfig {
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

  const LabelSelectorComponent = ({
    label,
    selector,
    onChange,
  }: {
    label: string;
    selector?: LabelSelectorItem;
    onChange: (selector: LabelSelectorItem) => void;
  }) => (
    <div className="p-3 bg-muted/10 rounded-lg border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h6 className="font-medium text-sm text-foreground">{label}</h6>
        <button
          onClick={() => {
            onChange({
              ...selector,
              matches: [...(selector?.matches || []), { id: Date.now().toString(), type: "label", key: "" }],
            });
          }}
          className="text-primary hover:opacity-70 text-xs flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Match
        </button>
      </div>

      <div className="space-y-2">
        {selector?.matches?.map((item) => (
          <div key={item.id} className="p-2 bg-muted/20 rounded border border-border space-y-2">
            {item.type === "label" ? (
              // Match Label UI
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.key}
                  onChange={(e) => {
                    onChange({
                      ...selector,
                      matches: selector.matches?.map((m) =>
                        m.id === item.id ? { ...m, key: e.target.value } : m
                      ),
                    });
                  }}
                  placeholder="key"
                  className="input-field text-sm flex-1"
                />
                <input
                  type="text"
                  value={item.value || ""}
                  onChange={(e) => {
                    onChange({
                      ...selector,
                      matches: selector.matches?.map((m) =>
                        m.id === item.id ? { ...m, value: e.target.value } : m
                      ),
                    });
                  }}
                  placeholder="value"
                  className="input-field text-sm flex-1"
                />
                <button
                  onClick={() => {
                    onChange({
                      ...selector,
                      matches: selector.matches?.filter((m) => m.id !== item.id),
                    });
                  }}
                  className="text-destructive hover:opacity-70"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onChange({
                      ...selector,
                      matches: selector.matches?.map((m) =>
                        m.id === item.id ? { ...m, type: "expression", operator: "In", values: [] } : m
                      ),
                    });
                  }}
                  className="text-primary text-xs hover:opacity-70"
                >
                  Switch to Expression
                </button>
              </div>
            ) : (
              // Match Expression UI
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={item.key}
                    onChange={(e) => {
                      onChange({
                        ...selector,
                        matches: selector.matches?.map((m) =>
                          m.id === item.id ? { ...m, key: e.target.value } : m
                        ),
                      });
                    }}
                    placeholder="key"
                    className="input-field text-sm"
                  />
                  <select
                    value={item.operator || "In"}
                    onChange={(e) => {
                      onChange({
                        ...selector,
                        matches: selector.matches?.map((m) =>
                          m.id === item.id ? { ...m, operator: e.target.value as Operator } : m
                        ),
                      });
                    }}
                    className="input-field text-sm"
                  >
                    {operators.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      onChange({
                        ...selector,
                        matches: selector.matches?.filter((m) => m.id !== item.id),
                      });
                    }}
                    className="text-destructive hover:opacity-70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Values</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.values?.map((val, idx) => (
                      <div key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
                        {val}
                        <button
                          onClick={() => {
                            onChange({
                              ...selector,
                              matches: selector.matches?.map((m) =>
                                m.id === item.id
                                  ? { ...m, values: m.values?.filter((_, i) => i !== idx) }
                                  : m
                              ),
                            });
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
                        onChange({
                          ...selector,
                          matches: selector.matches?.map((m) =>
                            m.id === item.id
                              ? { ...m, values: [...(m.values || []), e.currentTarget.value.trim()] }
                              : m
                          ),
                        });
                        e.currentTarget.value = "";
                      }
                    }}
                    className="input-field text-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    onChange({
                      ...selector,
                      matches: selector.matches?.map((m) =>
                        m.id === item.id ? { ...m, type: "label", value: "" } : m
                      ),
                    });
                  }}
                  className="text-primary text-xs hover:opacity-70"
                >
                  Switch to Label
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const PodAffinityTermComponent = ({
    term,
    onUpdate,
  }: {
    term: PodAffinityTerm;
    onUpdate: (term: PodAffinityTerm) => void;
  }) => (
    <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-4">
      {/* Topology Key */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">Topology Key*</label>
        <input
          type="text"
          value={term.topologyKey}
          onChange={(e) => onUpdate({ ...term, topologyKey: e.target.value })}
          placeholder="kubernetes.io/hostname"
          className="input-field text-sm"
          required
        />
      </div>

      {/* Namespaces */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-2">Namespaces</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {term.namespaces?.map((ns, idx) => (
            <div key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
              {ns}
              <button
                onClick={() => {
                  const updated = term.namespaces?.filter((_, i) => i !== idx);
                  onUpdate({ ...term, namespaces: updated });
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
          placeholder="Add namespace and press Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              onUpdate({
                ...term,
                namespaces: [...(term.namespaces || []), e.currentTarget.value.trim()],
              });
              e.currentTarget.value = "";
            }
          }}
          className="input-field text-sm"
        />
      </div>

      {/* Label Selector */}
      <LabelSelectorComponent
        label="Label Selector"
        selector={term.labelSelector}
        onChange={(selector) => onUpdate({ ...term, labelSelector: selector })}
      />

      {/* Namespace Selector */}
      <LabelSelectorComponent
        label="Namespace Selector"
        selector={term.namespaceSelector}
        onChange={(selector) => onUpdate({ ...term, namespaceSelector: selector })}
      />

      {/* Match Label Keys */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-2">Match Label Keys</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {term.matchLabelKeys?.map((key, idx) => (
            <div key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
              {key}
              <button
                onClick={() => {
                  const updated = term.matchLabelKeys?.filter((_, i) => i !== idx);
                  onUpdate({ ...term, matchLabelKeys: updated });
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
          placeholder="Add label key and press Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              onUpdate({
                ...term,
                matchLabelKeys: [...(term.matchLabelKeys || []), e.currentTarget.value.trim()],
              });
              e.currentTarget.value = "";
            }
          }}
          className="input-field text-sm"
        />
      </div>

      {/* Mismatch Label Keys */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-2">Mismatch Label Keys</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {term.mismatchLabelKeys?.map((key, idx) => (
            <div key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
              {key}
              <button
                onClick={() => {
                  const updated = term.mismatchLabelKeys?.filter((_, i) => i !== idx);
                  onUpdate({ ...term, mismatchLabelKeys: updated });
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
          placeholder="Add label key and press Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              onUpdate({
                ...term,
                mismatchLabelKeys: [...(term.mismatchLabelKeys || []), e.currentTarget.value.trim()],
              });
              e.currentTarget.value = "";
            }
          }}
          className="input-field text-sm"
        />
      </div>
    </div>
  );

  const SchedulingSection = ({
    title,
    term,
    onTermChange,
    showWeight,
    onDelete,
  }: {
    title: string;
    term?: PodAffinityTerm;
    onTermChange: (term: PodAffinityTerm) => void;
    showWeight?: boolean;
    onDelete?: () => void;
  }) => {
    const initialTerm: PodAffinityTerm = term || {
      id: Date.now().toString(),
      topologyKey: "",
      namespaces: [],
      labelSelector: { matches: [] },
      matchLabelKeys: [],
      mismatchLabelKeys: [],
      namespaceSelector: { matches: [] },
      ...(showWeight && { weight: 1 }),
    };

    return (
      <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-foreground text-sm">{title}</h5>
          {onDelete && term && (
            <button
              onClick={onDelete}
              className="text-destructive hover:opacity-70 text-xs"
              title="Clear this affinity section"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <PodAffinityTermComponent term={initialTerm} onUpdate={onTermChange} />

        {showWeight && (
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Weight</label>
            <input
              type="number"
              min="1"
              max="100"
              value={initialTerm.weight || 1}
              onChange={(e) => onTermChange({ ...initialTerm, weight: parseInt(e.target.value) || 1 })}
              className="input-field text-sm"
            />
          </div>
        )}
      </div>
    );
  };

  const ExpressionFieldComponent = ({
    items,
    onItemsChange,
    label,
  }: {
    items: NodeAffinityExpr[];
    onItemsChange: (items: NodeAffinityExpr[]) => void;
    label: string;
  }) => (
    <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-foreground">{label}</label>
        <button
          onClick={() => {
            const newExpr: NodeAffinityExpr = {
              id: Date.now().toString(),
              key: "",
              operator: "In",
              values: [],
            };
            onItemsChange([...items, newExpr]);
          }}
          className="text-primary hover:opacity-70 text-xs flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add {label}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((expr) => (
          <div key={expr.id} className="p-3 bg-muted/30 border border-border rounded space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Key</label>
                <input
                  type="text"
                  value={expr.key}
                  onChange={(e) =>
                    onItemsChange(
                      items.map((x) =>
                        x.id === expr.id ? { ...x, key: e.target.value } : x
                      )
                    )
                  }
                  placeholder="kubernetes.io/hostname"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Operator</label>
                <select
                  value={expr.operator}
                  onChange={(e) =>
                    onItemsChange(
                      items.map((x) =>
                        x.id === expr.id ? { ...x, operator: e.target.value as Operator } : x
                      )
                    )
                  }
                  className="input-field text-sm"
                >
                  {operators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => onItemsChange(items.filter((x) => x.id !== expr.id))}
                className="text-destructive hover:opacity-70 mt-6"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Values</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {expr.values.map((val, idx) => (
                  <div key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
                    {val}
                    <button
                      onClick={() => {
                        const newValues = expr.values.filter((_, i) => i !== idx);
                        onItemsChange(
                          items.map((x) =>
                            x.id === expr.id ? { ...x, values: newValues } : x
                          )
                        );
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
                    onItemsChange(
                      items.map((x) =>
                        x.id === expr.id
                          ? { ...x, values: [...x.values, e.currentTarget.value.trim()] }
                          : x
                      )
                    );
                    e.currentTarget.value = "";
                  }
                }}
                className="input-field text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const NodeAffinitySchedulingSection = ({
    title,
    matchExpressions,
    matchFields,
    onMatchExpressionsChange,
    onMatchFieldsChange,
    showWeight,
    weight,
    onWeightChange,
    onDelete,
  }: {
    title: string;
    matchExpressions: NodeAffinityExpr[];
    matchFields: NodeAffinityExpr[];
    onMatchExpressionsChange: (exprs: NodeAffinityExpr[]) => void;
    onMatchFieldsChange: (fields: NodeAffinityExpr[]) => void;
    showWeight?: boolean;
    weight?: number;
    onWeightChange?: (weight: number) => void;
    onDelete?: () => void;
  }) => {
    const hasConfig = matchExpressions.length > 0 || matchFields.length > 0 || weight !== undefined;

    return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-foreground text-sm">{title}</h5>
        {onDelete && hasConfig && (
          <button
            onClick={onDelete}
            className="text-destructive hover:opacity-70 text-xs"
            title="Clear this affinity section"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <ExpressionFieldComponent
          items={matchExpressions}
          onItemsChange={onMatchExpressionsChange}
          label="Match Expression"
        />

        <ExpressionFieldComponent
          items={matchFields}
          onItemsChange={onMatchFieldsChange}
          label="Match Field"
        />
      </div>

      {showWeight && (
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Weight</label>
          <input
            type="number"
            min="1"
            max="100"
            value={weight || 1}
            onChange={(e) => onWeightChange?.(parseInt(e.target.value) || 1)}
            className="input-field text-sm"
          />
        </div>
      )}
    </div>
    );
  };

  const AffinityTypeSection = ({
    type,
    title,
    config,
    onConfigChange,
    isPodAffinity,
  }: {
    type: "node" | "pod" | "podAntiAffinity";
    title: string;
    config?: NodeAffinityConfig | PodAffinityConfig;
    onConfigChange: (config: NodeAffinityConfig | PodAffinityConfig) => void;
    isPodAffinity?: boolean;
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
          {isPodAffinity ? (
            <>
              <SchedulingSection
                title="Required During Scheduling, Ignored During Execution"
                term={(config as PodAffinityConfig)?.requiredDuringScheduling?.podAffinityTerm}
                onTermChange={(term) => {
                  onConfigChange({
                    ...config,
                    requiredDuringScheduling: { podAffinityTerm: term },
                  });
                }}
                onDelete={() => {
                  onConfigChange({
                    ...config,
                    requiredDuringScheduling: undefined,
                  });
                }}
              />

              <SchedulingSection
                title="Preferred During Scheduling, Ignored During Execution"
                term={(config as PodAffinityConfig)?.preferredDuringScheduling?.podAffinityTerm}
                onTermChange={(term) => {
                  onConfigChange({
                    ...config,
                    preferredDuringScheduling: { podAffinityTerm: term },
                  });
                }}
                showWeight={true}
                onDelete={() => {
                  onConfigChange({
                    ...config,
                    preferredDuringScheduling: undefined,
                  });
                }}
              />
            </>
          ) : (
            <>
              <NodeAffinitySchedulingSection
                title="Required During Scheduling, Ignored During Execution"
                matchExpressions={(config as NodeAffinityConfig)?.requiredDuringScheduling?.nodeAffinityTerm?.matchExpressions || []}
                matchFields={(config as NodeAffinityConfig)?.requiredDuringScheduling?.nodeAffinityTerm?.matchFields || []}
                onMatchExpressionsChange={(exprs) => {
                  const currentFields = (config as NodeAffinityConfig)?.requiredDuringScheduling?.nodeAffinityTerm?.matchFields || [];
                  onConfigChange({
                    ...config,
                    requiredDuringScheduling: { nodeAffinityTerm: { matchExpressions: exprs, matchFields: currentFields } },
                  });
                }}
                onMatchFieldsChange={(fields) => {
                  const currentExprs = (config as NodeAffinityConfig)?.requiredDuringScheduling?.nodeAffinityTerm?.matchExpressions || [];
                  onConfigChange({
                    ...config,
                    requiredDuringScheduling: { nodeAffinityTerm: { matchExpressions: currentExprs, matchFields: fields } },
                  });
                }}
                onDelete={() => {
                  onConfigChange({
                    ...config,
                    requiredDuringScheduling: undefined,
                  });
                }}
              />

              <NodeAffinitySchedulingSection
                title="Preferred During Scheduling, Ignored During Execution"
                matchExpressions={(config as NodeAffinityConfig)?.preferredDuringScheduling?.nodeAffinityTerm?.matchExpressions || []}
                matchFields={(config as NodeAffinityConfig)?.preferredDuringScheduling?.nodeAffinityTerm?.matchFields || []}
                onMatchExpressionsChange={(exprs) => {
                  const currentFields = (config as NodeAffinityConfig)?.preferredDuringScheduling?.nodeAffinityTerm?.matchFields || [];
                  const currentWeight = (config as NodeAffinityConfig)?.preferredDuringScheduling?.nodeAffinityTerm?.weight;
                  onConfigChange({
                    ...config,
                    preferredDuringScheduling: { nodeAffinityTerm: { matchExpressions: exprs, matchFields: currentFields, weight: currentWeight } },
                  });
                }}
                onMatchFieldsChange={(fields) => {
                  const currentExprs = (config as NodeAffinityConfig)?.preferredDuringScheduling?.nodeAffinityTerm?.matchExpressions || [];
                  const currentWeight = (config as NodeAffinityConfig)?.preferredDuringScheduling?.nodeAffinityTerm?.weight;
                  onConfigChange({
                    ...config,
                    preferredDuringScheduling: { nodeAffinityTerm: { matchExpressions: currentExprs, matchFields: fields, weight: currentWeight } },
                  });
                }}
                showWeight={true}
                weight={(config as NodeAffinityConfig)?.preferredDuringScheduling?.nodeAffinityTerm?.weight}
                onWeightChange={(weight) => {
                  const currentExprs = (config as NodeAffinityConfig)?.preferredDuringScheduling?.nodeAffinityTerm?.matchExpressions || [];
                  const currentFields = (config as NodeAffinityConfig)?.preferredDuringScheduling?.nodeAffinityTerm?.matchFields || [];
                  onConfigChange({
                    ...config,
                    preferredDuringScheduling: { nodeAffinityTerm: { matchExpressions: currentExprs, matchFields: currentFields, weight } },
                  });
                }}
                onDelete={() => {
                  onConfigChange({
                    ...config,
                    preferredDuringScheduling: undefined,
                  });
                }}
              />
            </>
          )}
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
          />

          <AffinityTypeSection
            type="pod"
            title="Pod Affinity"
            config={affinity.podAffinity}
            onConfigChange={(config) => updatePodAffinity(config as PodAffinityConfig)}
            isPodAffinity={true}
          />

          <AffinityTypeSection
            type="podAntiAffinity"
            title="Pod Anti-Affinity"
            config={affinity.podAntiAffinity}
            onConfigChange={(config) => updatePodAntiAffinity(config as PodAffinityConfig)}
            isPodAffinity={true}
          />
        </div>
      </div>
    </div>
  );
}
