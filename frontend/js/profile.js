/**
 * TalentAI — profile.js
 */
import { getToken, getUser, saveUser } from './auth.js';

const API = 'http://localhost:3001/api';

// ─── Calcular completitud por sección ────────────────────────────────────────
export function calcSections(u) {
  return {
    personal:   !!(u.firstName && u.lastName && u.email && u.phone && u.jobTitle && u.location && u.bio),
    experience: !!(u.experience?.length),
    education:  !!(u.education?.length),
    skills:     !!(u.skills?.length && u.softSkills?.length),
    languages:  !!(u.languages?.length),
    cv:         !!(u.cvUrl || u.cvFileName),
  };
}

export function calcCandidatePercent(u) {
  const s = calcSections(u);
  const vals = Object.values(s);
  return Math.round((vals.filter(Boolean).length / vals.length) * 100);
}

export function calcCompanyPercent(u) {
  const fields = [u.companyName, u.email, u.industry, u.companySize, u.location, u.website, u.bio, u.linkedin];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

// ─── Actualizar steps de progreso en profile.html ────────────────────────────
function updateSteps(u) {
  const s = calcSections(u);
  const map = {
    'Datos personales':  s.personal,
    'Experiencia laboral': s.experience,
    'CV subido':         s.cv,
    'Educación':         s.education,
    'Idiomas':           s.languages,
    'Habilidades':       s.skills,
  };
  document.querySelectorAll('.step-item').forEach(item => {
    const label = item.querySelector('span')?.textContent?.trim();
    if (!(label in map)) return;
    const done = map[label];
    item.classList.remove('done', 'pending');
    item.classList.add(done ? 'done' : 'pending');
    const dot = item.querySelector('.step-dot');
    if (dot) dot.textContent = done ? '✓' : '!';
    item.style.color = '';
  });
}

// ─── Actualizar badges de cada panel ─────────────────────────────────────────
function updatePanelBadges(u) {
  const s = calcSections(u);

  const badgeMap = {
    'badge-personal':   { done: s.personal,   doneText: '✓ Completado',     pendText: '⚠ Incompleto' },
    'badge-experience': { done: s.experience, doneText: '✓ Completada',     pendText: '⚠ Sin experiencia' },
    'badge-education':  { done: s.education,  doneText: '✓ Completada',     pendText: '⚠ Sin educación' },
    'badge-skills':     { done: s.skills,     doneText: '✓ Completas',      pendText: '⚠ Sin habilidades' },
    'badge-cv':         { done: s.cv,         doneText: '✓ CV cargado',     pendText: '⚠ Sin CV' },
  };

  Object.entries(badgeMap).forEach(([id, cfg]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `badge ${cfg.done ? 'badge-green' : 'badge-gold'}`;
    el.textContent = cfg.done ? cfg.doneText : cfg.pendText;
  });
}

// ─── Actualizar avatar y nombre en el perfil ─────────────────────────────────
function updateProfileHero(u) {
  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();

  const avatarLarge = document.querySelector('.avatar-large');
  if (avatarLarge) {
    avatarLarge.textContent = `${(u.firstName||'')[0]||''}${(u.lastName||'')[0]||''}`.toUpperCase() || '?';
  }
  const avatarName = document.querySelector('.avatar-name');
  if (avatarName) avatarName.textContent = name;

  const avatarSub = document.querySelector('.avatar-sub');
  if (avatarSub) {
    const parts = [u.jobTitle, u.location].filter(Boolean);
    avatarSub.textContent = parts.join(' · ');
  }
}

// ─── Actualizar ring del dashboard ───────────────────────────────────────────
export function updateRing(pct) {
  const ring  = document.querySelector('.ring-fill');
  const label = document.querySelector('.ring-pct');
  if (!ring || !label) return;
  const r = 30;
  const circ = 2 * Math.PI * r;
  ring.style.strokeDasharray  = circ;
  ring.style.strokeDashoffset = circ * (1 - pct / 100);
  label.textContent = pct + '%';
}

// ─── Actualizar hero del dashboard ───────────────────────────────────────────
export function updateDashboardHero(u) {
  const nombre = u.role === 'company'
    ? (u.companyName || '')
    : `${u.firstName || ''} ${u.lastName || ''}`.trim();

  const iniciales = u.role === 'company'
    ? (u.companyName || 'E').substring(0,2).toUpperCase()
    : `${(u.firstName||'')[0]||''}${(u.lastName||'')[0]||''}`.toUpperCase();

  // ── Sidebar (presente en todas las páginas) ──
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarName   = document.getElementById('sidebar-name');
  const sidebarRole   = document.getElementById('sidebar-role');
  if (sidebarAvatar) sidebarAvatar.textContent = iniciales;
  if (sidebarName)   sidebarName.textContent   = nombre;
  if (sidebarRole)   sidebarRole.textContent   = u.role === 'company' ? 'Empresa' : 'Candidato';

  // ── Topbar bienvenida ──
  const subtitle = document.querySelector('.topbar-subtitle');
  if (subtitle) {
    const primerNombre = u.role === 'company' ? u.companyName : u.firstName;
    subtitle.textContent = `Bienvenido de vuelta, ${primerNombre || ''} 👋`;
  }

  // ── Hero del dashboard ──
  const heroName = document.querySelector('.hero-name');
  if (heroName) heroName.textContent = nombre;

  const heroAvatar = document.querySelector('.hero-avatar');
  if (heroAvatar) heroAvatar.textContent = iniciales;

  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle && u.role === 'candidate' && u.jobTitle) {
    heroTitle.textContent = u.jobTitle;
  }

  const metas = document.querySelectorAll('.hero-meta span');
  if (metas[0] && u.location)     metas[0].textContent = `📍 ${u.location}`;
  if (metas[2] && u.availability) metas[2].textContent = `💼 ${u.availability}`;
}

