import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import LoginModal from '../components/LoginModal'
import { getCurrentUser } from '../services/auth'
import {
  applyThemeToActiveProfile,
  deleteSavedTheme,
  getSavedThemes
} from '../services/themeService'
import './dashboard.css'
import './themes.css'

const getTokens = (theme) => theme?.tokens || {}

const getPreviewDescriptor = (theme) => {
  if (theme?.preview) {
    return theme.preview
  }
  const tokens = getTokens(theme)
  if (tokens.bgImage) {
    return { type: 'image', value: tokens.bgImage }
  }
  return { type: 'solid', value: tokens.bgColor || '#111827' }
}

const buildPreviewStyle = (preview) => {
  if (!preview) {
    return { background: '#111827' }
  }
  if (preview.type === 'image') {
    return {
      backgroundImage: `url(${preview.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return { background: preview.value || '#111827' }
}

function SavedProfiles() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [savedThemes, setSavedThemes] = useState([])
  const [toast, setToast] = useState({ show: false, message: '', theme: '' })

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      setShowLoginModal(true)
      return
    }
    loadSavedThemes()
  }, [])

  const loadSavedThemes = async () => {
    try {
      const themes = await getSavedThemes()
      setSavedThemes(themes)
    } catch (err) {
      console.error('Failed to load saved themes', err)
      setSavedThemes([])
    }
  }

  const showToast = (message, theme = 'success') => {
    setToast({ show: true, message, theme })
    setTimeout(() => setToast({ show: false, message: '', theme: '' }), 2500)
  }

  const handleApply = async (theme) => {
    try {
      await applyThemeToActiveProfile(theme)
      showToast(t('theme_applied') || 'Theme applied!')
      setTimeout(() => navigate('/customize'), 1000)
    } catch (err) {
      console.error('Failed to apply theme', err)
      showToast(t('failed_to_apply') || 'Unable to apply theme', 'error')
    }
  }

  const handleDelete = async (themeId) => {
    await deleteSavedTheme(themeId)
    const updated = await getSavedThemes()
    setSavedThemes(updated)
    showToast(t('theme_removed') || 'Theme removed', 'success')
  }

  const handleSwitchToSignup = () => {
    setShowLoginModal(false)
    navigate('/signup')
  }

  const themeCountLabel = useMemo(() => {
    if (savedThemes.length === 0) {
      return t('no_saved_themes') || 'No saved themes yet'
    }
    return `${savedThemes.length} ${(t('saved_themes') || 'Saved Themes')}`
  }, [savedThemes, t])

  const groupedThemes = useMemo(() => {
    return savedThemes.reduce((acc, theme) => {
      const type = theme.profileType || 'personal'
      if (!acc[type]) acc[type] = []
      acc[type].push(theme)
      return acc
    }, {})
  }, [savedThemes])

  const themeTypeSections = useMemo(() => ([
    { type: 'personal', label: t('saved_themes_personal') || 'Personal Themes' },
    { type: 'vtree', label: t('saved_themes_vtree') || 'Vtree Themes' },
    { type: 'resume', label: t('saved_themes_resume') || 'Resume Themes' }
  ]), [t])

  return (
    <div className="dashboard-shell p-4">
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '14px 22px',
            borderRadius: '10px',
            background: toast.theme === 'success'
              ? 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
              : 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
            color: '#fff',
            fontWeight: 600,
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <i className={`bi ${toast.theme === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
          {toast.message}
        </div>
      )}

      <div className="dashboard-card d-flex">
        <Sidebar />

        <main className="dashboard-main p-4">
          <div className="themes-container">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h2 className="themes-title">
                  <i className="bi bi-heart-fill me-2 text-danger"></i>
                  {t('saved_themes_title') || 'Saved Themes'}
                </h2>
                <p className="themes-subtitle">{themeCountLabel}</p>
              </div>
              <button
                type="button"
                className="workbench-btn secondary"
                onClick={() => navigate('/themes')}
              >
                <i className="bi bi-grid"></i>
                {t('browse_more_themes') || 'Browse more themes'}
              </button>
            </div>

            {savedThemes.length === 0 ? (
              <div className="no-themes" style={{ minHeight: '320px' }}>
                <i className="bi bi-heart display-4 text-muted mb-3"></i>
                <p className="mb-3">{t('save_theme_hint') || 'Save a theme from the Themes page to see it here.'}</p>
                <button className="btn-use-theme" style={{ maxWidth: '220px' }} onClick={() => navigate('/themes')}>
                  {t('go_to_themes') || 'Go to Themes'}
                </button>
              </div>
            ) : (
              themeTypeSections.map(section => {
                const items = groupedThemes[section.type]
                if (!items || items.length === 0) {
                  return null
                }
                return (
                  <div key={section.type} className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="mb-0 themes-title" style={{ fontSize: '20px' }}>
                        {section.label} <span className="text-muted" style={{ fontSize: '14px' }}>({items.length})</span>
                      </h4>
                    </div>
                    <div className="themes-grid">
                      {items.map(theme => {
                        const tokens = getTokens(theme)
                        const preview = getPreviewDescriptor(theme)
                        return (
                          <div key={theme.id} className="theme-card">
                            <div className="theme-preview" style={buildPreviewStyle(preview)}>
                              <div className="theme-mockup" style={{ fontFamily: tokens.fontFamily || 'inherit' }}>
                                <div className="mockup-avatar" style={{ background: tokens.nameColor || '#6c5ce7' }}>
                                  <i className="bi bi-person"></i>
                                </div>
                                <div className="mockup-name" style={{ color: tokens.nameColor || '#fff' }}>
                                  Your Name
                                </div>
                                <div className="mockup-desc" style={{ color: tokens.descColor || '#ddd' }}>
                                  Your description here
                                </div>
                              </div>
                            </div>
                            <div className="theme-info">
                              <div className="theme-header">
                                <div className="theme-author">
                                  <i className="bi bi-person-circle"></i>
                                  <span>@{theme.author || 'you'}</span>
                                </div>
                                <div className="theme-stats">
                                  <span>{theme.profileType || 'personal'}</span>
                                </div>
                              </div>
                              <h3 className="theme-name">{theme.name}</h3>
                              <div className="theme-actions">
                                <button className="btn-use-theme" onClick={() => handleApply(theme)}>
                                  {t('apply') || 'Apply'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-delete-theme"
                                  onClick={() => handleDelete(theme.id)}
                                >
                                  <i className="bi bi-trash me-2"></i>
                                  {t('remove') || 'Remove'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </main>
      </div>

      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </div>
  )
}

export default SavedProfiles
