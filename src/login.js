import './style.css';
import { auth } from './firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

// ── Redirect if already logged in ──────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = '/';
});

// ── Handle Google redirect result ──────────────────────
getRedirectResult(auth).catch((err) => {
  if (err?.code !== 'auth/popup-closed-by-user') console.error(err.code);
});

// ── Theme ───────────────────────────────────────────────
let theme = localStorage.getItem('theme') || 'light';
const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const icon = document.getElementById('loginThemeIcon');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
};
applyTheme();
document.getElementById('loginThemeBtn')?.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  applyTheme();
});

// ── DOM refs ────────────────────────────────────────────
const form        = document.getElementById('loginForm');
const emailInput  = document.getElementById('emailInput');
const passInput   = document.getElementById('passwordInput');
const nameInput   = document.getElementById('nameInput');
const nameGroup   = document.getElementById('nameGroup');
const submitBtn   = document.getElementById('submitBtn');
const btnText     = document.getElementById('btnText');
const btnLoader   = document.getElementById('btnLoader');
const formError   = document.getElementById('formError');
const toggleBtn   = document.getElementById('toggleBtn');
const toggleText  = document.getElementById('toggleText');
const forgotBtn   = document.getElementById('forgotBtn');
const subtitle    = document.getElementById('loginSubtitle');
const googleBtn   = document.getElementById('googleSignInBtn');

// ── State ────────────────────────────────────────────────
let isSignUp = false;

// ── Helpers ──────────────────────────────────────────────
const showError = (msg) => {
  formError.textContent = msg;
  formError.classList.remove('hidden', 'shake');
  void formError.offsetWidth;
  formError.classList.add('shake');
};
const hideError = () => formError.classList.add('hidden');

const setLoading = (on) => {
  submitBtn.disabled = on;
  btnText.classList.toggle('hidden', on);
  btnLoader.classList.toggle('hidden', !on);
};

const friendlyError = (code) => ({
  'auth/user-not-found':       'No account found with this email.',
  'auth/wrong-password':       'Incorrect password. Try again.',
  'auth/invalid-credential':   'Invalid email or password.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/weak-password':        'Password must be at least 6 characters.',
  'auth/invalid-email':        'Please enter a valid email address.',
  'auth/too-many-requests':    'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
})[code] || 'Something went wrong. Please try again.';

// ── Toggle login / sign-up ───────────────────────────────
const setMode = (signUp) => {
  isSignUp = signUp;
  btnText.textContent     = signUp ? 'Create Account' : 'Sign In';
  toggleText.textContent  = signUp ? 'Already have an account?' : "Don't have an account?";
  toggleBtn.textContent   = signUp ? 'Sign In' : 'Create Account';
  subtitle.textContent    = signUp ? 'Create your admin account' : 'Sign in to your admin panel';
  nameGroup.classList.toggle('hidden', !signUp);
  forgotBtn.classList.toggle('hidden', signUp);
  hideError();
};
toggleBtn.addEventListener('click', () => setMode(!isSignUp));

// ── Form submit ──────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const email = emailInput.value.trim();
  const pass  = passInput.value;
  const name  = nameInput.value.trim();
  if (!email || !pass)            return showError('Please fill in all fields.');
  if (isSignUp && !name)          return showError('Please enter your name.');

  setLoading(true);
  try {
    if (isSignUp) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
    }
  } catch (err) {
    showError(friendlyError(err.code));
    setLoading(false);
  }
});

// ── Forgot password ──────────────────────────────────────
forgotBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  if (!email) return showError('Enter your email above, then click "Forgot password?"');
  hideError();
  try {
    await sendPasswordResetEmail(auth, email);
    formError.textContent = '✅ Reset email sent! Check your inbox.';
    formError.classList.remove('hidden', 'shake');
    formError.style.color = 'var(--success)';
    setTimeout(() => { formError.style.color = ''; }, 4000);
  } catch (err) { showError(friendlyError(err.code)); }
});

// ── Google Sign-In ───────────────────────────────────────
googleBtn?.addEventListener('click', async () => {
  hideError();
  googleBtn.disabled = true;
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') showError(friendlyError(err.code));
    googleBtn.disabled = false;
  }
});
