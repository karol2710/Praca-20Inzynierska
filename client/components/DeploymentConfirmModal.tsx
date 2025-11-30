import { useState } from "react";
import { AlertCircle, CheckCircle, Copy, Check } from "lucide-react";

interface ConfigurationItem {
  label: string;
  value: string | number | boolean;
}

interface DeploymentConfirmModalProps {
  isOpen: boolean;
  namespace: string;
  configurationItems: ConfigurationItem[];
  generatedYaml?: string;
  onConfirm: (options: DeploymentOptions) => Promise<void>;
  onCancel: () => void;
}

export interface DeploymentOptions {
  createHTTPRoute: boolean;
  createClusterIPService: boolean;
  environment: "staging" | "production";
  generatedYaml?: string;
}

export default function DeploymentConfirmModal({
  isOpen,
  namespace,
  configurationItems,
  generatedYaml,
  onConfirm,
  onCancel,
}: DeploymentConfirmModalProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<"staging" | "production">("production");
  const [editedYaml, setEditedYaml] = useState<string>(generatedYaml || "");
  const [copiedYaml, setCopiedYaml] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeploying(true);
      setError(null);
      await onConfirm({
        createHTTPRoute: true,
        createClusterIPService: true,
        environment,
        generatedYaml: editedYaml,
      });
      setIsDeploying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deployment failed");
      setIsDeploying(false);
    }
  };

  const copyYamlToClipboard = () => {
    navigator.clipboard.writeText(editedYaml).then(() => {
      setCopiedYaml(true);
      setTimeout(() => setCopiedYaml(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-border bg-primary/5 flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Review Deployment Configuration</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Configuration Summary */}
          <div className="bg-muted/20 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground mb-4">Deployment Configuration</h3>
            <div className="space-y-3">
              {configurationItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start py-2 border-b border-border/30 last:border-b-0">
                  <p className="text-foreground/60 text-sm">{item.label}</p>
                  <p className="text-foreground font-medium text-sm text-right">
                    {typeof item.value === 'boolean' ? (item.value ? 'Yes' : 'No') : item.value || 'Not set'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Environment Selection */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Environment</label>
            <div className="space-y-2">
              {(["staging", "production"] as const).map((env) => (
                <label key={env} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/10">
                  <input
                    type="radio"
                    name="environment"
                    value={env}
                    checked={environment === env}
                    onChange={(e) => setEnvironment(e.target.value as "staging" | "production")}
                    className="w-4 h-4"
                  />
                  <span className="text-foreground capitalize font-medium">{env}</span>
                  <span className="text-xs text-foreground/50">
                    {env === "staging" ? "(Staging Certificate)" : "(Production Certificate)"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Generated YAML */}
          {editedYaml && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-foreground">Generated Kubernetes YAML</label>
                <button
                  type="button"
                  onClick={copyYamlToClipboard}
                  className="flex items-center gap-2 px-3 py-1 text-xs text-foreground/70 hover:text-foreground bg-muted rounded hover:bg-muted/80 transition"
                >
                  {copiedYaml ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={editedYaml}
                onChange={(e) => setEditedYaml(e.target.value)}
                className="w-full h-64 p-3 bg-muted/20 border border-border rounded-lg font-mono text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                placeholder="Generated YAML will appear here..."
              />
              <p className="text-xs text-foreground/50 mt-2">
                You can edit the YAML before deployment. Changes will be applied when you deploy.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground/70">
              <strong>Certificate:</strong> A TLS certificate will be automatically generated for the {environment} environment.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-border bg-muted/5 flex-shrink-0">
          <button
            onClick={onCancel}
            disabled={isDeploying}
            className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeploying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isDeploying ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Deploy to Kubernetes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
