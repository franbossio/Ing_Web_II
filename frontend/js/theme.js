/**
 * TalentAI — theme.js
 * Sistema de temas: dark, light, system
 * Incluir en todas las páginas con: <script src="../../js/theme.js"></script>
 * (antes de cualquier otro script, para evitar flash)
 */

const THEME_KEY = 'talentai_theme';

// Aplicar tema al <html> — se llama apenas carga el script
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

// Leer tema guardado o usar 'dark' por defecto
function getSavedTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

// Aplicar inmediatamente para evitar flash
applyTheme(getSavedTheme());

// ─── API pública ──────────────────────────────────────────
window.ThemeManager = {
  // Cambiar tema y marcar card activa
  set(theme) {
    applyTheme(theme);
    // Actualizar cards visuales si existen en la página
    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    const active = document.querySelector(`.theme-card.theme-${theme}`);
    if (active) active.classList.add('active');
  },

  // Obtener tema actual
  get() {
    return getSavedTheme();
  },

  // Inicializar cards en la página de settings
  initCards() {
    const current = getSavedTheme();
    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    const active = document.querySelector(`.theme-card.theme-${current}`);
    if (active) active.classList.add('active');
  }
};

// selectTheme — función global llamada por onclick en las cards
window.selectTheme = function(card, theme) {
  window.ThemeManager.set(theme);
};
