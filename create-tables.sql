-- ===============================================
-- สร้างตาราง Database ใน Supabase PostgreSQL
-- ===============================================

-- 1. สร้าง Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. สร้าง Table: user_profiles (สำหรับ login ด้วย username)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. สร้าง Indexes เพื่อประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- 4. เพิ่ม Admin User
INSERT INTO profiles (username, email, full_name, role)
VALUES ('admin1', 'admin1@smartpersona.com', 'Admin User', 'admin')
ON CONFLICT (username) DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 5. เพิ่ม Admin User ใน user_profiles
INSERT INTO user_profiles (username, email, first_name, last_name)
VALUES ('admin1', 'admin1@smartpersona.com', 'Admin', 'User')
ON CONFLICT (username) DO UPDATE SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();

-- 6. ตรวจสอบ
SELECT username, email, role FROM profiles WHERE username = 'admin1';
