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

  const LINKS = [
    { href: 'dashboard.html',    icon: '📊', label: 'Inicio',           section: 'Principal' },
    { href: 'candidates.html',   icon: '🔍', label: 'Buscar candidatos',   badge: '24' },
    { href: 'post-job.html',     icon: '➕', label: 'Publicar oferta',     section: 'Ofertas' },
    { href: 'my-jobs.html',      icon: '📋', label: 'Mis ofertas' },
    { href: 'applications.html', icon: '📬', label: 'Postulaciones',       badge: '8', section: 'Gestión' },
    { href: 'favorites.html',    icon: '⭐', label: 'Favoritos' },
    { href: 'settings.html',     icon: '⚙️', label: 'Configuración' },
  ];

  const LOGOUT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EA3323"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>`;

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
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();
