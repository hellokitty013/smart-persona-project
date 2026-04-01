import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import LoginModal from '../components/LoginModal'
import { getCurrentUser } from '../services/auth'
import { getAllProfiles, createProfile, deleteProfile, setActiveProfile, getActiveProfileId, migrateOldProfile } from '../services/profileManager'
import { getProfileTypes } from '../config/profileTemplates'
import './dashboard.css'

const profileTypes = getProfileTypes()

function MyProfiles() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState([])
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProfileType, setNewProfileType] = useState('personal')
  const [newProfileName, setNewProfileName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const selectedProfileType = profileTypes.find(t => t.value === newProfileType)

  useEffect(() => {
    // Migrate old data if needed
    migrateOldProfile()
    
    // Load profiles
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    const allProfiles = await getAllProfiles()
    setProfiles(allProfiles)
    setActiveProfileId(getActiveProfileId())
  }

  const handleCreateProfile = () => {
    const user = getCurrentUser()
    if (!user) {
      setShowLoginModal(true)
      return
    }

    setShowCreateModal(true)
  }

  const handleSaveNewProfile = async () => {
    setIsCreating(true)
    setCreateError('')
    try {
      const name = newProfileName.trim() || `${newProfileType.charAt(0).toUpperCase() + newProfileType.slice(1)} Profile`
      await createProfile({ type: newProfileType, name })
      setShowCreateModal(false)
      setNewProfileName('')
      await loadProfiles()
    } catch (err) {
      console.error('createProfile error:', err)
      setCreateError(err?.message || 'Failed to create profile. Make sure the database tables are set up.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSwitchProfile = (profileId) => {
    setActiveProfile(profileId)
    setActiveProfileId(profileId)
    navigate('/customize')
  }

  const handleEditProfile = (profileId) => {
    setActiveProfile(profileId)
    navigate('/customize')
  }

  const handleDeleteProfile = (profileId) => {
    if (profiles.length === 1) {
      alert('Cannot delete your last profile')
      return
    }
    
    // Show custom confirm dialog
    const confirmDelete = () => {
      return new Promise((resolve) => {
        const overlay = document.createElement('div')
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        `
        
        const modal = document.createElement('div')
        modal.style.cssText = `
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          min-width: 400px;
          max-width: 500px;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          position: relative;
        `
        
        modal.innerHTML = `
          <style>
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          </style>
          <div style="width: 100px; height: 100px; margin: 0 auto 24px; position: relative; display: flex; align-items: center; justify-content: center;">
            <svg width="100" height="100" viewBox="0 0 120 120" style="position: absolute; top: 0; left: 0; animation: spin 3s linear infinite;">
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#warnGradient)" stroke-width="3" stroke-linecap="round" stroke-dasharray="140 180" filter="drop-shadow(0 0 8px rgba(255,107,107,0.8))"/>
              <defs>
                <linearGradient id="warnGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color: #ff6b6b; stop-opacity: 0.2" />
                  <stop offset="50%" style="stop-color: #ff6b6b; stop-opacity: 1" />
                  <stop offset="100%" style="stop-color: #ff6b6b; stop-opacity: 0.2" />
                </linearGradient>
              </defs>
            </svg>
            <svg width="100" height="100" viewBox="0 0 120 120" style="position: relative; z-index: 1; filter: drop-shadow(0 0 20px rgba(255,255,255,0.5));">
              <text x="60" y="75" font-size="70" font-weight="bold" font-family="Arial, sans-serif" fill="white" text-anchor="middle" dominant-baseline="middle">V</text>
            </svg>
          </div>
          <h4 style="color: white; margin-bottom: 12px; font-weight: 600; font-size: 20px;">Are you sure?</h4>
          <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0; font-size: 14px;">Do you want to delete this profile?</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="cancelBtn" style="
              background: rgba(255,255,255,0.1);
              border: 1px solid rgba(255,255,255,0.2);
              color: white;
              padding: 10px 24px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: 600;
              transition: all 0.2s;
            ">Cancel</button>
            <button id="okBtn" style="
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
              border: none;
              color: white;
              padding: 10px 24px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: 600;
              box-shadow: 0 4px 12px rgba(255,107,107,0.4);
              transition: all 0.2s;
            ">OK</button>
          </div>
        `
        
        overlay.appendChild(modal)
        document.body.appendChild(overlay)
        
        const cancelBtn = modal.querySelector('#cancelBtn')
        const okBtn = modal.querySelector('#okBtn')
        
        cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(255,255,255,0.2)'
        cancelBtn.onmouseleave = () => cancelBtn.style.background = 'rgba(255,255,255,0.1)'
        
        okBtn.onmouseenter = () => {
          okBtn.style.transform = 'translateY(-2px)'
          okBtn.style.boxShadow = '0 6px 20px rgba(255,107,107,0.5)'
        }
        okBtn.onmouseleave = () => {
          okBtn.style.transform = 'translateY(0)'
          okBtn.style.boxShadow = '0 4px 12px rgba(255,107,107,0.4)'
        }
        
        cancelBtn.onclick = () => {
          document.body.removeChild(overlay)
          resolve(false)
        }
        
        okBtn.onclick = () => {
          document.body.removeChild(overlay)
          resolve(true)
        }
        
        overlay.onclick = (e) => {
          if (e.target === overlay) {
            document.body.removeChild(overlay)
            resolve(false)
          }
        }
      })
    }
    
    confirmDelete().then(async (confirmed) => {
      if (confirmed) {
        await deleteProfile(profileId)
        await loadProfiles()
      }
    })
  }

  const handleViewProfile = (profile) => {
    const user = getCurrentUser()
    const username = user?.username || profile.data?.username || 'demo'
    
    // Map profile type to the correct URL path
    const typePathMap = {
      'personal': 'personal',
      'vtree': 'vtree',
      'resume': 'resume'
    }
    
    const pathType = typePathMap[profile.type] || profile.type
    window.open(`/u/${username}/${pathType}`, '_blank')
  }

  const handleSwitchToSignup = () => {
    setShowLoginModal(false)
    navigate('/signup')
  }

  const getTypeIcon = (type) => {
    const found = profileTypes.find(t => t.value === type)
    return found ? found.icon : 'bi-person'
  }

  const getTypeColor = (type) => {
    const found = profileTypes.find(t => t.value === type)
    return found ? found.color : '#666'
  }

  return (
    <div className="dashboard-shell p-4">
      <div className="dashboard-card d-flex">
        <Sidebar />

        <main className="dashboard-main p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">My Profiles</h2>
              <p className="text-muted small mb-0">Manage multiple versions of your profile for different purposes</p>
            </div>
            <button className="btn btn-dark" onClick={handleCreateProfile}>
              <i className="bi bi-plus-circle me-2"></i>
              Create New Profile
            </button>
          </div>

          {profiles.length === 0 ? (
            <div className="text-center p-5">
              <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <h5 className="mt-3 text-muted">No profiles yet</h5>
              <p className="text-muted">Create your first profile to get started</p>
              <button className="btn btn-dark mt-2" onClick={handleCreateProfile}>
                Create Profile
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {profiles.map(profile => (
                <div key={profile.id} className="col-12 col-md-6 col-lg-4">
                  <div 
                    className="p-3 card-like position-relative"
                    style={{
                      border: profile.id === activeProfileId ? `2px solid ${getTypeColor(profile.type)}` : '1px solid rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {profile.id === activeProfileId && (
                      <div 
                        className="position-absolute top-0 end-0 m-2 badge"
                        style={{ backgroundColor: getTypeColor(profile.type) }}
                      >
                        Active
                      </div>
                    )}

                    <div className="d-flex align-items-center mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: '50px',
                          height: '50px',
                          backgroundColor: `${getTypeColor(profile.type)}20`,
                          color: getTypeColor(profile.type)
                        }}
                      >
                        <i className={`${getTypeIcon(profile.type)} fs-4`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="mb-1">{profile.name}</h5>
                        <div className="d-flex align-items-center gap-2">
                          <span 
                            className="badge"
                            style={{ 
                              backgroundColor: `${getTypeColor(profile.type)}`,
                              fontSize: '10px'
                            }}
                          >
                            {profile.type}
                          </span>
                          <span 
                            className="badge bg-secondary"
                            style={{ fontSize: '10px' }}
                          >
                            <i className="bi bi-layout-text-sidebar me-1"></i>
                            {profile.data?.layout || 'default'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">Display Name:</small>
                        <small className="fw-bold">{profile.data?.displayName || 'Not set'}</small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">Theme:</small>
                        <div className="d-flex align-items-center gap-1">
                          <div 
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: profile.data?.nameColor || '#000',
                              border: '1px solid rgba(0,0,0,0.2)'
                            }}
                          ></div>
                          <div 
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: profile.data?.blockColor || '#fff',
                              border: '1px solid rgba(0,0,0,0.2)'
                            }}
                          ></div>
                          <div 
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: profile.data?.bgColor || '#000',
                              border: '1px solid rgba(0,0,0,0.2)'
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Created:</small>
                        <small>{new Date(profile.createdAt).toLocaleDateString()}</small>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      {profile.id !== activeProfileId && (
                        <button 
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                          onClick={() => handleSwitchProfile(profile.id)}
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          Set Active
                        </button>
                      )}
                      <button 
                        className="btn btn-sm btn-outline-secondary flex-grow-1"
                        onClick={() => handleEditProfile(profile.id)}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-info"
                        onClick={() => handleViewProfile(profile)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {profiles.length > 1 && (
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteProfile(profile.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Profile</h5>
                <button className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Profile Type</label>
                  <select 
                    className="form-select" 
                    value={newProfileType}
                    onChange={(e) => setNewProfileType(e.target.value)}
                  >
                    {profileTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.name}</option>
                    ))}
                  </select>
                  
                  {/* Show description for selected type */}
                  {selectedProfileType && (
                    <div 
                      className="mt-3 p-3 rounded" 
                      style={{ 
                        backgroundColor: '#f8f9fa',
                        border: `2px solid ${selectedProfileType.color || '#6c5ce7'}`
                      }}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <i 
                          className={`${selectedProfileType.icon} me-2`}
                          style={{ fontSize: '24px', color: selectedProfileType.color || '#6c5ce7' }}
                        ></i>
                        <strong style={{ color: selectedProfileType.color || '#6c5ce7' }}>
                          {selectedProfileType.name}
                        </strong>
                      </div>
                      <p className="mb-2 small text-muted">
                        {selectedProfileType.description}
                      </p>
                      
                      {/* Template Preview */}
                      <div className="mt-3 p-2 rounded" style={{ backgroundColor: 'white', border: '1px solid #dee2e6' }}>
                        <small className="fw-bold d-block mb-2">
                          <i className="bi bi-magic me-1"></i>
                          Auto-applied settings:
                        </small>
                        <div className="d-flex flex-wrap gap-1 mb-1">
                          <span className="badge bg-primary">
                            <i className="bi bi-layout-text-sidebar me-1"></i>
                            {selectedProfileType.defaultSettings.layout} layout
                          </span>
                          <span className="badge bg-secondary">
                            <i className="bi bi-palette me-1"></i>
                            Optimized colors
                          </span>
                          <span className="badge bg-success">
                            <i className="bi bi-lightbulb me-1"></i>
                            Smart placeholders
                          </span>
                        </div>
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          Everything can be customized later
                        </small>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Profile Name (Optional)</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="e.g., Job Applications, Portfolio, etc."
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                  />
                  <small className="text-muted">Leave empty to use default name</small>
                </div>
              </div>
              <div className="modal-footer flex-column align-items-stretch gap-2">
                {createError && (
                  <div className="alert alert-danger py-2 mb-0" style={{ fontSize: '0.85rem' }}>
                    {createError}
                  </div>
                )}
                <div className="d-flex gap-2 w-100 justify-content-end">
                  <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setCreateError('') }}>
                    Cancel
                  </button>
                  <button className="btn btn-dark" onClick={handleSaveNewProfile} disabled={isCreating}>
                    {isCreating ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating...</>
                    ) : 'Create Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <LoginModal 
        show={showLoginModal} 
        onHide={() => setShowLoginModal(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </div>
  )
}

export default MyProfiles
