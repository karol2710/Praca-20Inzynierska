export function debugDeploymentPayload(payload: any): void {
  console.log("=== DEPLOYMENT PAYLOAD ===");
  console.log("Full Payload:", JSON.stringify(payload, null, 2));

  console.log("\n=== WORKLOADS ===");
  if (payload.workloads && Array.isArray(payload.workloads)) {
    payload.workloads.forEach((workload: any, index: number) => {
      console.log(`\nWorkload ${index}: ${workload.name} (${workload.type})`);
      console.log(`  Containers: ${workload.containers?.length || 0}`);
      if (workload.containers) {
        workload.containers.forEach((container: any) => {
          console.log(`    - ${container.name} (image: ${container.image})`);
          console.log(
            `      Ports: ${container.ports?.map((p: any) => `${p.containerPort}/${p.protocol || "TCP"}`).join(", ") || "None"}`,
          );
        });
      }
    });
  }

  console.log("\n=== RESOURCES ===");
  if (payload.resources && Array.isArray(payload.resources)) {
    payload.resources.forEach((resource: any, index: number) => {
      console.log(`Resource ${index}: ${resource.name} (${resource.type})`);
    });
  }

  console.log("\n=== GLOBAL CONFIG ===");
  console.log(`Namespace: ${payload.globalNamespace}`);
  console.log(`Domain: ${payload.globalDomain}`);
  console.log(`Rate Limit (req/s): ${payload.requestsPerSecond || "None"}`);
  console.log(`Resource Quota:`, payload.resourceQuota || {});

  console.log("\n=== DEPLOYMENT OPTIONS ===");
  if (payload.deploymentOptions) {
    console.log(`Environment: ${payload.deploymentOptions.environment}`);
    console.log(
      `Create ClusterIP: ${payload.deploymentOptions.createClusterIPService}`,
    );
    console.log(
      `Create HTTPRoute: ${payload.deploymentOptions.createHTTPRoute}`,
    );
  }

  console.log("\n=== GENERATED YAML (User-Editable) ===");
  if (payload.generatedYaml) {
    console.log(payload.generatedYaml);
  } else {
    console.log("(empty or not set)");
  }

  console.log("\n=== FULL YAML (For Backend Deployment) ===");
  if (payload._fullYaml) {
    console.log(payload._fullYaml);
  } else {
    console.log("(empty or not set)");
  }

  console.log("\n=== END PAYLOAD ===");
}
