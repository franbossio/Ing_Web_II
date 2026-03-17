// ─── Config ────────────────────────────────────────────────
export const API_BASE_URL = 'http://localhost:3000'; // Cambiá por la URL de tu backend en producción

// ─── Types ─────────────────────────────────────────────────
export type UserRole = 'candidate' | 'company';

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
}

// ─── Helper ─────────────────────────────────────────────────
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.message ?? 'Error en la solicitud');
  }

  return data as T;
}