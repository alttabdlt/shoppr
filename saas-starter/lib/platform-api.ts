const PLATFORM_API_URL =
  process.env.NEXT_PUBLIC_PLATFORM_API_URL ??
  process.env.PLATFORM_API_URL ??
  "http://localhost:8000";

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetch(`${PLATFORM_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      `Platform API request failed: ${response.status} ${response.statusText} ${(payload?.detail ?? "")}`.trim(),
    );
  }

  return (await response.json()) as T;
}

export async function listBoxes(tenantId: string) {
  return request(`/v1/boxes`, {
    headers: { "X-Tenant-ID": tenantId },
  });
}

export async function getBox(tenantId: string, boxId: string) {
  return request(`/v1/boxes/${boxId}`, {
    headers: { "X-Tenant-ID": tenantId },
  });
}

export async function createBox(tenantId: string, payload: unknown) {
  return request(`/v1/boxes`, {
    method: "POST",
    headers: { "X-Tenant-ID": tenantId },
    body: JSON.stringify(payload),
  });
}

export async function updateBoxSchema(tenantId: string, boxId: string, payload: unknown) {
  return request(`/v1/boxes/${boxId}/schema`, {
    method: "PATCH",
    headers: { "X-Tenant-ID": tenantId },
    body: JSON.stringify(payload),
  });
}

export async function simulateBox(tenantId: string, boxId: string, payload: unknown) {
  return request(`/v1/boxes/${boxId}/simulate`, {
    method: "POST",
    headers: { "X-Tenant-ID": tenantId },
    body: JSON.stringify(payload),
  });
}

export async function getSimulation(simulationId: string) {
  return request(`/v1/simulations/${simulationId}`);
}

export async function getSimulationArtifacts(simulationId: string) {
  return request(`/v1/simulations/${simulationId}/artifacts`);
}

export async function createEmbedToken(
  tenantId: string,
  boxId: string,
  payload: Record<string, unknown> = {}
) {
  return request(`/v1/boxes/${boxId}/embed-token`, {
    method: "POST",
    headers: { "X-Tenant-ID": tenantId },
    body: JSON.stringify(payload),
  });
}
