import { supabase } from "./supabaseClient";

function requireApiBase() {
  const value = (import.meta.env.VITE_PATHFLOW_API_BASE as string | undefined)?.trim();
  if (!value) {
    throw new Error("VITE_PATHFLOW_API_BASE is required.");
  }

  return value.replace(/\/$/, "");
}

export const nodeApiBase = requireApiBase();

export const useNodeWorkspaceApi =
  (import.meta.env.VITE_USE_NODE_WORKSPACE_API as string | undefined) === "true";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string;
}

export async function backendRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.accessToken ?? (await supabase.auth.getSession()).data.session?.access_token;
  if (!token) throw new Error("You must be signed in to use the Pathflow backend.");

  return backendPublicRequest<T>(path, {
    ...options,
    accessToken: token,
  });
}

export async function backendPublicRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${nodeApiBase}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error?.message ?? payload?.error ?? `Backend request failed with status ${res.status}`;
    throw new Error(message);
  }

  return payload as T;
}
