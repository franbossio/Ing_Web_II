/**
 * sidebar-candidate.js
 * Inyecta el sidebar completo del candidato y marca el nav-item activo
 * según la página actual. No tocar IDs ni clases — la lógica de
 * user-loader.js y mobile-sidebar.js depende de ellos.
 */

import { logout } from './auth.js';

window.cerrarSesion = function () {
  logout();
};

(function () {

  // Helper: genera un <svg><use> apuntando al sprite externo
  function icon(id, fill = '#7A611D') {
    return `<svg width="24" height="24" fill="${fill}"><use href="../../imagen/icons.svg#${id}"/></svg>`;
  }

  const LINKS = [
    { href: 'dashboard.html',    icon: icon('icon-home'),         label: 'Inicio' },
    { href: 'jobs.html',         icon: icon('icon-jobs'),         label: 'Explorar ofertas',   badge: '' },
    { href: 'profile.html',      icon: icon('icon-profile'),      label: 'Editar perfil',      section: 'Mi perfil' },
    { href: 'profile.html#cv',   icon: icon('icon-cv'),           label: 'Mi CV' },
    { href: 'applications.html', icon: icon('icon-applications'), label: 'Mis postulaciones',  badge: '', section: 'Postulaciones' },
    { href: 'saved.html',        icon: icon('icon-saved'),        label: 'Guardados' },
    { href: 'settings.html',     icon: icon('icon-settings'),     label: 'Configuración' },
  ];

  const LOGOUT_SVG = icon('icon-logout', '#EA3323');

  function currentPage() {
    return window.location.pathname.split('/').pop().split('#')[0];
  }

  function buildNav() {
    let html = '';

    LINKS.forEach(link => {
      if (link.section) {
        html += `<span class="nav-section-label">${link.section}</span>`;
      }
      const page     = link.href.split('#')[0];
      const isActive = page === currentPage() ? ' active' : '';
      const badge    = link.badge ? `<span class="nav-badge">${link.badge}</span>` : '';
      html += `<a href="${link.href}" class="nav-item${isActive}"><span class="nav-icon">${link.icon}</span> ${link.label}${badge}</a>`;
    });

    return html;
  }

  function inject() {
    const root = document.getElementById('sidebar-root');
    if (!root) return;

    root.innerHTML = `
      <div class="sidebar-overlay" id="sidebar-overlay"></div>

      <button class="sidebar-toggle" id="sidebarToggle">
        <span class="arrow-icon">❮</span>
      </button>

      <aside class="sidebar">
        <a href="dashboard.html" class="logo-container">
          <img src="../../imagen/logo_IA.png" alt="Logo AI" class="logo-img">
          <div class="logo-text-group"></div>
        </a>

        <div class="sidebar-profile">
          <div class="profile-badge">
            <div class="profile-avatar" id="sidebar-avatar">JP</div>
            <div class="profile-info">
              <div class="profile-name" id="sidebar-name">Juan Pérez</div>
              <div class="profile-role" id="sidebar-role">Candidato</div>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <span class="nav-section-label">Principal</span>
          ${buildNav()}
        </nav>

        <div class="sidebar-footer">
          <a href="#" onclick="cerrarSesion()" class="nav-item">
            <span class="nav-icon">${LOGOUT_SVG}</span> Cerrar sesión
          </a>
        </div>
      </aside>
    `;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { inject(); loadUser(); });
  } else {
    inject();
    loadUser();
  }

  async function loadUser() {
    const cached = JSON.parse(localStorage.getItem('talentai_user') || 'null');
    if (cached) fillSidebar(cached);

    const token = localStorage.getItem('talentai_token') || sessionStorage.getItem('talentai_token');
    if (!token) return;
    try {
      const res = await fetch('https://ing-web-ii.onrender.com/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const u = await res.json();
        localStorage.setItem('talentai_user', JSON.stringify(u));
        fillSidebar(u);
      }
    } catch {}

    loadBadges(token);
  }

  async function loadBadges(token) {
    const API = 'https://ing-web-ii.onrender.com/api';
    const headers = { Authorization: `Bearer ${token}` };

    // Postulaciones: datos reales de la BD
    try {
      const res = await fetch(`${API}/applications/my`, { headers });
      if (res.ok) {
        const apps = await res.json();
        setBadge('applications.html', apps.length);
      }
    } catch {}

    // Guardados: cruza los IDs del localStorage contra los jobs reales
    try {
      const savedIds = JSON.parse(localStorage.getItem('conectaia_saved_jobs') || '[]');
      if (savedIds.length > 0) {
        const res = await fetch(`${API}/jobs`, { headers });
        if (res.ok) {
          const jobs = await res.json();
          const jobIds = new Set(jobs.map(j => j.id));
          const validCount = savedIds.filter(id => jobIds.has(id)).length;
          setBadge('saved.html', validCount);
        } else {
          setBadge('saved.html', savedIds.length);
        }
      }
    } catch {}
  }

  function setBadge(href, count) {
    if (!count || count === 0) return;
    const link = document.querySelector(`.nav-item[href="${href}"]`);
    if (!link) return;
    let badge = link.querySelector('.nav-badge-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-badge-count';
      link.appendChild(badge);
    }
    badge.textContent = count;
  }

  function fillSidebar(u) {
    const nombre = [u.firstName, u.lastName].filter(Boolean).join(' ')
      || u.companyName || u.email || '—';
    const iniciales = nombre !== '—'
      ? nombre.split(' ').filter(Boolean).map(w => w[0]).slice(0,2).join('').toUpperCase()
      : '?';
    const av = document.getElementById('sidebar-avatar');
    const sn = document.getElementById('sidebar-name');
    if (av) {
      if (u.photo) {
        av.style.backgroundImage = `url(${u.photo})`;
        av.style.backgroundSize = 'cover';
        av.style.backgroundPosition = 'center';
        av.textContent = '';
      } else {
        av.style.backgroundImage = '';
        av.textContent = iniciales;
      }
    }
    if (sn) sn.textContent = nombre;
  }

})();