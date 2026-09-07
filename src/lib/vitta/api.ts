// VITTA ERP — tiny fetch wrapper for /api/* REST endpoints.
// Contract: list → { items }, mutate → { item }, delete → { ok: true }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function withParams(resource: string, params?: Record<string, string | undefined>) {
  const qs = params
    ? Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
        .join("&")
    : "";
  return `/api/${resource}${qs ? `?${qs}` : ""}`;
}

export const api = {
  list<T>(resource: string, params?: Record<string, string | undefined>) {
    return request<{ items: T[] }>(withParams(resource, params)).then((r) => r.items);
  },
  create<T>(resource: string, data: unknown) {
    return request<{ item: T }>(`/api/${resource}`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.item);
  },
  update<T>(resource: string, id: string, data: unknown) {
    return request<{ item: T }>(`/api/${resource}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((r) => r.item);
  },
  remove(resource: string, id: string) {
    return request<{ ok: true }>(`/api/${resource}/${id}`, { method: "DELETE" });
  },
};
