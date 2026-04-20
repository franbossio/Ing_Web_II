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
    { href: 'dashboard.html',    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#7A611D"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>', 
      label: 'Inicio',           section: 'Principal' },
    { href: 'candidates.html',   icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#7A611D"><path d="M360-240ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q32 0 64.5 3.5T489-425q-13 17-22.5 35.5T451-351q-23-5-45.5-7t-45.5-2q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32h323q4 22 11 42t18 38H40Zm207-367q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm466 0q-47 47-113 47-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113q0 66-47 113Zm-296.5-56.5Q440-607 440-640t-23.5-56.5Q393-720 360-720t-56.5 23.5Q280-673 280-640t23.5 56.5Q327-560 360-560t56.5-23.5ZM360-640Zm376.5 420q22.5-20 23.5-60 1-34-22.5-57T680-360q-34 0-57 23t-23 57q0 34 23 57t57 23q34 0 56.5-20ZM680-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 23-5.5 43.5T818-198L920-96l-56 56-102-102q-18 11-38.5 16.5T680-120Z"/></svg>', 
      label: 'Buscar candidatos',   badge: '24' },
    { href: 'post-job.html',     icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#7A611D"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>', 
      label: 'Publicar oferta',     section: 'Ofertas' },
    { href: 'my-jobs.html',      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#7A611D"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm80-80h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm221.5-198.5Q510-807 510-820t-8.5-21.5Q493-850 480-850t-21.5 8.5Q450-833 450-820t8.5 21.5Q467-790 480-790t21.5-8.5ZM200-200v-560 560Z"/></svg>', 
      label: 'Mis ofertas' },
    { href: 'applications.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#7A611D"><path d="M555-435q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35ZM400-160v-76q0-21 10-40t28-30q45-27 95.5-40.5T640-360q56 0 106.5 13.5T842-306q18 11 28 30t10 40v76H400Zm86-80h308q-35-20-74-30t-80-10q-41 0-80 10t-74 30Zm182.5-251.5Q680-503 680-520t-11.5-28.5Q657-560 640-560t-28.5 11.5Q600-537 600-520t11.5 28.5Q623-480 640-480t28.5-11.5ZM640-520Zm0 280ZM120-400v-80h320v80H120Zm0-320v-80h480v80H120Zm324 160H120v-80h360q-14 17-22.5 37T444-560Z"/></svg>', 
      label: 'Postulaciones',       badge: '8', section: 'Gestión' },
    { href: 'favorites.html',    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#7A611D"><path d="m389-400 91-55 91 55-24-104 80-69-105-9-42-98-42 98-105 9 80 69-24 104ZM200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>',
      label: 'Favoritos' },
    { href: 'settings.html',     icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#7A611D"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>',
      label: 'Configuración' },
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
