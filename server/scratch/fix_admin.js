
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aonkndmgaqloeqmibeeh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbmtuZG1nYXFsb2VxbWliZWVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0ODcwOSwiZXhwIjoyMDkwNjI0NzA5fQ.8hVcmVxAisO6qFrA2Z8ebF89ri4iZuF8QoBnkXdlMsc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAdmin() {
  const email = 'admin1@smartpersona.com'
  const username = 'admin1'
  const password = '12345' // From profile

  console.log('Fixing user:', username)

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username }
  })

  if (authError) {
    console.error('Error creating auth user:', authError.message)
    return
  }

  const newId = authData.user.id
  console.log('Created auth user with ID:', newId)

  // 2. Update profiles table
  const { error: profError } = await supabase
    .from('profiles')
    .update({ id: newId })
    .eq('username', username)

  if (profError) {
    console.error('Error updating profile ID:', profError.message)
    return
  }

  console.log('Successfully updated profile ID to:', newId)
  
  // 3. Update any existing profile_cards (optional, but good for consistency)
  const { error: cardError } = await supabase
    .from('profile_cards')
    .update({ user_id: newId })
    .eq('user_id', 'fb340775-2c95-4b09-983f-22b9d7dbb895') // old ID

  if (cardError) {
    console.warn('Warning updating profile cards:', cardError.message)
  }

  console.log('Admin1 fixed! Please log out and log in again on the website.')
}

fixAdmin()
