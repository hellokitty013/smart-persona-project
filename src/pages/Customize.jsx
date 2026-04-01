import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar'
import LoginModal from '../components/LoginModal'
import VisualEditor from '../components/VisualEditor'
import AIContentGenerator from '../components/AIContentGenerator'
import AIThemeRecommender from '../components/AIThemeRecommender'
import SectionManager from '../components/SectionManager'
import VtreeCustomize from '../components/VtreeCustomize'
import ResumeCustomize from '../components/ResumeCustomize'
import { getCurrentUser } from '../services/auth'
import { getAllProfiles, getActiveProfile, getActiveProfileId, setActiveProfile, updateProfile, migrateOldProfile, getProfiles } from '../services/profileManager'
import './customize.css';
import './dashboard.css'

const THEME_TOKEN_KEYS = [
    'bgColor',
    'blockColor',
    'nameColor',
    'descColor',
    'fontFamily',
    'bgImage',
    'bgOverlay',
    'accentColor',
    'buttonColor',
    'linkColor',
    'sectionBg',
    'textColor',
    'headingColor'
]

const THEME_SOURCE_LABELS = {
    builtin: 'Official Library',
    community: 'Community Gallery',
    saved: 'My Themes',
    custom: 'Custom Theme'
}

const formatThemeSource = (source) => THEME_SOURCE_LABELS[source] || THEME_SOURCE_LABELS.custom

const CREATIVE_PRESETS = [
    {
        id: 'creative-neon-portfolio',
        title: 'Neon Portfolio',
        description: 'High-energy palette for motion, 3D, and immersive installations.',
        gradient: 'linear-gradient(135deg, #f97316 0%, #c026d3 55%, #5b21b6 100%)',
        badges: ['Glow', 'Motion'],
        tokens: {
            bgColor: '#050014',
            blockColor: '#12021c',
            nameColor: '#ffd369',
            descColor: '#e0e7ff',
            bgOverlay: 0.48
        }
    },
    {
        id: 'creative-holographic-dream',
        title: 'Holographic Dream',
        description: 'Soft glassmorphism inspired by holographic foil and Y2K gradients.',
        gradient: 'linear-gradient(135deg, #94bbe9 0%, #eeaeca 100%)',
        badges: ['Glass', 'Soft light'],
        tokens: {
            bgColor: '#0f1024',
            blockColor: 'rgba(255,255,255,0.08)',
            nameColor: '#f8f6ff',
            descColor: '#cad7ff',
            bgOverlay: 0.35
        }
    },
    {
        id: 'creative-muse-lab',
        title: 'Muse Lab',
        description: 'Editorial contrast built for studios, art directors, and creative leads.',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #4338ca 55%, #f97316 100%)',
        badges: ['Editorial', 'Bold serif'],
        tokens: {
            bgColor: '#1a120f',
            blockColor: '#12090a',
            nameColor: '#f7e0c3',
            descColor: '#fcd8c6',
            bgOverlay: 0.32
        }
    }
]

const CREATIVE_SECTION_KITS = [
    {
        id: 'hero-projects',
        title: 'Hero Projects Stack',
        icon: 'bi bi-lightning-charge-fill',
        description: 'Spotlight three flagship drops with medium + metric highlights.',
        section: {
            type: 'bullets',
            title: 'Hero Projects',
            items: [
                'Immersive launch · XR showcase · 1M+ live viewers',
                'Art direction · Global brand film · Cannes shortlist',
                'Experiential retail · Pop-up concept · 32% lift in dwell time'
            ]
        }
    },
    {
        id: 'services-grid',
        title: 'Services & Mediums',
        icon: 'bi bi-grid-3x3-gap-fill',
        description: 'Tell clients what you ship and how to collaborate.',
        section: {
            type: 'text',
            title: 'Creative Services',
            content: 'Art direction · Visual identity · Motion systems\nRetainers available · Booking Q1 2026 · Remote friendly'
        }
    },
    {
        id: 'studio-contact',
        title: 'Studio Hotline',
        icon: 'bi bi-headset',
        description: 'Drop a quick booking block with direct contact details.',
        section: {
            type: 'contact',
            title: 'Studio Contact',
            address: 'Bangkok · Remote',
            phone: '+66 80 000 0000',
            email: 'hello@yourstudio.com',
            website: 'https://yourstudio.com'
        }
    }
]

// IndexedDB helper functions
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ProfileDB', 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
        request.onupgradeneeded = (event) => {
            const db = event.target.result
            if (!db.objectStoreNames.contains('audio')) {
                db.createObjectStore('audio')
            }
        }
    })
}

const saveAudioToDB = async (audioData) => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readwrite')
        const store = transaction.objectStore('audio')
        const request = store.put(audioData, 'userAudio')
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
    })
}

const getAudioFromDB = async () => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readonly')
        const store = transaction.objectStore('audio')
        const request = store.get('userAudio')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

const deleteAudioFromDB = async () => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readwrite')
        const store = transaction.objectStore('audio')
        const request = store.delete('userAudio')
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
    })
}

