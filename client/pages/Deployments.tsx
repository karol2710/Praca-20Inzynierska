import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import {
  Copy,
  Trash2,
  RotateCcw,
  ExternalLink,
  Edit,
  Boxes,
  X,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Deployment {
  id: string;
  name: string;
  namespace: string;
  createdAt: string;
  status: "active" | "failed" | "pending";
  environment: "staging" | "production";
  workloads: number;
  resources: number;
}

interface K8sResource {
  kind: string;
  name: string;
  namespace: string;
  apiVersion: string;
  deletable: boolean;
}

export default function Deployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);
  const [showYaml, setShowYaml] = useState(false);
  const [yamlContent, setYamlContent] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [resources, setResources] = useState<K8sResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/deployments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeployments(data.deployments || []);
      } else if (response.status === 401) {
        window.location.href = "/login";
      } else {
        setError("Failed to fetch deployments");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const viewYaml = async (deployment: Deployment) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/deployments/${deployment.id}/yaml`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setYamlContent(data.yaml);
        setSelectedDeployment(deployment);
        setShowYaml(true);
      }
    } catch (err) {
      setError("Failed to fetch YAML");
    }
  };

  const deleteDeployment = async (deploymentId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this deployment? This will remove all resources from the cluster.",
      )
    )
      return;

    setDeletingId(deploymentId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/deployments/${deploymentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDeployments(deployments.filter((d) => d.id !== deploymentId));
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete deployment");
      }
    } catch (err) {
      setError(
        `Error deleting deployment: ${err instanceof Error ? err.message : "An error occurred"}`,
      );
    } finally {
      setDeletingId(null);
    }
  };

  const copyYaml = () => {
    navigator.clipboard.writeText(yamlContent);
  };

  const viewResources = async (deployment: Deployment) => {
    try {
      setResourcesLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/deployments/${deployment.id}/resources`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
        setSelectedDeployment(deployment);
        setShowResources(true);
      } else {
        setError("Failed to fetch resources");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setResourcesLoading(false);
    }
  };

  const deleteResource = async (
    deploymentId: string,
    resource: K8sResource,
  ) => {
    if (
      !confirm(
        `Delete ${resource.kind}/${resource.name} from cluster? This action cannot be undone.`,
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/deployments/${deploymentId}/resources`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(resource),
        },
      );

      if (response.ok) {
        setResources(
          resources.filter(
            (r) => !(r.name === resource.name && r.kind === resource.kind),
          ),
        );
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete resource");
      }
    } catch (err) {
      setError(
        `Error deleting resource: ${err instanceof Error ? err.message : "An error occurred"}`,
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Deployments
            </h1>
            <p className="text-lg text-foreground/60">
              Manage your Kubernetes applications
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-foreground/60">Loading deployments...</div>
            </div>
          ) : deployments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground/60 mb-4">No deployments yet</p>
              <a
                href="/create-chart"
                className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Create Your First Deployment
              </a>
            </div>
          ) : (
            <div className="grid gap-4">
              {deployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {deployment.name}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        Namespace:{" "}
                        <code className="bg-muted px-2 py-1 rounded">
                          {deployment.namespace}
                        </code>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deployment.status)}`}
                      >
                        {deployment.status.charAt(0).toUpperCase() +
                          deployment.status.slice(1)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {deployment.environment}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6 py-4 border-y border-border">
                    <div>
                      <p className="text-xs text-foreground/50">Workloads</p>
                      <p className="text-lg font-semibold text-foreground">
                        {deployment.workloads}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/50">Resources</p>
                      <p className="text-lg font-semibold text-foreground">
                        {deployment.resources}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/50">Created</p>
                      <p className="text-sm text-foreground">
                        {new Date(deployment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div></div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Link
                      to={`/deployments/${deployment.id}/edit`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-all font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => viewResources(deployment)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-all font-medium"
                    >
                      <Boxes className="w-4 h-4" />
                      Resources
                    </button>
                    <button
                      onClick={() => viewYaml(deployment)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View YAML
                    </button>
                    <button
                      onClick={() => deleteDeployment(deployment.id)}
                      disabled={deletingId === deployment.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                        deletingId === deployment.id
                          ? "bg-destructive/20 text-destructive cursor-not-allowed opacity-60"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === deployment.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* YAML Modal */}
        {showYaml && selectedDeployment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-4xl w-full max-h-96 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">
                  {selectedDeployment.name} - YAML
                </h2>
                <button
                  onClick={() => setShowYaml(false)}
                  className="text-foreground/50 hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <pre className="text-xs bg-muted p-4 rounded overflow-auto text-foreground/80 font-mono">
                  {yamlContent}
                </pre>
              </div>
              <div className="flex gap-2 p-6 border-t border-border">
                <button
                  onClick={copyYaml}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  <Copy className="w-4 h-4" />
                  Copy YAML
                </button>
                <button
                  onClick={() => setShowYaml(false)}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showResources && selectedDeployment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-2xl w-full max-h-96 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">
                  {selectedDeployment.name} - Deployed Resources
                </h2>
                <button
                  onClick={() => setShowResources(false)}
                  className="text-foreground/50 hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                {resourcesLoading ? (
                  <p className="text-foreground/60 text-center py-8">
                    Loading resources...
                  </p>
                ) : resources.length === 0 ? (
                  <p className="text-foreground/60 text-center py-8">
                    No resources deployed
                  </p>
                ) : (
                  <div className="space-y-3">
                    {resources.map((resource, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {resource.kind}/{resource.name}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {resource.namespace} • {resource.apiVersion}
                          </p>
                        </div>
                        {resource.deletable ? (
                          <button
                            onClick={() =>
                              deleteResource(selectedDeployment.id, resource)
                            }
                            className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded text-sm transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        ) : (
                          <span className="text-xs text-foreground/50 px-3 py-2">
                            Auto-generated
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 p-6 border-t border-border">
                <button
                  onClick={() => setShowResources(false)}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
