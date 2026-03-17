import { isAuthenticated, getUser } from '../api/auth.js';

/**
 * Redirige al login si el usuario no está autenticado.
 * Usar al inicio de cada página protegida.
 */
export function requireAuth(): void {
  if (!isAuthenticated()) {
    window.location.href = '/pages/login.html';
  }
}

/**
 * Redirige al dashboard correcto según el rol del usuario.
 * Usar en login/register para evitar que usuarios ya logueados vean el form.
 */
export function redirectIfAuthenticated(): void {
  if (!isAuthenticated()) return;

  const user = getUser();
  if (!user) return;

  if (user.role === 'candidate') {
    window.location.href = '/pages/candidate/dashboard.html';
  } else {
    window.location.href = '/pages/company/dashboard.html';
  }
}

/**
 * Solo permite acceso a usuarios con un rol específico.
 */
export function requireRole(role: 'candidate' | 'company'): void {
  requireAuth();
  const user = getUser();
  if (user?.role !== role) {
    window.location.href = '/pages/login.html';
  }
}