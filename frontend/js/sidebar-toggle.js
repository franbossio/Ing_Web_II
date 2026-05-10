/**
 * sidebar-toggle.js
 * Colapsa/expande el sidebar en desktop.
 * Espera a que sidebar-candidate/company.js inyecte el DOM.
 */
(function () {
  function init() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const layout    = document.querySelector('.app-layout');
    if (toggleBtn && layout) {
      toggleBtn.addEventListener('click', () => {
        layout.classList.toggle('collapsed');
      });
      return true;
    }
    return false;
  }

  // Intentar varias veces porque sidebar-candidate.js es async (module)
  function tryInit(attempts) {
    if (init()) return;
    if (attempts > 0) setTimeout(() => tryInit(attempts - 1), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryInit(10));
  } else {
    tryInit(10);
  }
})();
