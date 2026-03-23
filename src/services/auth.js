const API_URL = 'http://localhost:5000/api';

const CURRENT_USER_KEY = 'spa_current_user';
const PROFILE_KEY = 'user_profile';

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { }
}

export function getCurrentUser() {
  return readJSON(CURRENT_USER_KEY);
}

export function getProfile() {
  return readJSON(PROFILE_KEY);
}

export function setSession(u) {
  writeJSON(CURRENT_USER_KEY, u);
}

export function logout() {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem('socialLinks');
  } catch (e) { }
}

export async function getUsers() {
  try {
    const res = await fetch(`${API_URL}/users`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function registerUser({ username, email, password, firstName, lastName, birthDate }) {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, firstName, lastName, birthDate })
    });
    const data = await res.json();
    if (data.ok) {
      setSession({ username: data.user.username, email: data.user.email, token: data.user.token });
      writeJSON(PROFILE_KEY, { username: data.user.username, firstName, lastName, email, description: '', avatar: '', bgColor: '#050505', nameColor: '#ffffff' });
    }
    return data;
  } catch (e) {
    return { ok: false, message: 'Server Error connecting to backend API' };
  }
}

export async function login(identifier, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (data.ok) {
      setSession({ username: data.user.username, email: data.user.email, token: data.user.token });
      writeJSON(PROFILE_KEY, { username: data.user.username, firstName: data.user.firstName || '', lastName: data.user.lastName || '', email: data.user.email, description: '', avatar: '' });
    }
    return data;
  } catch (e) {
    return { ok: false, message: 'Server Error connecting to backend API' };
  }
}

export async function isAdmin() {
  const cur = getCurrentUser();
  if (!cur || !cur.username) return false;
  const users = await getUsers();
  const found = users.find(u => u.username === cur.username);
  return !!(found && found.role === 'admin');
}

export async function promoteUserToAdmin(username) {
  try {
    const res = await fetch(`${API_URL}/users/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' })
    });
    const data = await res.json();
    return data.ok;
  } catch (e) { return false; }
}

export async function demoteAdminToUser(username) {
  try {
    const res = await fetch(`${API_URL}/users/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user' })
    });
    const data = await res.json();
    return data.ok;
  } catch (e) { return false; }
}

export async function deleteUser(username) {
  try {
    const res = await fetch(`${API_URL}/users/${username}`, { method: 'DELETE' });
    const data = await res.json();
    return data.ok;
  } catch (e) { return false; }
}

export async function impersonateUser(username) {
  const users = await getUsers();
  const targetUser = users.find(u => u.username === username);
  if (!targetUser) return false;

  setSession({ username: targetUser.username, email: targetUser.email, token: targetUser.token });
  writeJSON(PROFILE_KEY, {
    username: targetUser.username,
    firstName: targetUser.firstName || '',
    lastName: targetUser.lastName || '',
    email: targetUser.email,
    description: '',
    avatar: ''
  });
  return true;
}

export async function updateUser(username, updates) {
  try {
    const res = await fetch(`${API_URL}/users/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    return data.ok;
  } catch (e) { return false; }
}
