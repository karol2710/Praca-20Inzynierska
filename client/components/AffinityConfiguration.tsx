import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";

type Operator = "In" | "NotIn" | "Exists" | "DoesNotExist" | "Gt" | "Lt";

interface MatchExpressionItem {
  id: string;
  key: string;
  operator: Operator;
  values: string[];
  weight?: number;
}

interface LabelSelectorItem {
  matchLabels?: Record<string, string>;
  matchExpressions?: MatchExpressionItem[];
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
  podAffinityTerms?: PodAffinityTerm[];
}

interface PreferredScheduling {
  podAffinityTerms?: PodAffinityTerm[];
}

interface NodeAffinityExpr {
  id: string;
  key: string;
  operator: Operator;
  values: string[];
}

interface RequiredSchedulingNode {
  matchExpressions: NodeAffinityExpr[];
}

interface PreferredSchedulingNode {
  matchExpressions: NodeAffinityExpr[];
  weight?: number;
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
      <h6 className="font-medium text-sm text-foreground">{label}</h6>

      {/* Match Labels */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-2">Match Labels</label>
        <div className="space-y-2">
          {Object.entries(selector?.matchLabels || {}).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="text"
                value={key}
                disabled
                className="input-field text-sm flex-1 bg-muted/20"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  const newLabels = { ...selector?.matchLabels };
                  if (e.target.value.trim()) {
                    newLabels[key] = e.target.value;
                  } else {
                    delete newLabels[key];
                  }
                  onChange({ ...selector, matchLabels: newLabels });
                }}
                placeholder="value"
                className="input-field text-sm flex-1"
              />
              <button
                onClick={() => {
                  const newLabels = { ...selector?.matchLabels };
                  delete newLabels[key];
                  onChange({ ...selector, matchLabels: newLabels });
                }}
                className="text-destructive hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              id={`${label}-key`}
              placeholder="key"
              className="input-field text-sm flex-1"
            />
            <input
              type="text"
              id={`${label}-value`}
              placeholder="value"
              className="input-field text-sm flex-1"
            />
            <button
              onClick={() => {
                const keyInput = document.getElementById(`${label}-key`) as HTMLInputElement;
                const valueInput = document.getElementById(`${label}-value`) as HTMLInputElement;
                const key = keyInput?.value.trim();
                const value = valueInput?.value.trim();

                if (key && value) {
                  onChange({
                    ...selector,
                    matchLabels: {
                      ...selector?.matchLabels,
                      [key]: value,
                    },
                  });
                  keyInput.value = "";
                  valueInput.value = "";
                }
              }}
              className="text-primary hover:opacity-70"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Match Expressions */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-2">Match Expressions</label>
        <div className="space-y-2">
          {selector?.matchExpressions?.map((expr) => (
            <div key={expr.id} className="p-2 bg-muted/20 rounded border border-border space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={expr.key}
                  onChange={(e) => {
                    const updated = selector.matchExpressions?.map((x) =>
                      x.id === expr.id ? { ...x, key: e.target.value } : x
                    );
                    onChange({ ...selector, matchExpressions: updated });
                  }}
                  placeholder="key"
                  className="input-field text-sm"
                />
                <select
                  value={expr.operator}
                  onChange={(e) => {
                    const updated = selector.matchExpressions?.map((x) =>
                      x.id === expr.id ? { ...x, operator: e.target.value as Operator } : x
                    );
                    onChange({ ...selector, matchExpressions: updated });
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
                    const updated = selector.matchExpressions?.filter((x) => x.id !== expr.id);
                    onChange({ ...selector, matchExpressions: updated });
                  }}
                  className="text-destructive hover:opacity-70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {expr.values.map((val, idx) => (
                  <div key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
                    {val}
                    <button
                      onClick={() => {
                        const newValues = expr.values.filter((_, i) => i !== idx);
                        const updated = selector.matchExpressions?.map((x) =>
                          x.id === expr.id ? { ...x, values: newValues } : x
                        );
                        onChange({ ...selector, matchExpressions: updated });
                      }}
                      className="hover:opacity-70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const newExpr: MatchExpressionItem = {
                id: Date.now().toString(),
                key: "",
                operator: "In",
                values: [],
              };
              onChange({
                ...selector,
                matchExpressions: [...(selector?.matchExpressions || []), newExpr],
              });
            }}
            className="text-primary text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Expression
          </button>
        </div>
      </div>
    </div>
  );

  const PodAffinityTermComponent = ({
    term,
    onUpdate,
    onDelete,
    showWeight,
  }: {
    term: PodAffinityTerm;
    onUpdate: (term: PodAffinityTerm) => void;
    onDelete: () => void;
    showWeight?: boolean;
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

      {/* Weight (for Preferred) */}
      {showWeight && (
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Weight</label>
          <input
            type="number"
            min="1"
            max="100"
            value={term.weight || 1}
            onChange={(e) => onUpdate({ ...term, weight: parseInt(e.target.value) || 1 })}
            className="input-field text-sm"
          />
        </div>
      )}

      <button
        onClick={onDelete}
        className="w-full py-2 text-destructive hover:bg-destructive/10 rounded transition-colors text-sm"
      >
        Remove Term
      </button>
    </div>
  );

  const SchedulingSection = ({
    title,
    terms,
    onTermsChange,
    showWeight,
  }: {
    title: string;
    terms?: PodAffinityTerm[];
    onTermsChange: (terms: PodAffinityTerm[]) => void;
    showWeight?: boolean;
  }) => (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-foreground text-sm">{title}</h5>
        <button
          onClick={() => {
            const newTerm: PodAffinityTerm = {
              id: Date.now().toString(),
              topologyKey: "",
              namespaces: [],
              labelSelector: { matchLabels: {}, matchExpressions: [] },
              matchLabelKeys: [],
              mismatchLabelKeys: [],
              namespaceSelector: { matchLabels: {}, matchExpressions: [] },
              ...(showWeight && { weight: 1 }),
            };
            onTermsChange([...(terms || []), newTerm]);
          }}
          className="text-primary hover:opacity-70 text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Term
        </button>
      </div>

      {terms && terms.length > 0 ? (
        <div className="space-y-3">
          {terms.map((term) => (
            <PodAffinityTermComponent
              key={term.id}
              term={term}
              onUpdate={(updated) => {
                onTermsChange(terms.map((t) => (t.id === term.id ? updated : t)));
              }}
              onDelete={() => {
                onTermsChange(terms.filter((t) => t.id !== term.id));
              }}
              showWeight={showWeight}
            />
          ))}
        </div>
      ) : (
        <p className="text-foreground/50 text-sm">No terms added yet</p>
      )}
    </div>
  );

  const NodeAffinitySchedulingSection = ({
    title,
    expressions,
    onExpressionsChange,
    showWeight,
  }: {
    title: string;
    expressions: NodeAffinityExpr[];
    onExpressionsChange: (exprs: NodeAffinityExpr[]) => void;
    showWeight?: boolean;
  }) => (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-foreground text-sm">{title}</h5>
        <button
          onClick={() => {
            const newExpr: NodeAffinityExpr = {
              id: Date.now().toString(),
              key: "",
              operator: "In",
              values: [],
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
            <div key={expr.id} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Key</label>
                  <input
                    type="text"
                    value={expr.key}
                    onChange={(e) =>
                      onExpressionsChange(
                        expressions.map((x) =>
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
                      onExpressionsChange(
                        expressions.map((x) =>
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
                  onClick={() =>
                    onExpressionsChange(expressions.filter((x) => x.id !== expr.id))
                  }
                  className="text-destructive hover:opacity-70 mt-6"
                >
                  <X className="w-4 h-4" />
                </button>
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
                          onExpressionsChange(
                            expressions.map((x) =>
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
                      onExpressionsChange(
                        expressions.map((x) =>
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
                terms={(config as PodAffinityConfig)?.requiredDuringScheduling?.podAffinityTerms}
                onTermsChange={(terms) => {
                  onConfigChange({
                    ...config,
                    requiredDuringScheduling: { podAffinityTerms: terms },
                  });
                }}
              />

              <SchedulingSection
                title="Preferred During Scheduling, Ignored During Execution"
                terms={(config as PodAffinityConfig)?.preferredDuringScheduling?.podAffinityTerms}
                onTermsChange={(terms) => {
                  onConfigChange({
                    ...config,
                    preferredDuringScheduling: { podAffinityTerms: terms },
                  });
                }}
                showWeight={true}
              />
            </>
          ) : (
            <>
              <NodeAffinitySchedulingSection
                title="Required During Scheduling, Ignored During Execution"
                expressions={(config as NodeAffinityConfig)?.requiredDuringScheduling?.matchExpressions || []}
                onExpressionsChange={(exprs) => {
                  onConfigChange({
                    ...config,
                    requiredDuringScheduling: { matchExpressions: exprs },
                  });
                }}
              />

              <NodeAffinitySchedulingSection
                title="Preferred During Scheduling, Ignored During Execution"
                expressions={(config as NodeAffinityConfig)?.preferredDuringScheduling?.matchExpressions || []}
                onExpressionsChange={(exprs) => {
                  onConfigChange({
                    ...config,
                    preferredDuringScheduling: { matchExpressions: exprs },
                  });
                }}
                showWeight={true}
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
