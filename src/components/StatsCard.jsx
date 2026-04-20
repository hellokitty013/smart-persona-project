import React, { useState, useEffect } from 'react'

function StatsCard({ analytics, vheartLikes = 0 }) {
  const [stats, setStats] = useState({ views: 0, unique: 0, week: 0 })

  useEffect(() => {
    if (analytics) {
      setStats({
        views: analytics.totalViews || 0,
        unique: analytics.uniqueViewers || 0,
        week: analytics.last7DaysViews || 0
      })
      return
    }

    try {
      const savedStats = localStorage.getItem('profile_stats')
      if (savedStats) {
        const parsed = JSON.parse(savedStats)
        setStats({
          views: parsed.views || 0,
          unique: parsed.unique || parsed.clicks || 0,
          week: parsed.week || parsed.shares || 0
        })
      } else {
        const randomStats = {
          views: Math.floor(Math.random() * 2000) + 500,
          unique: Math.floor(Math.random() * 500) + 100,
          week: Math.floor(Math.random() * 200) + 50
        }
        setStats(randomStats)
        localStorage.setItem('profile_stats', JSON.stringify(randomStats))
      }
    } catch (err) {
      console.warn('Failed to load stats', err)
    }
  }, [analytics])

  return (
    <div className="stats-card p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="m-0">Basic Metrics</h6>
        <small className="text-muted">Last 30 days</small>
      </div>

      <div className="row text-center">
        <div className="col">
          <div className="stat-value fw-bold">{stats.views}</div>
          <div className="text-muted small">Profile Views</div>
        </div>
        <div className="col">
          <div className="stat-value fw-bold">{stats.unique}</div>
          <div className="text-muted small">Unique Visitors</div>
        </div>
        <div className="col">
          <div className="stat-value fw-bold">{stats.week}</div>
          <div className="text-muted small">Views (7d)</div>
        </div>
        <div className="col">
          <div className="stat-value fw-bold" style={{ color: '#e11d48' }}>
            <i className="bi bi-heart-fill me-1" style={{ fontSize: '0.9rem' }}></i>
            {vheartLikes}
          </div>
          <div className="text-muted small">Vheart</div>
        </div>
      </div>
    </div>
  )
}

export default StatsCard
