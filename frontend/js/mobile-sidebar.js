/**
 * mobile-sidebar.js
 * Maneja el comportamiento del sidebar en mobile.
 * Incluir en todas las páginas: <script src="../../js/mobile-sidebar.js"></script>
 */
(function() {
  function init() {
    const sidebar  = document.querySelector('.sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    const menuBtn  = document.getElementById('mobile-menu-btn');
    if (!sidebar || !overlay || !menuBtn) return;

    function open() {
      sidebar.classList.add('mobile-open');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    menuBtn.addEventListener('click', open);
    overlay.addEventListener('click', close);

    // Cerrar al hacer click en un nav-item (navegar a otra página)
    sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 900) close();
      });
    });

    // Cerrar con Escape
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
