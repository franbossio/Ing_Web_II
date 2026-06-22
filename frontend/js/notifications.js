const API = 'https://ing-web-ii.onrender.com/api';

function getToken() {
  return localStorage.getItem('talentai_token') || sessionStorage.getItem('talentai_token');
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

const TYPE_ICON = { status_change: '📋', new_application: '👤', new_job: '💼' };

let _bell = null;
let _dropdown = null;
let _open = false;

function findBell() {
  return [...document.querySelectorAll('button.icon-btn')].find(b => b.querySelector('.notif-dot'));
}

function updateDot(count) {
  const dot = _bell && _bell.querySelector('.notif-dot');
  if (!dot) return;
  if (count > 0) {
    dot.style.display = '';
  } else {
    dot.style.display = 'none';
  }
}

function positionDropdown() {
  if (!_bell || !_dropdown) return;
  const rect = _bell.getBoundingClientRect();
  const dropW = 340;
  let left = rect.right - dropW + window.scrollX;
  if (left < 8) left = 8;
  _dropdown.style.top  = (rect.bottom + window.scrollY + 6) + 'px';
  _dropdown.style.left = left + 'px';
}

function buildDropdown() {
  const d = document.createElement('div');
  d.id = '_notif_dropdown';
  Object.assign(d.style, {
    position:       'absolute',
    width:          '340px',
    maxHeight:      '430px',
    overflowY:      'auto',
    background:     'var(--clr-surface, #16181f)',
    border:         '1px solid var(--clr-border, #2a2d38)',
    borderRadius:   '12px',
    boxShadow:      '0 12px 40px rgba(0,0,0,0.55)',
    zIndex:         '99999',
    display:        'none',
    scrollbarWidth: 'thin',
    fontFamily:     'var(--font-body, sans-serif)',
  });

  d.innerHTML = `
    <div id="_notif_header" style="padding:13px 16px 10px;border-bottom:1px solid var(--clr-border,#2a2d38);
         display:flex;align-items:center;justify-content:space-between;
         position:sticky;top:0;background:var(--clr-surface,#16181f);border-radius:12px 12px 0 0;z-index:1;">
      <span style="font-size:0.8rem;font-weight:700;color:var(--clr-text,#f0e6c8);">Notificaciones</span>
      <button id="_notif_close" style="background:none;border:none;color:var(--clr-muted,#606474);
        cursor:pointer;font-size:0.9rem;padding:3px 7px;border-radius:4px;line-height:1;">✕</button>
    </div>
    <div id="_notif_list_inner">
      <div style="padding:20px;text-align:center;color:var(--clr-muted,#606474);font-size:0.82rem;">Cargando…</div>
    </div>`;

  document.body.appendChild(d);
  return d;
}

function renderList(list) {
  const el = document.getElementById('_notif_list_inner');
  if (!el) return;

  if (!list.length) {
    el.innerHTML = `
      <div style="padding:36px 20px;text-align:center;">
        <div style="font-size:1.8rem;margin-bottom:10px;opacity:0.5;">🔔</div>
        <div style="color:var(--clr-muted,#606474);font-size:0.83rem;">Sin notificaciones por ahora</div>
      </div>`;
    return;
  }

  el.innerHTML = list.map(n => `
    <div style="display:flex;gap:11px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);
         ${n.read ? '' : 'background:rgba(201,168,76,0.04);'}">
      <div style="font-size:1.05rem;margin-top:2px;flex-shrink:0;">${TYPE_ICON[n.type] || '🔔'}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.82rem;font-weight:${n.read ? '500' : '700'};
             color:var(--clr-text,#f0e6c8);margin-bottom:3px;line-height:1.3;">${escHtml(n.title)}</div>
        <div style="font-size:0.76rem;color:var(--clr-muted,#606474);line-height:1.4;">${escHtml(n.message)}</div>
        <div style="font-size:0.67rem;color:var(--clr-muted,#606474);margin-top:5px;opacity:0.65;">${timeAgo(n.createdAt)}</div>
      </div>
      ${n.read ? '' : '<div style="width:7px;height:7px;border-radius:50%;background:#c9a84c;margin-top:5px;flex-shrink:0;"></div>'}
    </div>`).join('');
}

async function loadAndRender() {
  const token = getToken();
  const el = document.getElementById('_notif_list_inner');
  if (!token) {
    if (el) el.innerHTML = `<div style="padding:16px;text-align:center;color:var(--clr-muted,#606474);font-size:0.82rem;">No autenticado</div>`;
    return;
  }
  try {
    const res = await fetch(`${API}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (el) el.innerHTML = `<div style="padding:16px;text-align:center;color:#e05c5c;font-size:0.82rem;">Error ${res.status} — reiniciá el servidor</div>`;
      return;
    }
    const list = await res.json();
    renderList(list);
    updateDot(list.filter(n => !n.read).length);
  } catch (err) {
    if (el) el.innerHTML = `<div style="padding:16px;text-align:center;color:#e05c5c;font-size:0.82rem;">Sin conexión al servidor</div>`;
  }
}

async function loadCount() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${API}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const list = await res.json();
    updateDot(list.filter(n => !n.read).length);
  } catch {}
}

function openDropdown() {
  if (!_dropdown) return;
  positionDropdown();
  _dropdown.style.display = 'block';
  _open = true;
  loadAndRender();
  // marcar como leídas
  const token = getToken();
  if (token) {
    fetch(`${API}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => updateDot(0)).catch(() => {});
  }
}

function closeDropdown() {
  if (!_dropdown) return;
  _dropdown.style.display = 'none';
  _open = false;
}

function setup() {
  _bell = findBell();
  if (!_bell) return;

  _dropdown = buildDropdown();
  positionDropdown();

  // Abrir/cerrar al clickear la campanita
  _bell.addEventListener('click', (e) => {
    e.stopPropagation();
    _open ? closeDropdown() : openDropdown();
  });

  // Cerrar con botón X
  document.getElementById('_notif_close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeDropdown();
  });

  // Cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (_open && !_dropdown.contains(e.target) && !_bell.contains(e.target)) {
      closeDropdown();
    }
  });

  // Reposicionar al hacer scroll o resize
  window.addEventListener('scroll', positionDropdown, { passive: true });
  window.addEventListener('resize', positionDropdown, { passive: true });

  // Conteo inicial + polling cada 60s
  loadCount();
  setInterval(loadCount, 60000);
}

export function initNotifications() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    // Pequeño defer para asegurar que el DOM esté pintado
    setTimeout(setup, 0);
  }
}
