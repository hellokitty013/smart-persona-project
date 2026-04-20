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

// ─── Profile Likes (ใจ) ───────────────────────────────────────────────────────

const LIKES_KEY = 'vheart_liked_profiles'

function getLocalLikes() {
  try { return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')) } catch { return new Set() }
}
function setLocalLikes(set) {
  localStorage.setItem(LIKES_KEY, JSON.stringify([...set]))
}

export async function getLikedProfiles() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return [...getLocalLikes()]
  const { data, error } = await supabase
    .from('profile_likes')
    .select('profile_id')
    .eq('user_id', user.id)
  if (error) {
    console.warn('profile_likes table not ready, using localStorage:', error.message)
    return [...getLocalLikes()]
  }
  const ids = (data || []).map(r => r.profile_id)
  setLocalLikes(new Set(ids))
  return ids
}

export async function likeProfile(profileId) {
  const local = getLocalLikes(); local.add(profileId); setLocalLikes(local)
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return true
  const { error } = await supabase
    .from('profile_likes')
    .insert({ user_id: user.id, profile_id: profileId })
  if (error) { console.warn('likeProfile supabase error:', error.message) }
  return true
}

export async function unlikeProfile(profileId) {
  const local = getLocalLikes(); local.delete(profileId); setLocalLikes(local)
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return true
  const { error } = await supabase
    .from('profile_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('profile_id', profileId)
  if (error) { console.warn('unlikeProfile supabase error:', error.message) }
  return true
}

