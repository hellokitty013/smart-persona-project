import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import LoginModal from '../components/LoginModal'
import { getCurrentUser } from '../services/auth'
import { getActiveProfile } from '../services/profileManager'
import {
  applyThemeToActiveProfile,
  createThemeFromProfile,
  deleteCommunityTheme,
  getThemesForType,
  publishTheme,
  saveThemeLocally
} from '../services/themeService'
import './dashboard.css'
import './themes.css'

const THEME_SOURCE_LABELS = {
  builtin: 'Official',
  community: 'Community',
  saved: 'My Theme'
}

const THEME_TAB_COPY = {
  personal: {
    titleKey: 'personal_profile_themes',
    title: 'Personal Profile Themes',
    subtitleKey: 'discover_personal_themes',
    subtitle: 'Discover themes for your personal profile page'
  },
  // creative: {
  //   titleKey: 'creative_profile_themes',
  //   title: 'Creative Studio Themes',
  //   subtitleKey: 'discover_creative_themes',
  //   subtitle: 'Bold looks for designers, artists, and studios'
  // },
  vtree: {
    titleKey: 'vtree_link_themes',
    title: 'Vtree Link Themes',
    subtitleKey: 'discover_vtree_themes',
    subtitle: 'Beautiful themes for your Vtree link collection'
  },
  resume: {
    titleKey: 'resume_builder_themes',
    title: 'Resume Builder Themes',
    subtitleKey: 'discover_resume_themes',
    subtitle: 'Professional themes for your resume'
  }
}

// Removed unused formatUseCount

const getTokens = (theme) => theme?.tokens || theme?.config || {}

const getPreviewDescriptor = (theme) => {
  if (theme?.preview) {
    return theme.preview
  }
  if (theme?.gifUrl) {
    return { type: 'gif', value: theme.gifUrl }
  }
  if (theme?.gradient) {
    return { type: 'gradient', value: theme.gradient }
  }
  const tokens = getTokens(theme)
  if (tokens.bgImage) {
    return { type: 'image', value: tokens.bgImage }
  }
  return { type: 'solid', value: tokens.bgColor || '#1a1a1a' }
}

