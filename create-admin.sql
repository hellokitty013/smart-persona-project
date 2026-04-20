-- ===============================================
-- SQL Script: สร้าง Admin User ใน Supabase
-- Username: admin1
-- Password: 123456
-- Role: admin
-- ===============================================

-- 1. สร้าง Record ใน profiles ตาราง
INSERT INTO profiles (username, email, full_name, role, created_at)
VALUES ('admin1', 'admin1@smartpersona.com', 'Admin User', 'admin', NOW())
ON CONFLICT (username) DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  created_at = EXCLUDED.created_at;

-- 2. สร้าง Record ใน user_profiles ตาราง (สำหรับ login ด้วย username)
INSERT INTO user_profiles (username, email, first_name, last_name, created_at)
VALUES ('admin1', 'admin1@smartpersona.com', 'Admin', 'User', NOW())
ON CONFLICT (username) DO UPDATE SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- 3. ตรวจสอบว่าข้อมูลถูกเพิ่มเข้าไปแล้ว
SELECT 
  p.id,
  p.username,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
WHERE p.username = 'admin1';
