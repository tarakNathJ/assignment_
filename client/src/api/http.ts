import { API_BASE } from "../config/constants";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || res.statusText);
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = localStorage.getItem("bi_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "omit", // Use token instead of cross-origin cookies
    headers: {
      ...headers,
      ...(init?.headers as Record<string, string> ?? {}),
    },
  });
  const data = await parseJson<{ error?: string; token?: string } & T>(res);
  
  if (data.token) {
    localStorage.setItem("bi_token", data.token);
  }
  
  if (!res.ok) {
    const err =
      typeof data.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}
