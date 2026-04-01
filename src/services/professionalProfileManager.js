// Professional Profile Manager — Supabase backend
import { supabase } from '../supabaseClient'
import { getCurrentUser } from './auth'

const ACTIVE_PROFILE_KEY = 'active_professional_profile'

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const initProfessionalProfiles = () => {} // no-op: Supabase handles init

export const getAllProfessionalProfiles = async () => {
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error('getAllProfessionalProfiles:', error); return [] }
  return data || []
}

export const getProfessionalProfileById = async (id) => {
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) { console.error('getProfessionalProfileById:', error); return null }
  return data
}

export const getProfessionalProfileByUsername = async (username) => {
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()
  if (error) { console.error('getProfessionalProfileByUsername:', error); return null }
  return data
}

export const getCurrentUserProfessionalProfile = async () => {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return null
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) { console.error('getCurrentUserProfessionalProfile:', error); return null }
  return data
}

export const createProfessionalProfile = async (username) => {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const existing = await getProfessionalProfileByUsername(username)
  if (existing) return existing

  const newProfile = {
    user_id: user.id,
    username,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    data: {
      displayName: username,
      jobTitle: '',
      location: '',
      avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
      coverImage: '',
      coverColor: '#0a66c2',
      about: '',
      experienceYears: 0,
      skills: [],
      experience: [],
      education: [],
      tagline: '',
      followers: 0,
      vheartLikes: 0,
      following: 0,
      contact: { email: '', phone: '', address: '', links: [] },
      featuredItems: [],
      recentActivity: [],
      isPublic: true
    }
  }

  const { data, error } = await supabase
    .from('professional_profiles')
    .insert(newProfile)
    .select()
    .single()
  if (error) { console.error('createProfessionalProfile:', error); throw error }
  return data
}

export const updateProfessionalProfile = async (id, updates) => {
  const current = await getProfessionalProfileById(id)
  if (!current) return null

  const { data, error } = await supabase
    .from('professional_profiles')
    .update({
      data: { ...current.data, ...updates },
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error('updateProfessionalProfile:', error); throw error }
  return data
}

export const deleteProfessionalProfile = async (id) => {
  const { error } = await supabase.from('professional_profiles').delete().eq('id', id)
  if (error) { console.error('deleteProfessionalProfile:', error); return false }
  return true
}

export const getPublicProfessionalProfiles = async () => {
  const { data, error } = await supabase
    .from('professional_profiles')
    .select('*')
  if (error) { console.error('getPublicProfessionalProfiles:', error); return [] }
  return (data || []).filter(p => p.data?.isPublic === true)
}

export const searchProfessionalProfiles = async (query = '', filters = {}) => {
  let profiles = await getPublicProfessionalProfiles()

  if (query.trim()) {
    const q = query.toLowerCase()
    profiles = profiles.filter(p => {
      const d = p.data
      return (
        d.displayName?.toLowerCase().includes(q) ||
        d.jobTitle?.toLowerCase().includes(q) ||
        d.location?.toLowerCase().includes(q) ||
        d.skills?.some(s => s.toLowerCase().includes(q))
      )
    })
  }

  if (filters.skill) {
    profiles = profiles.filter(p =>
      p.data.skills?.some(s => s.toLowerCase() === filters.skill.toLowerCase())
    )
  }
  if (filters.location) {
    profiles = profiles.filter(p =>
      p.data.location?.toLowerCase() === filters.location.toLowerCase()
    )
  }
  if (filters.experienceLevel) {
    profiles = profiles.filter(p => {
      const years = p.data.experienceYears || 0
      switch (filters.experienceLevel) {
        case 'junior': return years < 3
        case 'mid': return years >= 3 && years <= 7
        case 'senior': return years > 7
        default: return true
      }
    })
  }

  return profiles
}

export const getAllSkills = async () => {
  const profiles = await getAllProfessionalProfiles()
  const set = new Set()
  profiles.forEach(p => p.data?.skills?.forEach(s => set.add(s)))
  return Array.from(set).sort()
}

export const getAllLocations = async () => {
  const profiles = await getAllProfessionalProfiles()
  const set = new Set()
  profiles.forEach(p => { if (p.data?.location) set.add(p.data.location) })
  return Array.from(set).sort()
}

// ─── Experience ───────────────────────────────────────────────────────────────

export const addExperience = async (profileId, experience) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const list = [{ id: Date.now().toString(), ...experience, createdAt: new Date().toISOString() }, ...(profile.data.experience || [])]
  return updateProfessionalProfile(profileId, { experience: list })
}

