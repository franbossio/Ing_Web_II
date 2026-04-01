/**
 * profile.js
 * Maneja el guardado del perfil, cálculo de % completado
 * y actualización en tiempo real del anillo de progreso.
 */

import { authFetch, getUser, saveUser } from './auth.js';

// ─── Definición de secciones para calcular el % ──────────────
// Cada sección tiene un peso y una función que devuelve true si está completa
const PROFILE_SECTIONS = [
  {
    key: 'basicInfo',
    label: 'Datos personales',
    weight: 20,
    check: (u) => !!(u.firstName && u.lastName && u.email && u.phone),
  },
  {
    key: 'jobTitle',
    label: 'Título profesional',
    weight: 10,
    check: (u) => !!(u.jobTitle && u.location),
  },
  {
    key: 'bio',
    label: 'Sobre mí',
    weight: 10,
    check: (u) => !!(u.bio && u.bio.length > 20),
  },
  {
    key: 'experience',
    label: 'Experiencia laboral',
    weight: 20,
    check: (u) => Array.isArray(u.experience) && u.experience.length > 0,
  },
  {
    key: 'education',
    label: 'Educación',
    weight: 15,
    check: (u) => Array.isArray(u.education) && u.education.length > 0,
  },
  {
    key: 'skills',
    label: 'Habilidades',
    weight: 15,
    check: (u) => Array.isArray(u.skills) && u.skills.length >= 3,
  },
  {
    key: 'cv',
    label: 'CV subido',
    weight: 10,
    check: (u) => !!(u.cvFileName || u.cvUrl),
  },
];

// ─── Calcular porcentaje ──────────────────────────────────────
export function calcProfilePercent(user) {
  let total = 0;
  PROFILE_SECTIONS.forEach(section => {
    if (section.check(user)) total += section.weight;
  });
  return Math.min(total, 100);
}

// ─── Actualizar el anillo SVG en el DOM ───────────────────────
export function updateProgressRing(percent) {
  // El anillo tiene r=30, circunferencia = 2 * PI * 30 ≈ 188
  const circumference = 188;
  const offset = circumference - (percent / 100) * circumference;

  const fill = document.querySelector('.ring-fill');
  const pct  = document.querySelector('.ring-pct');

  if (fill) fill.style.strokeDashoffset = offset;
  if (pct)  pct.textContent = `${percent}%`;

  // Actualizar los steps del progreso en profile.html
  updateProgressSteps();
}

// ─── Actualizar los pasos visuales ────────────────────────────
function updateProgressSteps() {
  const user = getUser();
  if (!user) return;

  const stepMap = {
    'Datos personales':    () => !!(user.firstName && user.lastName && user.email),
    'Experiencia laboral': () => Array.isArray(user.experience) && user.experience.length > 0,
    'CV subido':           () => !!(user.cvFileName || user.cvUrl),
    'Educación':           () => Array.isArray(user.education) && user.education.length > 0,
    'Idiomas':             () => Array.isArray(user.languages) && user.languages.length > 0,
    'Habilidades':         () => Array.isArray(user.skills) && user.skills.length >= 3,
  };

  document.querySelectorAll('.step-item').forEach(item => {
    const label = item.textContent.trim();
    const checkFn = stepMap[label];
    if (!checkFn) return;

    const isDone = checkFn();
    item.classList.toggle('done',    isDone);
    item.classList.toggle('pending', !isDone);

    const dot = item.querySelector('.step-dot');
    if (dot) dot.textContent = isDone ? '✓' : '!';
  });
}

// ─── Guardar sección en el backend ───────────────────────────
async function saveProfile(data) {
  const res = await authFetch('/users/profile', {
    method:  'PATCH',
    body:    JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al guardar');
  }

  const updatedUser = await res.json();

  // Actualizar localStorage con los nuevos datos
  const current = getUser() || {};
  const merged  = { ...current, ...updatedUser };
  saveUser(merged);

  // Recalcular y actualizar el anillo
  const percent = calcProfilePercent(merged);
  updateProgressRing(percent);

  return updatedUser;
}

// ─── Leer tags del DOM ────────────────────────────────────────
function readTags(wrapperId) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return [];
  return Array.from(wrapper.querySelectorAll('.tag-pill'))
    .map(tag => tag.childNodes[0]?.textContent?.trim())
    .filter(Boolean);
}

