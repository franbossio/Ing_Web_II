/**
 * sidebar-candidate.js
 * Inyecta el sidebar y el cerrar sesión en todas las páginas de candidato.
 * Uso: <div id="sidebar-root"></div>
 *      <script src="../../js/sidebar-candidate.js" type="module"></script>
 */
import { logout } from './auth.js';
import { updateDashboardHero } from './profile.js';

// Marcar el nav-item activo según la URL actual
function getActiveHref() {
  return window.location.pathname.split('/').pop() || 'dashboard.html';
}

function renderSidebar() {
  const active = getActiveHref();

  const nav = [
    { label: 'Principal', type: 'label' },
    { href: 'dashboard.html',    icon: '📊', text: 'Dashboard' },
    { href: 'jobs.html',         icon: '🔍', text: 'Explorar ofertas', badge: '12' },
    { label: 'Mi perfil', type: 'label' },
    { href: 'profile.html',      icon: '👤', text: 'Editar perfil' },
    { href: 'profile.html#cv',   icon: '📄', text: 'Mi CV', matchHref: 'profile.html' },
    { label: 'Postulaciones', type: 'label' },
    { href: 'applications.html', icon: '📬', text: 'Mis postulaciones', badge: '5' },
    { href: 'saved.html',        icon: '⭐', text: 'Guardados' },
    { href: 'settings.html',     icon: '⚙️', text: 'Configuración' },
  ];

  const navHTML = nav.map(item => {
    if (item.type === 'label') {
      return `<span class="nav-section-label">${item.label}</span>`;
    }
    const matchHref = item.matchHref || item.href;
    const isActive  = active === matchHref.split('#')[0] ? ' active' : '';
    const badge     = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    return `<a href="${item.href}" class="nav-item${isActive}"><span class="nav-icon">${item.icon}</span> ${item.text}${badge}</a>`;
  }).join('\n      ');

  const html = `
  <aside class="sidebar">
    <a href="dashboard.html" class="logo-container">
      <img src="../../imagen/logo_IA.png" alt="Logo AI" class="logo-img">
      <div class="logo-text-group"></div>
    </a>
    <div class="sidebar-profile">
      <div class="profile-badge">
        <div class="profile-avatar" id="sidebar-avatar">?</div>
        <div class="profile-info">
          <div class="profile-name" id="sidebar-name">Cargando...</div>
          <div class="profile-role" id="sidebar-role">Candidato</div>
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

// Cerrar sesión global
window.cerrarSesion = function(e) {
  if (e) e.preventDefault();
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) logout();
};

// Cargar datos del usuario en el sidebar
function loadUser() {
  const u = JSON.parse(localStorage.getItem('talentai_user') || 'null');
  if (u) updateDashboardHero(u);

  // Refrescar desde backend en background
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
