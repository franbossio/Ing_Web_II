/**
 * sidebar-company.js
 * Inyecta el sidebar y el cerrar sesión en todas las páginas de empresa.
 * Uso: <div id="sidebar-root"></div>
 *      <script src="../../js/sidebar-company.js" type="module"></script>
 */
import { logout } from './auth.js';
import { updateDashboardHero } from './profile.js';

function getActiveHref() {
  return window.location.pathname.split('/').pop() || 'dashboard.html';
}

function renderSidebar() {
  const active = getActiveHref();

  const nav = [
    { label: 'Principal', type: 'label' },
    { href: 'dashboard.html',    icon: '📊', text: 'Dashboard' },
    { href: 'candidates.html',   icon: '🔍', text: 'Buscar candidatos', badge: '24' },
    { label: 'Ofertas', type: 'label' },
    { href: 'post-job.html',     icon: '➕', text: 'Publicar oferta' },
    { href: 'my-jobs.html',      icon: '📋', text: 'Mis ofertas' },
    { label: 'Gestión', type: 'label' },
    { href: 'applications.html', icon: '📬', text: 'Postulaciones', badge: '8' },
    { href: 'favorites.html',    icon: '⭐', text: 'Favoritos' },
    { href: 'settings.html',     icon: '⚙️', text: 'Configuración' },
  ];

  const navHTML = nav.map(item => {
    if (item.type === 'label') {
      return `<span class="nav-section-label">${item.label}</span>`;
    }
    const isActive = active === item.href ? ' active' : '';
    const badge    = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    return `<a href="${item.href}" class="nav-item${isActive}"><span class="nav-icon">${item.icon}</span> ${item.text}${badge}</a>`;
  }).join('\n      ');

  const html = `
  <aside class="sidebar">
    <a href="dashboard.html" class="logo-container">
      <img src="../../imagen/logo_IA.png" alt="Logo AI" class="logo-img">
      <div class="logo-text-group"></div>
    </a>
    <div class="sidebar-company">
      <div class="company-badge">
        <div class="company-avatar" id="sidebar-avatar">?</div>
        <div class="company-info">
          <div class="company-name" id="sidebar-name">Cargando...</div>
          <div class="company-role" id="sidebar-role">Empresa</div>
        </div>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${navHTML}
    </nav>
    <div class="sidebar-footer">
      <a href="#" onclick="cerrarSesion(event)" class="nav-item">
        <span class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EA3323">
            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/>
          </svg>
        </span> Cerrar sesión
      </a>
    </div>
  </aside>`;

  const root = document.getElementById('sidebar-root');
  if (root) root.outerHTML = html;
}

window.cerrarSesion = function(e) {
  if (e) e.preventDefault();
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) logout();
};

function loadUser() {
  const u = JSON.parse(localStorage.getItem('talentai_user') || 'null');
  if (u) updateDashboardHero(u);

  const token = localStorage.getItem('talentai_token') || sessionStorage.getItem('talentai_token');
  if (!token) return;
  fetch('http://localhost:3001/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.ok ? r.json() : null)
    .then(fresh => {
      if (fresh) {
        localStorage.setItem('talentai_user', JSON.stringify(fresh));
        updateDashboardHero(fresh);
      }
    }).catch(() => {});
}

renderSidebar();
loadUser();
