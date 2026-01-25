import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PodConfiguration from "@/components/PodConfiguration";
import ContainerConfiguration from "@/components/ContainerConfiguration";
import DeploymentConfiguration from "@/components/DeploymentConfiguration";
import ReplicaSetConfiguration from "@/components/ReplicaSetConfiguration";
import StatefulSetConfiguration from "@/components/StatefulSetConfiguration";
import JobConfiguration from "@/components/JobConfiguration";
import CronJobConfiguration from "@/components/CronJobConfiguration";
import ResourceConfiguration from "@/components/ResourceConfiguration";
import GlobalConfigurationForm from "@/components/GlobalConfigurationForm";
import { ChevronLeft, AlertCircle, Save } from "lucide-react";
import {
  generatePodYAML,
  generateDeploymentYAML,
  generateReplicaSetYAML,
  generateStatefulSetYAML,
  generateJobYAML,
  generateCronJobYAML,
  generateResourceYAML,
} from "@/lib/yaml-builder";
import { generateTemplates, combineAllYamlDocuments } from "@/lib/template-generator";

type WorkloadType =
  | "Pod"
  | "Deployment"
  | "ReplicaSet"
  | "StatefulSet"
  | "Job"
  | "CronJob";
type ResourceType =
  | "Service"
  | "HTTPRoute"
  | "GRPCRoute"
  | "PersistentVolume"
  | "PersistentVolumeClaim"
  | "VolumeAttributesClass"
  | "ConfigMap"
  | "Secret"
  | "LimitRange"
  | "RuntimeClass";

interface Container {
  id: string;
  name: string;
  image: string;
  [key: string]: any;
}

interface Workload {
  id: string;
  name: string;
  type: WorkloadType;
  containers: Container[];
  config: Record<string, any>;
}

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  namespace?: string;
  [key: string]: any;
}

interface DeploymentConfig {
  workloads: Workload[];
  resources: Resource[];
  globalNamespace: string;
  globalDomain: string;
  requestsPerSecond: string;
  resourceQuota: Record<string, any>;
}

