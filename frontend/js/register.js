/**
 * TalentAI — Register page script
 * Copiar en: frontend/js/register.js
 * El HTML ya tiene: <script src="../ts/pages/register.js" type="module"></script>
 * Cambiar esa ruta a:  <script src="../js/register.js" type="module"></script>
 */
import { registerUser, redirectToDashboard, isAuthenticated, getUser } from './auth.js';

if (isAuthenticated()) {
  const user = getUser();
  if (user) redirectToDashboard(user.role);
}

const form         = document.getElementById('register-form');
const submitBtn    = document.getElementById('submit-btn');
const alertError   = document.getElementById('alert-error');
const alertSuccess = document.getElementById('alert-success');

// ─── Toggle rol candidato / empresa ──────────────────────────────────────────
const roleInputs      = document.querySelectorAll('input[name="role"]');
const candidateFields = document.getElementById('candidate-fields');
const companyFields   = document.getElementById('company-fields');

roleInputs.forEach(input => {
  input.addEventListener('change', () => {
    const isCandidate = input.value === 'candidate';
    candidateFields.style.display = isCandidate ? '' : 'none';
    companyFields.style.display   = isCandidate ? 'none' : '';
  });
});

// ─── Toggle contraseña ───────────────────────────────────────────────────────
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    target.type = target.type === 'password' ? 'text' : 'password';
  });
});

// ─── Medidor de fortaleza de contraseña ──────────────────────────────────────
const passInput = document.getElementById('password');
const bars      = [
  document.getElementById('bar-1'),
  document.getElementById('bar-2'),
  document.getElementById('bar-3'),
];

function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)             score++;
  if (/[A-Z]/.test(pwd))          score++;
  if (/[0-9]/.test(pwd))          score++;
  if (/[^A-Za-z0-9]/.test(pwd))   score++;
  return Math.min(score, 3);
}

passInput?.addEventListener('input', () => {
  const strength = getStrength(passInput.value);
  const colors   = ['#e74c3c', '#f39c12', '#27ae60'];
  bars.forEach((bar, i) => {
    bar.style.backgroundColor = i < strength ? colors[strength - 1] : '';
    bar.style.opacity          = i < strength ? '1' : '0.2';
  });
});

// ─── Mostrar alertas ─────────────────────────────────────────────────────────
function showError(msg) {
  alertError.textContent = msg;
  alertError.style.display = 'block';
  alertSuccess.style.display = 'none';
}
function showSuccess(msg) {
  alertSuccess.textContent = msg;
  alertSuccess.style.display = 'block';
  alertError.style.display = 'none';
}
function hideAlerts() {
  alertError.style.display = 'none';
  alertSuccess.style.display = 'none';
}

// ─── Submit ───────────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlerts();

  const role     = document.querySelector('input[name="role"]:checked')?.value;
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm-password').value;
  const terms    = document.getElementById('terms').checked;

  // Validaciones cliente
  let valid = true;
  const hide = id => { document.getElementById(id).style.display = 'none'; };
  const show = id => { document.getElementById(id).style.display = 'block'; valid = false; };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) show('email-error'); else hide('email-error');
  if (password.length < 8) show('password-error'); else hide('password-error');
  if (password !== confirm) show('confirm-password-error'); else hide('confirm-password-error');
  if (!terms) show('terms-error'); else hide('terms-error');

  if (role === 'candidate') {
    const firstName = document.getElementById('first-name').value.trim();
    const lastName  = document.getElementById('last-name').value.trim();
    if (!firstName) show('first-name-error'); else hide('first-name-error');
    if (!lastName)  show('last-name-error');  else hide('last-name-error');
  }
  if (role === 'company') {
    const companyName = document.getElementById('company-name').value.trim();
    if (!companyName) show('company-name-error'); else hide('company-name-error');
  }

  if (!valid) return;

  // Construir payload
  const payload = { role, email, password };
  if (role === 'candidate') {
    payload.firstName = document.getElementById('first-name').value.trim();
    payload.lastName  = document.getElementById('last-name').value.trim();
  } else {
    payload.companyName = document.getElementById('company-name').value.trim();
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creando cuenta...';

  try {
    const data = await registerUser(payload);
    showSuccess('¡Cuenta creada! Redirigiendo...');
    setTimeout(() => redirectToDashboard(data.user.role), 1200);
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Crear cuenta';
  }
});
