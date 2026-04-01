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
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await parseJson<{ error?: string } & T>(res);
  if (!res.ok) {
    const err =
      typeof data.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}
