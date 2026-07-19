/**
 * Thin HTTP client for the Calendaa backend API.
 * All API calls go through here — handles base URL, auth headers, and errors.
 */

// Safely handle trailing slashes in the env var to prevent Vercel 308 Redirect / CORS errors
const rawBaseUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";
const BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const TOKEN_KEY = "calendaa_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Ensure path starts with a slash
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${BASE_URL}${safePath}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body?.detail ?? `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    name: string;
    email: string;
    role: "admin" | "hod" | "guest";
    department?: string;
  };
}

export async function apiLogin(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// ── Events ───────────────────────────────────────────────────────────────────

export interface ApiEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  department: string;
  year: string;
  section: string;
  category: string;
}

export interface EventFilters {
  department?: string;
  year?: string;
  section?: string;
  search?: string;
}

export async function apiFetchEvents(filters: EventFilters = {}): Promise<ApiEvent[]> {
  const params = new URLSearchParams();
  if (filters.department && filters.department !== "all") params.set("department", filters.department);
  if (filters.year && filters.year !== "all") params.set("year", filters.year);
  if (filters.section && filters.section !== "all") params.set("section", filters.section);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request<ApiEvent[]>(`/events${qs}`);
}

export async function apiCreateEvent(data: Omit<ApiEvent, "id">): Promise<ApiEvent> {
  return request<ApiEvent>("/events", { method: "POST", body: JSON.stringify(data) });
}

export async function apiUpdateEvent(id: string, data: Omit<ApiEvent, "id">): Promise<ApiEvent> {
  return request<ApiEvent>(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function apiDeleteEvent(id: string): Promise<void> {
  return request<void>(`/events/${id}`, { method: "DELETE" });
}

// ── Admin — HODs ──────────────────────────────────────────────────────────────

export interface ApiHod {
  id: number;
  username: string;
  name: string;
  email: string;
  department_id: number;
  department_name?: string;
}

export interface CreateHodData {
  username: string;
  password: string;
  name: string;
  email: string;
  department_id: number;
}

export async function apiFetchHods(): Promise<ApiHod[]> {
  return request<ApiHod[]>("/admin/hods");
}

export async function apiCreateHod(data: CreateHodData): Promise<ApiHod> {
  return request<ApiHod>("/admin/hods", { method: "POST", body: JSON.stringify(data) });
}

export async function apiDeleteHod(id: number): Promise<void> {
  return request<void>(`/admin/hods/${id}`, { method: "DELETE" });
}

// ── Lookup ────────────────────────────────────────────────────────────────────

export interface ApiDepartment {
  id: number;
  name: string;
}

export async function apiFetchDepartments(): Promise<ApiDepartment[]> {
  return request<ApiDepartment[]>("/departments");
}
