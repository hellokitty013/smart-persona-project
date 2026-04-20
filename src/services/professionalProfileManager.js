// Professional Profile Manager — via Backend API (bypasses Supabase RLS)
import { supabase } from '../supabaseClient'
import { getCurrentUser } from './auth'

const ACTIVE_PROFILE_KEY = 'active_professional_profile'
const API = 'http://localhost:5000'

// ─── helpers ──────────────────────────────────────────────────────────────────

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.message || 'API error')
  return json.data
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const initProfessionalProfiles = () => {} // no-op

export const getAllProfessionalProfiles = async () => {
  try {
    return await apiFetch('/api/profiles') || []
  } catch (e) { console.error('getAllProfessionalProfiles:', e); return [] }
}

export const getProfessionalProfileById = async (id) => {
  try {
    return await apiFetch(`/api/profiles/by-id/${id}`)
  } catch (e) { console.error('getProfessionalProfileById:', e); return null }
}

export const getProfessionalProfileByUsername = async (username) => {
  try {
    return await apiFetch(`/api/profiles/by-username/${encodeURIComponent(username)}`)
  } catch (e) { console.error('getProfessionalProfileByUsername:', e); return null }
}

export const getCurrentUserProfessionalProfile = async () => {
  const currentUser = getCurrentUser()
  if (!currentUser?.username) return null
  try {
    return await apiFetch(`/api/profiles/by-username/${encodeURIComponent(currentUser.username)}`)
  } catch (e) { console.error('getCurrentUserProfessionalProfile:', e); return null }
}

export const createProfessionalProfile = async (username) => {
  const currentUser = getCurrentUser()
  if (!currentUser?.username) throw new Error('Not authenticated')
  try {
    return await apiFetch('/api/profiles', {
      method: 'POST',
      body: JSON.stringify({ username, user_id: currentUser.username })
    })
  } catch (e) { console.error('createProfessionalProfile:', e); throw e }
}

export const updateProfessionalProfile = async (id, updates) => {
  try {
    return await apiFetch(`/api/profiles/by-id/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  } catch (e) { console.error('updateProfessionalProfile:', e); throw e }
}

export const deleteProfessionalProfile = async (id) => {
  try {
    const res = await fetch(`${API}/api/profiles/by-id/${id}`, { method: 'DELETE' })
    return res.ok
  } catch (e) { return false }
}

export const getPublicProfessionalProfiles = async () => {
  const profiles = await getAllProfessionalProfiles()
  return (profiles || []).filter(p => p.data?.isPublic === true)
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
    profiles = profiles.filter(p => p.data.skills?.some(s => s.toLowerCase() === filters.skill.toLowerCase()))
  }
  if (filters.location) {
    profiles = profiles.filter(p => p.data.location?.toLowerCase() === filters.location.toLowerCase())
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
