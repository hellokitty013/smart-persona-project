// Profile Management System — Supabase backend
import { supabase } from '../supabaseClient'
import { applyTemplate } from '../config/profileTemplates'

const ACTIVE_PROFILE_KEY = 'active_profile_id'

// ─── Active profile (local UI preference) ────────────────────────────────────

export function getActiveProfileId() {
  try { return localStorage.getItem(ACTIVE_PROFILE_KEY) || null } catch { return null }
}

export function setActiveProfile(profileId) {
  try { localStorage.setItem(ACTIVE_PROFILE_KEY, profileId) } catch {}
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getAllProfiles() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return []
  const { data, error } = await supabase
    .from('profile_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) { console.error('getAllProfiles:', error); return [] }
  return data || []
}

export const getProfiles = getAllProfiles

export async function getProfileById(profileId) {
  const { data, error } = await supabase
    .from('profile_cards')
    .select('*')
    .eq('id', profileId)
    .single()
  if (error) { console.error('getProfileById:', error); return null }
  return data
}

export async function getActiveProfile() {
  const activeId = getActiveProfileId()
  if (activeId) {
    const profile = await getProfileById(activeId)
    if (profile) return profile
  }
  const profiles = await getAllProfiles()
  return profiles.length > 0 ? profiles[0] : null
}

export async function createProfile({ type, name }) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const templateData = applyTemplate(type)
  const id = `profile_${Date.now()}`

  const newProfile = {
    id,
    user_id: user.id,
    type: type || 'personal',
    name: name || `${type} Profile`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    data: {
      username: '',
      ...templateData,
      hasAudio: false,
      audioFileName: '',
      audioStartTime: 0,
      audioEndTime: 0,
      isPublic: true,
      socialLinks: {},
      jobTitle: '',
      location: '',
      experienceYears: 0,
      skills: [],
      experience: [],
      education: []
    }
  }

  const { data, error } = await supabase
    .from('profile_cards')
    .insert(newProfile)
    .select()
    .single()
  if (error) { console.error('createProfile:', error); throw error }

  const all = await getAllProfiles()
  if (all.length === 1) setActiveProfile(data.id)

  return data
}

export async function updateProfile(profileId, updates) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const current = await getProfileById(profileId)
  if (!current) throw new Error('Profile not found')

  const { data, error } = await supabase
    .from('profile_cards')
    .update({
      data: { ...current.data, ...updates },
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) { console.error('updateProfile:', error); throw error }
  return data
}

export async function deleteProfile(profileId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profile_cards')
    .delete()
    .eq('id', profileId)
    .eq('user_id', user.id)
  if (error) { console.error('deleteProfile:', error); throw error }

  if (getActiveProfileId() === profileId) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY)
  }

  return await getAllProfiles()
}

// ─── Migration (localStorage → Supabase) ─────────────────────────────────────

export async function migrateOldProfile() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return

  const existing = await getAllProfiles()
  if (existing.length > 0) return

  try {
    const oldProfiles = localStorage.getItem('user_profiles')
    if (oldProfiles) {
      const parsed = JSON.parse(oldProfiles)
      for (const p of parsed) {
        const id = `profile_${Date.now()}_${Math.random().toString(36).slice(2)}`
        await supabase.from('profile_cards').insert({
          id,
          user_id: user.id,
          type: p.type || 'personal',
          name: p.name || 'Profile',
          data: p.data || {},
          created_at: p.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      return
    }

    const oldProfile = localStorage.getItem('user_profile')
    if (oldProfile) {
      const data = JSON.parse(oldProfile)
      const created = await createProfile({ type: 'personal', name: 'Main Profile' })
      await updateProfile(created.id, data)
    }
  } catch (err) {
    console.error('migrateOldProfile:', err)
  }
}

// ─── Initialize / Helpers ─────────────────────────────────────────────────────

export async function initializeProfiles(username) {
  const profiles = await getAllProfiles()
  if (profiles.length === 0) {
    const defaultProfile = await createProfile({ type: 'personal', name: 'Main Profile' })
    await updateProfile(defaultProfile.id, { username })
  }
}

export async function getPublicProfiles() {
  const { data, error } = await supabase
    .from('profile_cards')
    .select('*')
  if (error) { console.error('getPublicProfiles:', error); return [] }
  return (data || []).filter(p => p.data?.isPublic === true)
}

export async function searchProfiles(query, filters = {}) {
  let profiles = await getPublicProfiles()

  if (query && query.trim()) {
    const q = query.toLowerCase()
    profiles = profiles.filter(p => {
      const d = p.data || {}
      return (
        d.displayName?.toLowerCase().includes(q) ||
        d.username?.toLowerCase().includes(q) ||
        d.jobTitle?.toLowerCase().includes(q) ||
        d.location?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.skills?.some(s => s.toLowerCase().includes(q))
      )
    })
  }

  if (filters.skills?.length > 0) {
    profiles = profiles.filter(p => {
      const sk = (p.data?.skills || []).map(s => s.toLowerCase())
      return filters.skills.some(s => sk.includes(s.toLowerCase()))
    })
  }

  if (filters.jobTitle) {
    const role = filters.jobTitle.toLowerCase()
    profiles = profiles.filter(p => p.data?.jobTitle?.toLowerCase().includes(role))
  }

  if (filters.location) {
    const loc = filters.location.toLowerCase()
    profiles = profiles.filter(p => p.data?.location?.toLowerCase().includes(loc))
  }

  if (filters.experienceLevel) {
    profiles = profiles.filter(p => {
      const years = p.data?.experienceYears || 0
      switch (filters.experienceLevel) {
        case 'entry': return years >= 0 && years <= 2
        case 'mid': return years >= 3 && years <= 5
        case 'senior': return years >= 6
        default: return true
      }
    })
  }

  return profiles
}