export const updateExperience = async (profileId, experienceId, updates) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const list = (profile.data.experience || []).map(e => e.id === experienceId ? { ...e, ...updates } : e)
  return updateProfessionalProfile(profileId, { experience: list })
}

export const deleteExperience = async (profileId, experienceId) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const list = (profile.data.experience || []).filter(e => e.id !== experienceId)
  return updateProfessionalProfile(profileId, { experience: list })
}

// ─── Education ────────────────────────────────────────────────────────────────

export const addEducation = async (profileId, education) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const list = [{ id: Date.now().toString(), ...education, createdAt: new Date().toISOString() }, ...(profile.data.education || [])]
  return updateProfessionalProfile(profileId, { education: list })
}

export const updateEducation = async (profileId, educationId, updates) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const list = (profile.data.education || []).map(e => e.id === educationId ? { ...e, ...updates } : e)
  return updateProfessionalProfile(profileId, { education: list })
}

export const deleteEducation = async (profileId, educationId) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const list = (profile.data.education || []).filter(e => e.id !== educationId)
  return updateProfessionalProfile(profileId, { education: list })
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export const addSkill = async (profileId, skill) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const skills = profile.data.skills || []
  if (skills.includes(skill)) return profile
  return updateProfessionalProfile(profileId, { skills: [...skills, skill] })
}

export const removeSkill = async (profileId, skill) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  return updateProfessionalProfile(profileId, { skills: (profile.data.skills || []).filter(s => s !== skill) })
}

// ─── Featured Items ───────────────────────────────────────────────────────────

export const addFeaturedItem = async (profileId, item) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const newItem = { id: Date.now().toString(), type: item.type || 'Project', title: item.title || 'Untitled', description: item.description || '', url: item.url || '', cover: item.cover || '', createdAt: new Date().toISOString() }
  const list = [newItem, ...(profile.data.featuredItems || [])]
  return updateProfessionalProfile(profileId, { featuredItems: list })
}

export const removeFeaturedItem = async (profileId, itemId) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  return updateProfessionalProfile(profileId, { featuredItems: (profile.data.featuredItems || []).filter(i => i.id !== itemId) })
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export const addActivityEntry = async (profileId, entry) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const newEntry = { id: Date.now().toString(), type: entry.type || 'Update', title: entry.title || entry.summary || 'New update', description: entry.description || '', timestamp: entry.timestamp || new Date().toLocaleString(), icon: entry.icon || 'bi-activity' }
  return updateProfessionalProfile(profileId, { recentActivity: [newEntry, ...(profile.data.recentActivity || [])] })
}

export const removeActivityEntry = async (profileId, entryId) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  return updateProfessionalProfile(profileId, { recentActivity: (profile.data.recentActivity || []).filter(i => i.id !== entryId) })
}

// ─── Likes / Active Profile ───────────────────────────────────────────────────

export const adjustVheartLikes = async (profileId, delta = 1) => {
  const profile = await getProfessionalProfileById(profileId)
  if (!profile) return null
  const current = profile.data.vheartLikes ?? profile.data.followers ?? 0
  const nextValue = Math.max(0, current + delta)
  return updateProfessionalProfile(profileId, { vheartLikes: nextValue, followers: nextValue })
}

export const setActiveProfessionalProfile = (profileId) => {
  localStorage.setItem(ACTIVE_PROFILE_KEY, profileId)
}

export const getActiveProfessionalProfile = async () => {
  const profileId = localStorage.getItem(ACTIVE_PROFILE_KEY)
  if (profileId) return getProfessionalProfileById(profileId)
  return null
}

