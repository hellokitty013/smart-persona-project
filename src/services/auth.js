import { supabase } from '../supabaseClient'; 
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

export async function logout() {
  try {
    await supabase.auth.signOut();
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          firstName,
          lastName,
          birthDate
        }
      }
    });

    if (error) return { ok: false, message: error.message };

    const user = data.user;
    if (user) {
      setSession({ username, email: user.email, token: user.aud });
      writeJSON(PROFILE_KEY, { 
        username, 
        firstName, 
        lastName, 
        email: user.email, 
        description: '', 
        avatar: '', 
        bgColor: '#050505', 
        nameColor: '#ffffff' 
      });
      return { ok: true, user: { username, email: user.email } };
    }
    return { ok: false, message: 'Registration failed or requires email confirmation' };
  } catch (e) {
    return { ok: false, message: 'Supabase Connection Error' };
  }
}

export async function login(identifier, password) {
  try {
    // Supabase Auth typically uses email.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: password,
    });

    if (error) return { ok: false, message: error.message };

    const user = data.user;
    if (user) {
      const username = user.user_metadata?.username || user.email.split('@')[0];
      setSession({ username, email: user.email, token: user.aud });
      writeJSON(PROFILE_KEY, { 
        username, 
        firstName: user.user_metadata?.firstName || '', 
        lastName: user.user_metadata?.lastName || '', 
        email: user.email, 
        description: '', 
        avatar: '' 
      });
      return { ok: true, user: { username, email: user.email } };
    }
    return { ok: false, message: 'Login failed' };
  } catch (e) {
    return { ok: false, message: 'Supabase Connection Error' };
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
