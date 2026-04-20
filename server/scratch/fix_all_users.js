
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aonkndmgaqloeqmibeeh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbmtuZG1nYXFsb2VxbWliZWVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0ODcwOSwiZXhwIjoyMDkwNjI0NzA5fQ.8hVcmVxAisO6qFrA2Z8ebF89ri4iZuF8QoBnkXdlMsc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAllUsers() {
  console.log('--- Starting Mass User Sync ---')

  // 1. Get all profiles
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*')
  if (profErr) {
    console.error('Error fetching profiles:', profErr)
    return
  }

  // 2. Get all auth users
  const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr) {
    console.error('Error fetching auth users:', authErr)
    return
  }

  console.log(`Found ${profiles.length} profiles and ${authUsers.length} auth users.`)

  for (const profile of profiles) {
    const authUser = authUsers.find(u => u.email === profile.email)
    
    if (authUser) {
      // User exists in both, check if IDs match
      if (authUser.id !== profile.id) {
        console.log(`Mismatch for ${profile.username}: Profile ID ${profile.id} != Auth ID ${authUser.id}. Syncing...`)
        
        // Update profile ID to match auth ID
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ id: authUser.id })
          .eq('username', profile.username)
        
        if (updateErr) {
          console.error(`Failed to sync ID for ${profile.username}:`, updateErr.message)
        } else {
          // Also update profile_cards
          await supabase.from('profile_cards').update({ user_id: authUser.id }).eq('user_id', profile.id)
          console.log(`Synced ID for ${profile.username}.`)
        }
      } else {
        console.log(`User ${profile.username} is already synced.`)
      }
    } else {
      // Missing auth user! Create it.
      console.log(`Missing auth user for ${profile.username} (${profile.email}). Creating...`)
      
      const { data: newAuth, error: createErr } = await supabase.auth.admin.createUser({
        email: profile.email,
        password: profile.password || '12345', // Default if missing
        email_confirm: true,
        user_metadata: { username: profile.username }
      })

      if (createErr) {
        console.error(`Failed to create auth user for ${profile.username}:`, createErr.message)
      } else {
        const newId = newAuth.user.id
        await supabase.from('profiles').update({ id: newId }).eq('username', profile.username)
        await supabase.from('profile_cards').update({ user_id: newId }).eq('user_id', profile.id)
        console.log(`Created and synced ${profile.username} (New ID: ${newId}).`)
      }
    }
  }

  console.log('--- Mass User Sync Completed ---')
}

fixAllUsers()