// ─── Botón guardar con spinner ────────────────────────────────
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<div class="spinner" style="width:14px;height:14px;border-width:2px;border-top-color:#0d0f14;display:inline-block;margin-right:6px;"></div> Guardando...'
    : '💾 Guardar cambios';
}

function showAlert(msg, type = 'success') {
  const el = document.getElementById('global-alert');
  if (!el) return;
  el.className = `alert alert-${type} visible`;
  el.textContent = msg;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => el.classList.remove('visible'), 3500);
}

// ─── Inicializar cuando carga la página ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user) return;

  // Mostrar % actual al cargar
  const percent = calcProfilePercent(user);
  updateProgressRing(percent);

  // ── Tab: Datos personales ──────────────────────────────────
  document.querySelectorAll('.tab-panel .btn-primary').forEach(btn => {
    if (!btn.textContent.includes('Guardar')) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const panel = btn.closest('.tab-panel');
      if (!panel) return;
      const panelId = panel.id;

      setLoading(btn, true);
      try {
        let data = {};

        if (panelId === 'panel-personal') {
          data = {
            firstName:  document.getElementById('firstName')?.value?.trim(),
            lastName:   document.getElementById('lastName')?.value?.trim(),
            email:      document.getElementById('email')?.value?.trim(),
            phone:      document.getElementById('phone')?.value?.trim(),
            jobTitle:   document.getElementById('jobTitle')?.value?.trim(),
            location:   document.getElementById('location')?.value?.trim(),
            bio:        document.getElementById('bio')?.value?.trim(),
            linkedin:   document.getElementById('linkedin')?.value?.trim(),
            github:     document.getElementById('github')?.value?.trim(),
            portfolio:  document.getElementById('portfolio')?.value?.trim(),
            salary:     Number(document.getElementById('salary')?.value) || undefined,
            availability: document.getElementById('availability')?.value,
            modality:     document.getElementById('modality')?.value,
          };
        }

        else if (panelId === 'panel-skills') {
          data = {
            skills:    readTags('tech-wrapper'),
            softSkills: readTags('soft-wrapper'),
            languages: Array.from(document.querySelectorAll('.lang-row')).map(row => ({
              name:  row.querySelector('input, .lang-name')?.value
                     || row.querySelector('.lang-name')?.textContent?.trim(),
              level: row.querySelector('select')?.value,
            })).filter(l => l.name),
          };
        }

        else if (panelId === 'panel-experience') {
          data = {
            experience: Array.from(document.querySelectorAll('#exp-list .exp-item')).map(item => {
              const inputs = item.querySelectorAll('input');
              const textarea = item.querySelector('textarea');
              const currentCheck = item.querySelector('input[type="checkbox"]');
              return {
                title:       inputs[0]?.value?.trim(),
                company:     inputs[1]?.value?.trim(),
                startDate:   inputs[2]?.value,
                endDate:     currentCheck?.checked ? null : inputs[3]?.value,
                current:     !!currentCheck?.checked,
                description: textarea?.value?.trim(),
              };
            }).filter(e => e.title && e.company),
          };
        }

        else if (panelId === 'panel-education') {
          data = {
            education: Array.from(document.querySelectorAll('#edu-list .exp-item')).map(item => {
              const inputs   = item.querySelectorAll('input');
              const statusEl = item.querySelector('select');
              return {
                degree:      inputs[0]?.value?.trim(),
                institution: inputs[1]?.value?.trim(),
                startYear:   Number(inputs[2]?.value),
                endYear:     Number(inputs[3]?.value) || null,
                status:      statusEl?.value,
              };
            }).filter(e => e.degree && e.institution),
          };
        }

        await saveProfile(data);
        showAlert('✓ Cambios guardados correctamente.');

        // Actualizar nombre en sidebar/topbar si cambió
        const updated = getUser();
        const newName = `${updated.firstName ?? ''} ${updated.lastName ?? ''}`.trim();
        document.querySelectorAll('.profile-name').forEach(el => el.textContent = newName);
        document.querySelectorAll('.profile-avatar').forEach(el => {
          const words = newName.split(' ');
          el.textContent = words.length > 1
            ? (words[0][0] + words[1][0]).toUpperCase()
            : newName.slice(0, 2).toUpperCase();
        });

      } catch (err) {
        showAlert(err.message || 'Error al guardar. Intentá de nuevo.', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
  });
});