import { supabase } from '../supabaseClient'; 

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

export async function loginWithPassword(identifier, password) {
  try {
    // Call backend endpoint instead of querying Supabase directly
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const result = await response.json();

    if (!result.ok) {
      return { ok: false, message: result.message || 'Login failed' };
    }

    const profileData = result.user;
    const role = profileData.role || 'user';

    // บันทึก session
    setSession({ 
      id: profileData.id,
      username: profileData.username, 
      email: profileData.email, 
      token: 'local_token_' + Date.now(),
      role 
    });

    writeJSON(PROFILE_KEY, {
      username: profileData.username,
      email: profileData.email,
      full_name: profileData.full_name || '',
      role,
      description: '',
      avatar: profileData.avatar_url || ''
    });

    console.log('✅ Login success:', { username: profileData.username, role });
    return { ok: true, user: { username: profileData.username, email: profileData.email, role } };
  } catch (e) {
    console.error('Login Error:', e);
    return { ok: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

export async function getUsers() {
  try {
    const res = await fetch('http://localhost:5000/api/users');
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error('getUsers:', error);
    return [];
  }
}

export async function registerUser({ username, email, password, firstName, lastName, birthDate }) {
  try {
    // Call backend endpoint instead of Supabase Auth
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password,
        firstName: firstName || username,
        lastName: lastName || '-',
        birthDate: birthDate || '2000-01-01'
      })
    });

    const result = await response.json();

    if (!result.ok) {
      return { ok: false, message: result.message || 'Registration failed' };
    }

    // Set session
    const role = result.user?.role || 'user';
    setSession({
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      token: 'local_token_' + Date.now(),
      role
    });

    writeJSON(PROFILE_KEY, {
      username: result.user.username,
      email: result.user.email,
      full_name: `${firstName || username} ${lastName || ''}`.trim(),
      role,
      description: '',
      avatar: '',
      bgColor: '#050505',
      nameColor: '#ffffff'
    });

    console.log('✅ Registration success:', { username: result.user.username, role });
    return { ok: true, user: { username: result.user.username, email: result.user.email, role } };
  } catch (e) {
    console.error('Register Error:', e);
    return { ok: false, message: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

export async function login(identifier, password) {
  try {
    // ถ้าเป็น username (ไม่มี @) ให้หา email จากตาราง user_profiles
    let email = identifier;

    if (!identifier.includes('@')) {
      // ค้นหา email จาก username ใน professional_profiles
      const { data: profileData } = await supabase
        .from('professional_profiles')
        .select('user_id, username')
        .eq('username', identifier.trim())
        .maybeSingle();

      if (profileData?.user_id) {
        // ดึง email จาก auth.users ผ่าน user_id โดยใช้ตาราง user_emails (ถ้ามี)
        // fallback: ให้ user_metadata เก็บ email ไว้
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('id', profileData.user_id)
          .maybeSingle();

        if (userData?.email) {
          email = userData.email;
        } else {
          return { ok: false, message: 'ไม่พบ Username นี้ในระบบ กรุณาใช้ Email แทน' };
        }
      } else {
        return { ok: false, message: 'ไม่พบ Username นี้ในระบบ กรุณาใช้ Email แทน' };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { ok: false, message: error.message };

    const user = data.user;
    if (user) {
      const username = user.user_metadata?.username || user.email.split('@')[0];
      
      // ดึง role จากตาราง profiles
      let role = 'user';
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profileData?.role) {
          role = profileData.role;
        }
      } catch (err) {
        // ถ้ามี error ให้ใช้ role default เป็น user
      }
      
      setSession({ id: user.id, username, email: user.email, token: user.aud, role });
      writeJSON(PROFILE_KEY, { 
        username, 
        firstName: user.user_metadata?.firstName || '', 
        lastName: user.user_metadata?.lastName || '', 
        email: user.email, 
        description: '', 
        avatar: '', 
        role 
      });
      return { ok: true, user: { username, email: user.email, role } };
    }
    return { ok: false, message: 'Login failed' };
  } catch (e) {
    return { ok: false, message: 'Supabase Connection Error' };
  }
}

export async function isAdmin() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    return data?.role === 'admin';
  } catch { return false; }
}

export async function promoteUserToAdmin(username) {
  return await updateUser(username, { role: 'admin' });
}

export async function demoteAdminToUser(username) {
  return await updateUser(username, { role: 'user' });
}

export async function deleteUser(username) {
  try {
    const res = await fetch(`http://localhost:5000/api/users/${username}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    return result.ok;
  } catch { return false; }
}

export async function impersonateUser(username) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    if (!data) return false;
    setSession({ username: data.username, email: data.email || '', token: data.id });
    writeJSON(PROFILE_KEY, {
      username: data.username,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: data.email || '',
      description: '',
      avatar: data.avatar_url || ''
    });
    return true;
  } catch { return false; }
}

export async function updateUser(username, updates) {
  try {
    const res = await fetch(`http://localhost:5000/api/users/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const result = await res.json();
    return result.ok;
  } catch { return false; }
}
