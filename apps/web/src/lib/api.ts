import type { ApiError } from "@erp/shared";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError | undefined,
  ) {
    super(body?.message ?? `Request failed (${status})`);
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}

/** Single-flight refresh: concurrent 401s share one /auth/refresh call. */
async function refresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = (await res.json()) as { accessToken: string };
        accessToken = data.accessToken;
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  retry?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, retry = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && retry && (await refresh())) {
    return apiFetch<T>(path, { ...options, retry: false });
  }

  if (!res.ok) {
    const errBody = (await res.json().catch(() => undefined)) as ApiError | undefined;
    throw new ApiRequestError(res.status, errBody);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { refresh as refreshSession };
