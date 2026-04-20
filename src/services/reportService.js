// Report Service — Supabase backend
import { supabase } from '../supabaseClient'

export async function getReports() {
  try {
    const res = await fetch('http://localhost:5000/api/admin/reports')
    const result = await res.json()
    return result.data || []
  } catch (err) {
    console.error('getReports:', err)
    return []
  }
}

export async function createReport(reportData) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const reporter_id = session?.user?.id || null

    const res = await fetch('http://localhost:5000/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...reportData,
        reporter_id
      })
    })
    const result = await res.json()
    return result.ok ? result.data : null
  } catch (err) {
    console.error('createReport:', err)
    return null
  }
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
  try {
    const res = await fetch(`http://localhost:5000/api/admin/reports/${id}`, {
      method: 'DELETE'
    })
    const result = await res.json()
    return result.ok
  } catch (err) {
    console.error('deleteReport:', err)
    return false
  }
}


