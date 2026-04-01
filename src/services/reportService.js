// Report Service — Supabase backend
import { supabase } from '../supabaseClient'

export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('getReports:', error); return [] }
  return data || []
}

export async function createReport(reportData) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  const { data, error } = await supabase
    .from('reports')
    .insert({
      ...reportData,
      reporter_id: user?.id || null,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  if (error) { console.error('createReport:', error); return null }
  return data
}

export async function updateReportStatus(id, status) {
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id)
  if (error) { console.error('updateReportStatus:', error); return false }
  return true
}

export async function deleteReport(id) {
  const { error } = await supabase.from('reports').delete().eq('id', id)
  if (error) { console.error('deleteReport:', error); return false }
  return true
}


