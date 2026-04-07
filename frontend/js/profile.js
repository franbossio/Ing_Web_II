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
  return Math.round((Object.values(s).filter(Boolean).length / Object.values(s).length) * 100);
}

export function calcCompanyPercent(u) {
  const fields = [u.companyName, u.email, u.industry, u.companySize, u.location, u.website, u.bio, u.linkedin];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

// ─── Leer experiencia del DOM ─────────────────────────────────────────────────
function readExperience() {
  return [...document.querySelectorAll('#exp-list .exp-item')].map(item => {
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
  }).filter(e => e.title || e.company);
}

// ─── Leer educación del DOM ───────────────────────────────────────────────────
function readEducation() {
  return [...document.querySelectorAll('#edu-list .exp-item')].map(item => {
    const inputs  = item.querySelectorAll('input[type="text"]');
    const numbers = item.querySelectorAll('input[type="number"]');
    const select  = item.querySelector('select');
    return {
      career:      inputs[0]?.value?.trim() || '',
      institution: inputs[1]?.value?.trim() || '',
      startYear:   numbers[0]?.value || '',
      endYear:     numbers[1]?.value || '',
      status:      select?.value || select?.options[select?.selectedIndex]?.text || '',
    };
  }).filter(e => e.career || e.institution);
}

// ─── Leer idiomas del DOM ─────────────────────────────────────────────────────
function readLanguages() {
  return [...document.querySelectorAll('#lang-list .lang-row')].map(row => {
    const input  = row.querySelector('input[type="text"]');
    const select = row.querySelector('select');
    return {
      name:  input?.value?.trim() || '',
      level: select?.value || select?.options[select?.selectedIndex]?.text || '',
    };
  }).filter(l => l.name);
}

// ─── Leer datos personales del DOM ───────────────────────────────────────────
export function readCandidateForm() {
  const get    = id => document.getElementById(id)?.value?.trim() ?? '';
  const getSel = id => {
    const el = document.getElementById(id);
    return el?.options[el.selectedIndex]?.value || el?.options[el.selectedIndex]?.text || '';
  };
  const getTags = wid => [...document.querySelectorAll(`#${wid} .tag-pill, #${wid} .tag`)]
    .map(t => t.childNodes[0]?.textContent?.trim() || t.textContent.replace('×','').trim())
    .filter(Boolean);

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

// ─── Leer formulario empresa ──────────────────────────────────────────────────
export function readCompanyForm() {
  const get    = id => document.getElementById(id)?.value?.trim() || null;
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

// ─── Llenar experiencia en el DOM ─────────────────────────────────────────────
function fillExperience(list) {
  const container = document.getElementById('exp-list');
  if (!container || !list?.length) return;
  // Limpiar items hardcodeados
  container.innerHTML = '';
  list.forEach(exp => {
    const item = document.createElement('div');
    item.className = 'exp-item';
    const endVal   = exp.current || exp.endDate === 'Presente' ? '' : (exp.endDate || '');
    const isCurrent = exp.current || exp.endDate === 'Presente';
    item.innerHTML = `
      <div class="exp-item-header">
        <div>
          <div class="exp-item-title">${exp.title || 'Sin título'}</div>
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
          <input type="month" value="${endVal}" ${isCurrent ? 'disabled' : ''} />
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

// ─── Llenar educación en el DOM ───────────────────────────────────────────────
function fillEducation(list) {
  const container = document.getElementById('edu-list');
  if (!container || !list?.length) return;
  container.innerHTML = '';
  list.forEach(edu => {
    const item = document.createElement('div');
    item.className = 'exp-item';
    item.innerHTML = `
      <div class="exp-item-header">
        <div>
          <div class="exp-item-title">${edu.career || 'Sin título'}</div>
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
            <option ${edu.status === 'Graduado' ? 'selected' : ''}>Graduado</option>
            <option ${edu.status === 'En curso' ? 'selected' : ''}>En curso</option>
            <option ${edu.status === 'Incompleto' ? 'selected' : ''}>Incompleto</option>
          </select>
        </div>
      </div>`;
    container.appendChild(item);
  });
}

// ─── Llenar idiomas en el DOM ─────────────────────────────────────────────────
function fillLanguages(list) {
  const container = document.getElementById('lang-list');
  if (!container || !list?.length) return;
  container.innerHTML = '';
  list.forEach(lang => {
    const row = document.createElement('div');
    row.className = 'lang-row';
    row.innerHTML = `
      <input type="text" style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:var(--radius-sm);color:var(--clr-text);font-family:var(--font-body);font-size:0.85rem;padding:6px 10px;outline:none;min-width:100px;" value="${lang.name || ''}" placeholder="Idioma" />
      <div class="lang-level">
        <select>
          <option ${lang.level === 'Nativo' ? 'selected' : ''}>Nativo</option>
          <option ${lang.level === 'Avanzado' ? 'selected' : ''}>Avanzado</option>
          <option ${lang.level === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
          <option ${lang.level === 'Básico' ? 'selected' : ''}>Básico</option>
        </select>
      </div>
      <button class="lang-remove" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(row);
  });
}

// ─── Llenar tags ──────────────────────────────────────────────────────────────
function fillTags(wrapperId, inputId, items) {
  const wrapper = document.getElementById(wrapperId);
  const input   = document.getElementById(inputId);
  if (!wrapper || !input) return;
  wrapper.querySelectorAll('.tag, .tag-pill').forEach(t => t.remove());
  (items || []).forEach(skill => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${skill} <button class="tag-remove" onclick="this.parentElement.remove()">×</button>`;
    wrapper.insertBefore(tag, input);
  });
}

// ─── Llenar inputs simples ────────────────────────────────────────────────────
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
    fillExperience(u.experience || []);
    fillEducation(u.education || []);
    fillLanguages(u.languages || []);
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

// ─── Actualizar steps ─────────────────────────────────────────────────────────
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

// ─── Actualizar badges de panel ───────────────────────────────────────────────
function updatePanelBadges(u) {
  const s = calcSections(u);
  const map = {
    'badge-personal':   { done: s.personal,   ok: '✓ Completado',     no: '⚠ Incompleto' },
    'badge-experience': { done: s.experience, ok: '✓ Completada',     no: '⚠ Sin experiencia' },
    'badge-education':  { done: s.education,  ok: '✓ Completada',     no: '⚠ Sin educación' },
    'badge-skills':     { done: s.skills,     ok: '✓ Completas',      no: '⚠ Sin habilidades' },
    'badge-cv':         { done: s.cv,         ok: '✓ CV cargado',     no: '⚠ Sin CV' },
  };
  Object.entries(map).forEach(([id, cfg]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `badge ${cfg.done ? 'badge-green' : 'badge-gold'}`;
    el.textContent = cfg.done ? cfg.ok : cfg.no;
  });
}

// ─── Actualizar hero del perfil ───────────────────────────────────────────────
function updateProfileHero(u) {
  const avatarLarge = document.querySelector('.avatar-large');
  if (avatarLarge) avatarLarge.textContent =
    `${(u.firstName||'')[0]||''}${(u.lastName||'')[0]||''}`.toUpperCase() || '?';
  const avatarName = document.querySelector('.avatar-name');
  if (avatarName) avatarName.textContent = `${u.firstName||''} ${u.lastName||''}`.trim();
  const avatarSub = document.querySelector('.avatar-sub');
  if (avatarSub) avatarSub.textContent = [u.jobTitle, u.location].filter(Boolean).join(' · ');
}

// ─── Actualizar ring ──────────────────────────────────────────────────────────
export function updateRing(pct) {
  const ring  = document.querySelector('.ring-fill');
  const label = document.querySelector('.ring-pct');
  if (!ring || !label) return;
  const circ = 2 * Math.PI * 30;
  ring.style.strokeDasharray  = circ;
  ring.style.strokeDashoffset = circ * (1 - pct / 100);
  label.textContent = pct + '%';
}

// ─── Actualizar sidebar y hero del dashboard ──────────────────────────────────
export function updateDashboardHero(u) {
  const nombre   = u.role === 'company' ? (u.companyName||'') : `${u.firstName||''} ${u.lastName||''}`.trim();
  const iniciales = u.role === 'company'
    ? (u.companyName||'E').substring(0,2).toUpperCase()
    : `${(u.firstName||'')[0]||''}${(u.lastName||'')[0]||''}`.toUpperCase();

  const sid = id => document.getElementById(id);
  if (sid('sidebar-avatar')) sid('sidebar-avatar').textContent = iniciales;
  if (sid('sidebar-name'))   sid('sidebar-name').textContent   = nombre;
  if (sid('sidebar-role'))   sid('sidebar-role').textContent   = u.role === 'company' ? 'Empresa' : 'Candidato';

  const sub = document.querySelector('.topbar-subtitle');
  if (sub) sub.textContent = `Bienvenido de vuelta, ${u.role==='company'?u.companyName:u.firstName||''} 👋`;

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

// ─── Guardar en backend ───────────────────────────────────────────────────────
export async function saveProfile(data) {
  const token = getToken();
  const res = await fetch(`${API}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

// ─── Traer datos frescos del backend ─────────────────────────────────────────
async function fetchFreshUser() {
  try {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const fresh = await res.json();
    saveUser(fresh);
    return fresh;
  } catch { return null; }
}

// ─── Init perfil ──────────────────────────────────────────────────────────────
export async function initProfile() {
  // 1. Mostrar datos cacheados inmediatamente
  const cached = getUser();
  if (cached) {
    fillProfileForm(cached);
    updateProfileHero(cached);
    updateSteps(cached);
    updatePanelBadges(cached);
    updateDashboardHero(cached);
  }
  // 2. Refrescar desde el backend
  const fresh = await fetchFreshUser();
  if (fresh) {
    fillProfileForm(fresh);
    updateProfileHero(fresh);
    updateSteps(fresh);
    updatePanelBadges(fresh);
    updateDashboardHero(fresh);
  }
}

// ─── Init dashboard ───────────────────────────────────────────────────────────
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
