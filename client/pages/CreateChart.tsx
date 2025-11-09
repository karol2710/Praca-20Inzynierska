import { useState } from "react";
import Layout from "@/components/Layout";
import { Upload, Link as LinkIcon, Plus, X, Zap } from "lucide-react";

type ChartMode = "standard" | "advanced";
type InputType = "file" | "repo";

interface Workflow {
  id: string;
  name: string;
  containers: Container[];
}

interface Container {
  id: string;
  image: string;
  port: number;
  env: Record<string, string>;
}

export default function CreateChart() {
  const [mode, setMode] = useState<ChartMode>("standard");
  const [inputType, setInputType] = useState<InputType>("file");
  const [fileName, setFileName] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState<string>("");
  const [kubectlCommand, setKubectlCommand] = useState<string>("");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [newWorkflowName, setNewWorkflowName] = useState<string>("");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>("");
  const [newContainerImage, setNewContainerImage] = useState<string>("");
  const [newContainerPort, setNewContainerPort] = useState<string>("8080");
  const [isCreating, setIsCreating] = useState(false);

  // Standard mode handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      alert(`Chart created successfully!\nInput: ${inputType === "file" ? `File: ${fileName}` : `Repo: ${repoUrl}`}\nKubectl command: ${kubectlCommand}`);
    }, 1500);
  };

  // Advanced mode handlers
  const addWorkflow = () => {
    if (!newWorkflowName.trim()) return;
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: newWorkflowName,
      containers: [],
    };
    setWorkflows([...workflows, newWorkflow]);
    setActiveWorkflowId(newWorkflow.id);
    setNewWorkflowName("");
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter((w) => w.id !== id));
    if (activeWorkflowId === id) {
      setActiveWorkflowId(workflows.find((w) => w.id !== id)?.id || "");
    }
  };

  const addContainer = () => {
    if (!newContainerImage.trim() || !activeWorkflowId) return;
    const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId);
    if (!activeWorkflow) return;

    const newContainer: Container = {
      id: Date.now().toString(),
      image: newContainerImage,
      port: parseInt(newContainerPort) || 8080,
      env: {},
    };

    setWorkflows(
      workflows.map((w) =>
        w.id === activeWorkflowId
          ? { ...w, containers: [...w.containers, newContainer] }
          : w
      )
    );
    setNewContainerImage("");
    setNewContainerPort("8080");
  };

  const deleteContainer = (workflowId: string, containerId: string) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === workflowId
          ? { ...w, containers: w.containers.filter((c) => c.id !== containerId) }
          : w
      )
    );
  };

  const handleAdvancedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workflows.length === 0) {
      alert("Please add at least one workflow");
      return;
    }
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      alert(`Advanced chart created with ${workflows.length} workflow(s)`);
    }, 1500);
  };

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Kubernetes Chart</h1>
          <p className="text-foreground/60 text-lg">Choose between Standard or Advanced configuration</p>
        </div>

        {/* Mode Selector */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Standard Mode Card */}
          <button
            onClick={() => setMode("standard")}
            className={`p-8 rounded-xl border-2 transition-all text-left ${
              mode === "standard"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Standard</h2>
                <p className="text-foreground/60 mt-1">Simple and Quick</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
            </div>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>✓ Upload existing chart file</li>
              <li>✓ Provide repository link</li>
              <li>✓ Add kubectl install command</li>
              <li>✓ Deploy in minutes</li>
            </ul>
          </button>

          {/* Advanced Mode Card */}
          <button
            onClick={() => setMode("advanced")}
            className={`p-8 rounded-xl border-2 transition-all text-left ${
              mode === "advanced"
                ? "border-accent bg-accent/5"
                : "border-border bg-card hover:border-accent/30"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Advanced</h2>
                <p className="text-foreground/60 mt-1">Full Customization</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent" />
              </div>
            </div>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>✓ Create multiple workflows</li>
              <li>✓ Configure containers</li>
              <li>✓ Manage environment variables</li>
              <li>✓ Complete control</li>
            </ul>
          </button>
        </div>

        {/* Standard Mode Form */}
        {mode === "standard" && (
          <div className="bg-card border border-border rounded-xl p-8 max-w-2xl">
            <form onSubmit={handleStandardSubmit} className="space-y-6">
              {/* Input Type Selector */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-4">Input Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={inputType === "file"}
                      onChange={() => setInputType("file")}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-foreground">Upload File</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={inputType === "repo"}
                      onChange={() => setInputType("repo")}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-foreground">Repository Link</span>
                  </label>
                </div>
              </div>

              {/* File Upload or Repo URL */}
              {inputType === "file" ? (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Chart File</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".yaml,.yml,.tgz,.tar.gz"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <Upload className="w-8 h-8 text-foreground/40 mx-auto mb-2" />
                      <p className="text-foreground font-medium">Click to upload or drag and drop</p>
                      <p className="text-foreground/60 text-sm mt-1">YAML, TGZ, or TAR.GZ files</p>
                      {fileName && <p className="text-primary font-semibold mt-2">{fileName}</p>}
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="repoUrl" className="block text-sm font-semibold text-foreground mb-2">
                    Repository URL
                  </label>
                  <input
                    id="repoUrl"
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/your-org/your-repo"
                    className="input-field"
                    required
                  />
                </div>
              )}

              {/* Kubectl Command */}
              <div>
                <label htmlFor="kubectlCommand" className="block text-sm font-semibold text-foreground mb-2">
                  Kubectl Install Command
                </label>
                <textarea
                  id="kubectlCommand"
                  value={kubectlCommand}
                  onChange={(e) => setKubectlCommand(e.target.value)}
                  placeholder="kubectl apply -f https://..."
                  className="input-field resize-none h-24"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating Chart..." : "Create Chart"}
              </button>
            </form>
          </div>
        )}

        {/* Advanced Mode Form */}
        {mode === "advanced" && (
          <div className="space-y-8">
            {/* Add Workflow */}
            <div className="bg-card border border-border rounded-xl p-8 max-w-2xl">
              <h2 className="text-xl font-bold text-foreground mb-4">Workflows</h2>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="Workflow name (e.g., API Server, Database)"
                  className="input-field flex-1"
                />
                <button
                  onClick={addWorkflow}
                  className="btn-primary whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Workflows List */}
              {workflows.length > 0 && (
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => setActiveWorkflowId(workflow.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                        activeWorkflowId === workflow.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-foreground">{workflow.name}</p>
                        <p className="text-sm text-foreground/60">{workflow.containers.length} container(s)</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkflow(workflow.id);
                        }}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Configure Containers */}
            {activeWorkflow && (
              <div className="bg-card border border-border rounded-xl p-8 max-w-2xl">
                <h2 className="text-xl font-bold text-foreground mb-6">Containers in "{activeWorkflow.name}"</h2>

                {/* Add Container */}
                <div className="mb-6 p-6 bg-muted/30 rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground mb-4">Add Container</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Image</label>
                      <input
                        type="text"
                        value={newContainerImage}
                        onChange={(e) => setNewContainerImage(e.target.value)}
                        placeholder="nginx:latest"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Port</label>
                      <input
                        type="number"
                        value={newContainerPort}
                        onChange={(e) => setNewContainerPort(e.target.value)}
                        placeholder="8080"
                        className="input-field"
                      />
                    </div>
                    <button
                      onClick={addContainer}
                      className="btn-primary w-full"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Containers List */}
                {activeWorkflow.containers.length > 0 && (
                  <div className="space-y-3">
                    {activeWorkflow.containers.map((container) => (
                      <div
                        key={container.id}
                        className="p-4 bg-muted/20 border border-border rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{container.image}</p>
                          <p className="text-sm text-foreground/60">Port: {container.port}</p>
                        </div>
                        <button
                          onClick={() => deleteContainer(activeWorkflow.id, container.id)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            {workflows.length > 0 && (
              <div className="max-w-2xl">
                <button
                  onClick={handleAdvancedSubmit}
                  disabled={isCreating}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating Advanced Chart..." : "Create Advanced Chart"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
