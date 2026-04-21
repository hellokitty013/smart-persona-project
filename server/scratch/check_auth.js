
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aonkndmgaqloeqmibeeh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbmtuZG1nYXFsb2VxbWliZWVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0ODcwOSwiZXhwIjoyMDkwNjI0NzA5fQ.8hVcmVxAisO6qFrA2Z8ebF89ri4iZuF8QoBnkXdlMsc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error(error)
    return
  }
  
  const admin1 = users.find(u => u.email === 'admin1@smartpersona.com')
  console.log('Admin1 Auth User:', JSON.stringify(admin1, null, 2))
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'admin1')
    .single()
  console.log('Admin1 Profile:', JSON.stringify(profile, null, 2))
}

checkUser()
