import React, { useState } from 'react'

/**
 * VtreeCustomize: Linktree-style customization interface
 * Features: Header, Theme, Wallpaper, Text, Buttons, Colors
 */
export default function VtreeCustomize({ 
  profile,
  onUpdate,
  onSave,
  profiles = [],
  currentProfileId,
  onProfileSwitch,
  navigate
}) {
  const [activeTab, setActiveTab] = useState('header')
  const [showFontModal, setShowFontModal] = useState(false)
  const [fontModalType, setFontModalType] = useState('title') // 'title' or 'page'
  const [showVcreateModal, setShowVcreateModal] = useState(false)
  const [vcreatePrompt, setVcreatePrompt] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Profile settings state
  const [profileImage, setProfileImage] = useState(profile.profileImage || '')
  const [profileImageLayout, setProfileImageLayout] = useState(profile.profileImageLayout || 'classic')
  const [titleStyle, setTitleStyle] = useState(profile.titleStyle || 'text')
  const [titleText, setTitleText] = useState(profile.displayName || '@username')
  const [titleFont, setTitleFont] = useState(profile.titleFont || 'DM Sans')
  const [titleColor, setTitleColor] = useState(profile.nameColor || '#ffffff')
  const [titleSize, setTitleSize] = useState(profile.titleSize || 'small')
  
  // Wallpaper settings
  const [wallpaperStyle, setWallpaperStyle] = useState(profile.wallpaperStyle || 'fill')
  const [wallpaperColor, setWallpaperColor] = useState(profile.bgColor || '#808080')
  const [wallpaperImage, setWallpaperImage] = useState(profile.wallpaperImage || '')
  const [overlayOpacity, setOverlayOpacity] = useState(profile.overlayOpacity || 0)
  
  // Text settings
  const [pageFont, setPageFont] = useState(profile.pageFont || 'DM Sans')
  const [pageTextColor, setPageTextColor] = useState(profile.pageTextColor || '#ffffff')
  const [buttonTextColor, setButtonTextColor] = useState(profile.buttonTextColor || '#000000')
  
  // Button settings
  const [buttonStyle, setButtonStyle] = useState(profile.buttonStyle || 'solid')
  const [buttonCorners, setButtonCorners] = useState(profile.buttonCorners || 'round')
  const [buttonShadow, setButtonShadow] = useState(profile.buttonShadow || 'none')
  const [buttonColor, setButtonColor] = useState(profile.buttonColor || '#ffffff')
  
  // Links settings
  const socialLinks = profile.socialLinks || {}

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result)
        handleUpdate({ profileImage: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const tabs = [
    { id: 'links', icon: 'bi-link-45deg', label: 'Links' },
    { id: 'header', icon: 'bi-card-heading', label: 'Header' },
    { id: 'wallpaper', icon: 'bi-image', label: 'Wallpaper' },
    { id: 'text', icon: 'bi-fonts', label: 'Text' },
    { id: 'buttons', icon: 'bi-ui-checks', label: 'Buttons' },
    { id: 'colors', icon: 'bi-palette2', label: 'Colors' }
  ]

  const handleUpdate = (updates) => {
    onUpdate({
      ...profile,
      ...updates
    })
  }

  const fonts = {
    suggested: [
      'Inter', 'Poppins', 'Roboto', 'Montserrat',
      'Open Sans', 'Lato', 'Raleway', 'Nunito',
      'Work Sans', 'DM Sans', 'Plus Jakarta Sans', 'Outfit',
      'Urbanist', 'Manrope', 'IBM Plex Sans', 'Archivo',
      'Playfair Display', 'Merriweather', 'Crimson Text', 'Cormorant',
      'Bebas Neue', 'Righteous', 'Russo One', 'Bungee',
      'Pacifico', 'Dancing Script', 'Permanent Marker', 'Caveat'
    ],
    other: [
      'Albert Sans', 'Space Grotesk', 'Epilogue', 'Red Hat Display',
      'Rubik', 'Syne', 'Karla', 'Jost',
      'Barlow', 'Figtree', 'Quicksand', 'Lexend',
      'IBM Plex Serif', 'Lora', 'Noto Serif', 'PT Serif',
      'Roboto Serif', 'Source Serif Pro', 'Bitter', 'Spectral',
      'IBM Plex Mono', 'Space Mono', 'JetBrains Mono', 'Fira Code',
      'Orbitron', 'Exo 2', 'Audiowide', 'Press Start 2P'
    ]
  }

  // Style Presets for Vcreate AI
  const stylePresets = {
    professional: {
      name: 'Professional',
      icon: 'ðŸ’¼',
      description: 'Clean and trustworthy for business',
      config: {
        profileImageLayout: 'classic',
        titleFont: 'Inter',
        pageFont: 'Inter',
        buttonStyle: 'solid',
        buttonCorners: 33,
        buttonShadow: 25,
        buttonColor: '#2563eb',
        buttonTextColor: '#ffffff',
        bgColor: '#1e293b',
        pageTextColor: '#ffffff',
        titleColor: '#ffffff'
      }
    },
    creative: {
      name: 'Creative',
      icon: 'ðŸŽ¨',
      description: 'Bold and colorful for creators',
      config: {
        profileImageLayout: 'vfull',
        titleFont: 'Righteous',
        pageFont: 'Poppins',
        buttonStyle: 'solid',
        buttonCorners: 67,
        buttonShadow: 50,
        buttonColor: '#ec4899',
        buttonTextColor: '#ffffff',
        bgColor: '#7c3aed',
        pageTextColor: '#ffffff',
        titleColor: '#ffffff'
      }
    },
    minimal: {
      name: 'Minimal',
      icon: 'âœ¨',
      description: 'Simple and elegant design',
      config: {
        profileImageLayout: 'classic',
        titleFont: 'DM Sans',
        pageFont: 'DM Sans',
        buttonStyle: 'outline',
        buttonCorners: 33,
        buttonShadow: 0,
        buttonColor: '#000000',
        buttonTextColor: '#000000',
        bgColor: '#f5f5f5',
        pageTextColor: '#000000',
        titleColor: '#000000'
      }
    },
    bold: {
      name: 'Bold',
      icon: 'âš¡',
      description: 'Eye-catching and dynamic',
      config: {
        profileImageLayout: 'vfull',
        titleFont: 'Bebas Neue',
        pageFont: 'Roboto',
        buttonStyle: 'solid',
        buttonCorners: 0,
        buttonShadow: 75,
        buttonColor: '#dc2626',
        buttonTextColor: '#ffffff',
        bgColor: '#0a0a0a',
        pageTextColor: '#ffffff',
        titleColor: '#ffffff'
      }
    },
    elegant: {
      name: 'Elegant',
      icon: 'ðŸ‘‘',
      description: 'Sophisticated and refined',
      config: {
        profileImageLayout: 'classic',
        titleFont: 'Playfair Display',
        pageFont: 'Lora',
        buttonStyle: 'solid',
        buttonCorners: 67,
        buttonShadow: 25,
        buttonColor: '#92400e',
        buttonTextColor: '#ffffff',
        bgColor: '#fef3c7',
        pageTextColor: '#78350f',
        titleColor: '#78350f'
      }
    }
  }

  const applyPreset = (presetKey) => {
    const preset = stylePresets[presetKey]
    if (!preset) return

    const config = preset.config
    
    // Update all states
    setProfileImageLayout(config.profileImageLayout)
    setTitleFont(config.titleFont)
    setPageFont(config.pageFont)
    setButtonStyle(config.buttonStyle)
    setButtonCorners(config.buttonCorners)
    setButtonShadow(config.buttonShadow)
    setButtonColor(config.buttonColor)
    setButtonTextColor(config.buttonTextColor)
    setWallpaperColor(config.bgColor)
    setPageTextColor(config.pageTextColor)
    setTitleColor(config.titleColor)

    // Update profile
    handleUpdate({
      profileImageLayout: config.profileImageLayout,
      titleFont: config.titleFont,
      pageFont: config.pageFont,
      buttonStyle: config.buttonStyle,
      buttonCorners: config.buttonCorners,
      buttonShadow: config.buttonShadow,
      buttonColor: config.buttonColor,
      buttonTextColor: config.buttonTextColor,
      bgColor: config.bgColor,
      pageTextColor: config.pageTextColor,
      titleColor: config.titleColor,
      nameColor: config.titleColor
    })

    setSelectedPreset(presetKey)
    
    // Show success notification
    setSuccessMessage(`à¸ªà¸£à¹‰à¸²à¸‡à¹‚à¸›à¸£à¹„à¸Ÿà¸¥à¹Œà¸ªà¹„à¸•à¸¥à¹Œ "${preset.name}" à¸ªà¸³à¹€à¸£à¹‡à¸ˆ!`)
    setShowSuccessNotification(true)
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false)
    }, 3000)
  }

  // AI Generation from prompt (Thai & English support)
  const generateFromPrompt = () => {
    if (!vcreatePrompt.trim()) {
      alert('à¸à¸£à¸¸à¸“à¸²à¹ƒà¸ªà¹ˆà¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸ªà¹„à¸•à¸¥à¹Œà¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸à¹ˆà¸­à¸™à¸„à¸£à¸±à¸š / Please describe your desired style first')
      return
    }

    const prompt = vcreatePrompt.toLowerCase()
    console.log('Analyzing prompt:', prompt)
    
    // Color palette mapping (Thai & English) - All colors supported
    const colorPalettes = {
      pink: {
        keywords: ['pink', 'à¸Šà¸¡à¸žà¸¹', 'rosa'],
        colors: { bg: '#ec4899', button: '#f472b6', text: '#ffffff' }
      },
      blue: {
        keywords: ['blue', 'à¸™à¹‰à¸³à¹€à¸‡à¸´à¸™', 'à¸Ÿà¹‰à¸²'],
        colors: { bg: '#2563eb', button: '#3b82f6', text: '#ffffff' }
      },
      purple: {
        keywords: ['purple', 'violet', 'à¸¡à¹ˆà¸§à¸‡', 'à¹„à¸§à¹‚à¸­à¹€à¸¥à¸•'],
        colors: { bg: '#7c3aed', button: '#8b5cf6', text: '#ffffff' }
      },
      green: {
        keywords: ['green', 'à¹€à¸‚à¸µà¸¢à¸§'],
        colors: { bg: '#059669', button: '#10b981', text: '#ffffff' }
      },
      red: {
        keywords: ['red', 'à¹à¸”à¸‡'],
        colors: { bg: '#dc2626', button: '#ef4444', text: '#ffffff' }
      },
      orange: {
        keywords: ['orange', 'à¸ªà¹‰à¸¡'],
        colors: { bg: '#ea580c', button: '#f97316', text: '#ffffff' }
      },
      yellow: {
        keywords: ['yellow', 'à¹€à¸«à¸¥à¸·à¸­à¸‡'],
        colors: { bg: '#eab308', button: '#fbbf24', text: '#000000' }
      },
      brown: {
        keywords: ['brown', 'à¸™à¹‰à¸³à¸•à¸²à¸¥', 'coffee', 'à¸à¸²à¹à¸Ÿ'],
        colors: { bg: '#78350f', button: '#92400e', text: '#ffffff' }
      },
      black: {
        keywords: ['black', 'dark', 'à¸”à¸³', 'à¸¡à¸·à¸”', 'à¹€à¸‚à¹‰à¸¡', 'à¸”à¸²à¸£à¹Œà¸„'],
        colors: { bg: '#0a0a0a', button: '#1f1f1f', text: '#ffffff' }
      },
      white: {
        keywords: ['white', 'light', 'à¸‚à¸²à¸§', 'à¸ªà¸§à¹ˆà¸²à¸‡', 'à¸­à¹ˆà¸­à¸™'],
        colors: { bg: '#f5f5f5', button: '#e5e5e5', text: '#000000' }
      },
      gold: {
        keywords: ['gold', 'à¸—à¸­à¸‡', 'golden'],
        colors: { bg: '#fef3c7', button: '#92400e', text: '#78350f' }
      },
      silver: {
        keywords: ['silver', 'à¹€à¸‡à¸´à¸™', 'grey', 'gray', 'à¹€à¸—à¸²'],
        colors: { bg: '#6b7280', button: '#9ca3af', text: '#ffffff' }
      },
      teal: {
        keywords: ['teal', 'cyan', 'à¹€à¸‚à¸µà¸¢à¸§à¸™à¹‰à¸³à¸—à¸°à¹€à¸¥', 'à¸Ÿà¹‰à¸²à¹€à¸‚à¸µà¸¢à¸§'],
        colors: { bg: '#0891b2', button: '#06b6d4', text: '#ffffff' }
      },
      indigo: {
        keywords: ['indigo', 'à¸„à¸£à¸²à¸¡', 'à¸™à¹‰à¸³à¹€à¸‡à¸´à¸™à¹€à¸‚à¹‰à¸¡'],
        colors: { bg: '#4f46e5', button: '#6366f1', text: '#ffffff' }
      },
      lime: {
        keywords: ['lime', 'à¹€à¸‚à¸µà¸¢à¸§à¸¡à¸°à¸™à¸²à¸§', 'à¹€à¸‚à¸µà¸¢à¸§à¸­à¹ˆà¸­à¸™'],
        colors: { bg: '#65a30d', button: '#84cc16', text: '#ffffff' }
      },
      emerald: {
        keywords: ['emerald', 'à¹€à¸‚à¸µà¸¢à¸§à¸¡à¸£à¸à¸•'],
        colors: { bg: '#047857', button: '#059669', text: '#ffffff' }
      },
      rose: {
        keywords: ['rose', 'à¸Šà¸¡à¸žà¸¹à¸à¸¸à¸«à¸¥à¸²à¸š'],
        colors: { bg: '#e11d48', button: '#f43f5e', text: '#ffffff' }
      },
      fuchsia: {
        keywords: ['fuchsia', 'magenta', 'à¸šà¸²à¸™à¹€à¸¢à¹‡à¸™', 'à¸Šà¸¡à¸žà¸¹à¸¡à¹ˆà¸§à¸‡'],
        colors: { bg: '#c026d3', button: '#d946ef', text: '#ffffff' }
      },
      sky: {
        keywords: ['sky', 'à¸Ÿà¹‰à¸²à¸­à¹ˆà¸­à¸™', 'skyblue'],
        colors: { bg: '#0284c7', button: '#0ea5e9', text: '#ffffff' }
      },
      violet: {
        keywords: ['violet', 'à¸¡à¹ˆà¸§à¸‡à¸­à¹ˆà¸­à¸™'],
        colors: { bg: '#7c3aed', button: '#8b5cf6', text: '#ffffff' }
      },
      amber: {
        keywords: ['amber', 'à¹€à¸«à¸¥à¸·à¸­à¸‡à¸­à¸³à¸žà¸±à¸™'],
        colors: { bg: '#d97706', button: '#f59e0b', text: '#ffffff' }
      },
      mint: {
        keywords: ['mint', 'à¹€à¸‚à¸µà¸¢à¸§à¸¡à¸´à¹‰à¸™à¸•à¹Œ', 'à¹€à¸‚à¸µà¸¢à¸§à¸žà¸²à¸ªà¹€à¸—à¸¥'],
        colors: { bg: '#6ee7b7', button: '#34d399', text: '#000000' }
      },
      lavender: {
        keywords: ['lavender', 'à¸¡à¹ˆà¸§à¸‡à¸¥à¸²à¹€à¸§à¸™à¹€à¸”à¸­à¸£à¹Œ', 'à¸¡à¹ˆà¸§à¸‡à¸žà¸²à¸ªà¹€à¸—à¸¥'],
        colors: { bg: '#a78bfa', button: '#8b5cf6', text: '#ffffff' }
      },
      peach: {
        keywords: ['peach', 'à¸ªà¹‰à¸¡à¸žà¸µà¸Š', 'à¸ªà¹‰à¸¡à¸­à¹ˆà¸­à¸™'],
        colors: { bg: '#fb923c', button: '#f97316', text: '#ffffff' }
      },
      navy: {
        keywords: ['navy', 'à¸™à¹‰à¸³à¹€à¸‡à¸´à¸™à¸à¸£à¸¡', 'à¸™à¹‰à¸³à¹€à¸‡à¸´à¸™à¹€à¸‚à¹‰à¸¡'],
        colors: { bg: '#1e3a8a', button: '#1e40af', text: '#ffffff' }
      },
      maroon: {
        keywords: ['maroon', 'à¹à¸”à¸‡à¹€à¸‚à¹‰à¸¡', 'à¹à¸”à¸‡à¸„à¸¥à¹‰à¸³'],
        colors: { bg: '#7f1d1d', button: '#991b1b', text: '#ffffff' }
      },
      olive: {
        keywords: ['olive', 'à¹€à¸‚à¸µà¸¢à¸§à¸¡à¸°à¸à¸­à¸'],
        colors: { bg: '#65a30d', button: '#84cc16', text: '#ffffff' }
      },
      coral: {
        keywords: ['coral', 'à¸›à¸°à¸à¸²à¸£à¸±à¸‡', 'à¸ªà¹‰à¸¡à¹à¸”à¸‡'],
        colors: { bg: '#f87171', button: '#fb923c', text: '#ffffff' }
      },
      turquoise: {
        keywords: ['turquoise', 'à¹€à¸‚à¸µà¸¢à¸§à¹€à¸—à¸­à¸£à¹Œà¸„à¸§à¸­à¸¢à¸‹à¹Œ'],
        colors: { bg: '#14b8a6', button: '#2dd4bf', text: '#ffffff' }
      },
      beige: {
        keywords: ['beige', 'à¹€à¸šà¸ˆ', 'à¸„à¸£à¸µà¸¡', 'cream'],
        colors: { bg: '#fef3c7', button: '#fde68a', text: '#78350f' }
      }
    }

    // Style/Mood keywords
    const styleKeywords = {
      professional: ['professional', 'business', 'corporate', 'formal', 'work', 'à¸¡à¸·à¸­à¸­à¸²à¸Šà¸µà¸ž', 'à¸˜à¸¸à¸£à¸à¸´à¸ˆ', 'à¸—à¸³à¸‡à¸²à¸™', 'à¸šà¸£à¸´à¸©à¸±à¸—', 'à¸­à¸­à¸Ÿà¸Ÿà¸´à¸¨'],
      creative: ['creative', 'colorful', 'fun', 'playful', 'artist', 'designer', 'à¸ªà¸£à¹‰à¸²à¸‡à¸ªà¸£à¸£à¸„à¹Œ', 'à¸ªà¸µà¸ªà¸±à¸™', 'à¸ªà¸”à¹ƒà¸ª', 'à¸ªà¸™à¸¸à¸', 'à¸¨à¸´à¸¥à¸›à¸´à¸™', 'à¸”à¸µà¹„à¸‹à¹€à¸™à¸­à¸£à¹Œ', 'à¸„à¸­à¸™à¹€à¸—à¸™à¸•à¹Œ'],
      minimal: ['minimal', 'minimalist', 'simple', 'clean', 'basic', 'à¸¡à¸´à¸™à¸´à¸¡à¸­à¸¥', 'à¹€à¸£à¸µà¸¢à¸šà¸‡à¹ˆà¸²à¸¢', 'à¸ªà¸°à¸­à¸²à¸”', 'à¹€à¸£à¸µà¸¢à¸š'],
      bold: ['bold', 'strong', 'powerful', 'intense', 'edgy', 'cool', 'à¹‚à¸”à¸”à¹€à¸”à¹ˆà¸™', 'à¹à¸£à¸‡', 'à¸—à¸£à¸‡à¸žà¸¥à¸±à¸‡', 'à¹€à¸—à¹ˆ', 'à¸„à¸¹à¸¥'],
      elegant: ['elegant', 'luxury', 'sophisticated', 'premium', 'classy', 'refined', 'à¸«à¸£à¸¹à¸«à¸£à¸²', 'à¸ªà¸‡à¹ˆà¸²à¸‡à¸²à¸¡', 'à¸£à¸°à¸”à¸±à¸š', 'à¸›à¸£à¸°à¸“à¸µà¸•', 'à¸„à¸¥à¸²à¸ªà¸ªà¸´à¸'],
      cute: ['cute', 'kawaii', 'sweet', 'lovely', 'adorable', 'à¸™à¹ˆà¸²à¸£à¸±à¸', 'à¸«à¸§à¸²à¸™', 'à¸„à¸²à¸§à¸²à¸­à¸µà¹‰'],
      modern: ['modern', 'contemporary', 'trendy', 'hip', 'à¸—à¸±à¸™à¸ªà¸¡à¸±à¸¢', 'à¹‚à¸¡à¹€à¸”à¸´à¸£à¹Œà¸™', 'à¸®à¸´à¸›'],
      vintage: ['vintage', 'retro', 'classic', 'old school', 'à¸§à¸´à¸™à¹€à¸—à¸ˆ', 'à¹€à¸£à¹‚à¸—à¸£', 'à¹‚à¸šà¸£à¸²à¸“']
    }

    // Detect color
    let selectedColor = null
    Object.entries(colorPalettes).forEach(([colorName, colorData]) => {
      colorData.keywords.forEach(keyword => {
        if (prompt.includes(keyword)) {
          selectedColor = colorData.colors
        }
      })
    })

    // Detect style
    let styleScore = {}
    Object.entries(styleKeywords).forEach(([style, keywords]) => {
      let score = 0
      keywords.forEach(keyword => {
        if (prompt.includes(keyword)) score++
      })
      if (score > 0) styleScore[style] = score
    })

    // Get best matching style
    let bestStyle = Object.keys(styleScore).reduce((a, b) => 
      styleScore[a] > styleScore[b] ? a : b, 'professional'
    )

    // Build custom config
    const config = {
      profileImageLayout: ['bold', 'creative', 'modern'].includes(bestStyle) ? 'vfull' : 'classic',
      titleFont: {
        professional: 'Inter',
        creative: 'Righteous',
        minimal: 'DM Sans',
        bold: 'Bebas Neue',
        elegant: 'Playfair Display',
        cute: 'Caveat',
        modern: 'Urbanist',
        vintage: 'Old Standard TT'
      }[bestStyle] || 'Inter',
      pageFont: {
        professional: 'Inter',
        creative: 'Poppins',
        minimal: 'DM Sans',
        bold: 'Roboto',
        elegant: 'Lora',
        cute: 'Quicksand',
        modern: 'Outfit',
        vintage: 'Merriweather'
      }[bestStyle] || 'Inter',
      buttonStyle: ['minimal', 'vintage'].includes(bestStyle) ? 'outline' : 'solid',
      buttonCorners: {
        professional: 33,
        creative: 67,
        minimal: 33,
        bold: 0,
        elegant: 67,
        cute: 67,
        modern: 33,
        vintage: 33
      }[bestStyle] || 33,
      buttonShadow: {
        professional: 25,
        creative: 50,
        minimal: 0,
        bold: 75,
        elegant: 25,
        cute: 25,
        modern: 50,
        vintage: 0
      }[bestStyle] || 25,
      buttonColor: selectedColor?.button || '#2563eb',
      buttonTextColor: selectedColor?.text || '#ffffff',
      bgColor: selectedColor?.bg || '#1e293b',
      pageTextColor: selectedColor?.text || '#ffffff',
      titleColor: selectedColor?.text || '#ffffff'
    }

    console.log('Detected style:', bestStyle)
    console.log('Detected color:', selectedColor ? 'Custom' : 'Default')
    console.log('Generated config:', config)

    // Apply custom config
    setProfileImageLayout(config.profileImageLayout)
    setTitleFont(config.titleFont)
    setPageFont(config.pageFont)
    setButtonStyle(config.buttonStyle)
    setButtonCorners(config.buttonCorners)
    setButtonShadow(config.buttonShadow)
    setButtonColor(config.buttonColor)
    setButtonTextColor(config.buttonTextColor)
    setWallpaperColor(config.bgColor)
    setPageTextColor(config.pageTextColor)
    setTitleColor(config.titleColor)

    handleUpdate({
      profileImageLayout: config.profileImageLayout,
      titleFont: config.titleFont,
      pageFont: config.pageFont,
      buttonStyle: config.buttonStyle,
      buttonCorners: config.buttonCorners,
      buttonShadow: config.buttonShadow,
      buttonColor: config.buttonColor,
      buttonTextColor: config.buttonTextColor,
      bgColor: config.bgColor,
      pageTextColor: config.pageTextColor,
      titleColor: config.titleColor,
      nameColor: config.titleColor
    })

    // Show success notification
    const styleName = bestStyle.charAt(0).toUpperCase() + bestStyle.slice(1)
    const colorInfo = selectedColor ? ' à¸žà¸£à¹‰à¸­à¸¡à¸ªà¸µà¸—à¸µà¹ˆà¸à¸³à¸«à¸™à¸”à¹€à¸­à¸‡' : ''
    setSuccessMessage(`à¸ªà¸£à¹‰à¸²à¸‡à¹‚à¸›à¸£à¹„à¸Ÿà¸¥à¹Œà¸ªà¹„à¸•à¸¥à¹Œ "${styleName}"${colorInfo} à¸ªà¸³à¹€à¸£à¹‡à¸ˆ!`)
    setShowSuccessNotification(true)
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false)
    }, 3000)
  }

  return (
    <div className="vtree-customize">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000
        }}>
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes spin {
              from { transform: translate(-50%, -50%) rotate(0deg); }
              to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}</style>
          
          <div style={{
            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.1)',
            textAlign: 'center',
            minWidth: '320px',
            border: '1px solid rgba(255,255,255,0.2)',
            position: 'relative',
            animation: showSuccessNotification ? 'fadeIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s' : 'none'
          }}>
            {/* V Logo with spinning arc effect */}
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 20px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Spinning arc */}
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  animation: 'spin 2s linear infinite'
                }}
              >
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#arcGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="140 180"
                  filter="drop-shadow(0 0 8px rgba(255,255,255,0.8))"
                />
                <defs>
                  <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
                    <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* V Logo */}
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1,
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))'
                }}
              >
                <text
                  x="60"
                  y="75"
                  fontSize="80"
                  fontWeight="900"
                  fontFamily="Arial, sans-serif"
                  fill="url(#vGradient)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  V
                </text>
                <defs>
                  <linearGradient id="vGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#a0a0a0', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Success message */}
            <p style={{
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              margin: '0',
              textShadow: '0 2px 10px rgba(255,255,255,0.3)'
            }}>
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Vcreate AI Modal */}
      {showVcreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
              padding: '24px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(255,255,255,0.1)'
            }}>
              {/* Shine effect */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                animation: 'shine 3s infinite',
                pointerEvents: 'none'
              }} />
              <style>{`
                @keyframes shine {
                  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                }
              `}</style>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1" style={{ fontWeight: '700' }}>Vcreate AI Assistant</h4>
                  <p className="mb-0" style={{ opacity: 0.9, fontSize: '14px' }}>Let AI design your perfect profile</p>
                </div>
                <button 
                  onClick={() => setShowVcreateModal(false)}
                  style={{
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.4)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                  Ã—
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* AI Prompt Section */}
              <div className="mb-4">
                <label className="form-label fw-semibold mb-2">
                  Describe your style
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡: à¸‚à¸­à¹à¸šà¸šà¹€à¸—à¹ˆà¹† à¸„à¸¹à¸¥à¹† à¹‚à¸—à¸™à¸ªà¸µà¸”à¸³ | à¸­à¸¢à¸²à¸à¹„à¸”à¹‰à¸™à¹ˆà¸²à¸£à¸±à¸à¹† à¹‚à¸—à¸™à¸Šà¸¡à¸žà¸¹ | à¹ƒà¸«à¹‰à¸¡à¸±à¸™à¸”à¸¹à¸¡à¸·à¸­à¸­à¸²à¸Šà¸µà¸ž à¸ªà¸µà¸™à¹‰à¸³à¹€à¸‡à¸´à¸™"
                  value={vcreatePrompt}
                  onChange={(e) => setVcreatePrompt(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  style={{
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    padding: '12px',
                    fontSize: '14px',
                    resize: 'none'
                  }}
                />
                <button 
                  className="btn btn-primary mt-2 w-100"
                  style={{
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #000000 0%, #2a2a2a 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 0 20px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 0 30px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 0 20px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                  onClick={() => {
                    generateFromPrompt()
                  }}
                >
                  Generate with AI
                </button>
              </div>

              <div className="text-center my-3">
                <span className="text-muted small">â”€â”€ OR CHOOSE A PRESET â”€â”€</span>
              </div>

              {/* Style Presets */}
              <div className="row g-3">
                {Object.entries(stylePresets).map(([key, preset]) => (
                  <div key={key} className="col-md-6">
                    <button
                      className={`w-100 p-3 ${selectedPreset === key ? 'border-primary' : ''}`}
                      style={{
                        border: selectedPreset === key ? '3px solid #667eea' : '2px solid #e5e7eb',
                        borderRadius: '16px',
                        background: selectedPreset === key ? '#f0f4ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onClick={() => applyPreset(key)}
                      onMouseEnter={(e) => {
                        if (selectedPreset !== key) {
                          e.currentTarget.style.background = '#f9fafb'
                          e.currentTarget.style.borderColor = '#d1d5db'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPreset !== key) {
                          e.currentTarget.style.background = 'white'
                          e.currentTarget.style.borderColor = '#e5e7eb'
                        }
                      }}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div style={{ fontSize: '32px' }}>{preset.icon}</div>
                        <div>
                          <div className="fw-semibold mb-1">{preset.name}</div>
                          <div className="text-muted small">{preset.description}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Font Modal */}
      {showFontModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setShowFontModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h5 className="mb-0">Title Font</h5>
              <button 
                onClick={() => setShowFontModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px'
                }}
              >
                Ã—
              </button>
            </div>

            {/* Customize title font toggle */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Customize title font</span>
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" defaultChecked />
              </div>
            </div>

            {/* Font List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* Suggested */}
              <h6 className="mb-3">Suggested</h6>
              <div className="row g-2 mb-4">
                {fonts.suggested.map(font => (
                  <div key={font} className="col-6">
                    <button
                      className={`btn w-100 ${(fontModalType === 'title' ? titleFont : pageFont) === font ? 'btn-dark' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        if (fontModalType === 'title') {
                          setTitleFont(font)
                          handleUpdate({ titleFont: font })
                        } else {
                          setPageFont(font)
                          handleUpdate({ pageFont: font })
                        }
                      }}
                      style={{ 
                        borderRadius: '12px',
                        padding: '12px',
                        fontFamily: font,
                        textAlign: 'left'
                      }}
                    >
                      {font}
                    </button>
                  </div>
                ))}
              </div>

              {/* Other */}
              <h6 className="mb-3">Other</h6>
              <div className="row g-2">
                {fonts.other.map(font => (
                  <div key={font} className="col-6">
                    <button
                      className={`btn w-100 ${(fontModalType === 'title' ? titleFont : pageFont) === font ? 'btn-dark' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        if (fontModalType === 'title') {
                          setTitleFont(font)
                          handleUpdate({ titleFont: font })
                        } else {
                          setPageFont(font)
                          handleUpdate({ pageFont: font })
                        }
                      }}
                      style={{ 
                        borderRadius: '12px',
                        padding: '12px',
                        fontFamily: font,
                        textAlign: 'left'
                      }}
                    >
                      {font}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="vtree-nav bg-white border-bottom" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100,
        padding: '12px 0'
      }}>
        <div className="container-fluid px-4">
          <div className="d-flex justify-content-between align-items-center" style={{ position: 'relative' }}>
            {/* Left: Vcreate AI Button */}
            <button
              onClick={() => setShowVcreateModal(true)}
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: '700',
                fontSize: '15px',
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.4), 0 4px 15px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                zIndex: 10,
                position: 'relative',
                overflow: 'hidden',
                color: '#ffffff',
                textShadow: '0 2px 8px rgba(255, 255, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 0 50px rgba(255, 255, 255, 0.7), 0 8px 25px rgba(255, 255, 255, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.4), 0 4px 15px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              {/* Shine effect */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'vcreateShine 3s infinite',
                pointerEvents: 'none'
              }} />
              <style>{`
                @keyframes vcreateShine {
                  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                }
              `}</style>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              <span style={{ position: 'relative', zIndex: 1 }}>Vcreate</span>
            </button>

            {/* Center: Tab Navigation */}
            <div className="d-flex gap-2 overflow-auto" style={{
              flexWrap: 'nowrap',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn btn-sm d-flex align-items-center gap-2 ${
                    activeTab === tab.id ? 'btn-dark' : 'btn-outline-secondary'
                  }`}
                  style={{ 
                    whiteSpace: 'nowrap',
                    padding: '8px 16px',
                    borderRadius: '8px'
                  }}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Right: Profile Selector + Save */}
            {profiles && profiles.length > 0 && (
              <div className="d-flex align-items-center gap-2 ms-auto" style={{ zIndex: 10 }}>
                <label className="mb-0 small text-muted">Editing:</label>
                <select 
                  className="form-select form-select-sm" 
                  style={{ width: 'auto', minWidth: '200px' }}
                  value={currentProfileId || ''}
                  onChange={(e) => onProfileSwitch && onProfileSwitch(e)}
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-dark btn-sm"
                  style={{
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
                    border: '2px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 0 20px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
                    textShadow: '0 0 10px rgba(255,255,255,0.5)',
                    fontWeight: 600,
                    marginLeft: '8px',
                    padding: '6px 18px'
                  }}
                  onClick={() => {
                    if (onSave) onSave();
                    setShowSuccessNotification(true)
                    setTimeout(() => setShowSuccessNotification(false), 2000)
                  }}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="vtree-content p-4" style={{ paddingBottom: '100px' }}>
        <div className="row g-4">
          {/* Left Column: Settings */}
          <div className="col-lg-6"style={{ paddingLeft: '40px' }}>
          
          {/* Header Tab */}
          {activeTab === 'header' && (
            <div className="vtree-section">
              <h5 className="mb-3" style={{ color: '#666' }}>Header</h5>
              <div className="bg-white rounded p-4" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              
              {/* Profile Image Upload */}
              <div className="mb-4">
                <label className="form-label">Profile image</label>
                <div className="d-flex align-items-center gap-3">
                  {/* Profile Image Preview */}
                  <div 
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }} 
                      />
                    ) : (
                      <i className="bi bi-person-fill" style={{ fontSize: '40px', color: '#999' }}></i>
                    )}
                  </div>

                  {/* Add Button */}
                  <label 
                    className="btn btn-dark rounded-pill px-4"
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-plus-lg me-2"></i>
                    Add
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Profile Image Layout */}
              <div className="mb-4">
                <label className="form-label">Profile image layout</label>
                <div className="d-flex gap-3">
                  <button
                    className={`btn ${profileImageLayout === 'classic' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                    onClick={() => {
                      setProfileImageLayout('classic')
                      handleUpdate({ profileImageLayout: 'classic' })
                    }}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    Classic
                  </button>
                  <button
                    className={`btn ${profileImageLayout === 'vfull' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                    onClick={() => {
                      setProfileImageLayout('vfull')
                      handleUpdate({ profileImageLayout: 'vfull' })
                    }}
                  >
                    <i className="bi bi-image me-2"></i>
                    Vfull
                  </button>
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-4">
                <h6 className="mb-3">Title</h6>
                
                {/* Title Style */}
                <div className="mb-3">
                  <label className="form-label">Title style</label>
                  <div className="d-flex gap-3">
                    <button
                      className={`btn ${titleStyle === 'text' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setTitleStyle('text')
                        handleUpdate({ titleStyle: 'text' })
                      }}
                    >
                      <i className="bi bi-fonts me-2"></i>
                      Text
                    </button>
                    <button
                      className={`btn ${titleStyle === 'logo' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setTitleStyle('logo')
                        handleUpdate({ titleStyle: 'logo' })
                      }}
                    >
                      <i className="bi bi-image me-2"></i>
                      Logo
                    </button>
                  </div>
                </div>

                {/* Title Text */}
                <div className="mb-3">
                  <label className="form-label">Title text</label>
                  <input
                    type="text"
                    className="form-control"
                    value={titleText}
                    onChange={(e) => {
                      setTitleText(e.target.value)
                      handleUpdate({ displayName: e.target.value })
                    }}
                    placeholder="@username"
                  />
                </div>

                {/* Title Font */}
                <div className="mb-3">
                  <label className="form-label">Title font</label>
                  <button 
                    className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                    onClick={() => {
                      setFontModalType('title')
                      setShowFontModal(true)
                    }}
                  >
                    <span>{titleFont}</span>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>

                {/* Title Color */}
                <div className="mb-3">
                  <label className="form-label">Title color</label>
                  <input
                    type="color"
                    className="form-control form-control-color w-100"
                    value={titleColor}
                    onChange={(e) => {
                      setTitleColor(e.target.value)
                      handleUpdate({ nameColor: e.target.value })
                    }}
                    style={{ height: '50px' }}
                  />
                </div>

                {/* Title Size */}
                <div className="mb-3">
                  <label className="form-label">Title size</label>
                  <div className="d-flex gap-3">
                    <button
                      className={`btn ${titleSize === 'small' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setTitleSize('small')
                        handleUpdate({ titleSize: 'small' })
                      }}
                    >
                      Small
                    </button>
                    <button
                      className={`btn ${titleSize === 'large' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setTitleSize('large')
                        handleUpdate({ titleSize: 'large' })
                      }}
                    >
                      Large
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Wallpaper Tab */}
          {activeTab === 'wallpaper' && (
            <div className="vtree-section">
              <h5 className="mb-3" style={{ color: '#666' }}>Wallpaper</h5>
              <div className="bg-white rounded p-4" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                
                {/* Wallpaper Style */}
                <div className="mb-4">
                  <label className="form-label">Wallpaper style</label>
                  <div className="d-flex gap-3 flex-wrap">
                    {/* Fill */}
                    <button
                      className={`btn ${wallpaperStyle === 'fill' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        setWallpaperStyle('fill')
                        handleUpdate({ wallpaperStyle: 'fill' })
                      }}
                      style={{ width: '80px', height: '100px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                    >
                      <div style={{
                        width: '100%',
                        height: '60px',
                        backgroundColor: '#808080',
                        borderRadius: '8px',
                        border: '2px solid #333'
                      }}></div>
                      <span style={{ fontSize: '12px' }}>Fill</span>
                    </button>

                    {/* Gradient */}
                    <button
                      className={`btn ${wallpaperStyle === 'gradient' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        setWallpaperStyle('gradient')
                        handleUpdate({ wallpaperStyle: 'gradient' })
                      }}
                      style={{ width: '80px', height: '100px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                    >
                      <div style={{
                        width: '100%',
                        height: '60px',
                        background: 'linear-gradient(180deg, #999 0%, #666 100%)',
                        borderRadius: '8px',
                        border: '2px solid #333'
                      }}></div>
                      <span style={{ fontSize: '12px' }}>Gradient</span>
                    </button>

                    {/* Blur */}
                    <button
                      className={`btn ${wallpaperStyle === 'blur' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        setWallpaperStyle('blur')
                        handleUpdate({ wallpaperStyle: 'blur' })
                      }}
                      style={{ width: '80px', height: '100px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                    >
                      <div style={{
                        width: '100%',
                        height: '60px',
                        backgroundColor: '#999',
                        borderRadius: '8px',
                        border: '2px solid #333',
                        filter: 'blur(4px)'
                      }}></div>
                      <span style={{ fontSize: '12px' }}>Blur</span>
                    </button>

                    {/* Image */}
                    <label
                      className={`btn ${wallpaperStyle === 'image' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      style={{ width: '80px', height: '100px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <div style={{
                        width: '100%',
                        height: '60px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        border: '2px solid #333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="bi bi-image" style={{ fontSize: '24px', color: '#666' }}></i>
                        {wallpaperStyle === 'image' && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className="bi bi-plus" style={{ fontSize: '10px', color: 'white' }}></i>
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '12px' }}>Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setWallpaperImage(reader.result)
                              setWallpaperStyle('image')
                              handleUpdate({ 
                                wallpaperStyle: 'image',
                                wallpaperImage: reader.result,
                                bgColor: reader.result
                              })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Video */}
                    <label
                      className={`btn ${wallpaperStyle === 'video' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      style={{ width: '80px', height: '100px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <div style={{
                        width: '100%',
                        height: '60px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        border: '2px solid #333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <i className="bi bi-play-circle" style={{ fontSize: '24px', color: '#666' }}></i>
                        {wallpaperStyle === 'video' && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className="bi bi-plus" style={{ fontSize: '10px', color: 'white' }}></i>
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '12px' }}>Video</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setWallpaperStyle('video')
                              handleUpdate({ 
                                wallpaperStyle: 'video',
                                wallpaperVideo: reader.result
                              })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                {/* Overlay Opacity (for Image/Video) */}
                {(wallpaperStyle === 'image' || wallpaperStyle === 'video') && (
                  <div className="mb-4">
                    <label className="form-label">Overlay</label>
                    <input
                      type="range"
                      className="form-range"
                      min="0"
                      max="100"
                      value={overlayOpacity}
                      onChange={(e) => {
                        setOverlayOpacity(Number(e.target.value))
                        handleUpdate({ overlayOpacity: Number(e.target.value) })
                      }}
                    />
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">0%</small>
                      <small className="text-muted">{overlayOpacity}%</small>
                      <small className="text-muted">100%</small>
                    </div>
                  </div>
                )}

                {/* Color Picker (for Fill/Gradient) */}
                {(wallpaperStyle === 'fill' || wallpaperStyle === 'gradient') && (
                  <div className="mb-4">
                    <label className="form-label">Color</label>
                    <div className="d-flex gap-2 mb-3">
                      {/* Suggested Colors */}
                      <button
                        onClick={() => {
                          setWallpaperColor('#808080')
                          handleUpdate({ bgColor: '#808080' })
                        }}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#808080',
                          border: wallpaperColor === '#808080' ? '3px solid #333' : '2px solid #ddd',
                          cursor: 'pointer'
                        }}
                      ></button>
                      <button
                        onClick={() => {
                          setWallpaperColor('#ffffff')
                          handleUpdate({ bgColor: '#ffffff' })
                        }}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          border: wallpaperColor === '#ffffff' ? '3px solid #333' : '2px solid #ddd',
                          cursor: 'pointer'
                        }}
                      ></button>
                      <button
                        onClick={() => {
                          setWallpaperColor('#000000')
                          handleUpdate({ bgColor: '#000000' })
                        }}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#000000',
                          border: wallpaperColor === '#000000' ? '3px solid #333' : '2px solid #ddd',
                          cursor: 'pointer'
                        }}
                      ></button>
                    </div>
                    <p className="text-muted small mb-2">Suggested colors are based on your profile image</p>
                    
                    {/* Custom Color Picker */}
                    <input
                      type="color"
                      className="form-control form-control-color w-100"
                      value={wallpaperColor}
                      onChange={(e) => {
                        setWallpaperColor(e.target.value)
                        handleUpdate({ bgColor: e.target.value })
                      }}
                      style={{ height: '50px' }}
                    />
                  </div>
                )}
                
              </div>
            </div>
          )}

          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="vtree-section">
              <h5 className="mb-3" style={{ color: '#666' }}>Text</h5>
              <div className="bg-white rounded p-4" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                
                {/* Title Font */}
                <div className="mb-3">
                  <label className="form-label">Title font</label>
                  <button 
                    className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                    onClick={() => {
                      setFontModalType('title')
                      setShowFontModal(true)
                    }}
                  >
                    <span>{titleFont}</span>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>

                {/* Title Color */}
                <div className="mb-3">
                  <label className="form-label">Title color</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={titleColor}
                      onChange={(e) => {
                        setTitleColor(e.target.value)
                        handleUpdate({ nameColor: e.target.value })
                      }}
                      style={{ width: '50px', height: '50px' }}
                    />
                    <div 
                      className="flex-fill d-flex align-items-center justify-content-center"
                      style={{ 
                        height: '50px', 
                        borderRadius: '8px', 
                        border: '1px solid #ddd',
                        backgroundColor: '#fff'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          borderRadius: '50%', 
                          backgroundColor: titleColor,
                          border: '1px solid #ddd'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Title Size */}
                <div className="mb-4">
                  <label className="form-label">Title size</label>
                  <div className="d-flex gap-3">
                    <button
                      className={`btn ${titleSize === 'small' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setTitleSize('small')
                        handleUpdate({ titleSize: 'small' })
                      }}
                    >
                      Small
                    </button>
                    <button
                      className={`btn ${titleSize === 'large' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setTitleSize('large')
                        handleUpdate({ titleSize: 'large' })
                      }}
                    >
                      Large
                    </button>
                  </div>
                </div>

                {/* Page and Buttons Section */}
                <h6 className="mb-3">Page and buttons</h6>

                {/* Font */}
                <div className="mb-3">
                  <label className="form-label">Font</label>
                  <button 
                    className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                    onClick={() => {
                      setFontModalType('page')
                      setShowFontModal(true)
                    }}
                  >
                    <span>{pageFont}</span>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>

                {/* Page Text Color */}
                <div className="mb-3">
                  <label className="form-label">Page text color</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={pageTextColor}
                      onChange={(e) => {
                        setPageTextColor(e.target.value)
                        handleUpdate({ pageTextColor: e.target.value })
                      }}
                      style={{ width: '50px', height: '50px' }}
                    />
                    <div 
                      className="flex-fill d-flex align-items-center justify-content-center"
                      style={{ 
                        height: '50px', 
                        borderRadius: '8px', 
                        border: '1px solid #ddd',
                        backgroundColor: '#fff'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          borderRadius: '50%', 
                          backgroundColor: pageTextColor,
                          border: '1px solid #ddd'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Button Text Color */}
                <div className="mb-3">
                  <label className="form-label">Button text color</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={buttonTextColor}
                      onChange={(e) => {
                        setButtonTextColor(e.target.value)
                        handleUpdate({ buttonTextColor: e.target.value })
                      }}
                      style={{ width: '50px', height: '50px' }}
                    />
                    <div 
                      className="flex-fill d-flex align-items-center justify-content-center"
                      style={{ 
                        height: '50px', 
                        borderRadius: '8px', 
                        border: '1px solid #ddd',
                        backgroundColor: '#fff'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          borderRadius: '50%', 
                          backgroundColor: buttonTextColor,
                          border: '1px solid #ddd'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Buttons Tab */}
          {activeTab === 'buttons' && (
            <div className="vtree-section">
              <h5 className="mb-3" style={{ color: '#666' }}>Buttons</h5>
              <div className="bg-white rounded p-4" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                
                {/* Button Style */}
                <div className="mb-4">
                  <label className="form-label">Button style</label>
                  <div className="d-flex gap-3">
                    <button
                      className={`btn ${buttonStyle === 'solid' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setButtonStyle('solid')
                        handleUpdate({ buttonStyle: 'solid' })
                      }}
                      style={{ 
                        height: '60px',
                        backgroundColor: buttonStyle === 'solid' ? '#333' : '#e0e0e0',
                        color: buttonStyle === 'solid' ? 'white' : '#666',
                        border: buttonStyle === 'solid' ? '2px solid #333' : '1px solid #ddd',
                        borderRadius: '12px'
                      }}
                    >
                      Solid
                    </button>
                    <button
                      className={`btn flex-fill`}
                      onClick={() => {
                        setButtonStyle('glass')
                        handleUpdate({ buttonStyle: 'glass' })
                      }}
                      style={{ 
                        height: '60px',
                        backgroundColor: buttonStyle === 'glass' ? 'rgba(255,255,255,0.3)' : '#f5f5f5',
                        color: '#666',
                        border: buttonStyle === 'glass' ? '2px solid #333' : '1px solid #ddd',
                        borderRadius: '12px',
                        backdropFilter: buttonStyle === 'glass' ? 'blur(10px)' : 'none'
                      }}
                    >
                      Glass
                      {buttonStyle === 'glass' && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ccc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="bi bi-lock" style={{ fontSize: '10px', color: 'white' }}></i>
                        </div>
                      )}
                    </button>
                    <button
                      className={`btn flex-fill`}
                      onClick={() => {
                        setButtonStyle('outline')
                        handleUpdate({ buttonStyle: 'outline' })
                      }}
                      style={{ 
                        height: '60px',
                        backgroundColor: 'transparent',
                        color: '#666',
                        border: buttonStyle === 'outline' ? '2px solid #333' : '2px solid #ddd',
                        borderRadius: '12px'
                      }}
                    >
                      Outline
                    </button>
                  </div>
                </div>

                {/* Button Options */}
                <h6 className="mb-3">Button Options</h6>

                {/* Corners */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">Corners</label>
                    <div className="d-flex gap-2">
                      <small className="text-muted">Square</small>
                      <small className="text-muted" style={{ marginLeft: '120px' }}>Round</small>
                    </div>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="100"
                    value={buttonCorners === 'square' ? 0 : buttonCorners === 'smooth' ? 50 : 100}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      let cornerValue = 'square'
                      if (val < 33) cornerValue = 'square'
                      else if (val < 67) cornerValue = 'smooth'
                      else cornerValue = 'rounded'
                      setButtonCorners(cornerValue)
                      handleUpdate({ buttonCorners: cornerValue })
                    }}
                  />
                </div>

                {/* Shadow */}
                <div className="mb-4">
                  <label className="form-label">Shadow</label>
                  <div className="d-flex gap-2">
                    <button
                      className={`btn ${buttonShadow === 'none' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setButtonShadow('none')
                        handleUpdate({ buttonShadow: 'none' })
                      }}
                      style={{ borderRadius: '20px' }}
                    >
                      None
                    </button>
                    <button
                      className={`btn ${buttonShadow === 'subtle' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setButtonShadow('subtle')
                        handleUpdate({ buttonShadow: 'subtle' })
                      }}
                      style={{ borderRadius: '20px' }}
                    >
                      Subtle
                    </button>
                    <button
                      className={`btn ${buttonShadow === 'strong' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setButtonShadow('strong')
                        handleUpdate({ buttonShadow: 'strong' })
                      }}
                      style={{ borderRadius: '20px' }}
                    >
                      Strong
                    </button>
                    <button
                      className={`btn ${buttonShadow === 'hard' ? 'btn-dark' : 'btn-outline-secondary'} flex-fill`}
                      onClick={() => {
                        setButtonShadow('hard')
                        handleUpdate({ buttonShadow: 'hard' })
                      }}
                      style={{ borderRadius: '20px' }}
                    >
                      Hard
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <h6 className="mb-3">Colors</h6>

                {/* Button Color */}
                <div className="mb-3" style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0">Button color</label>
                    <div 
                      style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '50%', 
                        backgroundColor: buttonColor,
                        border: '2px solid #ddd',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('buttonColorPicker').click()}
                    ></div>
                    <input
                      id="buttonColorPicker"
                      type="color"
                      value={buttonColor}
                      onChange={(e) => {
                        setButtonColor(e.target.value)
                        handleUpdate({ buttonColor: e.target.value })
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div className="mb-3" style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0">Text color</label>
                    <div 
                      style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '50%', 
                        backgroundColor: buttonTextColor,
                        border: '2px solid #ddd',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('buttonTextColorPicker').click()}
                    ></div>
                    <input
                      id="buttonTextColorPicker"
                      type="color"
                      value={buttonTextColor}
                      onChange={(e) => {
                        setButtonTextColor(e.target.value)
                        handleUpdate({ buttonTextColor: e.target.value })
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="vtree-section">
              <h5 className="mb-3" style={{ color: '#666' }}>Colors</h5>
              <div className="bg-white rounded p-4" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                
                {/* Wallpaper */}
                <div className="mb-3" style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0">Wallpaper</label>
                    <div 
                      style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '50%', 
                        backgroundColor: wallpaperColor,
                        border: '2px solid #ddd',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('wallpaperColorPicker').click()}
                    ></div>
                    <input
                      id="wallpaperColorPicker"
                      type="color"
                      value={wallpaperColor}
                      onChange={(e) => {
                        setWallpaperColor(e.target.value)
                        handleUpdate({ bgColor: e.target.value })
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="mb-3" style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0">Title</label>
                    <div 
                      style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '50%', 
                        backgroundColor: titleColor,
                        border: '2px solid #ddd',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('titleColorPicker2').click()}
                    ></div>
                    <input
                      id="titleColorPicker2"
                      type="color"
                      value={titleColor}
                      onChange={(e) => {
                        setTitleColor(e.target.value)
                        handleUpdate({ nameColor: e.target.value })
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {/* Page text */}
                <div className="mb-3" style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0">Page text</label>
                    <div 
                      style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '50%', 
                        backgroundColor: pageTextColor,
                        border: '2px solid #ddd',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('pageTextColorPicker2').click()}
                    ></div>
                    <input
                      id="pageTextColorPicker2"
                      type="color"
                      value={pageTextColor}
                      onChange={(e) => {
                        setPageTextColor(e.target.value)
                        handleUpdate({ pageTextColor: e.target.value })
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="mb-3" style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0">Buttons</label>
                    <div 
                      style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '50%', 
                        backgroundColor: buttonColor,
                        border: '2px solid #ddd',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('buttonColorPicker2').click()}
                    ></div>
                    <input
                      id="buttonColorPicker2"
                      type="color"
                      value={buttonColor}
                      onChange={(e) => {
                        setButtonColor(e.target.value)
                        handleUpdate({ buttonColor: e.target.value })
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {/* Button text */}
                <div className="mb-3" style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0">Button text</label>
                    <div 
                      style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '50%', 
                        backgroundColor: buttonTextColor,
                        border: '2px solid #ddd',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('buttonTextColorPicker2').click()}
                    ></div>
                    <input
                      id="buttonTextColorPicker2"
                      type="color"
                      value={buttonTextColor}
                      onChange={(e) => {
                        setButtonTextColor(e.target.value)
                        handleUpdate({ buttonTextColor: e.target.value })
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="vtree-section">
              <div className="bg-white rounded p-4" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                
                {/* Profile Header */}
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    overflow: 'hidden'
                  }}>
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                        <i className="bi bi-person-fill" style={{ fontSize: '32px', color: '#999' }}></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-fill">
                    <h6 className="mb-1">{titleText}</h6>
                  </div>
                </div>

                {/* Add Button */}
                <button 
                  className="btn w-100 mb-3" 
                  onClick={() => navigate && navigate('/links')}
                  style={{ 
                    backgroundColor: '#8b5cf6', 
                    color: 'white',
                    borderRadius: '24px',
                    padding: '12px',
                    fontWeight: '500'
                  }}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Add
                </button>

                {/* Add collection & View archive */}
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <button className="btn btn-sm btn-link text-dark text-decoration-none">
                    <i className="bi bi-folder-plus me-1"></i>
                    Add collection
                  </button>
                  <button className="btn btn-sm btn-link text-dark text-decoration-none">
                    View archive
                    <i className="bi bi-chevron-right ms-1"></i>
                  </button>
                </div>

                {/* Links List */}
                {socialLinks && Object.keys(socialLinks).length > 0 && (
                  <div>
                    {Object.entries(socialLinks).map(([platform, url]) => {
                      if (!url || url.trim() === '') return null
                      
                      const platformNames = {
                        ig: 'Instagram',
                        facebook: 'Facebook',
                        x: 'X (Twitter)',
                        spotify: 'Spotify',
                        discord: 'Discord',
                        google: 'Google',
                        line: 'Line',
                        tiktok: 'TikTok',
                        github: 'GitHub'
                      }
                      
                      const platformIcons = {
                        ig: 'instagram',
                        facebook: 'facebook',
                        x: 'twitter-x',
                        spotify: 'spotify',
                        discord: 'discord',
                        google: 'google',
                        line: 'line',
                        tiktok: 'tiktok',
                        github: 'github'
                      }
                      
                      return (
                        <div key={platform} className="border rounded p-3 mb-3" style={{ backgroundColor: 'white' }}>
                          <div className="d-flex align-items-start">
                            <div className="flex-fill">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <i className={`bi bi-${platformIcons[platform] || 'link'}`} style={{ fontSize: '20px' }}></i>
                                  <div>
                                    <h6 className="mb-0">
                                      {platformNames[platform] || platform}
                                    </h6>
                                    <small className="text-primary">{url}</small>
                                  </div>
                                </div>
                                <div className="form-check form-switch">
                                  <input className="form-check-input" type="checkbox" defaultChecked />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

              </div>
            </div>
          )}

          </div>

          {/* Right Column: Mobile Preview */}
          <div className="col-lg-6 d-flex justify-content-center align-items-start" style={{ position: 'sticky', top: '20px', paddingTop: '0' }}>
            <div style={{
              width: '380px',
              height: '760px',
              borderRadius: '32px',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              position: 'relative',
              marginTop: '0'
            }}>
              {/* Background Layer */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: wallpaperStyle === 'gradient' 
                  ? `linear-gradient(180deg, ${wallpaperColor} 0%, ${wallpaperColor}dd 100%)`
                  : wallpaperStyle === 'image' && wallpaperImage
                  ? `url(${wallpaperImage}) center/cover`
                  : wallpaperColor,
                backgroundColor: wallpaperStyle === 'fill' ? wallpaperColor : undefined,
                filter: wallpaperStyle === 'blur' ? 'blur(8px)' : 'none',
                transform: wallpaperStyle === 'blur' ? 'scale(1.1)' : 'none'
              }}></div>

              {/* Overlay Layer */}
              {(wallpaperStyle === 'image' || wallpaperStyle === 'video') && overlayOpacity > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})`,
                  zIndex: 0
                }}></div>
              )}

              {/* Content Layer (Not blurred) */}
              <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                height: '100%',
                overflow: 'auto'
              }}>
                <div className="d-flex flex-column align-items-center" style={{ minHeight: '100%' }}>
                  
                  {/* Profile Image - Vfull or Classic */}
                  {profileImageLayout === 'vfull' ? (
                    // Vfull Layout
                    <>
                      <div style={{
                        width: '100%',
                        position: 'relative'
                      }}>
                        {/* Profile Image */}
                        <div style={{
                          width: '100%',
                          height: '300px',
                          backgroundColor: '#e0e0e0',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          {profileImage ? (
                            <img 
                              src={profileImage} 
                              alt="Profile" 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }} 
                            />
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                              <i className="bi bi-person-fill" style={{ fontSize: '64px', color: '#999' }}></i>
                            </div>
                          )}
                        </div>

                        {/* Rounded bottom gradient overlay */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '150px',
                          background: `radial-gradient(ellipse 120% 100% at 50% 0%, transparent 0%, transparent 40%, ${wallpaperColor}88 70%, ${wallpaperColor} 100%)`,
                          pointerEvents: 'none'
                        }}></div>
                      </div>
                      
                      {/* Profile Name */}
                      <h5 style={{ 
                        color: titleColor,
                        marginTop: '20px',
                        marginBottom: '16px',
                        fontSize: titleSize === 'large' ? '24px' : '18px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontFamily: titleFont
                      }}>
                        {titleText}
                      </h5>
                    </>
                  ) : (
                    // Classic Layout
                    <>
                      <div style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        backgroundColor: '#e0e0e0',
                        marginTop: '60px',
                        marginBottom: '16px',
                        overflow: 'hidden'
                      }}>
                        {profileImage ? (
                          <img 
                            src={profileImage} 
                            alt="Profile" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover' 
                            }} 
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                            <i className="bi bi-person-fill" style={{ fontSize: '48px', color: '#999' }}></i>
                          </div>
                        )}
                      </div>

                      {/* Profile Name for Classic */}
                      <h5 style={{ 
                        color: titleColor,
                        marginBottom: '16px',
                        fontSize: titleSize === 'large' ? '24px' : '18px',
                        fontWeight: 'bold',
                        fontFamily: titleFont
                      }}>
                        {titleText}
                      </h5>
                    </>
                  )}

                  {/* Social Links Buttons - Add padding */}
                  <div className="px-3 w-100" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: pageFont }}>
                  {profile.socialLinks && Object.entries(profile.socialLinks).map(([platform, url]) => {
                    if (!url) return null
                    
                    const platformNames = {
                      ig: 'Instagram',
                      facebook: 'Facebook',
                      x: 'X',
                      spotify: 'Spotify',
                      discord: 'Discord',
                      google: 'Google',
                      line: 'Line',
                      tiktok: 'TikTok',
                      github: 'GitHub'
                    }

                    const platformIcons = {
                      ig: 'instagram',
                      facebook: 'facebook',
                      x: 'twitter-x',
                      spotify: 'spotify',
                      discord: 'discord',
                      google: 'google',
                      line: 'line',
                      tiktok: 'tiktok',
                      github: 'github'
                    }

                    const getButtonStyle = () => {
                      const baseStyle = {
                        width: '100%',
                        padding: '12px 20px',
                        marginBottom: '12px',
                        border: 'none',
                        borderRadius: buttonCorners === 'rounded' ? '24px' : buttonCorners === 'smooth' ? '12px' : '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }

                      const getShadow = () => {
                        if (buttonShadow === 'none') return 'none'
                        if (buttonShadow === 'subtle') return '0 2px 4px rgba(0,0,0,0.1)'
                        if (buttonShadow === 'strong') return '0 4px 12px rgba(0,0,0,0.2)'
                        if (buttonShadow === 'hard') return '0 6px 20px rgba(0,0,0,0.3)'
                        return 'none'
                      }

                      if (buttonStyle === 'solid') {
                        return {
                          ...baseStyle,
                          backgroundColor: buttonColor,
                          color: buttonTextColor,
                          boxShadow: getShadow()
                        }
                      } else if (buttonStyle === 'glass') {
                        return {
                          ...baseStyle,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: buttonTextColor,
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          boxShadow: getShadow()
                        }
                      } else { // outline
                        return {
                          ...baseStyle,
                          backgroundColor: 'transparent',
                          color: buttonTextColor,
                          border: `2px solid ${buttonColor}`,
                          boxShadow: getShadow()
                        }
                      }
                    }

                    return (
                      <button 
                        key={platform} 
                        style={getButtonStyle()}
                        onClick={() => window.open(url, '_blank')}
                      >
                        <i className={`bi bi-${platformIcons[platform] || 'link'}`}></i>
                        {platformNames[platform] || platform}
                      </button>
                    )
                  })}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-4" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                    VERE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

