// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// ใส่ URL และ Key ของคุณที่นี่ (หรือใช้ .env file)
const supabaseUrl = 'https://aonkndmgaqloeqmibeeh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbmtuZG1nYXFsb2VxbWliZWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDg3MDksImV4cCI6MjA5MDYyNDcwOX0.wark7XJngSZ1XXse7bhWXLXkIGDfD6SN6sIdCphD6jg'

export const supabase = createClient(supabaseUrl, supabaseKey)
