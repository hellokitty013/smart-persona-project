// Profile View Analytics — Supabase backend
import { supabase } from '../supabaseClient'

export async function recordProfileView(profileId, viewerUsername = 'anonymous') {
  try {
    await supabase.from('profile_views').insert({
      profile_id: profileId,
      viewer_username: viewerUsername,
      viewed_at: new Date().toISOString()
    })
    return true
  } catch (err) {
    console.error('recordProfileView:', err)
    return false
  }
}

export async function getProfileViews(profileId) {
  const { data, error } = await supabase
    .from('profile_views')
    .select('*')
    .eq('profile_id', profileId)
    .order('viewed_at', { ascending: false })
  if (error) { console.error('getProfileViews:', error); return [] }
  return data || []
}

export async function getProfileViewCount(profileId) {
  const { count, error } = await supabase
    .from('profile_views')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
  if (error) { console.error('getProfileViewCount:', error); return 0 }
  return count || 0
}

export async function getUniqueViewersCount(profileId) {
  const views = await getProfileViews(profileId)
  return new Set(views.map(v => v.viewer_username)).size
}

export async function getRecentViews(profileId, days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase
    .from('profile_views')
    .select('*')
    .eq('profile_id', profileId)
    .gte('viewed_at', since.toISOString())
  if (error) { console.error('getRecentViews:', error); return [] }
  return data || []
}

export async function getViewsByDate(profileId) {
  const views = await getProfileViews(profileId)
  const byDate = {}
  views.forEach(v => {
    const date = new Date(v.viewed_at).toLocaleDateString()
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(v)
  })
  return byDate
}

export async function getProfileAnalytics(profileId) {
  const [allViews, last7, last30] = await Promise.all([
    getProfileViews(profileId),
    getRecentViews(profileId, 7),
    getRecentViews(profileId, 30)
  ])

  const today = new Date().toLocaleDateString()
  const todayViews = allViews.filter(v => new Date(v.viewed_at).toLocaleDateString() === today)
  const byDate = {}
  allViews.forEach(v => {
    const date = new Date(v.viewed_at).toLocaleDateString()
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(v)
  })

  return {
    totalViews: allViews.length,
    uniqueViewers: new Set(allViews.map(v => v.viewer_username)).size,
    todayViews: todayViews.length,
    last7DaysViews: last7.length,
    last30DaysViews: last30.length,
    viewsByDate: byDate
  }
}

export async function clearProfileViews(profileId) {
  await supabase.from('profile_views').delete().eq('profile_id', profileId)
}

export async function clearAllViews() {
  await supabase.from('profile_views').delete().neq('id', '')
}

