// Authentication flows using Supabase Auth REST
async function loginUser(email, password) {
  try {
    const data = await authFetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password })
    });
    const access_token = data.access_token;
    let user = data.user;
    if (!user && access_token) {
      user = await authFetch('/auth/v1/user', { headers: { 'Authorization': `Bearer ${access_token}`, 'apikey': SUPABASE_ANON_KEY } });
    }
    setSession({ access_token, refresh_token: data.refresh_token, user });
    window.location.href = './dashboard.html';
  } catch (e) { alert(`Login failed: ${e.message}`); }
}

async function signupUser(email, password) {
  try {
    const s = getSession();
    const currentEmail = s?.user?.email;
    const isAdmin = currentEmail && ADMIN_EMAILS.includes(currentEmail);
    if (!isAdmin) { alert('Only admin can create accounts'); return; }
    const data = await authFetch('/auth/v1/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password })
    });
    alert('Account created. The user should check email for confirmation.');
  } catch (e) { alert(`Signup failed: ${e.message}`); }
}

async function recoverPassword(email) {
  try {
    await authFetch('/auth/v1/recover', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email })
    });
    alert('Reset email sent if the address exists.');
  } catch (e) { alert(`Reset failed: ${e.message}`); }
}

function logoutUser() { clearSession(); window.location.href = './index.html'; }

async function refreshSession() {
  const s = getSession();
  if (!s?.refresh_token) return;
  try {
    const data = await authFetch('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    setSession({ access_token: data.access_token, refresh_token: data.refresh_token || s.refresh_token, user: data.user || s.user });
  } catch {}
}

function checkAuthState({ requireAuth = false } = {}) {
  const s = getSession();
  if (requireAuth && !s?.access_token) { window.location.href = './index.html'; return; }
  const theme = localStorage.getItem('theme');
  if (theme) document.body.setAttribute('data-theme', theme);
}
