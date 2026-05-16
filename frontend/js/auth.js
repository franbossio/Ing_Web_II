const API_BASE = 'https://ing-web-ii.onrender.com/api';

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
  // Redirigir al index relativo al path actual
  const currentPath = window.location.pathname;
  if (currentPath.includes('/pages/')) {
    const base = currentPath.substring(0, currentPath.indexOf('/pages/'));
    window.location.href = base + '/pages/index.html';
  } else {
    window.location.href = 'index.html';
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function redirectToDashboard(role) {
  // Detectar el path base dinámicamente desde la URL actual
  // login.html y register.html están en /pages/
  // los dashboards están en /pages/candidate/ o /pages/company/
  const currentPath = window.location.pathname;
  
  // Calcular base hasta la carpeta "pages"
  let base = '';
  if (currentPath.includes('/pages/')) {
    base = currentPath.substring(0, currentPath.indexOf('/pages/') + '/pages/'.length);
  } else {
    // Fallback: asumir que estamos un nivel arriba de pages
    base = currentPath.substring(0, currentPath.lastIndexOf('/') + 1) + 'pages/';
  }

  const routes = {
    candidate: base + 'candidate/dashboard.html',
    company:   base + 'company/dashboard.html',
    admin:     base + 'candidate/dashboard.html',
  };
  window.location.href = routes[role] || base + 'login.html';
}

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

export async function loginUser({ email, password, remember }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');
  saveToken(data.access_token, remember);
  saveUser(data.user);
  return data;
}

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Error al registrarse';
    throw new Error(msg);
  }
  // No guardamos token — el usuario debe verificar su email primero
  return data;
}