import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ProfileCard from '../components/ProfileCard'
import StatsCard from '../components/StatsCard'
import LoginModal from '../components/LoginModal'
import { getCurrentUser } from '../services/auth'
import { getProfileAnalytics } from '../services/profileAnalytics'
import { getCurrentUserProfessionalProfile, createProfessionalProfile, updateProfessionalProfile } from '../services/professionalProfileManager'
import './dashboard.css'

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [recentActivity, setRecentActivity] = useState([])
  const [profile, setProfile] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [profileStats, setProfileStats] = useState({
    completeness: 0,
    totalSocialLinks: 0,
    themeName: 'Custom',
    hasAvatar: false,
    hasDescription: false,
    hasUsername: false
  })

  const calculateProfileStats = (data = {}) => {
    let completeness = 0
    if (data.username) completeness += 20
    if (data.displayName || data.firstName) completeness += 15
    if (data.description) completeness += 20
    if (data.avatar) completeness += 15
    if (data.bgColor || data.bgImage) completeness += 10
    if (data.socialLinks) {
      const linkedSocials = Object.values(data.socialLinks).filter(link => link && link.trim() !== '')
      completeness += Math.min(linkedSocials.length * 4, 20)
    }

    const socialLinks = data.socialLinks || {}
    const totalSocialLinks = Object.values(socialLinks).filter(link => link && link.trim() !== '').length

    let themeName = 'Custom'
    if (data.bgImage) themeName = 'Custom Background'
    if (data.layout) {
      const layoutNames = {
        'default': 'Default Card',
        'linktree': 'Linktree Style',
        'linkedin': 'LinkedIn Pro',
        'guns': 'Neon Style',
        'minimal': 'Minimal Clean'
      }
      themeName = layoutNames[data.layout] || 'Custom'
    }

    return {
      completeness: Math.min(completeness, 100),
      totalSocialLinks,
      themeName,
      hasAvatar: !!data.avatar,
      hasDescription: !!data.description,
      hasUsername: !!data.username
    }
  }

  const hydrateRecentActivity = async (profileRecord) => {
    const storedActivity = profileRecord?.data?.recentActivity
    if (storedActivity && storedActivity.length > 0) {
      setRecentActivity(storedActivity)
      localStorage.setItem('recent_activity', JSON.stringify(storedActivity))
      return
    }

    try {
      const legacyActivity = localStorage.getItem('recent_activity')
      if (legacyActivity) {
        const parsed = JSON.parse(legacyActivity)
        setRecentActivity(parsed)
        if (profileRecord?.id) {
          await updateProfessionalProfile(profileRecord.id, { recentActivity: parsed })
        }
        return
      }
    } catch (err) {
      console.warn('Failed to parse legacy activity log', err)
    }

    const fallbackActivity = [
      { id: 'welcome', action: 'Welcome to VERE!', time: 'Today', icon: 'bi-star' },
      { id: 'profile-created', action: 'Profile created', time: 'Just now', icon: 'bi-person-plus' }
    ]

    setRecentActivity(fallbackActivity)
    localStorage.setItem('recent_activity', JSON.stringify(fallbackActivity))

    if (profileRecord?.id) {
      await updateProfessionalProfile(profileRecord.id, { recentActivity: fallbackActivity })
    }
  }

  // Check if user is admin
  const user = getCurrentUser()
  const userIsAdmin = user?.role === 'admin'

  useEffect(() => {
    const load = async () => {
      const user = getCurrentUser()
      if (!user) {
        setShowLoginModal(true)
        return
      }

      try {
        let professionalProfile = await getCurrentUserProfessionalProfile()
        if (!professionalProfile) {
          professionalProfile = await createProfessionalProfile(user.username)
        }

        if (professionalProfile) {
          const data = professionalProfile.data || {}
          setProfile(data)
          setProfileStats(calculateProfileStats(data))

          const analyticsData = await getProfileAnalytics(professionalProfile.id)
          setAnalytics(analyticsData)

          await hydrateRecentActivity(professionalProfile)
        }
      } catch (err) {
        console.warn('Failed to load professional profile', err)
      }
    }
    load()
  }, [])

  return (
    <div className="dashboard-shell p-4">
      <div className="dashboard-card d-flex">
        <Sidebar />

        <main className="dashboard-main p-4">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <ProfileCard 
              profileData={profile}
              username={profile?.username || user?.username}
            />
            {userIsAdmin && (
              <button className="btn btn-primary" onClick={() => navigate('/admin')}>
                <i className="bi bi-speedometer2 me-2"></i>Go to Admin Dashboard
              </button>
            )}
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <StatsCard analytics={analytics} />
              
              {/* Profile Overview */}
              <div className="mt-3 p-3 card-like">
                <h6 className="mb-3">{t('profile_overview') || 'Profile Overview'}</h6>
                <p className="text-muted small">
                  {t('profile_live_share') || 'Your profile is live and can be viewed by others. Share your unique link to increase visibility and engagement.'}
                </p>
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="small">{t('profile_completeness') || 'Profile Completeness'}</span>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ 
                        width: '100px', 
                        height: '8px', 
                        background: '#e5e7eb', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${profileStats.completeness}%`, 
                          height: '100%', 
                          background: profileStats.completeness >= 80 ? '#22c55e' : profileStats.completeness >= 50 ? '#f59e0b' : '#ef4444',
                          borderRadius: '4px',
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                      <span className="fw-bold">{profileStats.completeness}%</span>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="small">{t('social_links') || 'Social Links'}</span>
                    <span className="fw-bold">{profileStats.totalSocialLinks}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="small">{t('theme_applied') || 'Theme Applied'}</span>
                    <span className="fw-bold">{profileStats.themeName}</span>
                  </div>
                </div>
              </div>

              {/* Profile Analytics */}
              {analytics && (
                <div className="mt-3 p-3 card-like">
                  <h6 className="mb-3">
                    <i className="bi bi-graph-up me-2"></i>
                    {t('profile_analytics')}
                  </h6>
                  <div className="small">
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="small">{t('total_views')}</span>
                      <span className="fw-bold text-primary">{analytics.totalViews}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="small">{t('unique_visitors')}</span>
                      <span className="fw-bold text-success">{analytics.uniqueViewers}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="small">{t('views_today')}</span>
                      <span className="fw-bold">{analytics.todayViews}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="small">{t('last_7_days')}</span>
                      <span className="fw-bold">{analytics.last7DaysViews}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-2">
                      <span className="small">{t('last_30_days')}</span>
                      <span className="fw-bold">{analytics.last30DaysViews}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Checklist */}
              {profileStats.completeness < 100 && (
                <div className="mt-3 p-3 card-like">
                  <h6 className="mb-3">
                    <i className="bi bi-list-check me-2"></i>
                    {t('complete_profile') || 'Complete Your Profile'}
                  </h6>
                  <div className="small">
                    {!profileStats.hasUsername && (
                      <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                        <i className="bi bi-circle"></i>
                        <span>{t('add_username') || 'Add a username'}</span>
                      </div>
                    )}
                    {!profileStats.hasAvatar && (
                      <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                        <i className="bi bi-circle"></i>
                        <span>{t('upload_profile_picture') || 'Upload a profile picture'}</span>
                      </div>
                    )}
                    {!profileStats.hasDescription && (
                      <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                        <i className="bi bi-circle"></i>
                        <span>{t('write_bio_description') || 'Write a bio description'}</span>
                      </div>
                    )}
                    {profileStats.totalSocialLinks === 0 && (
                      <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                        <i className="bi bi-circle"></i>
                        <span>{t('add_social_links') || 'Add social media links'}</span>
                      </div>
                    )}
                    {profileStats.hasUsername && profileStats.hasAvatar && profileStats.hasDescription && profileStats.totalSocialLinks > 0 && (
                      <div className="d-flex align-items-center gap-2 mb-2 text-success">
                        <i className="bi bi-check-circle-fill"></i>
                        <span>{t('looking_great') || 'Looking great! Keep it up!'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="col-12 col-lg-4">
              <div className="p-3 card-like">
                <h6 className="mb-3">{t('recent_activity')}</h6>
                {recentActivity.length > 0 ? (
                  <div>
                    {recentActivity.map(item => (
                      <div key={item.id} className="mb-3 pb-2 border-bottom last:border-0">
                        <div className="d-flex align-items-start gap-2">
                          {item.icon && <i className={`${item.icon} text-primary`}></i>}
                          <div className="flex-grow-1">
                            <div className="small fw-bold">{item.action}</div>
                            <div className="text-muted" style={{ fontSize: '12px' }}>{item.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted small">{t('no_recent_activity') || 'No recent activity yet.'}</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onSwitchToSignup={() => {
            setShowLoginModal(false)
            navigate('/signup')
          }}
        />
      )}
    </div>
  )
}

export default Dashboard
