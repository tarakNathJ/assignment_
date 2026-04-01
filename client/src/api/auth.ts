import { apiFetch } from "./http";

export interface MeResponse {
  authed: boolean;
  db: { mode: "demo" | "custom"; label: string } | null;
}

export function login(username: string, password: string): Promise<{ ok: boolean }> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout(): Promise<{ ok: boolean }> {
  return apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({}) });
}

export function me(): Promise<MeResponse> {
  return apiFetch("/auth/me");
}
