/**
 * sidebar-toggle.js
 * Maneja el botón de colapsar/expandir el sidebar en desktop.
 * Reemplaza el bloque <script> repetido en cada página.
 * Incluir con: <script src="../../js/sidebar-toggle.js"></script>
 */
(function () {
  function init() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const layout    = document.querySelector('.app-layout');
    if (toggleBtn && layout) {
      toggleBtn.addEventListener('click', () => {
        layout.classList.toggle('collapsed');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
