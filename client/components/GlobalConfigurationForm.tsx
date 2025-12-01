interface GlobalConfigState {
  namespace: string;
  domain: string;
  requestsPerSecond: string;
  resourceQuota: {
    requestsCPU?: string;
    requestsMemory?: string;
    limitsCPU?: string;
    limitsMemory?: string;
    persistentVolumeClaimsLimit?: string;
    requestsStorage?: string;
  };
}

interface GlobalConfigurationFormProps {
  config: GlobalConfigState;
  onNamespaceChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  onRequestsPerSecondChange: (value: string) => void;
  onResourceQuotaChange: (quota: GlobalConfigState["resourceQuota"]) => void;
}

export default function GlobalConfigurationForm({
  config,
  onNamespaceChange,
  onDomainChange,
  onRequestsPerSecondChange,
  onResourceQuotaChange,
}: GlobalConfigurationFormProps) {
  return (
    <div className="max-w-4xl mx-auto mb-12 bg-card border border-border rounded-xl p-8 space-y-6">
      <h2 className="text-xl font-bold text-foreground mb-6">
        Global Configuration
      </h2>

      {/* Namespace */}
      <div>
        <label
          htmlFor="globalNamespace"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Namespace
        </label>
        <input
          id="globalNamespace"
          type="text"
          value={config.namespace}
          onChange={(e) => onNamespaceChange(e.target.value || "")}
          placeholder="default"
          className="input-field w-full"
        />
        <p className="text-xs text-foreground/50 mt-2">
          This namespace will be applied to all workloads and resources
        </p>
      </div>

      {/* Domain */}
      <div>
        <label
          htmlFor="globalDomain"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Domain
        </label>
        <input
          id="globalDomain"
          type="text"
          value={config.domain}
          onChange={(e) => onDomainChange(e.target.value || "")}
          placeholder="example.com"
          className="input-field w-full"
        />
        <p className="text-xs text-foreground/50 mt-2">
          Domain name for ingress and service endpoints
        </p>
      </div>

      {/* Rate Limiting */}
      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Rate Limiting
        </h3>
        <div>
          <label
            htmlFor="requestsPerSecond"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Requests per Second
          </label>
          <input
            id="requestsPerSecond"
            type="number"
            value={config.requestsPerSecond}
            onChange={(e) => onRequestsPerSecondChange(e.target.value || "")}
            placeholder="e.g., 1000"
            className="input-field w-full"
            min="0"
          />
          <p className="text-xs text-foreground/50 mt-2">
            Maximum number of requests allowed per second across all workloads
          </p>
        </div>
      </div>

      {/* Resource Quota */}
      <ResourceQuotaSection
        resourceQuota={config.resourceQuota}
        onResourceQuotaChange={onResourceQuotaChange}
      />
    </div>
  );
}

interface ResourceQuotaSectionProps {
  resourceQuota: GlobalConfigState["resourceQuota"];
  onResourceQuotaChange: (quota: GlobalConfigState["resourceQuota"]) => void;
}

function ResourceQuotaSection({
  resourceQuota,
  onResourceQuotaChange,
}: ResourceQuotaSectionProps) {
  const handleQuotaChange = (
    key: keyof typeof resourceQuota,
    value: string | undefined,
  ) => {
    onResourceQuotaChange({
      ...resourceQuota,
      [key]: value,
    });
  };

  return (
    <div className="border-t border-border pt-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Resource Quota
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requests CPU */}
        <div>
          <label
            htmlFor="rqRequestsCPU"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Requests CPU
          </label>
          <input
            id="rqRequestsCPU"
            type="text"
            value={resourceQuota.requestsCPU || ""}
            onChange={(e) =>
              handleQuotaChange("requestsCPU", e.target.value || undefined)
            }
            placeholder="e.g., 100m, 1, 2500m"
            className="input-field"
          />
          <p className="text-xs text-foreground/50 mt-1">
            e.g., 100m (millicores) or 1 (full core)
          </p>
        </div>

        {/* Requests Memory */}
        <div>
          <label
            htmlFor="rqRequestsMemory"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Requests Memory
          </label>
          <input
            id="rqRequestsMemory"
            type="text"
            value={resourceQuota.requestsMemory || ""}
            onChange={(e) =>
              handleQuotaChange("requestsMemory", e.target.value || undefined)
            }
            placeholder="e.g., 128Mi, 1Gi, 512M"
            className="input-field"
          />
          <p className="text-xs text-foreground/50 mt-1">e.g., 128Mi, 1Gi</p>
        </div>

        {/* Limits CPU */}
        <div>
          <label
            htmlFor="rqLimitsCPU"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Limits CPU
          </label>
          <input
            id="rqLimitsCPU"
            type="text"
            value={resourceQuota.limitsCPU || ""}
            onChange={(e) =>
              handleQuotaChange("limitsCPU", e.target.value || undefined)
            }
            placeholder="e.g., 500m, 2, 5000m"
            className="input-field"
          />
          <p className="text-xs text-foreground/50 mt-1">
            e.g., 500m or 2 (full cores)
          </p>
        </div>

        {/* Limits Memory */}
        <div>
          <label
            htmlFor="rqLimitsMemory"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Limits Memory
          </label>
          <input
            id="rqLimitsMemory"
            type="text"
            value={resourceQuota.limitsMemory || ""}
            onChange={(e) =>
              handleQuotaChange("limitsMemory", e.target.value || undefined)
            }
            placeholder="e.g., 512Mi, 2Gi, 1024M"
            className="input-field"
          />
          <p className="text-xs text-foreground/50 mt-1">e.g., 512Mi, 2Gi</p>
        </div>

        {/* PVC Limit */}
        <div>
          <label
            htmlFor="rqPVCLimit"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Persistent Volume Claims Limit
          </label>
          <input
            id="rqPVCLimit"
            type="number"
            value={resourceQuota.persistentVolumeClaimsLimit || ""}
            onChange={(e) =>
              handleQuotaChange(
                "persistentVolumeClaimsLimit",
                e.target.value || undefined,
              )
            }
            placeholder="e.g., 10"
            className="input-field"
            min="0"
          />
          <p className="text-xs text-foreground/50 mt-1">
            Maximum number of PVCs in namespace
          </p>
        </div>

        {/* Requests Storage */}
        <div>
          <label
            htmlFor="rqRequestsStorage"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Requests Storage
          </label>
          <input
            id="rqRequestsStorage"
            type="text"
            value={resourceQuota.requestsStorage || ""}
            onChange={(e) =>
              handleQuotaChange("requestsStorage", e.target.value || undefined)
            }
            placeholder="e.g., 100Gi, 1Ti"
            className="input-field"
          />
          <p className="text-xs text-foreground/50 mt-1">
            Total storage quota (e.g., 100Gi, 1Ti)
          </p>
        </div>
      </div>
    </div>
  );
}
