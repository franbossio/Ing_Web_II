/**
 * TalentAI — Auth helper
 * Copiar en: frontend/js/auth.js
 * Incluir en login.html y register.html con: <script src="../js/auth.js" type="module"></script>
 */

const API_BASE = 'http://localhost:3001/api';

// ─── Utilidades ──────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem('talentai_token') || sessionStorage.getItem('talentai_token');
}

export function saveToken(token, remember = false) {
  if (remember) {
    localStorage.setItem('talentai_token', token);
  } else {
    sessionStorage.setItem('talentai_token', token);
  }
}

export function saveUser(user) {
  localStorage.setItem('talentai_user', JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem('talentai_user');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem('talentai_token');
  localStorage.removeItem('talentai_user');
  sessionStorage.removeItem('talentai_token');
  window.location.href = '/pages/login.html';
}

export function isAuthenticated() {
  return !!getToken();
}

/** Redirige al dashboard correcto según el rol */
export function redirectToDashboard(role) {
  const routes = {
    candidate: '../pages/candidate/dashboard.html',
    company:   '../pages/company/dashboard.html',
    admin:     '../pages/candidate/dashboard.html', // ajustar si hay panel admin
  };
  window.location.href = routes[role] || '/pages/login.html';
}

// ─── Petición con auth ───────────────────────────────────────────────────────

export async function authFetch(path, options = {}) {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function loginUser({ email, password, remember }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }

  saveToken(data.access_token, remember);
  saveUser(data.user);
  return data;
}

// ─── Register ────────────────────────────────────────────────────────────────

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Error al registrarse';
    throw new Error(msg);
  }

  saveToken(data.access_token, false);
  saveUser(data.user);
  return data;
}
