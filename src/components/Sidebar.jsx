import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCurrentUser } from '../services/auth'
import { getActiveProfile, updateProfile } from '../services/profileManager'
import { getCurrentUserProfessionalProfile } from '../services/professionalProfileManager'
import LoginModal from './LoginModal'
import '../pages/dashboard.css'

function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activeProfileRecord, setActiveProfileRecord] = useState(null)
  const [legacyProfile, setLegacyProfile] = useState(null)
  const [viewPath, setViewPath] = useState('/customize')
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [professionalProfileData, setProfessionalProfileData] = useState(null)
  const sidebarRef = useRef(null)

  const handleProtectedAction = (e, path) => {
    e.preventDefault()
    const user = getCurrentUser()
    if (!user) {
      setShowLoginModal(true)
    } else {
      navigate(path)
    }
  }

  const handleProtectedClick = (callback) => {
    const user = getCurrentUser()
    if (!user) {
      setShowLoginModal(true)
    } else {
      callback()
    }
  }

  const handleSwitchToSignup = () => {
    setShowLoginModal(false)
    navigate('/signup')
  }

  useEffect(() => {
    loadSidebarProfile()
    loadProfessionalProfile()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const updateSidebarMetrics = () => {
      if (!sidebarRef.current) return
      const rect = sidebarRef.current.getBoundingClientRect()
      const root = document.documentElement
      root.style.setProperty('--floating-sidebar-left', `${rect.left}px`)
      root.style.setProperty('--floating-sidebar-width', `${rect.width}px`)
    }

    updateSidebarMetrics()
    window.addEventListener('resize', updateSidebarMetrics)
    return () => window.removeEventListener('resize', updateSidebarMetrics)
  }, [])

  const loadSidebarProfile = async () => {
    try {
      const activeProfile = await getActiveProfile()
      if (activeProfile?.data) {
        setActiveProfileRecord(activeProfile)
        setLegacyProfile(null)
        if (activeProfile.data.username) {
          let nextViewPath = `/u/${activeProfile.data.username}`
          if (activeProfile.type) {
            nextViewPath = `/u/${activeProfile.data.username}/${activeProfile.type}`
          }
          setViewPath(nextViewPath)
        } else {
          setViewPath('/customize')
        }
        return
      }

      const raw = localStorage.getItem('user_profile')
      const fallback = raw ? JSON.parse(raw) : null
      setLegacyProfile(fallback)
      setActiveProfileRecord(null)
      if (fallback?.username) {
        setViewPath(`/u/${fallback.username}`)
      } else {
        setViewPath('/customize')
      }
    } catch (err) {
      console.warn('Failed to read profile', err)
      setActiveProfileRecord(null)
      setLegacyProfile(null)
      setViewPath('/customize')
    }
  }

  const loadProfessionalProfile = async () => {
    try {
      const professionalProfile = await getCurrentUserProfessionalProfile()
      if (professionalProfile?.data) {
        const profileUsername = professionalProfile.data.username || professionalProfile.username
        setProfessionalProfileData({
          ...professionalProfile.data,
          username: profileUsername
        })
        if (profileUsername) {
          setViewPath(`/pro/${profileUsername}`)
        }
      } else {
        setProfessionalProfileData(null)
      }
    } catch (err) {
      console.warn('Failed to load professional profile', err)
      setProfessionalProfileData(null)
    }
  }

  const profile = activeProfileRecord?.data || legacyProfile || null
  const displayProfile = professionalProfileData || profile
  const sidebarName = displayProfile?.username || displayProfile?.displayName || 'Guest'

  const handleVisibilityChange = async (makePublic) => {
    if (!profile || isUpdatingVisibility) return
    const nextValue = !!makePublic
    const currentValue = profile.isPublic !== false
    if (currentValue === nextValue) return

    if (!nextValue) {
      const confirmed = window.confirm(t('confirm_private_profile', { defaultValue: 'Hide this profile from public view?' }))
      if (!confirmed) return
    }

    setIsUpdatingVisibility(true)
    try {
      if (activeProfileRecord?.id) {
        const updated = await updateProfile(activeProfileRecord.id, { isPublic: nextValue })
        setActiveProfileRecord(updated)
      } else if (legacyProfile) {
        const updatedLegacy = { ...legacyProfile, isPublic: nextValue }
        localStorage.setItem('user_profile', JSON.stringify(updatedLegacy))
        setLegacyProfile(updatedLegacy)
      }
    } catch (err) {
      console.error('Failed to update visibility', err)
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  return (
    <aside ref={sidebarRef} className="dashboard-sidebar d-flex flex-column">
      <div className="sidebar-top p-3">
        <div className="logo fw-bold fs-4">VERE</div>
      </div>
      <div className="sidebar-content flex-grow-1 d-flex flex-column">
        <nav className="sidebar-nav flex-grow-1">
          <ul className="list-unstyled m-0 p-2">
          <li className="nav-item mb-3">
            <NavLink to="/my-profile" className={({isActive}) => `d-flex align-items-center text-decoration-none text-dark nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-person-circle fs-4 me-2"></i>
              <span className="nav-label">{t('professional_profile')}</span>
            </NavLink>
          </li>
          <li className="nav-item mb-3">
            <a 
              href="/dashboard" 
              onClick={(e) => handleProtectedAction(e, '/dashboard')}
              className="d-flex align-items-center text-decoration-none text-dark nav-link"
            >
              <i className="bi bi-speedometer2 fs-4 me-2"></i>
              <span className="nav-label">{t('dashboard')}</span>
            </a>
          </li>
          <li className="nav-item mb-3">
            <NavLink to="/explore" className={({isActive}) => `d-flex align-items-center text-decoration-none text-dark nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-search fs-4 me-2"></i>
              <span className="nav-label">{t('explore_people')}</span>
            </NavLink>
          </li>
          
          <li><hr className="my-3" /></li>
          
          <li className="nav-item mb-3">
            <NavLink to="/my-profiles" className={({isActive}) => `d-flex align-items-center text-decoration-none text-dark nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-collection fs-4 me-2"></i>
              <span className="nav-label">{t('my_links')}</span>
            </NavLink>
          </li>
          <li className="nav-item mb-3">
            <NavLink to="/customize" className={({isActive}) => `d-flex align-items-center text-decoration-none text-dark nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-pencil-square fs-4 me-2"></i>
              <span className="nav-label">{t('customize')}</span>
            </NavLink>
          </li>
          <li className="nav-item mb-3">
            <NavLink to="/themes" className={({isActive}) => `d-flex align-items-center text-decoration-none text-dark nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-palette fs-4 me-2"></i>
              <div className="d-flex align-items-center justify-content-between flex-grow-1">
                <span className="nav-label">{t('themes')}</span>
                <span 
                  className="badge bg-warning text-dark"
                  style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}
                >
                  Creative
                </span>
              </div>
            </NavLink>
          </li>
          <li className="nav-item mb-3">
            <NavLink to="/saved-profiles" className={({isActive}) => `d-flex align-items-center text-decoration-none text-dark nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-heart fs-4 me-2"></i>
              <span className="nav-label">{t('saved_profiles')}</span>
            </NavLink>
          </li>
          <li className="nav-item mb-3">
            <NavLink to="/links" className={({isActive}) => `d-flex align-items-center text-decoration-none text-dark nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-link-45deg fs-4 me-2"></i>
              <span className="nav-label">{t('links')}</span>
            </NavLink>
          </li>
          </ul>
        </nav>

        <div className="sidebar-footer floating-profile-card p-3">
        <div className="mb-3">
          <button 
            onClick={() => handleProtectedClick(() => window.open(viewPath, '_blank'))}
            className="btn w-100 d-flex align-items-center justify-content-center"
            style={{
              background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              fontWeight: '700',
              padding: '12px 16px',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden',
              textShadow: '0 2px 8px rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.2), 0 6px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <i className="bi bi-eye me-2"></i>
            <span>{t('view_profile')}</span>
          </button>
        </div>

        <div 
          className="d-flex align-items-center"
          style={{
            background: 'var(--sidebar-bg, #f7f6f8)',
            borderRadius: '14px',
            padding: '12px 14px',
            border: '1px solid #eceff1'
          }}
        >
          {displayProfile && displayProfile.avatar ? (
            <img 
              src={displayProfile.avatar} 
              alt="profile" 
              style={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                objectFit: 'cover',
                marginRight: 12,
                border: '1px solid rgba(0,0,0,0.05)'
              }}
            />
          ) : (
            <i className="bi bi-person-circle fs-2 me-3"></i>
          )}
          <div className="flex-grow-1" style={{ lineHeight: 1.15 }}>
            <div className="profile-name" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{sidebarName}</div>
          </div>
        </div>
      </div>
      </div>

      <LoginModal 
        show={showLoginModal} 
        onHide={() => setShowLoginModal(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </aside>
  )
}

export default Sidebar