const buildPreviewStyle = (preview) => {
  if (!preview) {
    return { background: '#1a1a1a' }
  }
  if (preview.type === 'gradient') {
    return { background: preview.value, backgroundSize: '200% 200%' }
  }
  if (preview.type === 'gif' || preview.type === 'image') {
    return {
      backgroundImage: `url(${preview.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return { background: preview.value || '#1a1a1a' }
}

const normalizeThemeShape = (theme) => {
  if (theme?.tokens) {
    return theme
  }
  return {
    ...theme,
    tokens: theme?.config || {}
  }
}

const Themes = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedTab, setSelectedTab] = useState('personal')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', theme: '' })
  const [themeLibrary, setThemeLibrary] = useState([])
  const [libraryVersion, setLibraryVersion] = useState(0)
  const [themeNameInput, setThemeNameInput] = useState('')
  const [isSnapshotting, setIsSnapshotting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const activeTabCopy = THEME_TAB_COPY[selectedTab] || THEME_TAB_COPY.personal

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabFromQuery = params.get('tab')
    if (!tabFromQuery || !THEME_TAB_COPY[tabFromQuery]) {
      return
    }
    setSelectedTab(prev => (prev === tabFromQuery ? prev : tabFromQuery))
  }, [location.search])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const current = params.get('tab') || 'personal'
    if (current === selectedTab) {
      return
    }
    params.set('tab', selectedTab)
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true })
  }, [selectedTab, location.pathname, location.search, navigate])

  const hideToast = () => setToast({ show: false, message: '', theme: '' })

  const showToastMessage = (message, theme = 'success') => {
    setToast({ show: true, message, theme })
    setTimeout(() => hideToast(), 3000)
  }

  const ensureAuthenticated = () => {
    const user = getCurrentUser()
    if (!user) {
      setShowLoginModal(true)
      return false
    }
    return true
  }

  const refreshThemes = () => setLibraryVersion(prev => prev + 1)

  useEffect(() => {
    const load = async () => {
      try {
        const themes = await getThemesForType(selectedTab)
        setThemeLibrary(themes)
      } catch (err) {
        console.error('Failed to load themes', err)
        setThemeLibrary([])
      }
    }
    load()
  }, [selectedTab, libraryVersion])

  useEffect(() => {
    setSelectedFilter('all')
  }, [selectedTab])

  const handleApplyTheme = async (theme) => {
    if (!ensureAuthenticated()) return
    try {
      await applyThemeToActiveProfile(normalizeThemeShape(theme))
      showToastMessage(`${theme.name} applied!`, 'success')
      setTimeout(() => navigate('/customize'), 1200)
    } catch (err) {
      console.error('Failed to apply theme', err)
      showToastMessage('Failed to apply theme', 'error')
    }
  }

  const handleSaveTheme = (theme) => {
    if (!ensureAuthenticated()) return
    try {
      const normalized = normalizeThemeShape(theme)
      saveThemeLocally({
        profileType: normalized.profileType,
        name: `${normalized.name} Copy`,
        tags: normalized.tags,
        preview: normalized.preview,
        tokens: normalized.tokens
      })
      showToastMessage('Theme saved to My Themes')
      refreshThemes()
    } catch (err) {
      console.error('Failed to save theme', err)
      showToastMessage('Unable to save theme', 'error')
    }
  }

  const handleSnapshot = async (mode) => {
    if (!ensureAuthenticated() || isSnapshotting) return
    const activeProfile = await getActiveProfile()
    if (!activeProfile) {
      showToastMessage('No active profile found', 'error')
      return
    }

    setIsSnapshotting(true)
    try {
      const name = themeNameInput.trim() || `${activeProfile.name || 'My'} Theme`
      const baseTheme = createThemeFromProfile(
        {
          profileType: activeProfile.type || 'personal',
          name,
          profileData: activeProfile.data,
          preview: activeProfile.data?.bgImage
            ? { type: 'image', value: activeProfile.data.bgImage }
            : { type: 'solid', value: activeProfile.data?.bgColor || '#111111' }
        },
        {
          source: mode === 'publish' ? 'community' : 'saved',
          author: currentUser?.username || 'You'
        }
      )

      if (mode === 'publish') {
        publishTheme(baseTheme)
        showToastMessage('Theme published to community')
      } else {
        saveThemeLocally(baseTheme)
        showToastMessage('Theme saved to My Themes')
      }

      if ((activeProfile.type || 'personal') !== selectedTab) {
        setSelectedTab(activeProfile.type || 'personal')
      } else {
        refreshThemes()
      }
      setThemeNameInput('')
    } catch (err) {
      console.error('Failed to capture theme', err)
      showToastMessage('Unable to capture current theme', 'error')
    } finally {
      setIsSnapshotting(false)
    }
  }

  const handleSwitchToSignup = () => {
    setShowLoginModal(false)
    navigate('/signup')
  }

  const filteredThemes = useMemo(() => {
    const categoryThemes = themeLibrary
    if (selectedFilter === 'all') {
      return categoryThemes
    }

    return categoryThemes.filter(theme => {
      const preview = getPreviewDescriptor(theme)
      const tokens = getTokens(theme)
      if (selectedFilter === 'gif') {
        return preview.type === 'gif'
      }
      if (selectedFilter === 'gradient') {
        return preview.type === 'gradient'
      }
      if (selectedFilter === 'fonts') {
        return Boolean(tokens.fontFamily && !tokens.fontFamily.includes('Inter'))
      }
      if (selectedFilter === 'trending') {
        return Boolean(theme.stats?.trending || theme.trending)
      }
      return (theme.tags || []).includes(selectedFilter)
    })
  }, [themeLibrary, selectedFilter])

  const handleDeleteCommunity = (theme) => {
    if (!window.confirm(t('confirm_remove_theme') || 'Remove this theme from the gallery?')) {
      return
    }
    try {
      deleteCommunityTheme(theme.id)
      showToastMessage(t('theme_removed') || 'Theme removed')
      refreshThemes()
    } catch (err) {
      console.error('Failed to remove community theme', err)
      showToastMessage(t('failed_to_remove_theme') || 'Unable to remove theme', 'error')
    }
  }

  return (
    <div className="dashboard-shell p-4">
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '16px 24px',
            borderRadius: '12px',
            background: toast.theme === 'success'
              ? 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)'
              : 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <i
            className={`bi ${toast.theme === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}
            style={{ fontSize: '24px' }}
          ></i>
          {toast.message}
        </div>
      )}

      <div className="dashboard-card d-flex">
        <Sidebar />

        <main className="dashboard-main p-4">
          <div className="themes-container">
            <div className="themes-header">
              <div>
                <h2 className="themes-title">
                  {t(activeTabCopy.titleKey) || activeTabCopy.title}
                </h2>
                <p className="themes-subtitle">
                  {t(activeTabCopy.subtitleKey) || activeTabCopy.subtitle}
                </p>
              </div>

              <div className="theme-workbench">
                <input
                  type="text"
                  placeholder={t('name_your_theme') || 'Name your theme'}
                  value={themeNameInput}
                  onChange={(e) => setThemeNameInput(e.target.value)}
                />
                <button
                  type="button"
                  className="workbench-btn"
                  disabled={isSnapshotting}
                  onClick={() => handleSnapshot('save')}
                >
                  <i className="bi bi-bookmark-plus me-2"></i>
                  {t('save_current_theme') || 'Save current look'}
                </button>
                <button
                  type="button"
                  className="workbench-btn secondary"
                  disabled={isSnapshotting}
                  onClick={() => handleSnapshot('publish')}
                >
                  <i className="bi bi-megaphone me-2"></i>
                  {t('publish_theme') || 'Publish to community'}
                </button>
              </div>
              <p className="workbench-hint">
                {t('theme_workbench_hint') || 'Capture your active profile styling and reuse it across tabs or share it with the community.'}
              </p>
            </div>

            <div className="themes-tabs mb-4">
              <button
                className={`tab-btn ${selectedTab === 'personal' ? 'active' : ''}`}
                onClick={() => setSelectedTab('personal')}
              >
                <i className="bi bi-person-fill me-2"></i>
                {t('personal')}
              </button>
              {/* Removed creative tab */}
              <button
                className={`tab-btn ${selectedTab === 'vtree' ? 'active' : ''}`}
                onClick={() => setSelectedTab('vtree')}
              >
                <i className="bi bi-tree-fill me-2"></i>
                {t('vtree')}
              </button>
              <button
                className={`tab-btn ${selectedTab === 'resume' ? 'active' : ''}`}
                onClick={() => setSelectedTab('resume')}
              >
                <i className="bi bi-file-earmark-text-fill me-2"></i>
                {t('resume')}
              </button>
            </div>

            <div className="themes-filters">
              <button
                className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('all')}
              >
                {t('all_themes') || 'All Themes'}
              </button>
              <button
                className={`filter-btn ${selectedFilter === 'gif' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('gif')}
              >
                <i className="bi bi-film me-1"></i>
                {t('gif_backgrounds') || 'GIF Backgrounds'}
              </button>
              <button
                className={`filter-btn ${selectedFilter === 'gradient' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('gradient')}
              >
                <i className="bi bi-palette me-1"></i>
                {t('animated_gradients') || 'Animated Gradients'}
              </button>
              <button
                className={`filter-btn ${selectedFilter === 'fonts' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('fonts')}
              >
                <i className="bi bi-fonts me-1"></i>
                {t('custom_fonts') || 'Custom Fonts'}
              </button>
              <button
                className={`filter-btn ${selectedFilter === 'trending' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('trending')}
              >
                <i className="bi bi-star-fill me-1"></i>
                {t('trending') || 'Trending'}
              </button>
            </div>

            <div className="themes-grid">
              {filteredThemes.length === 0 ? (
                <div className="no-themes">
                  <p>{t('no_themes_available') || 'No themes available yet. Check back soon!'}</p>
                </div>
              ) : (
                filteredThemes.map(theme => {
                  const tokens = getTokens(theme)
                  const preview = getPreviewDescriptor(theme)
                  // const uses = theme.stats?.uses ?? theme.uses // unused
                  const isTrending = theme.stats?.trending || theme.trending
                  const sourceLabel = THEME_SOURCE_LABELS[theme.source || 'builtin'] || 'Theme'

                  return (
                    <div key={theme.id} className="theme-card">
                      <div
                        className={`theme-preview ${preview.type === 'gradient' ? 'animated' : ''} ${preview.type === 'gif' ? 'gif-bg' : ''}`}
                        style={buildPreviewStyle(preview)}
                      >
                        <div
                          className="theme-mockup"
                          style={{ fontFamily: tokens.fontFamily || 'inherit' }}
                        >
                          <div
                            className="mockup-avatar"
                            style={{ background: tokens.nameColor || '#6c5ce7', opacity: 0.9 }}
                          >
                            <i className="bi bi-person-fill"></i>
                          </div>
                          <div
                            className="mockup-name"
                            style={{
                              color: tokens.nameColor || '#fff',
                              textShadow: preview.type === 'gif' ? '0 2px 8px rgba(0,0,0,0.8)' : 'none'
                            }}
                          >
                            Your Name
                          </div>
                          <div
                            className="mockup-desc"
                            style={{
                              color: tokens.descColor || '#f5f5f5',
                              textShadow: preview.type === 'gif' ? '0 2px 8px rgba(0,0,0,0.8)' : 'none'
                            }}
                          >
                            Your description here
                          </div>
                        </div>

                        {isTrending && (
                          <div className="theme-badge">
                            <i className="bi bi-star-fill"></i> Trending
                          </div>
                        )}
                      </div>
                      <div className="theme-info">
                        <div className="theme-header">
                          <div className="theme-author">
                            <i className="bi bi-person-circle"></i>
                            <span>@{theme.author || 'creator'}</span>
                          </div>
                        </div>
                        <div className="theme-meta">
                          <span className={`theme-source-pill source-${theme.source || 'builtin'}`}>
                            {sourceLabel}
                          </span>
                        </div>
                        <h3 className="theme-name">{theme.name}</h3>
                        <div className="theme-tags">
                          {(theme.tags || []).map(tag => (
                            <span key={tag} className="theme-tag">{tag}</span>
                          ))}
                        </div>
                        <div className="theme-actions">
                          <button className="btn-use-theme" onClick={() => handleApplyTheme(theme)}>
                            {t('apply') || 'Apply'}
                          </button>
                          <button
                            type="button"
                            className="btn-save-theme"
                            onClick={() => handleSaveTheme(theme)}
                          >
                            <i className="bi bi-bookmark-plus me-2"></i>
                            {t('save') || 'Save'}
                          </button>
                          {theme.source === 'community' && currentUser && (theme.author === currentUser.username || theme.author === 'You') && (
                            <button
                              type="button"
                              className="btn-delete-theme"
                              onClick={() => handleDeleteCommunity(theme)}
                            >
                              <i className="bi bi-trash me-2"></i>
                              {t('remove') || 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
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

export default Themes
