// สคริปต์สำหรับสร้าง admin user ใน Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aonkndmgaqloeqmibeeh.supabase.co';
// ⚠️ ต้องใช้ Service Role Key ไม่ใช่ Anon Key
// ให้ copy จาก Supabase Dashboard > Settings > API > Service role secret key
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('❌ ต้องตั้งค่า SUPABASE_SERVICE_ROLE_KEY ใน .env ไฟล์');
  console.error('📖 Copy จาก: Supabase Dashboard > Settings > API > Service role secret key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin() {
  const username = 'admin1';
  const email = 'admin1@smartpersona.com';
  const password = '123456';

  try {
    console.log('🔄 กำลังสร้าง admin user ใน Supabase...');

    // 1. ตรวจสอบว่า user นี้มีอยู่แล้งหรือไม่
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === email);
    
    let userId;
    if (existingAdmin) {
      console.log('⚠️  User นี้มีอยู่แล้ว ใช้ ID เดิม:', existingAdmin.id);
      userId = existingAdmin.id;
    } else {
      // สร้าง user ใหม่
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          firstName: 'Admin',
          lastName: 'User',
        },
      });

      if (authError) {
        console.error('❌ Error สร้าง user:', authError.message);
        return;
      }

      userId = authData.user.id;
      console.log('✅ สร้าง user ใน Auth สำเร็จ:', userId);
    }

    // 2. สร้าง/อัปเดต profile ใน profiles ตาราง
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username,
        email,
        full_name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('❌ Error สร้าง profile:', profileError.message);
      return;
    }
    console.log('✅ สร้าง profile สำเร็จ');

    // 3. สร้าง/อัปเดต user_profile เพื่อ login ด้วย username
    const { error: userProfileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        username,
        email,
        first_name: 'Admin',
        last_name: 'User',
      }, { onConflict: 'id' });

    if (userProfileError) {
      console.error('❌ Error สร้าง user_profile:', userProfileError.message);
      return;
    }
    console.log('✅ สร้าง user_profile สำเร็จ');

    console.log('\n🎉 ==================== สร้าง admin เสร็จแล้ว! ====================');
    console.log(`📝 Username: admin1`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: 123456`);
    console.log(`👤 Role: admin`);
    console.log('\n🌐 เข้าสู่ระบบ: http://localhost:5173/admin/login');
    console.log('============================================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdmin();
