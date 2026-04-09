/**
 * TalentAI — profile.js
 * Maneja carga, guardado y visualización del perfil de candidato y empresa.
 */
import { getToken, getUser, saveUser } from './auth.js';

const API = 'http://localhost:3001/api';

// ══════════════════════════════════════════════════════════
// CÁLCULO DE COMPLETITUD
// ══════════════════════════════════════════════════════════

export function calcSections(u) {
  return {
    personal:   !!(u.firstName && u.lastName && u.email && u.phone && u.jobTitle && u.location && u.bio),
    experience: Array.isArray(u.experience) && u.experience.length > 0,
    education:  Array.isArray(u.education)  && u.education.length  > 0,
    skills:     Array.isArray(u.skills)     && u.skills.length     > 0
             && Array.isArray(u.softSkills) && u.softSkills.length > 0,
    languages:  Array.isArray(u.languages)  && u.languages.length  > 0,
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

// ══════════════════════════════════════════════════════════
// LEER DATOS DEL DOM
// ══════════════════════════════════════════════════════════

function readExperience() {
  const items = [...document.querySelectorAll('#exp-list .exp-item')];
  if (!items.length) return [];
  return items.map(item => {
    const inputs   = item.querySelectorAll('input[type="text"]');
    const months   = item.querySelectorAll('input[type="month"]');
    const textarea = item.querySelector('textarea');
    const current  = item.querySelector('input[type="checkbox"]')?.checked ?? false;
    return {
      title:       inputs[0]?.value?.trim() || '',
      company:     inputs[1]?.value?.trim() || '',
      startDate:   months[0]?.value || '',
      endDate:     current ? 'Presente' : (months[1]?.value || ''),
      current,
      description: textarea?.value?.trim() || '',
    };
  }).filter(e => e.title.length > 0 || e.company.length > 0);
}

function readEducation() {
  const items = [...document.querySelectorAll('#edu-list .exp-item')];
  if (!items.length) return [];
  return items.map(item => {
    const inputs  = item.querySelectorAll('input[type="text"]');
    const numbers = item.querySelectorAll('input[type="number"]');
    const select  = item.querySelector('select');
    return {
      career:      inputs[0]?.value?.trim() || '',
      institution: inputs[1]?.value?.trim() || '',
      startYear:   numbers[0]?.value || '',
      endYear:     numbers[1]?.value || '',
      status:      select?.options[select?.selectedIndex]?.text || '',
    };
  }).filter(e => e.career.length > 0 || e.institution.length > 0);
}

function readLanguages() {
  return [...document.querySelectorAll('#lang-list .lang-row')].map(row => {
    const input  = row.querySelector('input[type="text"]');
    const select = row.querySelector('select');
    return {
      name:  input?.value?.trim() || '',
      level: select?.options[select?.selectedIndex]?.text || '',
    };
  }).filter(l => l.name);
}

function getTags(wrapperId) {
  return [...document.querySelectorAll(`#${wrapperId} .tag, #${wrapperId} .tag-pill`)]
    .map(t => {
      const clone = t.cloneNode(true);
      clone.querySelectorAll('button, .tag-remove').forEach(b => b.remove());
      return clone.textContent.replace(/×/g, '').trim();
    })
    .filter(s => s.length > 0);
}

export function readCandidateForm() {
  const get    = id => document.getElementById(id)?.value?.trim() ?? '';
  const getSel = id => {
    const el = document.getElementById(id);
    return el?.options[el?.selectedIndex]?.value || el?.options[el?.selectedIndex]?.text || '';
  };
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
    languages:    readLanguages(),
    experience:   readExperience(),
    education:    readEducation(),
  };
}

export function readCompanyForm() {
  const get    = id => document.getElementById(id)?.value?.trim() || null;
  const getSel = id => {
    const el = document.getElementById(id);
    return el?.options[el?.selectedIndex]?.text || null;
  };
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

// ══════════════════════════════════════════════════════════
// LLENAR DOM CON DATOS
// ══════════════════════════════════════════════════════════

function setVal(id, val) {
  const el = document.getElementById(id);
  if (!el || val == null) return;
  if (el.tagName === 'SELECT') {
    [...el.options].forEach(o => { o.selected = o.value === String(val) || o.text === String(val); });
  } else {
    el.value = val;
  }
}

function fillTags(wrapperId, inputId, items) {
  const wrapper = document.getElementById(wrapperId);
  const input   = document.getElementById(inputId);
  if (!wrapper || !input) return;
  // Remover TODAS las tags existentes antes de agregar nuevas
  [...wrapper.querySelectorAll('.tag, .tag-pill')].forEach(t => t.remove());
  if (!items || !items.length) return;
  items.forEach(skill => {
    if (!skill || !skill.trim()) return;
    const tag = document.createElement('span');
    tag.className = 'tag-pill';
    tag.innerHTML = `${skill.trim()} <button class="tag-remove" onclick="this.parentElement.remove()">×</button>`;
    wrapper.insertBefore(tag, input);
  });
}

function fillExperience(list) {
  const container = document.getElementById('exp-list');
  if (!container) return;
  container.innerHTML = '';           // limpiar hardcodeados
  if (!list?.length) return;          // si está vacío, queda limpio
  list.forEach(exp => {
    const isCurrent = exp.current || exp.endDate === 'Presente';
    const item = document.createElement('div');
    item.className = 'exp-item';
    item.innerHTML = `
      <div class="exp-item-header">
        <div>
          <div class="exp-item-title">${exp.title || ''}</div>
          <div class="exp-item-sub">🏢 ${exp.company || ''} · ${exp.startDate || ''} – ${isCurrent ? 'Presente' : (exp.endDate || '')}</div>
        </div>
        <div class="exp-item-actions">
          <button class="exp-action-btn danger" onclick="this.closest('.exp-item').remove()">🗑 Eliminar</button>
        </div>
      </div>
      <div class="form-grid" style="margin-bottom:14px;">
        <div class="form-group"><label>Cargo</label><input type="text" value="${exp.title || ''}" /></div>
        <div class="form-group"><label>Empresa</label><input type="text" value="${exp.company || ''}" /></div>
        <div class="form-group"><label>Fecha inicio</label><input type="month" value="${exp.startDate || ''}" /></div>
        <div class="form-group">
          <label>Fecha fin</label>
          <input type="month" value="${isCurrent ? '' : (exp.endDate || '')}" ${isCurrent ? 'disabled' : ''} />
          <label style="display:flex;align-items:center;gap:6px;font-size:0.8rem;margin-top:6px;cursor:pointer;">
            <input type="checkbox" ${isCurrent ? 'checked' : ''} onchange="this.closest('.form-group').querySelector('input[type=month]').disabled=this.checked" />
            Trabajo actual
          </label>
        </div>
        <div class="form-group col-span-2"><label>Descripción</label><textarea rows="3">${exp.description || ''}</textarea></div>
      </div>`;
    container.appendChild(item);
  });
}

function fillEducation(list) {
  const container = document.getElementById('edu-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list?.length) return;
  list.forEach(edu => {
    const item = document.createElement('div');
    item.className = 'exp-item';
    item.innerHTML = `
      <div class="exp-item-header">
        <div>
          <div class="exp-item-title">${edu.career || ''}</div>
          <div class="exp-item-sub">🎓 ${edu.institution || ''} · ${edu.startYear || ''} – ${edu.endYear || ''}</div>
        </div>
        <div class="exp-item-actions">
          <button class="exp-action-btn danger" onclick="this.closest('.exp-item').remove()">🗑 Eliminar</button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Título / Carrera</label><input type="text" value="${edu.career || ''}" /></div>
        <div class="form-group"><label>Institución</label><input type="text" value="${edu.institution || ''}" /></div>
        <div class="form-group"><label>Año inicio</label><input type="number" value="${edu.startYear || ''}" min="1990" max="2030" /></div>
        <div class="form-group"><label>Año fin</label><input type="number" value="${edu.endYear || ''}" min="1990" max="2030" /></div>
        <div class="form-group">
          <label>Estado</label>
          <select>
            <option ${edu.status === 'Graduado'   ? 'selected' : ''}>Graduado</option>
            <option ${edu.status === 'En curso'   ? 'selected' : ''}>En curso</option>
            <option ${edu.status === 'Incompleto' ? 'selected' : ''}>Incompleto</option>
          </select>
        </div>
      </div>`;
    container.appendChild(item);
  });
}

function fillLanguages(list) {
  const container = document.getElementById('lang-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list?.length) return;
  list.forEach(lang => {
    const row = document.createElement('div');
    row.className = 'lang-row';
    row.innerHTML = `
      <input type="text" style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:var(--radius-sm);color:var(--clr-text);font-family:var(--font-body);font-size:0.85rem;padding:6px 10px;outline:none;min-width:100px;" value="${lang.name || ''}" placeholder="Idioma" />
      <div class="lang-level">
        <select>
          <option ${lang.level === 'Nativo'     ? 'selected' : ''}>Nativo</option>
          <option ${lang.level === 'Avanzado'   ? 'selected' : ''}>Avanzado</option>
          <option ${lang.level === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
          <option ${lang.level === 'Básico'     ? 'selected' : ''}>Básico</option>
        </select>
      </div>
      <button class="lang-remove" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(row);
  });
}

export function fillProfileForm(u) {
  if (u.role === 'candidate' || !u.role) {
    setVal('firstName', u.firstName);
    setVal('lastName',  u.lastName);
    setVal('email',     u.email);
    setVal('phone',     u.phone);
    setVal('jobTitle',  u.jobTitle);
    setVal('location',  u.location);
    setVal('bio',       u.bio);
    setVal('linkedin',  u.linkedin);
    setVal('github',    u.github);
    setVal('portfolio', u.portfolio);
    setVal('salary',    u.salary);
    setVal('availability', u.availability);
    setVal('modality',  u.modality);
    fillTags('tech-wrapper', 'tech-input', u.skills     || []);
    fillTags('soft-wrapper', 'soft-input', u.softSkills || []);
    fillExperience(u.experience || []);
    fillEducation(u.education   || []);
    fillLanguages(u.languages   || []);
  } else {
    setVal('companyName', u.companyName);
    setVal('industry',    u.industry);
    setVal('companySize', u.companySize);
    setVal('location',    u.location);
    setVal('website',     u.website);
    setVal('linkedin',    u.linkedin);
    setVal('bio',         u.bio);
  }
}

// ══════════════════════════════════════════════════════════
// ACTUALIZAR UI (steps, badges, hero, sidebar, ring)
// ══════════════════════════════════════════════════════════

function updateSteps(u) {
  const s = calcSections(u);
  const map = {
    'Datos personales':    s.personal,
    'Experiencia laboral': s.experience,
    'CV subido':           s.cv,
    'Educación':           s.education,
    'Idiomas':             s.languages,
    'Habilidades':         s.skills,
  };
  document.querySelectorAll('.step-item').forEach(item => {
    const label = item.querySelector('span')?.textContent?.trim();
    if (!(label in map)) return;
    const done = map[label];
    item.classList.toggle('done', done);
    item.classList.toggle('pending', !done);
    const dot = item.querySelector('.step-dot');
    if (dot) dot.textContent = done ? '✓' : '!';
    item.style.color = '';
  });
}

function updatePanelBadges(u) {
  const s = calcSections(u);
  const map = {
    'badge-personal':   { done: s.personal,   ok: '✓ Completado',   no: '⚠ Incompleto' },
    'badge-experience': { done: s.experience, ok: '✓ Completada',   no: '⚠ Sin experiencia' },
    'badge-education':  { done: s.education,  ok: '✓ Completada',   no: '⚠ Sin educación' },
    'badge-skills':     { done: s.skills,     ok: '✓ Completas',    no: '⚠ Sin habilidades' },
    'badge-cv':         { done: s.cv,         ok: '✓ CV cargado',   no: '⚠ Sin CV' },
  };
  Object.entries(map).forEach(([id, cfg]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `badge ${cfg.done ? 'badge-green' : 'badge-gold'}`;
    el.textContent = cfg.done ? cfg.ok : cfg.no;
  });
}

function updateProfileHero(u) {
  const av = document.querySelector('.avatar-large');
  if (av) av.textContent = `${(u.firstName||'')[0]||''}${(u.lastName||'')[0]||''}`.toUpperCase() || '?';
  const nm = document.querySelector('.avatar-name');
  if (nm) nm.textContent = `${u.firstName||''} ${u.lastName||''}`.trim();
  const sb = document.querySelector('.avatar-sub');
  if (sb) sb.textContent = [u.jobTitle, u.location].filter(Boolean).join(' · ');
}

export function updateRing(pct) {
  const ring  = document.querySelector('.ring-fill');
  const label = document.querySelector('.ring-pct');
  if (!ring || !label) return;
  const circ = 2 * Math.PI * 30;
  ring.style.strokeDasharray  = circ;
  ring.style.strokeDashoffset = circ * (1 - pct / 100);
  label.textContent = pct + '%';
}

export function updateDashboardHero(u) {
  const nombre   = u.role === 'company' ? (u.companyName||'') : `${u.firstName||''} ${u.lastName||''}`.trim();
  const iniciales = u.role === 'company'
    ? (u.companyName||'E').substring(0,2).toUpperCase()
    : `${(u.firstName||'')[0]||''}${(u.lastName||'')[0]||''}`.toUpperCase();

  // Sidebar
  const $ = id => document.getElementById(id);
  if ($('sidebar-avatar')) $('sidebar-avatar').textContent = iniciales;
  if ($('sidebar-name'))   $('sidebar-name').textContent   = nombre;
  if ($('sidebar-role'))   $('sidebar-role').textContent   = u.role === 'company' ? 'Empresa' : 'Candidato';

  // Topbar
  const sub = document.querySelector('.topbar-subtitle');
  if (sub) sub.textContent = `Bienvenido de vuelta, ${u.role==='company' ? u.companyName : u.firstName || ''} 👋`;

  // Hero dashboard
  const heroName = document.querySelector('.hero-name');
  if (heroName) heroName.textContent = nombre;
  const heroAvatar = document.querySelector('.hero-avatar');
  if (heroAvatar) heroAvatar.textContent = iniciales;
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle && u.jobTitle) heroTitle.textContent = u.jobTitle;
  const metas = document.querySelectorAll('.hero-meta span');
  if (metas[0] && u.location)     metas[0].textContent = `📍 ${u.location}`;
  if (metas[2] && u.availability) metas[2].textContent = `💼 ${u.availability}`;
}

// ══════════════════════════════════════════════════════════
// GUARDAR EN BACKEND
// ══════════════════════════════════════════════════════════

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
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  const updated = await res.json();
  saveUser(updated);
  return updated;
}

// ══════════════════════════════════════════════════════════
// TRAER DATOS FRESCOS DEL BACKEND
// ══════════════════════════════════════════════════════════

async function fetchFreshUser() {
  try {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const fresh = await res.json();
    saveUser(fresh);
    return fresh;
  } catch { return null; }
}

// ══════════════════════════════════════════════════════════
// INITS PRINCIPALES
// ══════════════════════════════════════════════════════════

export async function initProfile() {
  // 1. Mostrar caché inmediatamente
  const cached = getUser();
  if (cached) {
    fillProfileForm(cached);
    updateProfileHero(cached);
    updateSteps(cached);
    updatePanelBadges(cached);
    updateDashboardHero(cached);
  }
  // 2. Refrescar desde la DB — pisa hardcodeados del HTML con datos reales
  const fresh = await fetchFreshUser();
  if (fresh) {
    fillProfileForm(fresh);
    updateProfileHero(fresh);
    updateSteps(fresh);
    updatePanelBadges(fresh);
    updateDashboardHero(fresh);
  }
}

// Refrescar solo la UI (badges, steps, sidebar) SIN tocar el DOM del formulario
// Usar esto después de guardar para no borrar lo que el usuario acaba de escribir
export function refreshUI(u) {
  updateProfileHero(u);
  updateSteps(u);
  updatePanelBadges(u);
  updateDashboardHero(u);
}

export async function initDashboard() {
  const cached = getUser();
  if (cached) {
    updateDashboardHero(cached);
    updateRing(cached.role==='company' ? calcCompanyPercent(cached) : calcCandidatePercent(cached));
  }
  const fresh = await fetchFreshUser();
  if (fresh) {
    updateDashboardHero(fresh);
    updateRing(fresh.role==='company' ? calcCompanyPercent(fresh) : calcCandidatePercent(fresh));
  }
}