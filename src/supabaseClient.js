// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// ใส่ URL และ Key ของคุณที่นี่ (หรือใช้ .env file)
const supabaseUrl = 'https://aonkndmgaqloeqmibeeh.supabase.co'
const supabaseKey = 'sb_publishable_Rzhb6l82a9CtauyTR1fMog_FgjANBGL'

export const supabase = createClient(supabaseUrl, supabaseKey)
