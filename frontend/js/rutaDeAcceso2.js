function crearSidebar(paginaActual) {
    const nav = document.createElement("nav");

  nav.innerHTML = `<nav class="sidebar-nav">
      <span class="nav-section-label">Principal</span>

      <a href="dashboard.html" class="nav-item ${paginaActual === "dashboard.html" ? "active" : ""}">
        <span class="nav-icon">📊</span> Dashboard
      </a>

      <a href="jobs.html" class="nav-item ${paginaActual === "jobs.html" ? "active" : ""}">
        <span class="nav-icon">🔍</span> Explorar ofertas
        <span class="nav-badge">12</span>
      </a>

      <span class="nav-section-label">Mi perfil</span>

      <a href="profile.html" class="nav-item ${paginaActual === "profile.html" ? "active" : ""}">
        <span class="nav-icon">👤</span> Editar perfil
      </a>

      <a href="#" class="nav-item">
        <span class="nav-icon">📄</span> Mi CV
      </a>

      <span class="nav-section-label">Postulaciones</span>

      <a href="applications.html" class="nav-item ${paginaActual === "applications.html" ? "active" : ""}">
        <span class="nav-icon">📬</span> Mis postulaciones
        <span class="nav-badge">5</span>
      </a>

      <a href="#" class="nav-item">
        <span class="nav-icon">⭐</span> Guardados
      </a>

      <a href="#" class="nav-item">
        <span class="nav-icon">⚙️</span> Configuración
      </a>
    </nav>`;

    return nav;
}
const paginaActual = window.location.pathname.split("/").pop();
document.getElementById("sidebar").appendChild(crearSidebar(paginaActual));