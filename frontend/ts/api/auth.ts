import {
  apiFetch,
  type LoginPayload,
  type RegisterPayload,
  type AuthResponse,
} from './config.js';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Session helpers ─────────────────────────────────────────
export function saveSession(data: AuthResponse): void {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function clearSession(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export function getUser(): AuthResponse['user'] | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}