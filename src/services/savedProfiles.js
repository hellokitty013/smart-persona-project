// Saved Profiles Management — Supabase backend
import { supabase } from '../supabaseClient'

export async function getSavedProfiles() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return []
  const { data, error } = await supabase
    .from('saved_profiles')
    .select('profile_id')
    .eq('user_id', user.id)
  if (error) { console.error('getSavedProfiles:', error); return [] }
  return (data || []).map(r => r.profile_id)
}

export async function isProfileSaved(profileId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return false
  const { data } = await supabase
    .from('saved_profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('profile_id', profileId)
    .maybeSingle()
  return !!data
}

export async function saveProfile(profileId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return false
  const { error } = await supabase
    .from('saved_profiles')
    .insert({ user_id: user.id, profile_id: profileId })
  if (error) { console.error('saveProfile:', error); return false }
  return true
}

export async function unsaveProfile(profileId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return false
  const { error } = await supabase
    .from('saved_profiles')
    .delete()
    .eq('user_id', user.id)
    .eq('profile_id', profileId)
  if (error) { console.error('unsaveProfile:', error); return false }
  return true
}

export async function toggleSaveProfile(profileId) {
  const saved = await isProfileSaved(profileId)
  return saved ? unsaveProfile(profileId) : saveProfile(profileId)
}

export async function getSavedProfilesCount() {
  const saved = await getSavedProfiles()
  return saved.length
}

