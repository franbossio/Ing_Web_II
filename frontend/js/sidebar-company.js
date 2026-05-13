/**
 * sidebar-company.js
 * Inyecta el sidebar completo de la empresa y marca el nav-item activo
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
    { href: 'dashboard.html',    icon: icon('icon-home'),                  label: 'Inicio',             section: 'Principal' },
    { href: 'candidates.html',   icon: icon('icon-candidates'),            label: 'Buscar candidatos',  badge: '' },
    { href: 'post-job.html',     icon: icon('icon-post-job'),              label: 'Publicar oferta',    section: 'Ofertas' },
    { href: 'my-jobs.html',      icon: icon('icon-my-jobs'),               label: 'Mis ofertas' },
    { href: 'applications.html', icon: icon('icon-company-applications'),  label: 'Postulaciones',      badge: '', section: 'Gestión' },
    { href: 'favorites.html',    icon: icon('icon-saved'),                 label: 'Favoritos' },
    { href: 'settings.html',     icon: icon('icon-settings'),              label: 'Configuración' },
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
      const isActive = link.href === currentPage() ? ' active' : '';
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

        <div class="sidebar-company">
          <div class="company-badge">
            <div class="company-avatar" id="sidebar-avatar">AC</div>
            <div class="company-info">
              <div class="company-name" id="sidebar-name">Acme Corp S.A.</div>
              <div class="company-role" id="sidebar-role">Empresa</div>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
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
  }

  function fillSidebar(u) {
    const nombre = u.companyName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '—';
    const iniciales = nombre !== '—'
      ? nombre.split(' ').filter(Boolean).map(w => w[0]).slice(0,2).join('').toUpperCase()
      : '?';
    const av = document.getElementById('sidebar-avatar');
    const sn = document.getElementById('sidebar-name');
    if (av) av.textContent = iniciales;
    if (sn) sn.textContent = nombre;
  }

})();