export default function EditDeployment() {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [globalNamespace, setGlobalNamespace] = useState<string>("default");
  const [globalDomain, setGlobalDomain] = useState<string>("");
  const [requestsPerSecond, setRequestsPerSecond] = useState<string>("");
  const [resourceQuota, setResourceQuota] = useState<Record<string, any>>({});

  const [activeWorkloadId, setActiveWorkloadId] = useState<string>("");
  const [activeResourceId, setActiveResourceId] = useState<string>("");
  const [editingContainerId, setEditingContainerId] = useState<string>("");
  const [editingWorkloadId, setEditingWorkloadId] = useState<string>("");

  useEffect(() => {
    fetchDeploymentConfig();
  }, [deploymentId]);

  const fetchDeploymentConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/deployments/${deploymentId}/edit`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: DeploymentConfig = await response.json();
        setWorkloads(data.workloads || []);
        setResources(data.resources || []);
        setGlobalNamespace(data.globalNamespace || "default");
        setGlobalDomain(data.globalDomain || "");
        setRequestsPerSecond(data.requestsPerSecond || "");
        setResourceQuota(data.resourceQuota || {});
        if (data.workloads?.length > 0) {
          setActiveWorkloadId(data.workloads[0].id);
        }
        if (data.resources?.length > 0) {
          setActiveResourceId(data.resources[0].id);
        }
      } else if (response.status === 401) {
        navigate("/login");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load deployment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (workloads.length === 0) {
      setError("At least one workload is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Generate YAML for updated configuration
      const hasClusterIP = resources.some((r) => r.type === "Service");
      const hasHTTPRoute = resources.some((r) => r.type === "HTTPRoute");
      const clusterIPNames = resources
        .filter((r) => r.type === "Service")
        .map((r) => r.name);

      const templateResult = generateTemplates(
        workloads,
        {
          namespace: globalNamespace,
          domain: globalDomain,
          requestsPerSecond,
          resourceQuota,
        },
        !hasHTTPRoute && !hasClusterIP,
        !hasHTTPRoute,
        { userCreatedClusterIPNames: clusterIPNames },
      );

      let allYaml = combineAllYamlDocuments(templateResult);

      // Add user-created resources to YAML
      const userResourceYamls: string[] = [];
      for (const resource of resources) {
        const resourceYaml = generateResourceYAML(
          resource.name,
          resource.type,
          resource,
          globalNamespace,
        );
        if (resourceYaml) {
          userResourceYamls.push(resourceYaml);
        }
      }

      if (userResourceYamls.length > 0) {
        const allDocs = allYaml.split("\n---\n").filter((doc) => doc.trim());
        allDocs.push(...userResourceYamls);
        allYaml = allDocs.join("\n---\n");
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/deployments/${deploymentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workloads,
          resources,
          globalNamespace,
          globalDomain,
          requestsPerSecond,
          resourceQuota,
          _fullYaml: allYaml,
        }),
      });

      if (response.ok) {
        // Redirect to deployments page
        navigate("/deployments");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save deployment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const activeWorkload = workloads.find((w) => w.id === activeWorkloadId);
  const activeResource = resources.find((r) => r.id === activeResourceId);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-foreground/60">Loading deployment...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/deployments")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Edit Deployment
              </h1>
              <p className="text-lg text-foreground/60">
                Namespace: <code className="bg-muted px-2 py-1 rounded">{globalNamespace}</code>
                <span className="text-sm ml-4 text-orange-600">
                  (Cannot be changed)
                </span>
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 p-4 bg-orange-100 border border-orange-300 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900">Edit Restrictions</h3>
              <p className="text-sm text-orange-800 mt-1">
                You can only edit workloads and resources you created. Auto-generated resources
                (Services, HTTPRoutes, RBAC, etc.) are managed automatically.
              </p>
            </div>
          </div>

          {/* Global Configuration */}
          <div className="mb-8">
            <GlobalConfigurationForm
              config={{
                namespace: globalNamespace,
                domain: globalDomain,
                requestsPerSecond,
                resourceQuota,
              }}
              onNamespaceChange={setGlobalNamespace}
              onDomainChange={setGlobalDomain}
              onRequestsPerSecondChange={setRequestsPerSecond}
              onResourceQuotaChange={setResourceQuota}
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Panel: Workloads List */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Workloads</h2>
                {workloads.length === 0 ? (
                  <p className="text-sm text-foreground/60">No workloads</p>
                ) : (
                  <div className="space-y-2">
                    {workloads.map((workload) => (
                      <button
                        key={workload.id}
                        onClick={() => setActiveWorkloadId(workload.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                          activeWorkloadId === workload.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        <div className="font-medium text-sm">{workload.name}</div>
                        <div className="text-xs opacity-75">{workload.type}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-6 mt-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Resources</h2>
                {resources.length === 0 ? (
                  <p className="text-sm text-foreground/60">No resources</p>
                ) : (
                  <div className="space-y-2">
                    {resources.map((resource) => (
                      <button
                        key={resource.id}
                        onClick={() => setActiveResourceId(resource.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                          activeResourceId === resource.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        <div className="font-medium text-sm">{resource.name}</div>
                        <div className="text-xs opacity-75">{resource.type}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Configuration */}
            <div className="lg:col-span-3">
              {activeWorkload ? (
                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {activeWorkload.name}
                    </h2>
                    <p className="text-foreground/60">
                      Type: <code className="bg-muted px-2 py-1 rounded">{activeWorkload.type}</code>
                    </p>
                  </div>

                  {/* Containers */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Containers ({activeWorkload.containers?.length || 0})
                    </h3>
                    <div className="space-y-4">
                      {activeWorkload.containers?.map((container) => (
                        <div
                          key={container.id}
                          className="bg-muted p-4 rounded-lg border border-border"
                        >
                          <button
                            onClick={() => {
                              setEditingContainerId(container.id);
                              setEditingWorkloadId(activeWorkload.id);
                            }}
                            className="w-full text-left hover:opacity-75 transition-opacity"
                          >
                            <div className="font-semibold text-foreground">
                              {container.name}
                            </div>
                            <div className="text-sm text-foreground/60">
                              {container.image}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuration Panel */}
                  {activeWorkload.type === "Pod" && (
                    <div className="border-t border-border pt-6">
                      <PodConfiguration
                        config={activeWorkload.config}
                        onChange={(key, value) => {
                          setWorkloads(
                            workloads.map((w) =>
                              w.id === activeWorkload.id
                                ? { ...w, config: { ...w.config, [key]: value } }
                                : w,
                            ),
                          );
                        }}
                      />
                    </div>
                  )}

                  {activeWorkload.type === "Deployment" && (
                    <div className="border-t border-border pt-6">
                      <DeploymentConfiguration
                        config={activeWorkload.config}
                        onChange={(key, value) => {
                          setWorkloads(
                            workloads.map((w) =>
                              w.id === activeWorkload.id
                                ? { ...w, config: { ...w.config, [key]: value } }
                                : w,
                            ),
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : activeResource ? (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    {activeResource.name}
                  </h2>
                  <ResourceConfiguration
                    resourceType={activeResource.type}
                    config={activeResource}
                    onChange={(key, value) => {
                      setResources(
                        resources.map((r) =>
                          r.id === activeResource.id
                            ? { ...r, [key]: value }
                            : r,
                        ),
                      );
                    }}
                  />
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-foreground/60">Select a workload or resource to edit</p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 mt-8 sticky bottom-4">
            <button
              onClick={handleSave}
              disabled={saving || workloads.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => navigate("/deployments")}
              className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
