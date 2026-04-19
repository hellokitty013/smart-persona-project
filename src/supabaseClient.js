// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// ดึงค่า URL และ Key จากไฟล์ .env เพื่อความปลอดภัย
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
