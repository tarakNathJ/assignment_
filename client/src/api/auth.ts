import { apiFetch } from "./http";

export interface MeResponse {
  authed: boolean;
  db: { mode: "demo" | "custom"; label: string } | null;
}

export async function login(username: string, password: string): Promise<{ ok: boolean }> {
  const result = await apiFetch<{ ok: boolean; token?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (result.token) {
    localStorage.setItem("bi_token", result.token);
  }
  return result;
}

export async function logout(): Promise<{ ok: boolean }> {
  localStorage.removeItem("bi_token");
  return apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({}) });
}

export function me(): Promise<MeResponse> {
  return apiFetch("/auth/me");
}
