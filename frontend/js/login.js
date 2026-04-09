/**
 * TalentAI — Login page script
 * Copiar en: frontend/js/login.js
 * Agregar al final de login.html:
 *   <script src="../js/login.js" type="module"></script>
 */
import { loginUser, redirectToDashboard, isAuthenticated, getUser } from './auth.js';

// Si ya está logueado, redirigir directo
if (isAuthenticated()) {
  const user = getUser();
  if (user) redirectToDashboard(user.role);
}

const form       = document.getElementById('login-form');
const submitBtn  = document.getElementById('submit-btn');
const alertBox   = document.getElementById('alert-error');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const remember   = document.getElementById('remember');

// Toggle contraseña
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    target.type = target.type === 'password' ? 'text' : 'password';
  });
});

function showError(msg) {
  alertBox.textContent = msg;
  alertBox.style.display = 'block';
}
function hideError() {
  alertBox.style.display = 'none';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const email    = emailInput.value.trim();
  const password = passInput.value;

  // Validación mínima en cliente
  let valid = true;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('email-error').style.display = 'block';
    valid = false;
  } else {
    document.getElementById('email-error').style.display = 'none';
  }
  if (!password) {
    document.getElementById('password-error').style.display = 'block';
    valid = false;
  } else {
    document.getElementById('password-error').style.display = 'none';
  }
  if (!valid) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Iniciando sesión...';

  try {
    const data = await loginUser({ email, password, remember: remember?.checked });
    redirectToDashboard(data.user.role);
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Iniciar sesión';
  }
});
