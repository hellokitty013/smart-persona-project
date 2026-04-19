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

export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, website, role, created_at');
    if (error) { console.error('getUsers:', error); return []; }
    return data || [];
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
      // บันทึก username → email ลงตาราง user_profiles เพื่อให้ login ด้วย username ได้
      await supabase.from('user_profiles').upsert({
        id: user.id,
        username,
        email: user.email,
        first_name: firstName || '',
        last_name: lastName || '',
      }, { onConflict: 'id' });

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
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('username', username);
    return !error;
  } catch { return false; }
}

export async function demoteAdminToUser(username) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('username', username);
    return !error;
  } catch { return false; }
}

export async function deleteUser(username) {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('username', username);
    return !error;
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
    const mapped = {};
    if (updates.role !== undefined) mapped.role = updates.role;
    if (updates.firstName !== undefined) mapped.first_name = updates.firstName;
    if (updates.lastName !== undefined) mapped.last_name = updates.lastName;
    if (updates.full_name !== undefined) mapped.full_name = updates.full_name;
    if (updates.avatar_url !== undefined) mapped.avatar_url = updates.avatar_url;

    const { error } = await supabase
      .from('profiles')
      .update(mapped)
      .eq('username', username);
    return !error;
  } catch { return false; }
}
