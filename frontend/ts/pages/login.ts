import { login, saveSession } from '../api/auth.js';
import { redirectIfAuthenticated } from '../utils/auth-guard.js';

// ─── Redirige si ya está logueado ─────────────────────────
redirectIfAuthenticated();

// ─── Referencias al DOM ───────────────────────────────────
const form       = document.getElementById('login-form')    as HTMLFormElement;
const emailInput = document.getElementById('email')         as HTMLInputElement;
const passInput  = document.getElementById('password')      as HTMLInputElement;
const submitBtn  = document.getElementById('submit-btn')    as HTMLButtonElement;
const alertEl    = document.getElementById('alert-error')   as HTMLDivElement;

// ─── Toggle password visibility ──────────────────────────
document.querySelectorAll<HTMLButtonElement>('.toggle-password').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target!;
    const input = document.getElementById(targetId) as HTMLInputElement;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  });
});

// ─── Helpers ─────────────────────────────────────────────
function showError(msg: string): void {
  alertEl.textContent = msg;
  alertEl.classList.add('visible');
}
function hideError(): void {
  alertEl.classList.remove('visible');
}

function setLoading(loading: boolean): void {
  submitBtn.disabled = loading;
  submitBtn.innerHTML = loading
    ? '<div class="spinner"></div> Ingresando...'
    : 'Iniciar sesión';
}

// ─── Validación ───────────────────────────────────────────
function validate(): boolean {
  let valid = true;

  const emailErr = document.getElementById('email-error')!;
  const passErr  = document.getElementById('password-error')!;

  emailErr.classList.remove('visible');
  passErr.classList.remove('visible');
  emailInput.classList.remove('error');
  passInput.classList.remove('error');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value.trim())) {
    emailErr.classList.add('visible');
    emailInput.classList.add('error');
    valid = false;
  }

  if (passInput.value.length < 1) {
    passErr.classList.add('visible');
    passInput.classList.add('error');
    valid = false;
  }

  return valid;
}

// ─── Submit ───────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  if (!validate()) return;

  setLoading(true);

  try {
    const data = await login({
      email:    emailInput.value.trim(),
      password: passInput.value,
    });

    saveSession(data);

    // Redirigir según rol
    if (data.user.role === 'candidate') {
      window.location.href = '/pages/candidate/dashboard.html';
    } else {
      window.location.href = '/pages/company/dashboard.html';
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al iniciar sesión. Intentá de nuevo.';
    showError(msg);
  } finally {
    setLoading(false);
  }
});