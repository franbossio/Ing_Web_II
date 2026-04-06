/**
 * user-loader.js
 * Reemplaza todos los datos hardcodeados con los datos reales
 * del usuario guardado en localStorage tras el login.
 */

import { getUser, isAuthenticated, logout } from './auth.js';
import { calcProfilePercent, updateProgressRing } from './profile.js';

// ─── Guard ────────────────────────────────────────────────────
if (!isAuthenticated()) {
  const base = window.location.pathname.split('/frontend/')[0];
  window.location.href = base + '/frontend/pages/login.html';
}

// ─── Helpers ──────────────────────────────────────────────────

function getInitials(str = '') {
  const words = str.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function setText(selector, value, context = document) {
  if (!value) return;
  context.querySelectorAll(selector).forEach(el => {
    el.textContent = value;
  });
}

function setVal(selector, value, context = document) {
  if (!value) return;
  context.querySelectorAll(selector).forEach(el => {
    el.value = value;
  });
}

/**
 * Busca un <input> o <textarea> dentro de un .form-group
 * que tenga un <label> con ese texto exacto y le asigna el value.
 */
function setInputByLabel(labelText, value, context = document) {
  if (!value) return;
  context.querySelectorAll('label').forEach(label => {
    // Eliminar asterisco y espacios extras del label
    const clean = label.textContent.trim().replace(/\s*\*$/, '').trim();
    if (clean !== labelText.trim()) return;

    const parent = label.closest('.form-group') || label.parentElement;
    if (!parent) return;

    const input = parent.querySelector(
      'input:not([type="password"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea'
    );
    if (input) input.value = value;
  });
}

// ─── Cerrar sesión global ─────────────────────────────────────
window.cerrarSesion = function () {
  logout();
};

// ─── Main ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user) return;

  const isCandidate = user.role === 'candidate';

  // Nombre a mostrar
  const displayName = isCandidate
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    : (user.companyName ?? user.name ?? '');

  const firstName = isCandidate
    ? (user.firstName ?? displayName.split(' ')[0])
    : displayName.split(' ')[0];

  const initials = getInitials(displayName);

  // ══════════════════════════════════════════════════════════
  // 1. SIDEBAR — aplica en TODAS las páginas
  // ══════════════════════════════════════════════════════════
  setText('.profile-avatar', initials);   // candidato
  setText('.profile-name',   displayName);
  setText('.company-avatar', initials);   // empresa
  setText('.company-name',   displayName);

  // ══════════════════════════════════════════════════════════
  // 2. TOPBAR — aplica en TODAS las páginas
  // ══════════════════════════════════════════════════════════
  const subtitle = document.querySelector('.topbar-subtitle');
  if (subtitle) {
    subtitle.textContent = isCandidate
      ? `Bienvenido de vuelta, ${firstName} 👋`
      : `Bienvenido de vuelta, ${displayName}`;
  }

  // ══════════════════════════════════════════════════════════
  // 3. DASHBOARD CANDIDATO — hero
  // ══════════════════════════════════════════════════════════
  setText('.hero-avatar', initials);
  setText('.hero-name',   displayName);

  if (user.jobTitle) setText('.hero-title', user.jobTitle);

  if (user.location) {
    const locSpan = document.querySelector('.hero-meta span:first-child');
    if (locSpan) locSpan.textContent = `📍 ${user.location}`;
  }

  // ══════════════════════════════════════════════════════════
  // 4. PROFILE.HTML — avatar del formulario e inputs con id
  // ══════════════════════════════════════════════════════════

  // Avatar grande y nombre sobre el formulario
  setText('.avatar-large', initials);
  setText('.avatar-name',  displayName);

  // Inputs que SÍ tienen id definido
  setVal('#firstName', user.firstName);
  setVal('#lastName',  user.lastName);
  setVal('#email',     user.email);
  if (user.jobTitle) setVal('#jobTitle', user.jobTitle);
  if (user.location) setVal('#location', user.location);
  if (user.phone)    setVal('#phone',    user.phone);
  if (user.linkedin) setVal('#linkedin', user.linkedin);
  if (user.github)   setVal('#github',   user.github);
  if (user.bio)      setVal('#bio',      user.bio);
  if (user.salary)   setVal('#salary',   user.salary);

  // ══════════════════════════════════════════════════════════
  // 5. SETTINGS CANDIDATO — #panel-cuenta
  //    Los inputs NO tienen id, se buscan por label
  // ══════════════════════════════════════════════════════════
  const panelCuenta = document.getElementById('panel-cuenta');
  if (panelCuenta) {
    setInputByLabel('Nombre',             user.firstName, panelCuenta);
    setInputByLabel('Apellido',           user.lastName,  panelCuenta);
    setInputByLabel('Email',              user.email,     panelCuenta);
    setInputByLabel('Teléfono',           user.phone,     panelCuenta);
    setInputByLabel('Título profesional', user.jobTitle,  panelCuenta);
  }

  // Conexiones: "Conectado como Juan Pérez"
  document.querySelectorAll('.connected-status.linked').forEach(el => {
    if (el.textContent.includes('Conectado como')) {
      el.textContent = `✓ Conectado como ${displayName}`;
    }
  });

  // ══════════════════════════════════════════════════════════
  // 6. SETTINGS EMPRESA — logo grande + #panel-empresa
  // ══════════════════════════════════════════════════════════

  // Logo grande dentro del formulario de empresa
  setText('.company-logo-lg', initials);
  setText('.logo-info-name',  displayName);
  setText('.logo-info-sub',   user.location ?? '');

  const panelEmpresa = document.getElementById('panel-empresa');
  if (panelEmpresa) {
    setInputByLabel('Nombre de la empresa', user.companyName, panelEmpresa);
    if (user.location) setInputByLabel('Ubicación', user.location, panelEmpresa);
    if (user.website)  setInputByLabel('Sitio web', user.website,  panelEmpresa);
    if (user.linkedin) setInputByLabel('LinkedIn',  user.linkedin, panelEmpresa);
    if (user.bio) {
      const textarea = panelEmpresa.querySelector('textarea');
      if (textarea) textarea.value = user.bio;
    }
  }


  // ══════════════════════════════════════════════════════════
  // 7. DATA ATTRIBUTES en body para uso futuro en CSS/JS
  // ══════════════════════════════════════════════════════════
  if (isCandidate) {
    // Calculamos el % basado en el objeto 'user' que ya tienes cargado
    const percent = calcProfilePercent(user);
    
    // Esta función busca los elementos '.ring-fill' y '.ring-pct'
    // Solo actuará si existen en la página actual (como en dashboard.html)
    updateProgressRing(percent);

    // Opcional: si tienes un texto extra en el Dashboard para el porcentaje
    const dashboardPct = document.getElementById('dashboard-pct-value');
    if (dashboardPct) {
      dashboardPct.textContent = `${percent}%`;
    }
  }
  document.body.dataset.role   = user.role;
  document.body.dataset.userId = user.id ?? '';
  
});