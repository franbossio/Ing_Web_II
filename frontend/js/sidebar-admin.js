import { logout } from './auth.js';

window.cerrarSesion = function () {
  if (confirm('¿Cerrar sesión?')) logout();
};

(function () {

  function icon(id, fill = '#7A611D') {
    return `<svg width="20" height="20" fill="${fill}"><use href="../../imagen/icons.svg#${id}"/></svg>`;
  }

  const LINKS = [
    { href: 'dashboard.html', icon: icon('icon-home'),       label: 'Inicio',   section: 'Panel' },
    { href: 'users.html',     icon: icon('icon-candidates'), label: 'Usuarios', section: 'Gestión' },
    { href: 'jobs.html',      icon: icon('icon-my-jobs'),    label: 'Ofertas' },
  ];

  const LOGOUT_SVG = icon('icon-logout', '#EA3323');

  function currentPage() {
    return window.location.pathname.split('/').pop().split('#')[0];
  }

  function buildNav() {
    let html = '';
    LINKS.forEach(link => {
      if (link.section) html += `<span class="nav-section-label">${link.section}</span>`;
      const isActive = link.href === currentPage() ? ' active' : '';
      html += `<a href="${link.href}" class="nav-item${isActive}"><span class="nav-icon">${link.icon}</span> ${link.label}</a>`;
    });
    return html;
  }

  function inject() {
    const root = document.getElementById('sidebar-root');
    if (!root) return;
    root.innerHTML = `
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <button class="sidebar-toggle" id="sidebarToggle"><span class="arrow-icon">❮</span></button>
      <aside class="sidebar">

        <a href="dashboard.html" class="logo-container">
          <img src="../../imagen/logo_IA.png" alt="Logo" class="logo-img">
        </a>

        <div style="margin:0 12px 8px;padding:14px 14px 16px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:12px;">
          <div style="display:flex;align-items:center;gap:11px;">
            <div id="sidebar-avatar" style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#8a6e2f);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;border:2px solid rgba(201,168,76,0.4);color:#0d0f14;font-weight:700;background-size:cover;background-position:center;">⚙</div>
            <div style="min-width:0;">
              <div style="font-size:0.83rem;font-weight:700;color:var(--clr-text);line-height:1.2;" id="sidebar-name">Administrador</div>
              <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--clr-accent);margin-top:2px;">Sistema</div>
              <div style="font-size:0.67rem;color:var(--clr-muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;" id="sidebar-email"></div>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">${buildNav()}</nav>

        <div class="sidebar-footer">
          <a href="#" onclick="cerrarSesion()" class="nav-item">
            <span class="nav-icon">${LOGOUT_SVG}</span> Cerrar sesión
          </a>
        </div>
      </aside>`;
  }

  function fillSidebar(u) {
    const av = document.getElementById('sidebar-avatar');
    const emailEl = document.getElementById('sidebar-email');
    if (av && u.photo) {
      av.style.backgroundImage = `url(${u.photo})`;
      av.textContent = '';
    }
    if (emailEl && u.email) emailEl.textContent = u.email;
  }

  function guardAdmin() {
    const u = JSON.parse(localStorage.getItem('talentai_user') || 'null');
    const t = localStorage.getItem('talentai_token') || sessionStorage.getItem('talentai_token');
    if (!t || !u || u.role !== 'admin') {
      window.location.href = '../../pages/login.html';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { guardAdmin(); inject(); loadUser(); });
  } else {
    guardAdmin(); inject(); loadUser();
  }

  async function loadUser() {
    const cached = JSON.parse(localStorage.getItem('talentai_user') || 'null');
    if (cached) fillSidebar(cached);
  }

})();
