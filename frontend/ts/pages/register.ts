import { register, saveSession } from '../api/auth.js';
import { redirectIfAuthenticated } from '../utils/auth-guard.js';
import type { UserRole } from '../api/config.js';

// ─── Redirige si ya está logueado ─────────────────────────
redirectIfAuthenticated();

// ─── Referencias al DOM ───────────────────────────────────
const form             = document.getElementById('register-form')    as HTMLFormElement;
const submitBtn        = document.getElementById('submit-btn')       as HTMLButtonElement;
const alertError       = document.getElementById('alert-error')      as HTMLDivElement;
const alertSuccess     = document.getElementById('alert-success')    as HTMLDivElement;

const candidateFields  = document.getElementById('candidate-fields') as HTMLDivElement;
const companyFields    = document.getElementById('company-fields')   as HTMLDivElement;

const firstNameInput   = document.getElementById('first-name')       as HTMLInputElement;
const lastNameInput    = document.getElementById('last-name')        as HTMLInputElement;
const companyNameInput = document.getElementById('company-name')     as HTMLInputElement;
const emailInput       = document.getElementById('email')            as HTMLInputElement;
const passInput        = document.getElementById('password')         as HTMLInputElement;
const confirmPassInput = document.getElementById('confirm-password') as HTMLInputElement;
const termsInput       = document.getElementById('terms')            as HTMLInputElement;

// ─── Role toggle ─────────────────────────────────────────
function getSelectedRole(): UserRole {
  const checked = document.querySelector<HTMLInputElement>('input[name="role"]:checked');
  return (checked?.value as UserRole) ?? 'candidate';
}

document.querySelectorAll<HTMLInputElement>('input[name="role"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    const isCompany = getSelectedRole() === 'company';
    candidateFields.style.display = isCompany ? 'none' : 'block';
    companyFields.style.display   = isCompany ? 'block' : 'none';
  });
});

// ─── Toggle password visibility ──────────────────────────
document.querySelectorAll<HTMLButtonElement>('.toggle-password').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target!;
    const input = document.getElementById(targetId) as HTMLInputElement;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  });
});

// ─── Password strength ────────────────────────────────────
passInput.addEventListener('input', () => {
  const val = passInput.value;
  const bars = [
    document.getElementById('bar-1')!,
    document.getElementById('bar-2')!,
    document.getElementById('bar-3')!,
  ];

  bars.forEach(b => { b.className = 'strength-bar'; });

  let score = 0;
  if (val.length >= 8)                      score++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val))            score++;

  const cls = score === 1 ? 'weak' : score === 2 ? 'medium' : score === 3 ? 'strong' : '';
  for (let i = 0; i < score; i++) {
    bars[i].classList.add(cls);
  }
});

// ─── Helpers ─────────────────────────────────────────────
function showAlert(el: HTMLDivElement, msg: string): void {
  el.textContent = msg;
  el.classList.add('visible');
}
function hideAlerts(): void {
  alertError.classList.remove('visible');
  alertSuccess.classList.remove('visible');
}

function setFieldError(inputEl: HTMLInputElement, errorId: string, show: boolean): void {
  const errEl = document.getElementById(errorId);
  if (!errEl) return;
  if (show) {
    errEl.classList.add('visible');
    inputEl.classList.add('error');
  } else {
    errEl.classList.remove('visible');
    inputEl.classList.remove('error');
  }
}

function setLoading(loading: boolean): void {
  submitBtn.disabled = loading;
  submitBtn.innerHTML = loading
    ? '<div class="spinner"></div> Creando cuenta...'
    : 'Crear cuenta';
}

// ─── Validación ───────────────────────────────────────────
function validate(): boolean {
  let valid = true;
  const role = getSelectedRole();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (role === 'candidate') {
    if (firstNameInput.value.trim().length < 1) valid = false;
    if (lastNameInput.value.trim().length < 1)  valid = false;
    setFieldError(firstNameInput, 'first-name-error', firstNameInput.value.trim().length < 1);
    setFieldError(lastNameInput,  'last-name-error',  lastNameInput.value.trim().length < 1);
  } else {
    if (companyNameInput.value.trim().length < 1) {
      setFieldError(companyNameInput, 'company-name-error', true);
      valid = false;
    } else {
      setFieldError(companyNameInput, 'company-name-error', false);
    }
  }

  if (!emailRegex.test(emailInput.value.trim())) {
    setFieldError(emailInput, 'email-error', true);
    valid = false;
  } else {
    setFieldError(emailInput, 'email-error', false);
  }

  if (passInput.value.length < 8) {
    setFieldError(passInput, 'password-error', true);
    valid = false;
  } else {
    setFieldError(passInput, 'password-error', false);
  }

  if (confirmPassInput.value !== passInput.value) {
    setFieldError(confirmPassInput, 'confirm-password-error', true);
    valid = false;
  } else {
    setFieldError(confirmPassInput, 'confirm-password-error', false);
  }

  if (!termsInput.checked) {
    document.getElementById('terms-error')!.classList.add('visible');
    valid = false;
  } else {
    document.getElementById('terms-error')!.classList.remove('visible');
  }

  return valid;
}

// ─── Submit ───────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlerts();

  if (!validate()) return;

  setLoading(true);
  const role = getSelectedRole();

  try {
    const data = await register({
      email:       emailInput.value.trim(),
      password:    passInput.value,
      role,
      firstName:   role === 'candidate' ? firstNameInput.value.trim() : undefined,
      lastName:    role === 'candidate' ? lastNameInput.value.trim()  : undefined,
      companyName: role === 'company'   ? companyNameInput.value.trim() : undefined,
    });

    saveSession(data);

    showAlert(alertSuccess, '¡Cuenta creada con éxito! Redirigiendo...');

    setTimeout(() => {
      if (data.user.role === 'candidate') {
        window.location.href = '/pages/candidate/dashboard.html';
      } else {
        window.location.href = '/pages/company/dashboard.html';
      }
    }, 1200);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al crear la cuenta. Intentá de nuevo.';
    showAlert(alertError, msg);
  } finally {
    setLoading(false);
  }
});