const Customize = () => {
    const { t } = useTranslation();
    const navigate = useNavigate()
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [profiles, setProfiles] = useState([])
    const [currentProfileId, setCurrentProfileId] = useState(null)
    const [profileType, setProfileType] = useState('personal')
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [description, setDescription] = useState('')
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [bgImage, setBgImage] = useState(null)
    const [bgOverlay, setBgOverlay] = useState(0.3)
    const [nameColor, setNameColor] = useState('#1E6FB8')
    const [blockColor, setBlockColor] = useState('#ffffff')
    const [bgColor, setBgColor] = useState('#050505')
    const [descColor, setDescColor] = useState('#ffffff')
    const [layout, setLayout] = useState('default')
    const [audioFile, setAudioFile] = useState(null)
    const [audioFileName, setAudioFileName] = useState('')
    const [audioStartTime, setAudioStartTime] = useState(0)
    const [audioEndTime, setAudioEndTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)
    
    // Privacy Setting
    
    // Multi-Section System
    const [profileSections, setProfileSections] = useState([])
    
    // Social Links
    const [socialLinks, setSocialLinks] = useState({})
    
    // AI Theme Recommender
    const [showAIThemeRecommender, setShowAIThemeRecommender] = useState(false)
    
    // Visual Editor Mode
    const [visualEditorMode, setVisualEditorMode] = useState(false)
    
    // Advanced Layout Settings
    const [advancedMode, setAdvancedMode] = useState(false)
    const [layoutSettings, setLayoutSettings] = useState({
        avatarAlignment: 'center', // left, center, right
        avatarSize: 120, // pixels
        avatarVisible: true,
        nameAlignment: 'center',
        nameFontSize: 32,
        nameVisible: true,
        descAlignment: 'center',
        descFontSize: 16,
        descVisible: true,
        contentVerticalAlign: 'center', // top, center, bottom
        contentPadding: 48,
        elementSpacing: 16
    })
    const [themeMeta, setThemeMeta] = useState(null)
    const [themeTokens, setThemeTokens] = useState({})
    const isCreativeProfile = profileType === 'creative'

    const themeSourceLabel = themeMeta ? formatThemeSource(themeMeta.source) : ''

    const checkLogin = () => {
        const user = getCurrentUser()
        if (!user) {
            setShowLoginModal(true)
            return false
        }
        return true
    }

    const handleSwitchToSignup = () => {
        setShowLoginModal(false)
        navigate('/signup')
    }

    // Helper to format seconds to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    useEffect(() => {
        // Migrate old profile data first
        migrateOldProfile()
        
        const collectThemeTokens = (data) => {
            if (!data) return {}
            const snapshot = {}
            THEME_TOKEN_KEYS.forEach((key) => {
                if (data[key] !== undefined && data[key] !== null) {
                    snapshot[key] = data[key]
                }
            })
            return snapshot
        }

        const loadProfile = async () => {
            try {
                // Load all profiles
                const allProfiles = await getAllProfiles()
                setProfiles(allProfiles)
                
                // Get active profile
                const activeId = getActiveProfileId()
                const activeProfile = await getActiveProfile()
                
                if (activeProfile) {
                    setCurrentProfileId(activeId)
                    const data = activeProfile.data
                    
                    // Load from user session first (this is the registered username)
                    const currentUser = localStorage.getItem('spa_current_user')
                    const user = currentUser ? JSON.parse(currentUser) : null
                    
                    setUsername(user?.username || data.username || '')
                    setProfileType(activeProfile.type || 'professional')
                    setDisplayName(data.displayName || '')
                    setDescription(data.description || '')
                    setAvatarPreview(data.avatar || null)
                    setBgImage(data.bgImage || null)
                    setBgOverlay(typeof data.bgOverlay === 'number' ? data.bgOverlay : 0.3)
                    setNameColor(data.nameColor || '#1E6FB8')
                    setBlockColor(data.blockColor || '#ffffff')
                    setBgColor(data.bgColor || '#050505')
                    setDescColor(data.descColor || '#ffffff')
                    setLayout(data.layout || 'default')
                    setAudioFileName(data.audioFileName || '')
                    setAudioStartTime(data.audioStartTime || 0)
                    setAudioEndTime(data.audioEndTime || 0)
                    setProfileSections(data.sections || [])
                    setSocialLinks(data.socialLinks || {})
                    setThemeMeta(data.themeMeta || null)
                    setThemeTokens(collectThemeTokens(data))
                    
                    // Load advanced layout settings
                    if (data.layoutSettings) {
                        setLayoutSettings(data.layoutSettings)
                    }
                    
                    // Load audio from IndexedDB
                    if (data.hasAudio) {
                        const audioData = await getAudioFromDB()
                        if (audioData) {
                            setAudioFile(audioData)
                            // Get duration again
                            const audio = new Audio(audioData)
                            audio.addEventListener('loadedmetadata', () => {
                                setAudioDuration(Math.floor(audio.duration))
                            })
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to load user_profile', err)
            }
        }
        loadProfile()
    }, [])

    const handleProfileUpload = (e) => {
        if (!checkLogin()) return
        const file = e.target.files && e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setAvatarPreview(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const handleBgUpload = (e) => {
        if (!checkLogin()) return
        const file = e.target.files && e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setBgImage(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const clearBgImage = () => {
        if (!checkLogin()) return
        setBgImage(null)
    }

    const handleAudioUpload = (e) => {
        if (!checkLogin()) return
        const file = e.target.files && e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            const audioUrl = reader.result
            setAudioFile(audioUrl)
            setAudioFileName(file.name)
            // Load audio to get duration
            const audio = new Audio(audioUrl)
            audio.addEventListener('loadedmetadata', () => {
                const duration = Math.floor(audio.duration)
                setAudioDuration(duration)
                setAudioStartTime(0)
                setAudioEndTime(duration)
            })
        }
        reader.readAsDataURL(file)
    }

    const clearAudio = async () => {
        if (!checkLogin()) return
        try {
            await deleteAudioFromDB()
        } catch (err) {
            console.warn('Failed to delete audio from DB', err)
        }
        setAudioFile(null)
        setAudioFileName('')
        setAudioStartTime(0)
        setAudioEndTime(0)
        setAudioDuration(0)
    }

    const hexToRgba = (hex, alpha) => {
        if (!hex) return `rgba(30,111,184,${alpha})`
        const h = hex.replace('#','')
        const normalized = h.length === 3 ? h.split('').map(c=>c+c).join('') : h
        const bigint = parseInt(normalized, 16)
        const r = (bigint >> 16) & 255
        const g = (bigint >> 8) & 255
        const b = bigint & 255
        return `rgba(${r},${g},${b},${alpha})`
    }

    const hexLuminance = (hex) => {
        if (!hex) return 0
        const h = hex.replace('#','')
        const normalized = h.length === 3 ? h.split('').map(c=>c+c).join('') : h
        const bigint = parseInt(normalized, 16)
        const r = (bigint >> 16) & 255
        const g = (bigint >> 8) & 255
        const b = bigint & 255
        const srgb = [r,g,b].map(v => {
            const s = v/255
            return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4)
        })
        return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2]
    }

    const buildTextGlow = (hex) => {
        const c1 = hexToRgba(hex, 0.95)
        const c2 = hexToRgba(hex, 0.6)
        const c3 = hexToRgba(hex, 0.35)
        const dark1 = 'rgba(0,0,0,0.7)'
        const dark2 = 'rgba(0,0,0,0.45)'
        return [
            `0 2px 0 ${dark1}`,
            `0 6px 14px ${dark2}`,
            `0 0 6px ${c1}`,
            `0 0 18px ${c2}`,
            `0 0 40px ${c3}`,
            `0 0 90px ${c3}`,
        ].join(', ')
    }

    const saveProfile = async () => {
        if (!checkLogin()) return
        if (!currentProfileId) {
            alert('No profile selected')
            return
        }
        
        try {
            // Save audio to IndexedDB first
            if (audioFile) {
                await saveAudioToDB(audioFile)
            }
            
            // Update the current profile
            const updates = {
                displayName: displayName.trim() || username.trim() || 'User',
                description,
                avatar: avatarPreview || null,
                bgImage: bgImage || null,
                bgOverlay: bgOverlay,
                nameColor,
                blockColor,
                bgColor,
                descColor,
                layout,
                layoutSettings, // Save advanced layout settings
                hasAudio: !!audioFile,
                audioFileName: audioFileName || '',
                audioStartTime: audioStartTime || 0,
                audioEndTime: audioEndTime || 0,
                sections: profileSections,
                themeMeta: themeMeta || null,
                themeTokens
            }
            
            await updateProfile(currentProfileId, updates)
            alert('Profile saved successfully!')
        } catch (err) {
            if (err.name === 'QuotaExceededError') {
                alert('Error: Storage quota exceeded. Please use smaller images.')
            } else {
                alert('Error saving profile: ' + err.message)
            }
            console.error('Save error:', err)
        }
    }

    const handleProfileSwitch = (e) => {
        const profileId = e.target.value
        setActiveProfile(profileId)
        window.location.reload() // Reload to load new profile data
    }

    // preview wrapper style depends on optional bgImage (image) or bgColor
    const previewWrapperStyle = bgImage ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 10,
        padding: 20
    } : { background: bgColor || '#0b0b0b', borderRadius:10, padding:20 }

    const applyCreativePreset = (preset) => {
        if (!preset) return
        setLayout('creative')
        setThemeMeta({
            id: preset.id,
            name: preset.title,
            source: 'creative-studio',
            profileType: 'creative',
            badges: preset.badges
        })
        setThemeTokens(preset.tokens)
        if (preset.tokens.nameColor) setNameColor(preset.tokens.nameColor)
        if (preset.tokens.descColor) setDescColor(preset.tokens.descColor)
        if (preset.tokens.blockColor) setBlockColor(preset.tokens.blockColor)
        if (preset.tokens.bgColor) setBgColor(preset.tokens.bgColor)
        if (preset.tokens.bgOverlay !== undefined) setBgOverlay(preset.tokens.bgOverlay)
    }

    const handleCreativeSectionInsert = (kit) => {
        if (!kit) return
        setProfileSections(prev => {
            if (prev.some(section => section.templateId === kit.id)) {
                return prev
            }
            const payload = JSON.parse(JSON.stringify(kit.section))
            return [
                ...prev,
                {
                    id: `section_${Date.now()}_${kit.id}`,
                    templateId: kit.id,
                    order: prev.length,
                    ...payload
                }
            ]
        })
    }

    const renderCreativeStudio = () => (
        <div className="creative-studio mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                    <div className="text-uppercase creative-eyebrow">Creative Studio</div>
                    <h3 className="mb-1">Canvas presets for designers & artists</h3>
                    <p className="mb-0">Apply neon palettes, drop-in section kits, or let AI name your studio.</p>
                </div>
                <span className="badge bg-dark text-white">Creative Beta</span>
            </div>

            <div className="row g-3 mt-2">
                {CREATIVE_PRESETS.map((preset) => (
                    <div key={preset.id} className="col-md-4">
                        <div className="creative-preset-card" style={{ background: preset.gradient }}>
                            <div>
                                <div className="d-flex align-items-center justify-content-between">
                                    <h5 className="mb-1 text-white">{preset.title}</h5>
                                    <i className="bi bi-brush text-white-50"></i>
                                </div>
                                <p className="small mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>{preset.description}</p>
                                <div className="d-flex flex-wrap gap-2">
                                    {preset.badges.map((badge) => (
                                        <span key={badge} className="badge creative-badge">{badge}</span>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-light btn-sm w-100 mt-3"
                                onClick={() => applyCreativePreset(preset)}
                            >
                                <i className="bi bi-stars me-1"></i>
                                Use Palette
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-3 mt-1">
                <div className="col-lg-7">
                    <div className="creative-kit-card h-100">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <h5 className="mb-0">Section kits</h5>
                                <small>Create folio-ready blocks with one click</small>
                            </div>
                        </div>
                        <div className="creative-kit-list">
                            {CREATIVE_SECTION_KITS.map((kit) => {
                                const alreadyAdded = profileSections.some(section => section.templateId === kit.id)
                                return (
                                    <div key={kit.id} className="creative-kit-row">
                                        <div>
                                            <div className="d-flex align-items-center gap-2">
                                                <i className={`${kit.icon} text-muted`}></i>
                                                <strong>{kit.title}</strong>
                                            </div>
                                            <p className="small text-muted mb-0">{kit.description}</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-dark"
                                            disabled={alreadyAdded}
                                            onClick={() => handleCreativeSectionInsert(kit)}
                                        >
                                            {alreadyAdded ? 'Added' : 'Add Section'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="creative-ai-stack h-100">
                        <AIContentGenerator
                            profileType="creative"
                            fieldName="description"
                            onGenerated={(content) => setDescription(content)}
                        />
                        <div className="mt-3">
                            <AIContentGenerator
                                profileType="creative"
                                fieldName="displayName"
                                onGenerated={(content) => setDisplayName(content)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    // Handle Visual Editor Save
    const handleVisualEditorSave = async (vereData) => {
        if (!checkLogin()) return
        if (!currentProfileId) return
        
        try {
            await updateProfile(currentProfileId, vereData)
            // Refresh profile data
            const updatedProfiles = getProfiles()
            setProfiles(updatedProfiles)
            setVisualEditorMode(false)
            alert('Vere design saved!')
        } catch (err) {
            console.error('Failed to save vere:', err)
            alert('Failed to save vere design')
        }
    }

    // If in visual editor mode, show visual editor
    if (visualEditorMode) {
        const currentProfile = profiles.find(p => p.id === currentProfileId)
        return (
            <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
                <button
                    className="btn btn-secondary"
                    style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        zIndex: 1000
                    }}
                    onClick={() => setVisualEditorMode(false)}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Normal Editor
                </button>
                <VisualEditor 
                    profile={{
                        ...currentProfile?.data,
                        username,
                        displayName,
                        description,
                        avatar: avatarPreview,
                        bgImage,
                        bgColor,
                        nameColor,
                        descColor
                    }}
                    onSave={handleVisualEditorSave}
                />
            </div>
        )
    }

    // If Vtree profile type, show VtreeCustomize interface
    if (profileType === 'vtree') {
        return (
            <div className="dashboard-shell p-4">
                <div className="dashboard-card d-flex">
                    <Sidebar />
                    <main className="dashboard-main p-0" style={{ flex: 1 }}>
                        <VtreeCustomize 
                            profiles={profiles}
                            currentProfileId={currentProfileId}
                            onProfileSwitch={handleProfileSwitch}
                            navigate={navigate}
                            profile={{
                                displayName,
                                nameColor,
                                bgColor,
                                descColor,
                                blockColor,
                                avatar: avatarPreview,
                                profileImageLayout: layoutSettings.profileImageLayout,
                                titleStyle: layoutSettings.titleStyle,
                                titleFont: layoutSettings.titleFont,
                                titleSize: layoutSettings.titleSize,
                                socialLinks: socialLinks
                            }}
                            onUpdate={(updates) => {
                                if (updates.displayName !== undefined) setDisplayName(updates.displayName)
                                if (updates.nameColor !== undefined) setNameColor(updates.nameColor)
                                if (updates.bgColor !== undefined) setBgColor(updates.bgColor)
                                if (updates.descColor !== undefined) setDescColor(updates.descColor)
                                if (updates.blockColor !== undefined) setBlockColor(updates.blockColor)
                                
                                // Update layout settings
                                const newLayoutSettings = { ...layoutSettings }
                                if (updates.profileImageLayout) newLayoutSettings.profileImageLayout = updates.profileImageLayout
                                if (updates.titleStyle) newLayoutSettings.titleStyle = updates.titleStyle
                                if (updates.titleFont) newLayoutSettings.titleFont = updates.titleFont
                                if (updates.titleSize) newLayoutSettings.titleSize = updates.titleSize
                                setLayoutSettings(newLayoutSettings)
                            }}
                            onSave={saveProfile}
                        />
                    </main>
                </div>
                
                {showLoginModal && (
                    <LoginModal onClose={() => setShowLoginModal(false)} onSwitchToSignup={handleSwitchToSignup} />
                )}
            </div>
        )
    }

    // If Resume profile type, show ResumeCustomize interface
    if (profileType === 'resume') {
        return (
            <div className="dashboard-shell p-4">
                <div className="dashboard-card d-flex">
                    <Sidebar />
                    <main className="dashboard-main p-0" style={{ flex: 1 }}>
                        <ResumeCustomize 
                            profile={{
                                fullName: displayName,
                                ...layoutSettings,
                                themeMeta,
                                themeTokens
                            }}
                            onUpdate={(updates) => {
                                if (updates.fullName !== undefined) setDisplayName(updates.fullName)
                                // Add more update handlers as needed
                                const newLayoutSettings = { ...layoutSettings, ...updates }
                                setLayoutSettings(newLayoutSettings)
                            }}
                            profiles={profiles}
                            currentProfileId={currentProfileId}
                            onProfileSwitch={handleProfileSwitch}
                        />
                    </main>
                </div>
                
                {showLoginModal && (
                    <LoginModal onClose={() => setShowLoginModal(false)} onSwitchToSignup={handleSwitchToSignup} />
                )}
            </div>
        )
    }

    return (
        <div className="dashboard-shell p-4">
            <div className="dashboard-card d-flex">
                <Sidebar />

                <main className="dashboard-main p-4">
                    <div className="customize-container">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="customize-title mb-0">{t('customize') || 'Customization'}</h2>
                            
                            {/* Profile Selector */}
                            {profiles.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <label className="mb-0 small text-muted">{t('editing') || 'Editing:'}</label>
                                    <select 
                                        className="form-select" 
                                        style={{ width: 'auto', minWidth: '200px' }}
                                        value={currentProfileId || ''}
                                        onChange={handleProfileSwitch}
                                    >
                                        {profiles.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {isCreativeProfile && renderCreativeStudio()}

                        {themeMeta && (
                            <div
                                className="mb-4"
                                style={{
                                    borderRadius: '18px',
                                    padding: '20px',
                                    background: 'linear-gradient(135deg, #0f172a 0%, #1f2937 100%)',
                                    color: '#f8fafc',
                                    boxShadow: '0 12px 30px rgba(15,23,42,0.25)'
                                }}
                            >
                                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                                    <div>
                                        <div className="text-uppercase small" style={{ letterSpacing: '0.1em', opacity: 0.65 }}>
                                            Active Theme
                                        </div>
                                        <div className="h5 mb-1" style={{ fontWeight: 700 }}>{themeMeta.name}</div>
                                        <div className="small" style={{ opacity: 0.75 }}>{themeSourceLabel}</div>
                                        <div className="d-flex gap-2 mt-3">
                                            {[themeTokens.bgColor, themeTokens.blockColor, themeTokens.nameColor]
                                                .filter(Boolean)
                                                .map((color, idx) => (
                                                    <span
                                                        key={`${color}-${idx}`}
                                                        style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: '8px',
                                                            backgroundColor: color,
                                                            border: '1px solid rgba(255,255,255,0.4)'
                                                        }}
                                                    ></span>
                                                ))}
                                        </div>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-light"
                                            style={{ borderRadius: '10px', fontWeight: 600 }}
                                            onClick={() => navigate('/themes')}
                                        >
                                            <i className="bi bi-grid me-2"></i>
                                            Browse Themes
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-light"
                                            style={{ borderRadius: '10px', fontWeight: 600 }}
                                            onClick={() => navigate('/saved-profiles')}
                                        >
                                            <i className="bi bi-bookmark-heart me-2"></i>
                                            My Themes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="customize-card mb-4">
                            <div className="customize-row">
                                <div className="form-group">
                                    <label className="form-label">{t('username_cannot_change') || 'Username (cannot be changed)'}</label>
                                    <input 
                                        value={username} 
                                        className="form-control neutral-input" 
                                        placeholder="your-username" 
                                        disabled
                                        style={{
                                            backgroundColor: '#f0f0f0',
                                            cursor: 'not-allowed',
                                            color: '#666'
                                        }}
                                    />
                                    <small className="text-muted">{t('username_note') || 'This is your login username and cannot be changed'}</small>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('display_name')}</label>
                                    <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="form-control neutral-input" placeholder="Your display name" />
                                    <small className="text-muted">{t('display_name_note') || 'This name will be shown on your profile'}</small>
                                </div>

                                <div className="form-group w-100">
                                    <label className="form-label">{t('description')}</label>
                                    <input value={description} onChange={e => setDescription(e.target.value)} className="form-control neutral-input" placeholder="this is my Description" />
                                </div>
                            </div>

                            {/* Multi-Section Manager - Hide for Personal profile type */}
                            {profileType !== 'personal' && (
                                <div className="customize-row mt-4">
                                    <div className="form-group w-100">
                                        <SectionManager
                                            sections={profileSections}
                                            onChange={setProfileSections}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* AI Theme Recommender */}
                            <div className="customize-row mt-3">
                                <div className="form-group w-100">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="form-label mb-0">
                                            <i className="bi bi-palette me-2"></i>
                                            {t('color_customization') || 'Color Customization'}
                                        </label>
                                        <button 
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setShowAIThemeRecommender(!showAIThemeRecommender)}
                                        >
                                            <i className="bi bi-stars me-1"></i>
                                            {showAIThemeRecommender ? t('hide_ai_recommender') || 'Hide AI Recommender' : t('get_ai_theme_suggestions') || 'Get AI Theme Suggestions'}
                                        </button>
                                    </div>
                                    
                                    {showAIThemeRecommender && (
                                        <div className="mb-3">
                                            <AIThemeRecommender
                                                profileType={profileType || 'personal'}
                                                onThemeApplied={(colors) => {
                                                    setNameColor(colors.nameColor)
                                                    setBgColor(colors.bgColor)
                                                    setDescColor(colors.descColor)
                                                    setShowAIThemeRecommender(false)
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="customize-row mt-3">
                                <div className="form-group">
                                    <label className="form-label">{t('name_color') || 'Name color'}</label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input type="color" value={nameColor} onChange={e => setNameColor(e.target.value)} className="form-control form-control-color" style={{width:56, height:36, padding:4}} />
                                        <input type="text" value={nameColor} onChange={e => setNameColor(e.target.value)} className="form-control neutral-input" style={{maxWidth:140}} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('block_background') || 'Block background'}</label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input type="color" value={blockColor} onChange={e => setBlockColor(e.target.value)} className="form-control form-control-color" style={{width:56, height:36, padding:4}} />
                                        <input type="text" value={blockColor} onChange={e => setBlockColor(e.target.value)} className="form-control neutral-input" style={{maxWidth:140}} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('description_color') || 'Description color'}</label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input type="color" value={descColor} onChange={e => setDescColor(e.target.value)} className="form-control form-control-color" style={{width:56, height:36, padding:4}} />
                                        <input type="text" value={descColor} onChange={e => setDescColor(e.target.value)} className="form-control neutral-input" style={{maxWidth:140}} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('page_background') || 'Page background'}</label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="form-control form-control-color" style={{width:56, height:36, padding:4}} />
                                        <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="form-control neutral-input" style={{maxWidth:140}} />
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Layout Editor - Only show when custom layout is selected */}
                            {layout === 'custom' && (
                                <div className="mt-4 p-4 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <h5 className="mb-0">
                                            <i className="bi bi-tools me-2"></i>
                                            {t('advanced_layout_editor') || 'Advanced Layout Editor'}
                                        </h5>
                                        <button 
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setAdvancedMode(!advancedMode)}
                                        >
                                            {advancedMode ? t('hide_details') || 'Hide Details' : t('show_details') || 'Show Details'}
                                        </button>
                                    </div>

                                    {/* Avatar Settings */}
                                    <div className="mb-3 p-3 bg-white rounded">
                                        <h6 className="mb-3">
                                            <i className="bi bi-person-circle me-2"></i>
                                            {t('avatar_settings') || 'Avatar Settings'}
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small">{t('alignment') || 'Alignment'}</label>
                                                <select 
                                                    className="form-select form-select-sm"
                                                    value={layoutSettings.avatarAlignment}
                                                    onChange={(e) => setLayoutSettings({...layoutSettings, avatarAlignment: e.target.value})}
                                                >
                                                    <option value="left">Left</option>
                                                    <option value="center">Center</option>
                                                    <option value="right">Right</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small">{t('size') || 'Size'}: {layoutSettings.avatarSize}px</label>
                                                <input 
                                                    type="range" 
                                                    className="form-range"
                                                    min="60"
                                                    max="200"
                                                    value={layoutSettings.avatarSize}
                                                    onChange={(e) => setLayoutSettings({...layoutSettings, avatarSize: parseInt(e.target.value)})}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={layoutSettings.avatarVisible}
                                                        onChange={(e) => setLayoutSettings({...layoutSettings, avatarVisible: e.target.checked})}
                                                    />
                                                    <label className="form-check-label small">{t('show_avatar') || 'Show Avatar'}</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Name Settings */}
                                    <div className="mb-3 p-3 bg-white rounded">
                                        <h6 className="mb-3">
                                            <i className="bi bi-type me-2"></i>
                                            {t('name_settings') || 'Name Settings'}
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small">{t('alignment') || 'Alignment'}</label>
                                                <select 
                                                    className="form-select form-select-sm"
                                                    value={layoutSettings.nameAlignment}
                                                    onChange={(e) => setLayoutSettings({...layoutSettings, nameAlignment: e.target.value})}
                                                >
                                                    <option value="left">Left</option>
                                                    <option value="center">Center</option>
                                                    <option value="right">Right</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small">{t('font_size') || 'Font Size'}: {layoutSettings.nameFontSize}px</label>
                                                <input 
                                                    type="range" 
                                                    className="form-range"
                                                    min="16"
                                                    max="64"
                                                    value={layoutSettings.nameFontSize}
                                                    onChange={(e) => setLayoutSettings({...layoutSettings, nameFontSize: parseInt(e.target.value)})}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={layoutSettings.nameVisible}
                                                        onChange={(e) => setLayoutSettings({...layoutSettings, nameVisible: e.target.checked})}
                                                    />
                                                    <label className="form-check-label small">{t('show_name') || 'Show Name'}</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description Settings */}
                                    <div className="mb-3 p-3 bg-white rounded">
                                        <h6 className="mb-3">
                                            <i className="bi bi-text-paragraph me-2"></i>
                                            {t('description_settings') || 'Description Settings'}
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small">{t('alignment') || 'Alignment'}</label>
                                                <select 
                                                    className="form-select form-select-sm"
                                                    value={layoutSettings.descAlignment}
                                                    onChange={(e) => setLayoutSettings({...layoutSettings, descAlignment: e.target.value})}
                                                >
                                                    <option value="left">Left</option>
                                                    <option value="center">Center</option>
                                                    <option value="right">Right</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small">{t('font_size') || 'Font Size'}: {layoutSettings.descFontSize}px</label>
                                                <input 
                                                    type="range" 
                                                    className="form-range"
                                                    min="12"
                                                    max="24"
                                                    value={layoutSettings.descFontSize}
                                                    onChange={(e) => setLayoutSettings({...layoutSettings, descFontSize: parseInt(e.target.value)})}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={layoutSettings.descVisible}
                                                        onChange={(e) => setLayoutSettings({...layoutSettings, descVisible: e.target.checked})}
                                                    />
                                                    <label className="form-check-label small">{t('show_description') || 'Show Description'}</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Spacing Settings */}
                                    <div className="mb-3 p-3 bg-white rounded">
                                        <h6 className="mb-3">
                                            <i className="bi bi-arrows-expand me-2"></i>
                                            {t('spacing_layout') || 'Spacing & Layout'}
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label small">{t('vertical_position') || 'Vertical Position'}</label>
                                                <select 
                                                    className="form-select form-select-sm"
                                                    value={layoutSettings.contentVerticalAlign}
                                                    onChange={(e) => setLayoutSettings({...layoutSettings, contentVerticalAlign: e.target.value})}
                                                >
                                                    <option value="top">Top</option>
                                                    <option value="center">Center</option>
                                                    <option value="bottom">Bottom</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small">{t('content_padding') || 'Content Padding'}: {layoutSettings.contentPadding}px</label>
                                                <input 
                                                    type="range" 
                                                    className="form-range"
                                                    min="0"
                                                    max="120"
                                                    value={layoutSettings.contentPadding}
                                                    onChange={(e) => setLayoutSettings({...layoutSettings, contentPadding: parseInt(e.target.value)})}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small">{t('element_spacing') || 'Element Spacing'}: {layoutSettings.elementSpacing}px</label>
                                                <input 
                                                    type="range" 
                                                    className="form-range"
                                                    min="0"
                                                    max="60"
                                                    value={layoutSettings.elementSpacing}
                                                    onChange={(e) => setLayoutSettings({...layoutSettings, elementSpacing: parseInt(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="alert alert-info small mb-0">
                                        <i className="bi bi-info-circle me-2"></i>
                                        {t('changes_applied_note') || 'Changes will be applied when you save the profile and view it.'}
                                    </div>
                                </div>
                            )}

                            <div className="mt-3 d-flex justify-content-end align-items-center">
                                <button
                                    className="btn btn-primary"
                                    onClick={saveProfile}
                                    style={{
                                        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
                                        border: '2px solid rgba(255,255,255,0.15)',
                                        fontWeight: 600,
                                        boxShadow: '0 0 20px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
                                        color: '#ffffff',
                                        textShadow: '0 0 10px rgba(255,255,255,0.5)'
                                    }}
                                >
                                    Save Profile
                                </button>
                            </div>
                        </div>

                        <h3 className="customize-title">Assets Uploader</h3>
                        <div className="customize-card assets-grid">
                            <div className="asset-item">
                                <label className="asset-box" htmlFor="bg-upload">
                                    {bgImage ? (
                                        <img src={bgImage} alt="background preview" className="asset-bg-thumb" />
                                    ) : (
                                    <>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                    <div className="asset-label">upload a file</div>
                                    </>
                                    )}
                                </label>
                                <div className="d-flex align-items-center" style={{gap:8, marginTop:8}}>
                                    <div className="asset-title">Background</div>
                                    {bgImage && (
                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearBgImage} style={{marginLeft:8}}>Remove</button>
                                    )}
                                </div>
                                <input id="bg-upload" onChange={handleBgUpload} type="file" accept="image/*" className="d-none" />
                            </div>

                            <div className="asset-item">
                                <label className="asset-box" htmlFor="audio-upload">
                                    {audioFile ? (
                                        <div style={{padding:12, textAlign:'center'}}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="#4CAF50" stroke="#4CAF50" strokeWidth="2" aria-hidden>
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="10 8 16 12 10 16 10 8" fill="white"></polyline>
                                            </svg>
                                            <div className="asset-label" style={{fontSize:11, marginTop:4, wordBreak:'break-word'}}>{audioFileName}</div>
                                        </div>
                                    ) : (
                                        <>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                            <div className="asset-label">upload audio file</div>
                                        </>
                                    )}
                                </label>
                                <div className="d-flex align-items-center" style={{gap:8, marginTop:8}}>
                                    <div className="asset-title">Audio</div>
                                    {audioFile && (
                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearAudio} style={{marginLeft:8}}>Remove</button>
                                    )}
                                </div>
                                <input id="audio-upload" onChange={handleAudioUpload} type="file" accept="audio/*,video/mp4" className="d-none" />
                                {audioFile && audioDuration > 0 && (
                                    <div style={{marginTop:12, fontSize:12}}>
                                        <div style={{marginBottom:6}}>
                                            <label style={{display:'block', marginBottom:4}}>Start: {formatTime(audioStartTime)}</label>
                                            <input type="range" min="0" max={audioDuration} value={audioStartTime} onChange={(e) => {
                                                const val = Number(e.target.value)
                                                if (val < audioEndTime) setAudioStartTime(val)
                                            }} style={{width:'100%'}} />
                                        </div>
                                        <div>
                                            <label style={{display:'block', marginBottom:4}}>End: {formatTime(audioEndTime)}</label>
                                            <input type="range" min="0" max={audioDuration} value={audioEndTime} onChange={(e) => {
                                                const val = Number(e.target.value)
                                                if (val > audioStartTime) setAudioEndTime(val)
                                            }} style={{width:'100%'}} />
                                        </div>
                                        <div style={{marginTop:4, color:'#666'}}>Duration: {formatTime(audioEndTime - audioStartTime)} / {formatTime(audioDuration)}</div>
                                    </div>
                                )}
                            </div>

                            <div className="asset-item">
                                <label className="asset-box profile-box" htmlFor="profile-upload">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="avatar preview" className="avatar-preview" />
                                    ) : (
                                        <>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                            <div className="asset-label">upload a file</div>
                                        </>
                                    )}
                                </label>
                                <div className="asset-title">Profile</div>
                                <input id="profile-upload" onChange={handleProfileUpload} type="file" accept="image/*" className="d-none" />
                            </div>
                        </div>

                            <div className="customize-card mt-4">
                            <h4 className="mb-3">{t('preview') || 'Preview'}</h4>
                            <div className="d-flex align-items-center" style={{gap:12, marginBottom:8}}>
                                <div style={{display:'flex', alignItems:'center', gap:12}}>
                                    <label className="form-label mb-0 ">{t('background_overlay') || 'Background overlay'}</label>
                                    <input type="range" min={0} max={100} value={Math.round(bgOverlay*100)} onChange={e => setBgOverlay(Number(e.target.value)/100)} />
                                    <div style={{minWidth:42, textAlign:'center'}}>{Math.round(bgOverlay*100)}%</div>
                                </div>
                            </div>
                            <div className="preview-wrapper" style={previewWrapperStyle}>
                                <div className="preview-content" style={{
                                    width:'100%',
                                    maxWidth:760,
                                    padding: bgImage ? 24 : 12,
                                    background: bgImage ? 'transparent' : (blockColor || '#ffffff'),
                                    borderRadius: bgImage ? 0 : 8,
                                    textAlign:'center'
                                }}>
                                    {avatarPreview && (
                                        <img src={avatarPreview} alt="avatar preview" className="avatar-preview-large avatar-circle" style={{
                                            boxShadow: `0 10px 30px ${hexToRgba(nameColor,0.28)}`,
                                            border: `4px solid ${hexToRgba(nameColor,0.12)}`
                                        }} />
                                    )}
                                    <div className="preview-username" style={{
                                            fontSize:28,
                                            fontWeight:700,
                                            color: nameColor || '#ffffff',
                                            textShadow: buildTextGlow(nameColor || '#ffffff')
                                    }}>
                                        {username || 'username'}
                                    </div>
                                    <div className="preview-description" style={{color: descColor || (hexLuminance(bgColor || '#050505') > 0.6 ? '#111' : '#fff')}}>{description}</div>
                                </div>
                            </div>
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
    );
};

export default Customize;