// ─── Llenar inputs del formulario ────────────────────────────────────────────
export function fillProfileForm(u) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (!el || val == null) return;
    if (el.tagName === 'SELECT') {
      [...el.options].forEach(o => { o.selected = o.value === String(val) || o.text === String(val); });
    } else {
      el.value = val;
    }
  };

  if (u.role === 'candidate' || !u.role) {
    set('firstName', u.firstName);
    set('lastName',  u.lastName);
    set('email',     u.email);
    set('phone',     u.phone);
    set('jobTitle',  u.jobTitle);
    set('location',  u.location);
    set('bio',       u.bio);
    set('linkedin',  u.linkedin);
    set('github',    u.github);
    set('portfolio', u.portfolio);
    set('salary',    u.salary);
    set('availability', u.availability);
    set('modality',  u.modality);
    fillTags('tech-wrapper', 'tech-input', u.skills || []);
    fillTags('soft-wrapper', 'soft-input', u.softSkills || []);
  } else {
    set('companyName', u.companyName);
    set('industry',    u.industry);
    set('companySize', u.companySize);
    set('location',    u.location);
    set('website',     u.website);
    set('linkedin',    u.linkedin);
    set('bio',         u.bio);
  }
}

function fillTags(wrapperId, inputId, items) {
  const wrapper = document.getElementById(wrapperId);
  const input   = document.getElementById(inputId);
  if (!wrapper || !input) return;
  wrapper.querySelectorAll('.tag').forEach(t => t.remove());
  items.forEach(skill => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${skill} <button class="tag-remove" onclick="this.parentElement.remove()">×</button>`;
    wrapper.insertBefore(tag, input);
  });
}

// ─── Leer formulario candidato ────────────────────────────────────────────────
export function readCandidateForm() {
  const get = id => document.getElementById(id)?.value?.trim() || null;
  const getSel = id => { const el = document.getElementById(id); return el?.options[el.selectedIndex]?.text || null; };
  const getTags = wid => [...document.querySelectorAll(`#${wid} .tag`)]
    .map(t => t.textContent.replace('×','').trim()).filter(Boolean);

  return {
    firstName:    get('firstName'),
    lastName:     get('lastName'),
    phone:        get('phone'),
    jobTitle:     get('jobTitle'),
    location:     get('location'),
    bio:          get('bio'),
    linkedin:     get('linkedin'),
    github:       get('github'),
    portfolio:    get('portfolio'),
    salary:       get('salary') ? Number(get('salary')) : null,
    availability: getSel('availability'),
    modality:     getSel('modality'),
    skills:       getTags('tech-wrapper'),
    softSkills:   getTags('soft-wrapper'),
  };
}

// ─── Leer formulario empresa ──────────────────────────────────────────────────
export function readCompanyForm() {
  const get = id => document.getElementById(id)?.value?.trim() || null;
  const getSel = id => { const el = document.getElementById(id); return el?.options[el.selectedIndex]?.text || null; };
  return {
    companyName: get('companyName'),
    industry:    getSel('industry'),
    companySize: getSel('companySize'),
    location:    get('location'),
    website:     get('website'),
    linkedin:    get('linkedin'),
    bio:         get('bio'),
  };
}

// ─── Guardar en backend ───────────────────────────────────────────────────────
export async function saveProfile(data) {
  const token = getToken();
  const res = await fetch(`${API}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al guardar');
  }
  const updated = await res.json();
  saveUser(updated);
  return updated;
}

// ─── Init página de perfil ────────────────────────────────────────────────────
export function initProfile() {
  const u = getUser();
  if (!u) return;
  fillProfileForm(u);
  updateProfileHero(u);
  updateSteps(u);
  updatePanelBadges(u);
}

// ─── Init dashboard ───────────────────────────────────────────────────────────
export function initDashboard() {
  const u = getUser();
  if (!u) return;
  updateDashboardHero(u);
  const pct = u.role === 'company' ? calcCompanyPercent(u) : calcCandidatePercent(u);
  updateRing(pct);
}
