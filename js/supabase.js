// Supabase REST utilities (configure URL and anon key)
const SUPABASE_URL = 'https://tpopvamtqwjjbpokmczw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwb3B2YW10cXdqamJwb2ttY3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDI2NjksImV4cCI6MjA3OTM3ODY2OX0.3pr6TDBZlRXd8ra3d1S5oYWjyCPqVXoLaiKs8Zy_G2g';
function isConfigured() { return Boolean(SUPABASE_URL) && Boolean(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55ZHhoaXRqaXF0eGx1dXhvd2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4Mjc5NjQsImV4cCI6MjA3OTQwMzk2NH0._iGtoSu-tGkTx3gLEFDOO0Y9aKmPRpfaRExUfDBabDc); }

const ADMIN_EMAILS = ['admin@antim.com'];

function getSession() {
  try { return JSON.parse(localStorage.getItem('sb_session')) || null; } catch { return null; }
}

function setSession(session) {
  localStorage.setItem('sb_session', JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem('sb_session');
  localStorage.removeItem('theme');
}

function apiHeaders(includeAuth = true) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  };
  if (includeAuth) {
    const s = getSession();
    if (s?.access_token) headers['Authorization'] = `Bearer ${s.access_token}`;
  }
  return headers;
}

async function authFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers: { ...apiHeaders(false), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || data.msg || 'Request failed');
  return data;
}

async function restFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { ...options, headers: { ...apiHeaders(true), 'Prefer': 'return=representation', ...(options.headers || {}) } });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(typeof data === 'string' ? data : data.message || 'Request failed');
  return data;
}

function qs(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') usp.append(k, v); });
  return `?${usp.toString()}`;
}

// REST helpers
async function select(table, params = {}) { return restFetch(`/${table}${qs(params)}`, { method: 'GET' }); }
async function insert(table, rows) { return restFetch(`/${table}`, { method: 'POST', body: JSON.stringify(rows) }); }
async function update(table, matchParams, body) { return restFetch(`/${table}${qs(matchParams)}`, { method: 'PATCH', body: JSON.stringify(body) }); }
async function remove(table, matchParams) { return restFetch(`/${table}${qs(matchParams)}`, { method: 'DELETE' }); }

// Layout controls shared
function initLayoutControls() {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const themeToggle = document.getElementById('themeToggle');
  const logoutBtn = document.getElementById('logoutBtn');
  if (menuToggle) menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  if (themeToggle) themeToggle.addEventListener('click', () => {
    const next = (document.body.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) document.body.setAttribute('data-theme', savedTheme);
  if (logoutBtn) logoutBtn.addEventListener('click', () => logoutUser());
}

// Export helpers globally
window.sb = { select, insert, update, remove };
window.isConfigured = isConfigured;
