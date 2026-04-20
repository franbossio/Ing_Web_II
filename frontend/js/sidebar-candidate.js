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

  const LINKS = [
    { href: 'dashboard.html',    icon: '📊', label: 'Inicio' },
    { href: 'jobs.html',         icon: '🔍', label: 'Explorar ofertas', badge: '12' },
    { href: 'profile.html',      icon: '👤', label: 'Editar perfil',    section: 'Mi perfil' },
    { href: 'profile.html#cv',   icon: '📄', label: 'Mi CV' },
    { href: 'applications.html', icon: '📬', label: 'Mis postulaciones', badge: '5', section: 'Postulaciones' },
    { href: 'saved.html',        icon: '⭐', label: 'Guardados' },
    { href: 'settings.html',     icon: '⚙️', label: 'Configuración' },
  ];

  const LOGOUT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EA3323"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>`;

  function currentPage() {
    return window.location.pathname.split('/').pop().split('#')[0];
  }

  function buildNav() {
    let html = '';
    let sectionOpen = false;

    LINKS.forEach(link => {
      if (link.section) {
        html += `<span class="nav-section-label">${link.section}</span>`;
      }
      const page    = link.href.split('#')[0];
      const isActive = page === currentPage() ? ' active' : '';
      const badge   = link.badge ? `<span class="nav-badge">${link.badge}</span>` : '';
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
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();
