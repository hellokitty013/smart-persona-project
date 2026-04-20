import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { generateCvPdf } from '../utils/exportCv'

function ResumeCustomize({ profile, onUpdate, profiles = [], currentProfileId, onProfileSwitch }) {
  const navigate = useNavigate()
  const themeMeta = profile?.themeMeta
  const themeTokens = profile?.themeTokens || {}
  const themeSourceLabel = themeMeta
    ? (
        {
          builtin: 'Official Library',
          community: 'Community Gallery',
          saved: 'My Themes'
        }[themeMeta.source] || 'Custom Theme'
      )
    : ''
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  // AI Generator Modal State
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAIPrompt] = useState('')
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [showFontModal, setShowFontModal] = useState(false)
  const [showQuickStylesModal, setShowQuickStylesModal] = useState(false)
  const [previewBackdrop, setPreviewBackdrop] = useState('gradient')
  const [compactPreview, setCompactPreview] = useState(false)
  const [showSampleContent, setShowSampleContent] = useState(true)
  const [isEnhancingSummary, setIsEnhancingSummary] = useState(false)

  // Section Order State for Drag & Drop
  const [sectionOrder, setSectionOrder] = useState([
    'header',
    'summary',
    'highlights',
    'experience',
    'education',
    'skills',
    'projects',
    'languages',
    'interests'
  ])

  // Resume Data State
  const [resumeData, setResumeData] = useState({
    // Header
    fullName: profile?.fullName || '',
    title: profile?.title || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    location: profile?.location || '',
    linkedin: profile?.linkedin || '',
    twitter: profile?.twitter || '',
    medium: profile?.medium || '',
    website: profile?.website || '',
    profilePhoto: profile?.profilePhoto || '',
    headerBgColor: profile?.headerBgColor || themeTokens.sectionBg || themeTokens.blockColor || '#2c5f7c',
    titleColor: profile?.titleColor || themeTokens.nameColor || themeTokens.headingColor || '#f9a825',
    
    // Summary
    summary: profile?.summary || '',
    
    // Experience
    experiences: profile?.experiences || [],
    
    // Education
    education: profile?.education || [],
    
    // Skills
    skills: profile?.skills || [],
    
    // Projects (NEW)
    projects: profile?.projects || [],
    
    // Languages (NEW)
    languages: profile?.languages || [],
    
    // Interests (NEW)
    interests: profile?.interests || [],

    // Highlights / Strength cards
    highlights: profile?.highlights || [],
    
    // Template & Styling
    template: profile?.template || 'modern',
    colorScheme: profile?.colorScheme || 'brown-beige',
    layout: profile?.layout || 'single-column',
    columnRatio: profile?.columnRatio || '40-60',
    heroStyle: profile?.heroStyle || 'gradient',
    sectionAccent: profile?.sectionAccent || 'cards',
    dividerStyle: profile?.dividerStyle || 'solid',
    cornerStyle: profile?.cornerStyle || 'rounded',
    contentDensity: profile?.contentDensity || 'standard',
    fontSize: profile?.fontSize || 'medium',
    fontFamily: profile?.fontFamily || themeTokens.fontFamily || 'Inter',
    spacing: profile?.spacing || 'normal',
    
    // Advanced Styling
    leftColumnBg: profile?.leftColumnBg || themeTokens.blockColor || '#2c5f7c',
    rightColumnBg: profile?.rightColumnBg || themeTokens.bgColor || '#f5f5f5',
    accentColor: profile?.accentColor || themeTokens.headingColor || themeTokens.nameColor || '#f9a825',
    showSectionIcons: profile?.showSectionIcons !== undefined ? profile.showSectionIcons : true,
    sectionIconStyle: profile?.sectionIconStyle || 'filled',
    sectionColors: profile?.sectionColors || {}
  })

  useEffect(() => {
    if (!themeMeta?.id) return
    const hasTokens = Object.keys(themeTokens).length > 0
    if (!hasTokens) return
    setResumeData(prev => {
      const themedValues = {
        headerBgColor: themeTokens.sectionBg || themeTokens.blockColor || prev.headerBgColor,
        leftColumnBg: themeTokens.blockColor || themeTokens.bgColor || prev.leftColumnBg,
        rightColumnBg: themeTokens.bgColor || prev.rightColumnBg,
        accentColor: themeTokens.headingColor || themeTokens.nameColor || themeTokens.accentColor || prev.accentColor,
        titleColor: themeTokens.nameColor || themeTokens.headingColor || prev.titleColor,
        fontFamily: themeTokens.fontFamily || prev.fontFamily,
        colorScheme: 'custom-theme'
      }
      const nextState = { ...prev, ...themedValues }
      onUpdateRef.current?.(themedValues)
      return nextState
    })
  }, [themeMeta?.id, themeTokens])

  // Active Tab State
  const [activeTab, setActiveTab] = useState('ai-generator')

  const buildExportPayload = () => {
    const skills = (resumeData.skills || [])
      .map((skill) => (typeof skill === 'string' ? skill : skill.name))
      .filter(Boolean)
    const experience = (resumeData.experiences || []).map((exp) => {
      const [periodStart = '', periodEnd = ''] = (exp.period || '')
        .split('-')
        .map((part) => part.trim())
      return {
        position: exp.position || '',
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.startDate || periodStart,
        endDate: exp.current ? '' : (exp.endDate || periodEnd),
        description: exp.description || exp.summary || '',
        bullets: Array.isArray(exp.bulletPoints) ? exp.bulletPoints.filter(Boolean) : []
      }
    })
    const education = (resumeData.education || []).map((edu) => ({
      school: edu.school || '',
      degree: edu.degree || '',
      location: edu.location || '',
      startDate: edu.startDate || '',
      endDate: edu.graduationDate || edu.endDate || ''
    }))

    return {
      username: profile?.username || '',
      displayName: resumeData.fullName || profile?.fullName || profile?.displayName || 'Resume',
      jobTitle: resumeData.title || profile?.title || '',
      description: resumeData.summary || '',
      skills,
      experience,
      education,
      contact: {
        email: resumeData.email || profile?.email || '',
        phone: resumeData.phone || profile?.phone || '',
        address: resumeData.location || profile?.location || '',
        links: profile?.contact?.links || []
      }
    }
  }

  const handleDownloadResumePdf = async () => {
    try {
      const payload = buildExportPayload()
      const slug = (payload.displayName || payload.username || 'resume')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
      await generateCvPdf(payload, { filename: `${slug || 'resume'}-cv.pdf` })
    } catch (error) {
      console.error('Failed to export resume PDF', error)
      window.alert('ไม่สามารถดาวน์โหลด Resume ได้ โปรดลองอีกครั้ง')
    }
  }

  // Template options
  const templates = [
    { id: 'modern', name: 'Modern', iconClass: 'bi-phone', description: 'Clean and contemporary' },
    { id: 'classic', name: 'Classic', iconClass: 'bi-journal-text', description: 'Traditional and professional' },
    { id: 'creative', name: 'Creative', iconClass: 'bi-brush', description: 'Bold and artistic' },
    { id: 'minimal', name: 'Minimal', iconClass: 'bi-app', description: 'Simple and elegant' }
  ]

  // Layout options
  const layoutVariants = [
    { id: 'single-column', name: 'Balanced Single', icon: 'bi-layout-text-window', description: 'Stacked sections ideal for ATS' },
    { id: 'two-column', name: 'Modern Split', icon: 'bi-layout-sidebar-inset-reverse', description: 'Sidebar for quick facts' },
    { id: 'split-hero', name: 'Split Hero', icon: 'bi-layout-three-columns', description: 'Hero banner + split content' },
    { id: 'timeline', name: 'Story Timeline', icon: 'bi-diagram-3', description: 'Chronological vertical timeline' },
    { id: 'gallery', name: 'Showcase Grid', icon: 'bi-grid-3x3-gap', description: 'Card grid for highlights/projects' }
  ]

  const columnRatioOptions = [
    { id: '50-50', label: '50 / 50', value: [50, 50] },
    { id: '45-55', label: '45 / 55', value: [45, 55] },
    { id: '40-60', label: '40 / 60', value: [40, 60] },
    { id: '35-65', label: '35 / 65', value: [35, 65] }
  ]

  const heroStyles = [
    { id: 'gradient', name: 'Gradient Glow', description: 'Full-width gradient hero with overlay' },
    { id: 'card', name: 'Floating Card', description: 'Large card with subtle drop shadow' },
    { id: 'angular', name: 'Diagonal Split', description: 'Angled background blocks and stats' }
  ]

  const previewBackdropOptions = [
    { id: 'clean', name: 'Clean', description: 'สีพื้นเรียบ' },
    { id: 'gradient', name: 'Soft Gradient', description: 'ไล่สีโทนอ่อน' },
    { id: 'grid', name: 'Paper Texture', description: 'พื้นหลังลายกระดาษ/กริด' }
  ]

  const contentBlockOptions = [
    { id: 'summary', label: 'Professional Summary', icon: 'bi-card-text', description: 'ย่อหน้าเล่าเรื่องตัวคุณ' },
    { id: 'highlights', label: 'Highlights', icon: 'bi-star', description: 'บัตรสะสมความโดดเด่น' },
    { id: 'experience', label: 'Work Experience', icon: 'bi-briefcase', description: 'ไทม์ไลน์การทำงาน' },
    { id: 'education', label: 'Education', icon: 'bi-mortarboard', description: 'ประวัติการศึกษา' },
    { id: 'projects', label: 'Projects', icon: 'bi-folder', description: 'โปรเจกต์ที่ภูมิใจ' },
    { id: 'skills', label: 'Skills', icon: 'bi-lightning', description: 'ความสามารถหลัก' },
    { id: 'languages', label: 'Languages', icon: 'bi-translate', description: 'ภาษาที่ใช้ได้' },
    { id: 'interests', label: 'Interests', icon: 'bi-heart', description: 'ความสนใจพิเศษ' }
  ]

  const sampleContent = {
    summary: 'Product designer with 6+ years crafting human-centered experiences, blending research, storytelling, and data-led experiments to ship delightful journeys.',
    experiences: [
      {
        position: 'Senior Product Designer',
        company: 'Orbit Labs',
        period: '2022 - ปัจจุบัน',
        description: 'นำทีมออกแบบฟีเจอร์ collaboration ช่วยเพิ่ม activation rate 18% พร้อมออกแบบดีไซน์ซิสเต็มใหม่.'
      },
      {
        position: 'UX Designer',
        company: 'Northwind Digital',
        period: '2019 - 2022',
        description: 'วิจัยผู้ใช้ >60 ราย สร้าง journey ใหม่ให้ onboarding flow ลด drop-off 25%.'
      }
    ],
    education: [
      { degree: 'B.Eng. Computer Engineering', school: 'Chulalongkorn University', startDate: '2014', endDate: '2018' }
    ],
    highlights: [
      { title: 'Launch Champion', description: 'ดูแลโปรเจ็กต์ redesign dashboard ภายใน 4 เดือน' },
      { title: 'Team Leadership', description: 'โค้ชดีไซเนอร์รุ่นใหม่ 5 คน' }
    ],
    skills: [
      { name: 'Product Strategy', level: 90 },
      { name: 'UX Research', level: 85 },
      { name: 'UI Systems', level: 80 },
      { name: 'Figma', level: 90 }
    ],
    projects: [
      { name: 'Insight Command Center', period: '2023', description: 'แพลตฟอร์ม data visualization สำหรับทีม growth' },
      { name: 'AI Portfolio Kit', period: '2022', description: 'เว็บแอปสร้าง portfolio อัตโนมัติ' }
    ],
    languages: [
      { name: 'Thai', proficiency: 'native' },
      { name: 'English', proficiency: 'proficient' },
      { name: 'Japanese', proficiency: 'working' }
    ],
    interests: [
      { icon: '🎨', name: 'Creative Coding' },
      { icon: '🚴‍♀️', name: 'Cycling' },
      { icon: '📚', name: 'Design Books' },
      { icon: '☕', name: 'Cafe Hunting' }
    ],
    contact: {
      phone: '080-123-4567',
      email: 'hello@vero.co',
      location: 'Bangkok, Thailand',
      linkedin: 'linkedin.com/in/vero-designer'
    }
  }

  const withSampleList = (list = [], key) => {
    const normalized = Array.isArray(list) ? list : []
    if (!showSampleContent) return normalized
    if (normalized.length > 0) return normalized
    return sampleContent[key] || []
  }


  const sectionAccentOptions = [
    { id: 'cards', name: 'Card Blocks', description: 'Rounded cards with soft borders' },
    { id: 'underlines', name: 'Underlines', description: 'Clean headings with underline dividers' },
    { id: 'minimal', name: 'Minimal', description: 'No borders, rely on spacing' }
  ]

  const dividerOptions = [
    { id: 'solid', name: 'Solid Line' },
    { id: 'dotted', name: 'Dotted Line' },
    { id: 'none', name: 'No Divider' }
  ]

  const densityOptions = [
    { id: 'cozy', name: 'Cozy', padding: 42 },
    { id: 'standard', name: 'Standard', padding: 56 },
    { id: 'roomy', name: 'Roomy', padding: 72 }
  ]

  const cornerOptions = [
    { id: 'rounded', name: 'Rounded' },
    { id: 'pill', name: 'Soft Pill' },
    { id: 'sharp', name: 'Sharp' }
  ]

  // Color schemes
  const colorSchemes = [
    { id: 'brown-beige', name: 'Brown & Beige', primary: '#A67C52', secondary: '#F5E6D3' },
    { id: 'blue-white', name: 'Blue & White', primary: '#1E6FB8', secondary: '#FFFFFF' },
    { id: 'navy-gold', name: 'Navy & Gold', primary: '#1a237e', secondary: '#d4af37' },
    { id: 'purple-pink', name: 'Purple & Pink', primary: '#7b1fa2', secondary: '#f48fb1' },
    { id: 'teal-white', name: 'Teal & White', primary: '#00897b', secondary: '#FFFFFF' },
    { id: 'green-white', name: 'Green & White', primary: '#2e7d32', secondary: '#FFFFFF' },
    { id: 'black-white', name: 'Black & White', primary: '#000000', secondary: '#FFFFFF' }
  ]

  // Font list for modal
  const fonts = {
    suggested: [
      'Inter', 'Poppins', 'Roboto', 'Montserrat',
      'Open Sans', 'Lato', 'Raleway', 'Nunito',
      'Work Sans', 'DM Sans', 'Plus Jakarta Sans', 'Outfit',
      'Urbanist', 'Manrope', 'IBM Plex Sans', 'Archivo'
    ],
    other: [
      'Playfair Display', 'Merriweather', 'Crimson Text', 'Cormorant',
      'Bebas Neue', 'Righteous', 'Russo One', 'Bungee',
      'Pacifico', 'Dancing Script', 'Permanent Marker', 'Caveat',
      'Albert Sans', 'Space Grotesk', 'Epilogue', 'Red Hat Display',
      'Rubik', 'Syne', 'Karla', 'Jost',
      'IBM Plex Serif', 'Lora', 'Noto Serif', 'PT Serif',
      'IBM Plex Mono', 'Space Mono', 'JetBrains Mono', 'Fira Code'
    ]
  }

  // Font size options
  const fontSizes = [
    { id: 'small', name: 'Small', size: '0.9em' },
    { id: 'medium', name: 'Medium', size: '1em' },
    { id: 'large', name: 'Large', size: '1.1em' }
  ]

  // Spacing options
  const spacingOptions = [
    { id: 'compact', name: 'Compact', value: '0.8' },
    { id: 'normal', name: 'Normal', value: '1' },
    { id: 'relaxed', name: 'Relaxed', value: '1.2' }
  ]

  // Quick Style Presets
  const stylePresets = [
    {
      id: 'professional-blue',
      name: 'Professional',
      colors: { left: '#1e3a5f', right: '#f8f9fa', accent: '#2563eb', title: '#fbbf24' }
    },
    {
      id: 'creative-purple',
      name: 'Creative',
      colors: { left: '#7c3aed', right: '#faf5ff', accent: '#a855f7', title: '#ffffff' }
    },
    {
      id: 'minimal-black',
      name: 'Minimal',
      colors: { left: '#1f2937', right: '#ffffff', accent: '#000000', title: '#ffffff' }
    },
    {
      id: 'warm-brown',
      name: 'Warm',
      colors: { left: '#8b6f47', right: '#f5e6d3', accent: '#8b6f47', title: '#ffffff' }
    }
  ]

  // Quick apply style preset
  const applyStylePreset = (preset) => {
    const newData = {
      ...resumeData,
      leftColumnBg: preset.colors.left,
      rightColumnBg: preset.colors.right,
      accentColor: preset.colors.accent,
      titleColor: preset.colors.title,
      headerBgColor: preset.colors.left
    }
    setResumeData(newData)
    onUpdate?.(newData)
    setShowQuickStylesModal(false)
  }

  // Tabs Configuration
  const tabs = [
    { id: 'ai-generator', label: 'AI Generator', icon: 'bi-magic', category: 'ai' },
    { id: 'template', label: 'Template & Layout', icon: 'bi-layout-text-window', category: 'design' },
    { id: 'header', label: 'Header & Contact', icon: 'bi-person-badge', category: 'content' },
    { id: 'summary', label: 'Summary', icon: 'bi-card-text', category: 'content' },
    { id: 'highlights', label: 'Highlights', icon: 'bi-star', category: 'content' },
    { id: 'experience', label: 'Work Experience', icon: 'bi-briefcase', category: 'content' },
    { id: 'education', label: 'Education', icon: 'bi-mortarboard', category: 'content' },
    { id: 'skills', label: 'Skills', icon: 'bi-lightning', category: 'content' },
    { id: 'projects', label: 'Projects', icon: 'bi-folder', category: 'content' },
    { id: 'languages', label: 'Languages', icon: 'bi-translate', category: 'content' },
    { id: 'interests', label: 'Interests', icon: 'bi-heart', category: 'content' },
    { id: 'styling', label: 'Colors & Style', icon: 'bi-palette', category: 'design' }
  ]

  const tabLookup = tabs.reduce((acc, tab) => {
    acc[tab.id] = tab
    return acc
  }, {})

  const tabSections = [
    {
      id: 'essentials',
      label: 'Profile Essentials',
      hint: 'ชื่อ, ความสามารถ, Highlights',
      tabIds: ['header', 'summary', 'highlights']
    },
    {
      id: 'content',
      label: 'Content Blocks',
      hint: 'ประสบการณ์และข้อมูลสนับสนุน',
      tabIds: ['experience', 'education', 'projects', 'skills', 'languages', 'interests']
    },
    {
      id: 'style',
      label: 'Style & Utilities',
      hint: 'Template, สี, AI tools',
      tabIds: ['template', 'styling', 'ai-generator']
    }
  ]

  // AI Resume Generator
  const generateResumeFromAI = () => {
    if (!aiPrompt.trim()) {
      alert('กรุณาใส่คำอธิบายเกี่ยวกับตัวคุณก่อนครับ')
      return
    }

    // Analyze AI prompt to extract information
    const prompt = aiPrompt.toLowerCase()
    
    // Detect field of study/work
    let detectedField = 'general'
    let suggestedTitle = 'Professional'
    
    if (prompt.includes('วิศวกร') || prompt.includes('engineer') || prompt.includes('คอมพิวเตอร์') || prompt.includes('computer') || prompt.includes('โปรแกรม') || prompt.includes('developer')) {
      detectedField = 'engineering'
      suggestedTitle = 'Software Engineer'
    } else if (prompt.includes('ธุรกิจ') || prompt.includes('business') || prompt.includes('การตลาด') || prompt.includes('marketing') || prompt.includes('บริหาร')) {
      detectedField = 'business'
      suggestedTitle = 'Business Professional'
    } else if (prompt.includes('ออกแบบ') || prompt.includes('design') || prompt.includes('creative') || prompt.includes('ui') || prompt.includes('ux') || prompt.includes('กราฟิก')) {
      detectedField = 'creative'
      suggestedTitle = 'UX/UI Designer'
    } else if (prompt.includes('ข้อมูล') || prompt.includes('data') || prompt.includes('วิเคราะห์') || prompt.includes('analyst')) {
      detectedField = 'data'
      suggestedTitle = 'Data Analyst'
    }

    // Extract skills from prompt
    const skillKeywords = [
      'python', 'javascript', 'java', 'react', 'node', 'typescript', 'sql', 'html', 'css',
      'excel', 'powerpoint', 'word', 'photoshop', 'illustrator', 'figma',
      'communication', 'leadership', 'teamwork', 'problem solving', 'creative thinking',
      'การสื่อสาร', 'ภาวะผู้นำ', 'ทำงานเป็นทีม', 'แก้ปัญหา', 'คิดสร้างสรรค์'
    ]
    
    const detectedSkills = []
    skillKeywords.forEach(keyword => {
      if (prompt.includes(keyword)) {
        const skillName = keyword.charAt(0).toUpperCase() + keyword.slice(1)
        if (!detectedSkills.find(s => s.name.toLowerCase() === keyword)) {
          detectedSkills.push({ 
            name: skillName, 
            level: Math.floor(Math.random() * 20) + 70 
          })
        }
      }
    })

    // Generate summary from prompt
    const sentences = aiPrompt.split(/[.!?。]/).filter(s => s.trim().length > 10)
    let generatedSummary = ''
    
    if (sentences.length > 0) {
      generatedSummary = sentences.slice(0, 3).join('. ').trim()
      if (!generatedSummary.endsWith('.')) generatedSummary += '.'
    } else {
      generatedSummary = `${aiPrompt.substring(0, 200)}${aiPrompt.length > 200 ? '...' : ''}`
    }

    // Extract GPA if mentioned
    const gpaMatch = prompt.match(/gpa\s*[\:\s]*(\d+\.?\d*)/i) || prompt.match(/เกรด\s*[\:\s]*(\d+\.?\d*)/i)
    const detectedGPA = gpaMatch ? parseFloat(gpaMatch[1]) : null

    // Extract education info
    const isStudent = prompt.includes('นักศึกษา') || prompt.includes('student') || prompt.includes('ปี ') || prompt.includes('year ')
    const yearMatch = prompt.match(/ปี\s*(\d+)/i) || prompt.match(/year\s*(\d+)/i)
    const detectedYear = yearMatch ? parseInt(yearMatch[1]) : null

    // Extract company/internship info
    const internMatch = prompt.match(/ฝึกงาน.*?(?:ที่|at)\s*([^\s,]+)/i) || prompt.match(/intern.*?at\s*([^\s,]+)/i)
    const companyMatch = internMatch || prompt.match(/บริษัท\s*([^\s,]+)/i) || prompt.match(/company\s*([^\s,]+)/i)
    const detectedCompany = companyMatch ? companyMatch[1] : null

    // Extract duration
    const durationMatch = prompt.match(/(\d+)\s*(?:เดือน|months?)/i)
    const detectedDuration = durationMatch ? parseInt(durationMatch[1]) : null

    // Build generated data
    const generatedData = {
      // Header info - use existing or generate placeholder
      fullName: resumeData.fullName || profile?.fullName || 'Your Full Name',
      title: suggestedTitle,
      summary: generatedSummary,
      email: resumeData.email || profile?.email || 'your.email@example.com',
      phone: resumeData.phone || profile?.phone || '080-XXX-XXXX',
      location: resumeData.location || profile?.location || 'Bangkok, Thailand',
      
      // Template & Style selection based on field
      template: detectedField === 'creative' ? 'creative' : detectedField === 'business' ? 'classic' : 'modern',
      colorScheme: detectedField === 'engineering' ? 'blue-white' :
                   detectedField === 'business' ? 'navy-gold' :
                   detectedField === 'creative' ? 'purple-pink' :
                   detectedField === 'data' ? 'teal-white' : 'brown-beige',
      layout: detectedField === 'creative' ? 'two-column' : 'single-column',
      fontSize: 'medium',
      contentDensity: 'standard',
      dividerStyle: 'solid',
      cornerStyle: 'rounded',
      sectionAccent: detectedField === 'creative' ? 'cards' : 'underlines',
      showSectionIcons: true,
      
      // Update colors based on selected scheme
      accentColor: detectedField === 'engineering' ? '#1E6FB8' :
                   detectedField === 'business' ? '#d4af37' :
                   detectedField === 'creative' ? '#f48fb1' :
                   detectedField === 'data' ? '#00897b' : '#A67C52',
      leftColumnBg: detectedField === 'engineering' ? '#1E6FB8' :
                    detectedField === 'business' ? '#1a237e' :
                    detectedField === 'creative' ? '#7b1fa2' :
                    detectedField === 'data' ? '#00897b' : '#A67C52',
      rightColumnBg: '#FFFFFF',
      headerBgColor: detectedField === 'engineering' ? '#1E6FB8' :
                     detectedField === 'business' ? '#1a237e' :
                     detectedField === 'creative' ? '#7b1fa2' :
                     detectedField === 'data' ? '#00897b' : '#A67C52',
      titleColor: '#FFFFFF',
      
      // Merge detected skills with existing skills
      skills: [...(resumeData.skills || []), ...detectedSkills].slice(0, 8),
      
      // Generate experience if company detected
      experiences: detectedCompany ? [
        ...(resumeData.experiences || []),
        {
          position: 'Intern',
          company: detectedCompany,
          location: '',
          startDate: detectedDuration ? `${detectedDuration} months ago` : '',
          endDate: 'Present',
          current: false,
          bulletPoints: [
            'Participated in team projects and contributed to development',
            'Applied technical skills in real-world scenarios',
            'Collaborated with experienced professionals'
          ]
        }
      ].slice(0, 3) : resumeData.experiences,
      
      // Generate education if student
      education: isStudent ? [
        ...(resumeData.education || []),
        {
          school: 'มหาวิทยาลัย',
          degree: detectedField === 'engineering' ? 'วิศวกรรมศาสตรบัณฑิต - วิศวกรรมคอมพิวเตอร์' :
                  detectedField === 'business' ? 'บริหารธุรกิจบัณฑิต' :
                  'ปริญญาตรี',
          location: '',
          startDate: detectedYear ? `ปีที่ ${detectedYear}` : '',
          graduationDate: '',
          gpa: detectedGPA || undefined
        }
      ].slice(0, 2) : resumeData.education,

      // Add highlights based on prompt
      highlights: [
        ...(resumeData.highlights || []),
        ...(detectedGPA ? [{ icon: 'bi-mortarboard', title: `GPA ${detectedGPA}`, description: 'Academic Achievement' }] : []),
        ...(detectedCompany ? [{ icon: 'bi-briefcase', title: 'Internship', description: `${detectedCompany}` }] : [])
      ].slice(0, 4)
    }

    // Merge with existing data
    const updatedData = { ...resumeData, ...generatedData }
    
    // Update state and notify parent
    setResumeData(updatedData)
    onUpdate?.(updatedData)
    
    setShowSuccessNotification(true)
    setShowAIModal(false)
    setAIPrompt('')
    setTimeout(() => setShowSuccessNotification(false), 4000)
    
    // Switch to appropriate tab to show results
    setActiveTab('template')
  }

  // Update resume data
  const updateResumeData = (field, value) => {
    const newData = { ...resumeData, [field]: value }
    setResumeData(newData)
    onUpdate?.(newData)
  }

  // AI Enhance Summary — rewrite existing summary into polished professional text
  const handleAIEnhanceSummary = () => {
    const current = resumeData.summary?.trim()
    if (!current) {
      alert('กรุณาเขียน summary ก่อน แล้วให้ AI ช่วยปรับปรุงให้ครับ')
      return
    }
    setIsEnhancingSummary(true)

    setTimeout(() => {
      const name = resumeData.fullName || 'Professional'
      const title = resumeData.title || ''
      const skillList = (resumeData.skills || [])
        .slice(0, 4)
        .map(s => (typeof s === 'string' ? s : s.name))
        .filter(Boolean)
      const expCount = resumeData.experiences?.length || 0
      const hasExp = expCount > 0
      const firstCompany = resumeData.experiences?.[0]?.company || ''
      const expNote = hasExp
        ? `With hands-on experience${firstCompany ? ` at ${firstCompany}` : ''}, `
        : ''
      const skillNote = skillList.length > 0
        ? ` Proficient in ${skillList.join(', ')}.`
        : ''

      // Enhance the original text — preserve key facts, improve polish
      const sentences = current.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 8)
      const coreContent = sentences.slice(0, 3).join('. ')

      const enhanced = `${expNote}${coreContent ? coreContent + '. ' : ''}${title ? `As a dedicated ${title}, ` : ''}I bring a results-driven mindset and strong attention to detail to every project.${skillNote} Committed to continuous learning and delivering high-impact solutions that create real value.`

      updateResumeData('summary', enhanced.trim())
      setIsEnhancingSummary(false)
      setShowSuccessNotification(true)
      setTimeout(() => setShowSuccessNotification(false), 3000)
    }, 1200)
  }

  // Dedicated helper so highlight edits stay in sync with preview + parent state
  const updateHighlights = (updater) => {
    setResumeData(prev => {
      const currentHighlights = Array.isArray(prev.highlights) ? prev.highlights : []
      const nextHighlights = typeof updater === 'function' ? updater(currentHighlights) : updater
      const nextState = { ...prev, highlights: nextHighlights }
      onUpdateRef.current?.(nextState)
      return nextState
    })
  }

  // Handle drag end for reordering sections
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(sectionOrder)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSectionOrder(items)
  }

  const selectedScheme = colorSchemes.find((scheme) => scheme.id === resumeData.colorScheme)
  const accentColor = resumeData.accentColor || selectedScheme?.primary || '#333333'
  const secondarySurface = resumeData.rightColumnBg || selectedScheme?.secondary || '#f5f5f5'
  const primarySurface = resumeData.leftColumnBg || selectedScheme?.primary || '#1e3a5f'
  const columnRatio = columnRatioOptions.find((option) => option.id === resumeData.columnRatio)?.value || [40, 60]
  const densityPadding = densityOptions.find((option) => option.id === resumeData.contentDensity)?.padding || 56
  const sectionRadius = resumeData.cornerStyle === 'pill' ? '28px' : resumeData.cornerStyle === 'sharp' ? '0px' : '14px'
  const headingDivider = (color = accentColor) => {
    if (resumeData.dividerStyle === 'none') return 'none'
    const borderType = resumeData.dividerStyle === 'dotted' ? 'dotted' : 'solid'
    const borderWidth = resumeData.sectionAccent === 'minimal' ? '1px' : '2px'
    const borderColor = resumeData.sectionAccent === 'minimal' ? '#d1d5db' : color
    return `${borderWidth} ${borderType} ${borderColor}`
  }

  const renderSectionIcon = (iconClass, color) => {
    if (!resumeData.showSectionIcons) return null
    return (
      <i
        className={`bi ${iconClass} me-2`}
        style={{ color: color || 'currentColor', fontSize: '0.95em' }}
        aria-hidden="true"
      ></i>
    )
  }

  const getSectionColor = (sectionId) => {
    if (!sectionId) return accentColor
    const stored = resumeData.sectionColors?.[sectionId]
    return stored || accentColor
  }

  const updateSectionColor = (sectionId, color) => {
    setResumeData((prev) => {
      const nextColors = { ...(prev.sectionColors || {}) }
      if (!color) {
        delete nextColors[sectionId]
      } else {
        nextColors[sectionId] = color
      }
      const nextState = { ...prev, sectionColors: nextColors }
      onUpdateRef.current?.(nextState)
      return nextState
    })
  }

  const previewContact = {
    phone: resumeData.phone || (showSampleContent ? sampleContent.contact.phone : ''),
    email: resumeData.email || (showSampleContent ? sampleContent.contact.email : ''),
    location: resumeData.location || (showSampleContent ? sampleContent.contact.location : ''),
    linkedin: resumeData.linkedin || (showSampleContent ? sampleContent.contact.linkedin : ''),
    website: resumeData.website,
    twitter: resumeData.twitter,
    medium: resumeData.medium
  }

  // Render section based on type
  const renderSection = (sectionId, isWhiteText = false) => {
    const sectionColor = getSectionColor(sectionId)
    const sectionStyles = {
      cursor: 'grab',
      marginBottom: '1.5rem',
      position: 'relative',
      transition: 'all 0.2s ease',
      borderRadius: resumeData.sectionAccent === 'cards' ? sectionRadius : 0,
      padding: resumeData.sectionAccent === 'cards' ? '20px' : '0',
      backgroundColor: resumeData.sectionAccent === 'cards' ? '#ffffff' : 'transparent',
      border: resumeData.sectionAccent === 'cards' ? `1px solid ${sectionColor}22` : 'none',
      boxShadow: resumeData.sectionAccent === 'cards' ? `0 14px 26px ${sectionColor}1a` : 'none',
      '&:hover': {
        transform: 'scale(1.01)'
      }
    }

    const dragHandleStyle = {
      position: 'absolute',
      top: '8px',
      right: '8px',
      fontSize: '18px',
      color: isWhiteText ? 'rgba(255,255,255,0.5)' : `${sectionColor}aa`,
      cursor: 'grab',
      userSelect: 'none',
      padding: '4px',
      lineHeight: '1'
    }

    switch (sectionId) {
      case 'header':
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <div className={`mb-4 pb-4 ${resumeData.template === 'modern' ? 'text-center' : resumeData.template === 'creative' ? 'text-start' : 'text-center'}`} 
                 style={{ 
                   borderBottom: resumeData.template === 'minimal' ? 'none' : `2px solid ${resumeData.accentColor || colorSchemes.find(c => c.id === resumeData.colorScheme)?.primary || '#333'}`,
                   background: resumeData.headerBgColor || (resumeData.template === 'creative' ? `linear-gradient(135deg, ${colorSchemes.find(c => c.id === resumeData.colorScheme)?.primary || '#7b1fa2'}, ${colorSchemes.find(c => c.id === resumeData.colorScheme)?.secondary || '#f48fb1'})` : 'transparent'),
                   color: resumeData.template === 'creative' ? 'white' : 'inherit',
                   padding: resumeData.template === 'creative' ? '30px' : '0',
                   borderRadius: resumeData.template === 'creative' ? '12px' : '0',
                   marginBottom: '2rem'
                 }}>
              {resumeData.profilePhoto && (
                <div className="text-center mb-3">
                  <img 
                    src={resumeData.profilePhoto} 
                    alt="Profile" 
                    style={{
                      width: resumeData.template === 'creative' ? '100px' : '120px',
                      height: resumeData.template === 'creative' ? '100px' : '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: resumeData.template === 'creative' ? '4px solid white' : `3px solid ${resumeData.accentColor || colorSchemes.find(c => c.id === resumeData.colorScheme)?.primary || '#333'}`,
                      marginBottom: '10px'
                    }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
              <h1 className="fw-bold" style={{ 
                fontSize: resumeData.template === 'minimal' ? '32px' : '36px',
                marginBottom: '8px',
                color: resumeData.template === 'creative' ? 'white' : (resumeData.titleColor || resumeData.accentColor || colorSchemes.find(c => c.id === resumeData.colorScheme)?.primary || '#333')
              }}>
                {resumeData.fullName || 'Your Professional Name'}
              </h1>
              <p className="text-muted" style={{ 
                fontSize: resumeData.template === 'classic' ? '18px' : '16px',
                marginBottom: resumeData.template === 'creative' ? '20px' : '15px',
                color: resumeData.template === 'creative' ? 'rgba(255,255,255,0.9)' : '#666'
              }}>
                {resumeData.title || 'Your Professional Title'}
              </p>
              <div className="d-flex flex-wrap gap-3 justify-content-center" style={{ fontSize: '14px', color: resumeData.template === 'creative' ? 'rgba(255,255,255,0.95)' : '#666' }}>
                {previewContact.phone && (
                  <span><i className="bi bi-telephone me-1"></i>{previewContact.phone}</span>
                )}
                {previewContact.email && (
                  <span><i className="bi bi-envelope me-1"></i>{previewContact.email}</span>
                )}
                {previewContact.location && (
                  <span><i className="bi bi-geo-alt me-1"></i>{previewContact.location}</span>
                )}
                {previewContact.linkedin && (
                  <span><i className="bi bi-linkedin me-1"></i>{previewContact.linkedin}</span>
                )}
                {previewContact.twitter && (
                  <span><i className="bi bi-twitter me-1"></i>{resumeData.twitter}</span>
                )}
                {previewContact.medium && (
                  <span><i className="bi bi-medium me-1"></i>{previewContact.medium}</span>
                )}
                {previewContact.website && (
                  <span><i className="bi bi-globe me-1"></i>{previewContact.website}</span>
                )}
              </div>
            </div>
          </div>
        )

      case 'summary':
        const summaryText = resumeData.summary || (showSampleContent ? sampleContent.summary : '')
        if (!summaryText) return null
        const summaryDivider = isWhiteText ? '2px solid rgba(255,255,255,0.35)' : headingDivider(sectionColor)
        const summaryHeadingColor = isWhiteText ? '#ffffff' : sectionColor
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-2" style={{ 
              borderBottom: summaryDivider,
              paddingBottom: '8px',
              color: summaryHeadingColor,
              fontSize: resumeData.template === 'classic' ? '20px' : '18px'
            }}>
              {renderSectionIcon('bi-card-text', summaryHeadingColor)}
              Professional Summary
            </h5>
            <p className="text-muted" style={{ lineHeight: '1.6' }}>{summaryText}</p>
          </div>
        )

      case 'experience':
        const experiences = withSampleList(resumeData.experiences, 'experiences')
        if (experiences.length === 0) return null
        const experienceHeadingColor = isWhiteText ? '#ffffff' : sectionColor
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              borderBottom: headingDivider(sectionColor), 
              paddingBottom: '8px',
              color: experienceHeadingColor,
              fontSize: resumeData.template === 'classic' ? '20px' : '18px'
            }}>
              {renderSectionIcon('bi-briefcase', experienceHeadingColor)}
              Work Experience
            </h5>
            <div>
              {resumeData.layout === 'timeline' && (
                <div style={{ position: 'relative', marginLeft: '6px', marginBottom: '4px' }}>
                  <div style={{ position: 'absolute', left: '9px', top: '10px', bottom: '10px', width: '2px', backgroundColor: `${sectionColor}55` }}></div>
                </div>
              )}
              {experiences.map((exp, idx) => (
                <div
                  key={idx}
                  className="mb-3"
                  style={resumeData.layout === 'timeline' ? { position: 'relative', paddingLeft: '34px' } : undefined}
                >
                  {resumeData.layout === 'timeline' && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '8px',
                        top: '6px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: sectionColor
                      }}
                    ></span>
                  )}
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="fw-semibold mb-0" style={{ color: experienceHeadingColor }}>
                        {exp.position || 'Position Title'}
                      </h6>
                      <p className="text-muted mb-0">{exp.company || 'Company Name'}</p>
                    </div>
                    {(exp.period || exp.startDate) && (
                      <small className="text-muted">
                        {exp.period || `${exp.startDate || ''}${exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}`}
                      </small>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-muted small mt-1 mb-0" style={{ lineHeight: '1.5' }}>{exp.description}</p>
                  )}
                  {idx < experiences.length - 1 && (
                    <hr
                      className="my-2"
                      style={{
                        opacity: resumeData.dividerStyle === 'none' ? 0 : 0.35,
                        borderStyle: resumeData.dividerStyle === 'dotted' ? 'dotted' : 'solid',
                        borderColor: sectionColor
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 'education':
        const educationItems = withSampleList(resumeData.education, 'education')
        if (educationItems.length === 0) return null
        const educationHeadingColor = isWhiteText ? '#ffffff' : sectionColor
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              borderBottom: headingDivider(sectionColor), 
              paddingBottom: '8px',
              color: educationHeadingColor,
              fontSize: resumeData.template === 'classic' ? '20px' : '18px'
            }}>
              {renderSectionIcon('bi-mortarboard', educationHeadingColor)}
              Education
            </h5>
            <div>
              {educationItems.map((edu, idx) => (
                <div
                  key={idx}
                  className="mb-3"
                  style={resumeData.layout === 'timeline' ? { position: 'relative', paddingLeft: '34px' } : undefined}
                >
                  {resumeData.layout === 'timeline' && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '8px',
                        top: '6px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: sectionColor
                      }}
                    ></span>
                  )}
                  <h6 className="fw-semibold mb-0" style={{ color: educationHeadingColor }}>
                    {edu.degree || 'Education'}
                  </h6>
                  <p className="text-muted mb-0">{edu.school || 'School Name'}</p>
                  {edu.startDate && (
                    <small className="text-muted">{edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ''}</small>
                  )}
                  {idx < educationItems.length - 1 && (
                    <hr
                      className="my-2"
                      style={{
                        opacity: resumeData.dividerStyle === 'none' ? 0 : 0.35,
                        borderStyle: resumeData.dividerStyle === 'dotted' ? 'dotted' : 'solid',
                        borderColor: sectionColor
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 'highlights':
        const highlights = withSampleList(resumeData.highlights, 'highlights')
        if (highlights.length === 0) return null
        const highlightHeadingColor = isWhiteText ? '#ffffff' : sectionColor
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              borderBottom: headingDivider(sectionColor), 
              paddingBottom: '8px',
              color: highlightHeadingColor,
              fontSize: resumeData.template === 'classic' ? '20px' : '18px'
            }}>
              {renderSectionIcon('bi-star', highlightHeadingColor)}
              Highlights
            </h5>
            <div
              className="row g-3"
              style={resumeData.layout === 'gallery' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' } : undefined}
            >
              {highlights.map((highlight, idx) => (
                <div key={highlight.id || idx} className={resumeData.layout === 'gallery' ? '' : 'col-md-6'}>
                  <div
                    className="h-100 p-3"
                    style={{
                      borderRadius: sectionRadius,
                      border: `1px solid ${sectionColor}22`,
                      backgroundColor: `${sectionColor}0d`
                    }}
                  >
                    <h6 className="fw-semibold mb-2" style={{ color: highlightHeadingColor }}>
                      {highlight.title || 'Highlight title'}
                    </h6>
                    <p className="text-muted small mb-0" style={{ lineHeight: '1.5' }}>
                      {highlight.description || 'Add a short description to spotlight this win.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'skills':
        const skills = withSampleList(resumeData.skills, 'skills')
        if (skills.length === 0) return null
        const skillsHeadingColor = isWhiteText ? '#ffffff' : sectionColor
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              borderBottom: headingDivider(sectionColor), 
              paddingBottom: '8px',
              color: skillsHeadingColor,
              fontSize: resumeData.template === 'classic' ? '20px' : '18px'
            }}>
              {renderSectionIcon('bi-lightning', skillsHeadingColor)}
              Skills
            </h5>
            {resumeData.layout === 'gallery' ? (
              <div className="d-flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="badge"
                    style={{
                      backgroundColor: `${sectionColor}15`,
                      color: skillsHeadingColor,
                      borderRadius: sectionRadius,
                      padding: '8px 14px'
                    }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            ) : (
              skills.map((skill, idx) => (
                <div key={idx} className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold">{skill.name}</span>
                    <span className="text-muted small">{skill.level}%</span>
                  </div>
                  <div className="progress" style={{ height: resumeData.template === 'classic' ? '8px' : '6px', borderRadius: resumeData.template === 'minimal' ? '0' : '4px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${skill.level}%`,
                        backgroundColor: sectionColor
                      }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )

      case 'projects':
        const projects = withSampleList(resumeData.projects, 'projects')
        if (projects.length === 0) return null
        const projectsHeadingColor = isWhiteText ? '#ffffff' : sectionColor
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              borderBottom: headingDivider(sectionColor), 
              paddingBottom: '8px',
              color: projectsHeadingColor,
              fontSize: resumeData.template === 'classic' ? '20px' : '18px'
            }}>
              {renderSectionIcon('bi-folder', projectsHeadingColor)}
              Projects
            </h5>
            {projects.map((project, idx) => (
              <div
                key={idx}
                className="mb-3"
                style={resumeData.layout === 'gallery'
                  ? { border: `1px solid ${sectionColor}1f`, borderRadius: sectionRadius, padding: '16px' }
                  : undefined}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="fw-semibold mb-1" style={{ color: projectsHeadingColor }}>
                    {project.name || 'Project Name'}
                  </h6>
                  {project.period && (
                    <span className="text-muted small" style={{ fontStyle: 'italic' }}>
                      {project.period}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    {project.description}
                  </p>
                )}
                {idx < projects.length - 1 && (
                  <hr className="my-2" style={{ opacity: 0.3, borderColor: sectionColor }} />
                )}
              </div>
            ))}
          </div>
        )

      case 'languages':
        const languages = withSampleList(resumeData.languages, 'languages')
        if (languages.length === 0) return null
        const languageHeadingColor = isWhiteText ? '#ffffff' : sectionColor
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              borderBottom: headingDivider(sectionColor), 
              paddingBottom: '8px',
              color: languageHeadingColor,
              fontSize: resumeData.template === 'classic' ? '20px' : '18px'
            }}>
              {renderSectionIcon('bi-translate', languageHeadingColor)}
              Languages
            </h5>
            <div className="row g-2">
              {languages.map((lang, idx) => (
                <div key={idx} className="col-6">
                  <div className="fw-semibold" style={{ color: languageHeadingColor }}>{lang.name}</div>
                  <div className="text-muted small" style={{ fontStyle: 'italic', color: `${languageHeadingColor}aa` }}>
                    {lang.proficiency === 'native' && 'Native'}
                    {lang.proficiency === 'proficient' && 'Proficient'}
                    {lang.proficiency === 'working' && 'Working'}
                    {lang.proficiency === 'limited' && 'Limited'}
                    {lang.proficiency === 'elementary' && 'Elementary'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'interests':
        const interests = withSampleList(resumeData.interests, 'interests')
        if (interests.length === 0) return null
        const interestsHeadingColor = isWhiteText ? '#ffffff' : sectionColor
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              borderBottom: headingDivider(sectionColor), 
              paddingBottom: '8px',
              color: interestsHeadingColor,
              fontSize: resumeData.template === 'classic' ? '20px' : '18px'
            }}>
              {renderSectionIcon('bi-lightbulb', interestsHeadingColor)}
              Interests
            </h5>
            <div className="d-flex flex-wrap gap-2">
              {interests.map((interest, idx) => (
                <span 
                  key={idx}
                  className="badge"
                  style={{ 
                    backgroundColor: `${sectionColor}15`,
                    color: interestsHeadingColor,
                    fontSize: '13px',
                    fontWeight: 'normal',
                    padding: '6px 12px',
                    borderRadius: sectionRadius
                  }}
                >
                  {interest.icon} {interest.name}
                </span>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render section for two-column layout (left column - white text)
  const renderSectionTwoColumnLeft = (sectionId) => {
    const sectionStyles = {
      cursor: 'grab',
      marginBottom: '1.5rem',
      position: 'relative'
    }

    const sectionColor = getSectionColor(sectionId)
    const dragHandleStyle = {
      position: 'absolute',
      top: '8px',
      right: '8px',
      fontSize: '16px',
      color: `${sectionColor}aa`,
      cursor: 'grab',
      userSelect: 'none',
      padding: '4px',
      lineHeight: '1'
    }

    switch (sectionId) {
      case 'summary':
        const summaryText = resumeData.summary || (showSampleContent ? sampleContent.summary : '')
        if (!summaryText) return null
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5
              className="fw-bold mb-2"
              style={{
                fontSize: '16px',
                color: sectionColor,
                borderBottom: `2px solid ${sectionColor}66`,
                paddingBottom: '8px'
              }}
            >
              {renderSectionIcon('bi-card-text', sectionColor)}
              Professional Summary
            </h5>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.95)' }}>
              {summaryText}
            </p>
          </div>
        )

      case 'skills':
        const skills = withSampleList(resumeData.skills, 'skills')
        if (skills.length === 0) return null
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5
              className="fw-bold mb-3"
              style={{ fontSize: '16px', color: sectionColor, borderBottom: `2px solid ${sectionColor}66`, paddingBottom: '8px' }}
            >
              {renderSectionIcon('bi-lightning', sectionColor)}
              Key Skills
            </h5>
            {skills.map((skill, index) => (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{skill.name}</span>
                </div>
                <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${skill.level}%`,
                      backgroundColor: sectionColor
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'languages':
        const languages = withSampleList(resumeData.languages, 'languages')
        if (languages.length === 0) return null
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5
              className="fw-bold mb-3"
              style={{ fontSize: '16px', color: sectionColor, borderBottom: `2px solid ${sectionColor}66`, paddingBottom: '8px' }}
            >
              {renderSectionIcon('bi-translate', sectionColor)}
              Languages
            </h5>
            {languages.map((lang, index) => (
              <div key={index} className="mb-2" style={{ fontSize: '13px' }}>
                <div className="fw-semibold" style={{ color: sectionColor }}>{lang.name}</div>
                <div style={{ 
                  fontSize: '12px', 
                  color: `${sectionColor}cc`,
                  fontStyle: 'italic'
                }}>
                  {lang.proficiency === 'native' && 'Native or Bilingual'}
                  {lang.proficiency === 'proficient' && 'Full Professional'}
                  {lang.proficiency === 'working' && 'Professional Working'}
                  {lang.proficiency === 'limited' && 'Limited Working'}
                  {lang.proficiency === 'elementary' && 'Elementary'}
                </div>
              </div>
            ))}
          </div>
        )

      case 'interests':
        const interests = withSampleList(resumeData.interests, 'interests')
        if (interests.length === 0) return null
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5
              className="fw-bold mb-3"
              style={{ fontSize: '16px', color: sectionColor, borderBottom: `2px solid ${sectionColor}66`, paddingBottom: '8px' }}
            >
              {renderSectionIcon('bi-lightbulb', sectionColor)}
              Interests
            </h5>
            <div className="d-flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <span 
                  key={index} 
                  style={{ 
                    fontSize: '12px',
                    backgroundColor: `${sectionColor}22`,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: `1px solid ${sectionColor}55`,
                    color: sectionColor,
                  }}
                >
                  {interest.icon} {interest.name}
                </span>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render section for two-column layout (right column - dark text)
  const renderSectionTwoColumnRight = (sectionId) => {
    const sectionStyles = {
      cursor: 'grab',
      marginBottom: '1.5rem',
      position: 'relative'
    }

    const sectionColor = getSectionColor(sectionId)
    const dragHandleStyle = {
      position: 'absolute',
      top: '8px',
      right: '8px',
      fontSize: '16px',
      color: `${sectionColor}aa`,
      cursor: 'grab',
      userSelect: 'none',
      padding: '4px',
      lineHeight: '1'
    }

    switch (sectionId) {
      case 'highlights':
        const highlights = withSampleList(resumeData.highlights, 'highlights')
        if (highlights.length === 0) return null
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '18px',
                padding: '18px',
                border: `1px solid ${sectionColor}22`,
                boxShadow: '0 8px 20px rgba(0,0,0,0.05)'
              }}
            >
              <h5 className="fw-bold mb-2" style={{ color: sectionColor }}>
                {renderSectionIcon('bi-star', sectionColor)}
                Key Highlights
              </h5>
              {highlights.map((highlight, index) => (
                <div key={highlight.id || index} className="mb-2">
                  <p className="mb-1 fw-semibold" style={{ fontSize: '14px' }}>
                    {highlight.title || 'Highlight title'}
                  </p>
                  <p className="mb-0 text-muted" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {highlight.description || 'Add a concise description here.'}
                  </p>
                  {index < highlights.length - 1 && (
                    <hr className="my-3" style={{ opacity: 0.2 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 'experience':
        const experiences = withSampleList(resumeData.experiences, 'experiences')
        if (experiences.length === 0) return null
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              fontSize: '18px',
              color: sectionColor,
              borderBottom: `2px solid ${sectionColor}`,
              paddingBottom: '8px'
            }}>
              {renderSectionIcon('bi-briefcase', sectionColor)}
              Professional Experience
            </h5>
            {experiences.map((exp, index) => (
              <div key={index} className="mb-3">
                <h6 className="fw-semibold mb-0" style={{ 
                  fontSize: '15px',
                  color: sectionColor 
                }}>
                  {exp.position || 'Position Title'}
                </h6>
                <p className="mb-2" style={{ fontSize: '13px', color: '#666' }}>
                  <em>{exp.company || 'Company Name'}</em>
                </p>
                {index < experiences.length - 1 && <hr style={{ opacity: 0.3, margin: '15px 0', borderColor: sectionColor }} />}
              </div>
            ))}
          </div>
        )

      case 'education':
        const educationItems = withSampleList(resumeData.education, 'education')
        if (educationItems.length === 0) return null
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              fontSize: '18px',
              color: sectionColor,
              borderBottom: `2px solid ${sectionColor}`,
              paddingBottom: '8px'
            }}>
              {renderSectionIcon('bi-mortarboard', sectionColor)}
              Education
            </h5>
            {educationItems.map((edu, index) => (
              <div key={index} className="mb-3">
                <h6 className="fw-semibold mb-0" style={{ 
                  fontSize: '15px',
                  color: sectionColor 
                }}>
                  {edu.degree || 'Degree'}
                </h6>
                <p className="mb-0" style={{ fontSize: '13px', color: '#666' }}>
                  {edu.school || 'School Name'}
                </p>
                {index < educationItems.length - 1 && <hr style={{ opacity: 0.3, margin: '15px 0', borderColor: sectionColor }} />}
              </div>
            ))}
          </div>
        )

      case 'projects':
        const projects = withSampleList(resumeData.projects, 'projects')
        if (projects.length === 0) return null
        return (
          <div style={sectionStyles}>
            <span style={dragHandleStyle}>⋮⋮</span>
            <h5 className="fw-bold mb-3" style={{ 
              fontSize: '18px',
              color: sectionColor,
              borderBottom: `2px solid ${sectionColor}`,
              paddingBottom: '8px'
            }}>
              {renderSectionIcon('bi-folder', sectionColor)}
              Projects
            </h5>
            {projects.map((project, index) => (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="fw-semibold mb-1" style={{ 
                    fontSize: '15px',
                    color: sectionColor 
                  }}>
                    {project.name || 'Project Name'}
                  </h6>
                  {project.period && (
                    <span style={{ 
                      fontSize: '12px', 
                      color: sectionColor,
                      fontStyle: 'italic'
                    }}>
                      {project.period}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5', marginBottom: '0' }}>
                    {project.description}
                  </p>
                )}
                {index < resumeData.projects.length - 1 && <hr style={{ opacity: 0.3, margin: '15px 0', borderColor: sectionColor }} />}
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  const spacingScale = parseFloat(spacingOptions.find((s) => s.id === resumeData.spacing)?.value || '1')
  const paddingValue = densityPadding * spacingScale
  const previewShellPadding = compactPreview ? 24 : 40
  const previewPaperMinHeight = compactPreview ? '820px' : '1000px'
  const previewPaperShadow = compactPreview ? '0 8px 24px rgba(15,23,42,0.12)' : '0 18px 45px rgba(15,23,42,0.18)'

  const renderSplitHeroBanner = () => {
    if (resumeData.layout !== 'split-hero') return null
    const isCard = resumeData.heroStyle === 'card'
    const isAngular = resumeData.heroStyle === 'angular'
    const heroBackground = isCard
      ? '#ffffff'
      : isAngular
        ? `linear-gradient(120deg, ${accentColor}, ${primarySurface})`
        : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`
    const heroText = isCard ? '#111111' : '#ffffff'
    const heroWrapperStyle = {
      background: heroBackground,
      color: heroText,
      borderRadius: '32px',
      padding: '48px',
      marginBottom: '28px',
      boxShadow: isCard ? '0 35px 70px rgba(15,23,42,0.18)' : '0 25px 60px rgba(15,23,42,0.25)'
    }

    const stats = [
      { label: 'Experiences', value: withSampleList(resumeData.experiences, 'experiences').length },
      { label: 'Projects', value: withSampleList(resumeData.projects, 'projects').length },
      { label: 'Skills', value: withSampleList(resumeData.skills, 'skills').length }
    ].filter((stat) => stat.value > 0)

    const contactChips = [
      previewContact.location,
      previewContact.phone,
      previewContact.email,
      previewContact.linkedin
    ].filter(Boolean).slice(0, 3)

    const heroSummary = resumeData.summary || (showSampleContent ? sampleContent.summary : '')

    return (
      <div style={heroWrapperStyle}>
        <div className="d-flex flex-column flex-lg-row align-items-center align-items-lg-start gap-4">
          <div className="text-center text-lg-start">
            {resumeData.profilePhoto && (
              <img
                src={resumeData.profilePhoto}
                alt="Profile"
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '35px',
                  objectFit: 'cover',
                  border: isCard ? `8px solid ${secondarySurface}` : '8px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 15px 30px rgba(0,0,0,0.25)'
                }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}
          </div>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-light text-dark">Showcase Hero</span>
              <span className="badge bg-light text-dark">Template: {resumeData.template}</span>
            </div>
            <h1 className="fw-bold mb-1" style={{ color: heroText }}>{resumeData.fullName || 'Your Name'}</h1>
            <p className="mb-3" style={{ color: isCard ? '#444' : 'rgba(255,255,255,0.9)' }}>{resumeData.title || 'Professional Title'}</p>
            {heroSummary && (
              <p className="mb-3" style={{ color: isCard ? '#555' : 'rgba(255,255,255,0.85)' }}>
                {heroSummary.length > 180 ? `${heroSummary.slice(0, 180)}...` : heroSummary}
              </p>
            )}
            {contactChips.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-4">
                {contactChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="badge"
                    style={{
                      backgroundColor: isCard ? '#f1f3f5' : 'rgba(255,255,255,0.15)',
                      color: heroText,
                      padding: '8px 16px',
                      borderRadius: '20px'
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
            {stats.length > 0 && (
              <div className="row g-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="col-6 col-lg-4">
                    <div
                      className="p-3"
                      style={{
                        borderRadius: '18px',
                        backgroundColor: isCard ? '#111' : 'rgba(255,255,255,0.15)',
                        color: isCard ? '#fff' : '#fff'
                      }}
                    >
                      <div className="fw-bold" style={{ fontSize: '26px' }}>{stat.value}</div>
                      <small style={{ opacity: 0.8 }}>{stat.label}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderDualColumnLayout = () => {
    const [leftWidth, rightWidth] = columnRatio
    return (
      <>
        {renderSplitHeroBanner()}
        <div className="d-flex flex-wrap" style={{ overflow: 'hidden', borderRadius: resumeData.layout === 'split-hero' ? '32px' : '12px' }}>
          <div
            style={{
              flex: `0 0 ${leftWidth}%`,
              maxWidth: `${leftWidth}%`,
              background: primarySurface,
              color: '#ffffff',
              padding: `${paddingValue}px 40px`
            }}
          >
            {resumeData.profilePhoto && resumeData.layout !== 'split-hero' && (
              <div className="text-center mb-4">
                <img
                  src={resumeData.profilePhoto}
                  alt="Profile"
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '5px solid rgba(255,255,255,0.3)',
                    marginBottom: '20px'
                  }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            )}
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2" style={{ fontSize: '28px', color: resumeData.titleColor || '#ffffff' }}>
                {resumeData.fullName || 'Your Name'}
              </h2>
              <p className="mb-3" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                {resumeData.title || 'Your Professional Title'}
              </p>
            </div>
            <div className="mb-4" style={{ fontSize: '13px' }}>
              {previewContact.location && (
                <div className="mb-2"><i className="bi bi-geo-alt me-2"></i>{previewContact.location}</div>
              )}
              {previewContact.phone && (
                <div className="mb-2"><i className="bi bi-telephone me-2"></i>{previewContact.phone}</div>
              )}
              {previewContact.email && (
                <div className="mb-2"><i className="bi bi-envelope me-2"></i>{previewContact.email}</div>
              )}
              {previewContact.linkedin && (
                <div className="mb-2"><i className="bi bi-linkedin me-2"></i>{previewContact.linkedin}</div>
              )}
              {previewContact.website && (
                <div className="mb-2"><i className="bi bi-globe me-2"></i>{previewContact.website}</div>
              )}
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="left-column-sections">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {['summary', 'skills', 'languages', 'interests'].map((sectionId, index) => {
                      const sectionContent = renderSectionTwoColumnLeft(sectionId)
                      if (!sectionContent) return null
                      return (
                        <Draggable key={sectionId} draggableId={`left-${sectionId}`} index={index}>
                          {(dragProvided, snapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              style={{
                                ...dragProvided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.85 : 1,
                                backgroundColor: snapshot.isDragging ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: snapshot.isDragging ? '8px' : '0',
                                padding: snapshot.isDragging ? '10px' : '0',
                                border: snapshot.isDragging ? '2px dashed rgba(255,255,255,0.4)' : 'none'
                              }}
                            >
                              {sectionContent}
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          <div
            style={{
              flex: `0 0 ${rightWidth}%`,
              maxWidth: `${rightWidth}%`,
              backgroundColor: secondarySurface,
              padding: `${paddingValue}px 40px`
            }}
          >
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="right-column-sections">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {['highlights', 'experience', 'education', 'projects'].map((sectionId, index) => {
                      const sectionContent = renderSectionTwoColumnRight(sectionId)
                      if (!sectionContent) return null
                      return (
                        <Draggable key={sectionId} draggableId={`right-${sectionId}`} index={index}>
                          {(dragProvided, snapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              style={{
                                ...dragProvided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.85 : 1,
                                backgroundColor: snapshot.isDragging ? '#f8f9fa' : 'transparent',
                                borderRadius: snapshot.isDragging ? '8px' : '0',
                                padding: snapshot.isDragging ? '10px' : '0',
                                border: snapshot.isDragging ? '2px dashed #333' : 'none'
                              }}
                            >
                              {sectionContent}
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </>
    )
  }

  const renderSingleColumnLayout = () => (
    <div style={{ padding: `${paddingValue}px` }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="resume-sections">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {sectionOrder.map((sectionId, index) => {
                const sectionContent = renderSection(sectionId)
                if (!sectionContent) return null
                return (
                  <Draggable key={sectionId} draggableId={sectionId} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={{
                          ...dragProvided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.85 : 1,
                          backgroundColor: snapshot.isDragging ? '#f8f9fa' : 'transparent',
                          borderRadius: snapshot.isDragging ? '8px' : '0',
                          padding: snapshot.isDragging ? '10px' : '0',
                          border: snapshot.isDragging ? '2px dashed #333' : 'none'
                        }}
                      >
                        {sectionContent}
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )

  const renderPreviewLayout = () => {
    if (['two-column', 'split-hero'].includes(resumeData.layout)) {
      return renderDualColumnLayout()
    }
    return renderSingleColumnLayout()
  }

  const tabBadgeCounts = {
    highlights: resumeData.highlights?.length || 0,
    experience: resumeData.experiences?.length || 0,
    education: resumeData.education?.length || 0,
    projects: resumeData.projects?.length || 0,
    skills: resumeData.skills?.length || 0,
    languages: resumeData.languages?.length || 0,
    interests: resumeData.interests?.length || 0
  }

  return (
    <div className="resume-customize" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Font Modal */}
      {showFontModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 2100,
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
              <h5 className="mb-0">Select Font</h5>
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
                ×
              </button>
            </div>

            {/* Font List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* Suggested */}
              <h6 className="mb-3">Suggested</h6>
              <div className="row g-2 mb-4">
                {fonts.suggested.map(font => (
                  <div key={font} className="col-6">
                    <button
                      className={`btn w-100 ${resumeData.fontFamily === font ? 'btn-dark' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        updateResumeData('fontFamily', font)
                        setShowFontModal(false)
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
                      className={`btn w-100 ${resumeData.fontFamily === font ? 'btn-dark' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        updateResumeData('fontFamily', font)
                        setShowFontModal(false)
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

      {/* Quick Styles Modal */}
      {showQuickStylesModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowQuickStylesModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '500px',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-palette me-2" aria-hidden="true"></i>
                Quick Styles
              </h5>
              <button
                onClick={() => setShowQuickStylesModal(false)}
                className="btn-close"
                aria-label="Close"
              ></button>
            </div>
            <p className="text-muted small mb-4">
              เลือกชุดสีสำเร็จรูปเพื่อเปลี่ยนรูปลักษณ์ Resume ของคุณได้ทันที
            </p>
            <div className="row g-3">
              {stylePresets.map(preset => (
                <div key={preset.id} className="col-6">
                  <button
                    onClick={() => applyStylePreset(preset)}
                    className="btn w-100 p-3 text-start"
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e9ecef',
                      backgroundColor: 'white',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#000'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e9ecef'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div className="fw-bold mb-1" style={{ fontSize: '14px' }}>
                      {preset.name}
                    </div>
                    <div className="d-flex gap-1 mt-2">
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: preset.colors.left
                      }}></div>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: preset.colors.right
                      }}></div>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: preset.colors.accent
                      }}></div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
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
                  top: 0,
                  left: 0,
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
                  position: 'relative',
                  zIndex: 1,
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))'
                }}
              >
                <text
                  x="60"
                  y="75"
                  fontSize="80"
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  V
                </text>
              </svg>
            </div>

            <h4 style={{ color: 'white', marginBottom: '8px', fontWeight: '600' }}>
              สร้าง Resume สำเร็จ! 🎉
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '14px' }}>
              AI ได้สร้างโครงสร้าง Resume ให้คุณแล้ว
            </p>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      {showAIModal && (
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
                  <h4 className="mb-1" style={{ fontWeight: '700' }}>
                    <i className="bi bi-robot me-2" aria-hidden="true"></i>
                    AI Resume Generator
                  </h4>
                  <p className="mb-0" style={{ opacity: 0.9, fontSize: '14px' }}>บอก AI เกี่ยวกับตัวคุณแล้วเราจะสร้าง Resume ให้</p>
                </div>
                <button 
                  onClick={() => setShowAIModal(false)}
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
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div className="mb-4">
                <label className="form-label fw-semibold mb-2">
                  อธิบายเกี่ยวกับตัวคุณ
                </label>
                <textarea
                  className="form-control"
                  rows="6"
                  placeholder="ตัวอย่าง: ผมเป็นนักศึกษาวิศวกรรมคอมพิวเตอร์ปี 4 มี GPA 3.5 เคยทำ project จบเกี่ยวกับ AI chatbot และเคยฝึกงานที่บริษัท ABC เป็นเวลา 3 เดือน มีทักษะด้าน Python, JavaScript และชอบทำงานเป็นทีม..."
                  value={aiPrompt}
                  onChange={(e) => setAIPrompt(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  style={{
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    padding: '12px',
                    fontSize: '14px'
                  }}
                />
                <small className="text-muted d-block mt-2">
                  <i className="bi bi-lightbulb me-1" aria-hidden="true"></i>
                  ยิ่งอธิบายละเอียด AI จะสร้าง Resume ได้ดีและเหมาะสมกับคุณมากขึ้น
                </small>
              </div>

              {/* Quick Example Templates */}
              <div className="mb-4">
                <label className="form-label fw-semibold mb-2" style={{ fontSize: '13px' }}>
                  <i className="bi bi-lightning-fill me-1"></i>
                  ตัวอย่างที่ใช้ได้เลย (คลิกเพื่อใส่)
                </label>
                <div className="d-flex flex-column gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-start"
                    style={{ borderRadius: '8px', fontSize: '12px', padding: '8px 12px' }}
                    onClick={() => setAIPrompt('ผมเป็นนักศึกษาวิศวกรรมคอมพิวเตอร์ปี 4 มี GPA 3.52 เคยทำ project จบเกี่ยวกับ AI chatbot และเคยฝึกงานที่บริษัท Tech Innovate เป็นเวลา 3 เดือน มีทักษะด้าน Python, JavaScript, React และชอบทำงานเป็นทีม')}
                  >
                    💻 <strong>วิศวกร Software:</strong> นักศึกษาปี 4 มี GPA 3.52 เคยฝึกงาน มีทักษะ Python, JS, React
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-start"
                    style={{ borderRadius: '8px', fontSize: '12px', padding: '8px 12px' }}
                    onClick={() => setAIPrompt('ผมสำเร็จการศึกษาบริหารธุรกิจ มีประสบการณ์ทำงานด้านการตลาด 2 ปี เคยทำแคมเปญที่เพิ่ม engagement 35% มีทักษะด้าน Excel, PowerPoint, Google Analytics และ Social Media Marketing')}
                  >
                    📊 <strong>นักการตลาด:</strong> จบบริหารธุรกิจ ประสบการณ์ 2 ปี เคยทำแคมเปญสำเร็จ
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-start"
                    style={{ borderRadius: '8px', fontSize: '12px', padding: '8px 12px' }}
                    onClick={() => setAIPrompt('ผมเป็น UX/UI Designer มีประสบการณ์ 3 ปี ทำงานกับ startup และ agency ออกแบบแอพและเว็บไซต์มากกว่า 20 โปรเจกต์ มีทักษะ Figma, Adobe XD, Photoshop และเข้าใจ user research')}
                  >
                    🎨 <strong>UX/UI Designer:</strong> ประสบการณ์ 3 ปี ทำโปรเจกต์ 20+ ใช้ Figma และ Adobe
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-start"
                    style={{ borderRadius: '8px', fontSize: '12px', padding: '8px 12px' }}
                    onClick={() => setAIPrompt('ผมจบสถิติและวิเคราะห์ข้อมูล มีประสบการณ์ทำ data analysis 1 ปี เคยทำโปรเจกต์วิเคราะห์พฤติกรรมลูกค้าและสร้าง dashboard มีทักษะ Python, SQL, Excel, Tableau และ Power BI')}
                  >
                    📈 <strong>Data Analyst:</strong> จบสถิติ ประสบการณ์ 1 ปี ใช้ Python, SQL, Tableau
                  </button>
                </div>
              </div>

              <button
                onClick={generateResumeFromAI}
                className="btn btn-dark w-100 py-3"
                style={{
                  background: 'linear-gradient(135deg, #000000 0%, #2a2a2a 50%, #000000 100%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                <i className="bi bi-stars me-2" aria-hidden="true"></i>
                Vcreate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="container-fluid" style={{ padding: '20px' }}>

        <div className="row g-3">
          {/* Left Panel - Controls */}
          <div className="col-lg-5 col-xl-4">
            <div className="card shadow-sm" style={{ borderRadius: '16px', border: 'none' }}>
              {/* Header with AI Button */}
              <div className="card-header bg-white border-0 p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold">Resume Customize</h5>
                  <button
                    onClick={() => navigate(-1)}
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius: '8px' }}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Back
                  </button>
                </div>
                
                {/* AI Generator Button */}
                <button
                  onClick={() => setShowAIModal(true)}
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: '700',
                    fontSize: '15px',
                    boxShadow: '0 0 30px rgba(255, 255, 255, 0.4)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Shine effect */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'aiButtonShine 3s infinite',
                    pointerEvents: 'none'
                  }} />
                  <style>{`
                    @keyframes aiButtonShine {
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
                {themeMeta && (
                  <div
                    className="mt-3"
                    style={{
                      borderRadius: '14px',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      color: '#f8fafc',
                      boxShadow: '0 10px 25px rgba(15,23,42,0.25)'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="text-uppercase small" style={{ letterSpacing: '0.08em', opacity: 0.65 }}>
                          Active Theme
                        </div>
                        <div className="fw-semibold" style={{ fontSize: '16px' }}>{themeMeta.name}</div>
                        <div className="small" style={{ opacity: 0.7 }}>{themeSourceLabel}</div>
                        <div className="d-flex gap-2 mt-2">
                          {[themeTokens.bgColor, themeTokens.blockColor, themeTokens.headingColor]
                            .filter(Boolean)
                            .map((color, idx) => (
                              <span
                                key={`${color}-${idx}`}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '6px',
                                  backgroundColor: color,
                                  border: '1px solid rgba(255,255,255,0.3)'
                                }}
                              ></span>
                            ))}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/themes')}
                        className="btn btn-sm btn-light"
                        style={{ borderRadius: '8px', fontWeight: 600 }}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="card-body p-0">
                <div className="d-flex flex-column gap-3" style={{ padding: '16px' }}>
                  {tabSections.map((section) => (
                    <div
                      key={section.id}
                      style={{
                        backgroundColor: '#f8f9fb',
                        borderRadius: '14px',
                        padding: '14px',
                        border: '1px solid #edf0f5'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-semibold" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {section.label}
                          </div>
                          <small className="text-muted">{section.hint}</small>
                        </div>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ced4da' }}></div>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {section.tabIds.map((tabId) => {
                          const tab = tabLookup[tabId]
                          if (!tab) return null
                          const isActive = activeTab === tab.id
                          const badgeValue = tabBadgeCounts[tab.id]
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className="d-flex align-items-center justify-content-between"
                              style={{
                                border: 'none',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                backgroundColor: isActive ? '#111' : 'white',
                                color: isActive ? '#fff' : '#333',
                                fontSize: '13px',
                                fontWeight: isActive ? 600 : 500,
                                boxShadow: isActive ? '0 10px 25px rgba(0,0,0,0.12)' : '0 2px 6px rgba(15,23,42,0.05)',
                                transition: 'all 0.2s'
                              }}
                            >
                              <span className="d-flex align-items-center gap-2">
                                <i className={`bi ${tab.icon}`}></i>
                                {tab.label}
                              </span>
                              {typeof badgeValue === 'number' && badgeValue > 0 && (
                                <span
                                  className="badge rounded-pill"
                                  style={{
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#f1f3f5',
                                    color: isActive ? '#fff' : '#333',
                                    fontWeight: 600,
                                    fontSize: '12px'
                                  }}
                                >
                                  {badgeValue}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tab Content */}
                <div style={{ padding: '20px', minHeight: '400px' }}>
                  {activeTab === 'ai-generator' && (
                    <div>
                      <h6 className="fw-bold mb-3">
                        <i className="bi bi-robot me-2" aria-hidden="true"></i>
                        AI Tools
                      </h6>
                      <div className="alert alert-info" style={{ borderRadius: '12px' }}>
                        <i className="bi bi-lightbulb me-2"></i>
                        คลิกปุ่ม "Vcreate" ด้านบนเพื่อให้ AI ช่วยสร้าง Resume ให้คุณอัตโนมัติ
                      </div>
                      <p className="text-muted small">
                        AI จะช่วยคุณ:
                      </p>
                      <ul className="small text-muted">
                        <li>เลือก Template ที่เหมาะสม</li>
                        <li>เขียน Professional Summary</li>
                        <li>แนะนำ Skills ที่ควรมี</li>
                        <li>จัดรูปแบบให้สวยงามทันที</li>
                      </ul>
                    </div>
                  )}

                  {activeTab === 'template' && (
                    <div>
                      <h6 className="fw-bold mb-3">Template & Layout</h6>
                      <p className="text-muted small mb-3">เลือกรูปแบบ Resume ที่คุณชอบ</p>

                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="toggleSampleContent"
                          checked={showSampleContent}
                          onChange={(e) => setShowSampleContent(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="toggleSampleContent">
                          แสดงตัวอย่างข้อมูลอัตโนมัติ
                        </label>
                      </div>

                      <div className="form-check form-switch mb-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="toggleCompactPreview"
                          checked={compactPreview}
                          onChange={(e) => setCompactPreview(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="toggleCompactPreview">
                          Compact Preview (ลดระยะขอบ & scale)
                        </label>
                      </div>
                      
                      {/* Template Selection */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Resume Template</label>
                        <div className="row g-2">
                          {templates.map(template => (
                            <div key={template.id} className="col-6">
                              <button
                                onClick={() => updateResumeData('template', template.id)}
                                className="btn w-100 text-start p-3"
                                style={{
                                  borderRadius: '12px',
                                  border: resumeData.template === template.id ? '2px solid #000' : '2px solid #e9ecef',
                                  backgroundColor: resumeData.template === template.id ? '#f8f9fa' : 'white',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <i className={`bi ${template.iconClass}`} style={{ fontSize: '20px' }} aria-hidden="true"></i>
                                  <strong className="small">{template.name}</strong>
                                </div>
                                <small className="text-muted d-block">{template.description}</small>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Color Scheme Selection */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Color Scheme</label>
                        <div className="d-flex flex-wrap gap-2">
                          {colorSchemes.map(scheme => (
                            <button
                              key={scheme.id}
                              onClick={() => updateResumeData('colorScheme', scheme.id)}
                              className="btn btn-sm"
                              style={{
                                borderRadius: '8px',
                                border: resumeData.colorScheme === scheme.id ? '2px solid #000' : '2px solid #e9ecef',
                                backgroundColor: 'white',
                                padding: '8px 12px'
                              }}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <div style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  backgroundColor: scheme.primary
                                }}></div>
                                <small className="fw-semibold">{scheme.name}</small>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Layout Selection */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Layout</label>
                        <div className="row g-3">
                          {layoutVariants.map(layout => (
                            <div key={layout.id} className="col-12 col-md-6">
                              <button
                                onClick={() => updateResumeData('layout', layout.id)}
                                className="btn w-100 text-start p-3"
                                style={{
                                  borderRadius: '14px',
                                  border: resumeData.layout === layout.id ? '2px solid #000' : '2px solid #e9ecef',
                                  backgroundColor: resumeData.layout === layout.id ? '#111' : 'white',
                                  color: resumeData.layout === layout.id ? '#fff' : '#111',
                                  transition: 'all 0.2s',
                                  boxShadow: resumeData.layout === layout.id ? '0 18px 30px rgba(15,23,42,0.18)' : '0 4px 12px rgba(15,23,42,0.08)'
                                }}
                              >
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <i className={`bi ${layout.icon}`}></i>
                                  <strong className="small">{layout.name}</strong>
                                </div>
                                <small className="d-block" style={{ opacity: 0.75 }}>{layout.description}</small>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Preview Background</label>
                        <div className="row g-2">
                          {previewBackdropOptions.map(option => (
                            <div className="col-12 col-md-4" key={option.id}>
                              <button
                                onClick={() => setPreviewBackdrop(option.id)}
                                className="btn w-100 text-start"
                                style={{
                                  borderRadius: '12px',
                                  padding: '12px',
                                  border: previewBackdrop === option.id ? '2px solid #000' : '2px solid #e9ecef',
                                  backgroundColor: '#fff'
                                }}
                              >
                                <strong className="small d-block">{option.name}</strong>
                                <small className="text-muted">{option.description}</small>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {['two-column', 'split-hero'].includes(resumeData.layout) && (
                        <div className="mb-4">
                          <label className="form-label small fw-semibold mb-2">Column Ratio</label>
                          <div className="btn-group w-100 flex-wrap" role="group">
                            {columnRatioOptions.map(option => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => updateResumeData('columnRatio', option.id)}
                                className={`btn ${resumeData.columnRatio === option.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                                style={{ borderRadius: '10px', marginBottom: '6px' }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {resumeData.layout === 'split-hero' && (
                        <div className="mb-4">
                          <label className="form-label small fw-semibold mb-2">Hero Treatment</label>
                          <div className="row g-2">
                            {heroStyles.map(style => (
                              <div key={style.id} className="col-12 col-md-4">
                                <button
                                  onClick={() => updateResumeData('heroStyle', style.id)}
                                  className="btn w-100 text-start p-3"
                                  style={{
                                    borderRadius: '14px',
                                    border: resumeData.heroStyle === style.id ? '2px solid #000' : '2px solid #e9ecef',
                                    backgroundColor: 'white',
                                    minHeight: '100px'
                                  }}
                                >
                                  <strong className="small d-block mb-1">{style.name}</strong>
                                  <small className="text-muted">{style.description}</small>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section styling */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Section Surface</label>
                        <div className="row g-2">
                          {sectionAccentOptions.map(option => (
                            <div className="col-12 col-md-4" key={option.id}>
                              <button
                                onClick={() => updateResumeData('sectionAccent', option.id)}
                                className="btn w-100 text-start p-3"
                                style={{
                                  borderRadius: '12px',
                                  border: resumeData.sectionAccent === option.id ? '2px solid #000' : '2px solid #e9ecef',
                                  backgroundColor: 'white'
                                }}
                              >
                                <strong className="small d-block mb-1">{option.name}</strong>
                                <small className="text-muted">{option.description}</small>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Dividers</label>
                        <div className="btn-group w-100" role="group">
                          {dividerOptions.map(option => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => updateResumeData('dividerStyle', option.id)}
                              className={`btn ${resumeData.dividerStyle === option.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                              style={{ borderRadius: '10px' }}
                            >
                              {option.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Corner Radius</label>
                        <div className="btn-group w-100" role="group">
                          {cornerOptions.map(option => (
                            <button
                              key={option.id}
                              onClick={() => updateResumeData('cornerStyle', option.id)}
                              className={`btn ${resumeData.cornerStyle === option.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                              style={{ borderRadius: '10px' }}
                            >
                              {option.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Section Spacing</label>
                        <div className="btn-group w-100" role="group">
                          {densityOptions.map(option => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => updateResumeData('contentDensity', option.id)}
                              className={`btn ${resumeData.contentDensity === option.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                              style={{ borderRadius: '10px' }}
                            >
                              {option.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="toggleSectionIcons"
                          checked={!!resumeData.showSectionIcons}
                          onChange={(e) => updateResumeData('showSectionIcons', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="toggleSectionIcons">
                          แสดงไอคอนหน้าหัวข้อ
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'header' && (
                    <div>
                      <h6 className="fw-bold mb-3">Header Information</h6>
                      
                      {/* Profile Photo */}
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Profile Photo URL</label>
                        <input
                          type="text"
                          className="form-control"
                          value={resumeData.profilePhoto}
                          onChange={(e) => updateResumeData('profilePhoto', e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          style={{ borderRadius: '8px', fontSize: '13px' }}
                        />
                        <small className="text-muted">Optional: Add a profile photo (recommended for 2-column layout)</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={resumeData.fullName}
                          onChange={(e) => updateResumeData('fullName', e.target.value)}
                          placeholder="Your Full Name"
                          style={{ borderRadius: '8px' }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Professional Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={resumeData.title}
                          onChange={(e) => updateResumeData('title', e.target.value)}
                          placeholder="e.g., Software Engineer"
                          style={{ borderRadius: '8px' }}
                        />
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Phone</label>
                          <input
                            type="tel"
                            className="form-control"
                            value={resumeData.phone}
                            onChange={(e) => updateResumeData('phone', e.target.value)}
                            placeholder="(555) 123-4567"
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={resumeData.email}
                            onChange={(e) => updateResumeData('email', e.target.value)}
                            placeholder="your@email.com"
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Location</label>
                        <input
                          type="text"
                          className="form-control"
                          value={resumeData.location}
                          onChange={(e) => updateResumeData('location', e.target.value)}
                          placeholder="City, State"
                          style={{ borderRadius: '8px' }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">LinkedIn URL</label>
                        <input
                          type="url"
                          className="form-control"
                          value={resumeData.linkedin}
                          onChange={(e) => updateResumeData('linkedin', e.target.value)}
                          placeholder="linkedin.com/in/yourprofile"
                          style={{ borderRadius: '8px' }}
                        />
                      </div>
                      
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Twitter</label>
                          <input
                            type="text"
                            className="form-control"
                            value={resumeData.twitter}
                            onChange={(e) => updateResumeData('twitter', e.target.value)}
                            placeholder="@username"
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Medium</label>
                          <input
                            type="text"
                            className="form-control"
                            value={resumeData.medium}
                            onChange={(e) => updateResumeData('medium', e.target.value)}
                            placeholder="medium.com/@username"
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Website</label>
                        <input
                          type="url"
                          className="form-control"
                          value={resumeData.website}
                          onChange={(e) => updateResumeData('website', e.target.value)}
                          placeholder="yourwebsite.com"
                          style={{ borderRadius: '8px' }}
                        />
                      </div>

                      <hr className="my-4" />

                      <h6 className="fw-bold mb-3">Header Styling</h6>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Background Color</label>
                          <input
                            type="color"
                            className="form-control form-control-color w-100"
                            value={resumeData.headerBgColor}
                            onChange={(e) => updateResumeData('headerBgColor', e.target.value)}
                            style={{ height: '45px', borderRadius: '8px' }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Title Color</label>
                          <input
                            type="color"
                            className="form-control form-control-color w-100"
                            value={resumeData.titleColor}
                            onChange={(e) => updateResumeData('titleColor', e.target.value)}
                            style={{ height: '45px', borderRadius: '8px' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'summary' && (
                    <div>
                      <h6 className="fw-bold mb-3"><i className="bi bi-card-text me-2"></i>Professional Summary</h6>
                      <p className="text-muted small mb-2">
                        เขียนย่อหน้าสั้นๆ เกี่ยวกับตัวคุณ ความสามารถ และสิ่งที่ต้องการทำ (2–4 ประโยค)
                      </p>

                      {/* Quick-fill starters */}
                      {!resumeData.summary && (
                        <div className="mb-3">
                          <p className="small fw-semibold text-muted mb-2">⚡ เริ่มจาก template:</p>
                          <div className="d-flex flex-wrap gap-2">
                            {[
                              { label: '💻 Developer', text: 'Passionate software developer with experience building scalable web applications. Skilled in React, Node.js, and cloud platforms. Eager to contribute to innovative teams and deliver user-focused solutions.' },
                              { label: '📊 Business', text: 'Results-oriented business professional with a background in marketing and data analysis. Experienced in driving growth through strategic campaigns and cross-functional collaboration.' },
                              { label: '🎨 Designer', text: 'Creative UX/UI designer with a user-first approach and strong visual storytelling skills. Experienced in Figma, design systems, and translating complex problems into elegant interfaces.' },
                              { label: '🎓 Fresh Grad', text: 'Motivated fresh graduate with hands-on project experience and a strong academic foundation. Quick learner with a passion for problem-solving and continuous growth.' }
                            ].map(t => (
                              <button
                                key={t.label}
                                className="btn btn-sm btn-outline-secondary"
                                style={{ borderRadius: '20px', fontSize: '12px' }}
                                onClick={() => updateResumeData('summary', t.text)}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea
                        className="form-control mb-2"
                        rows="6"
                        value={resumeData.summary}
                        onChange={(e) => updateResumeData('summary', e.target.value)}
                        placeholder="ตัวอย่าง: Experienced software engineer with 5+ years in web development. Skilled in React, Node.js, and cloud technologies. Passionate about building scalable applications and leading development teams..."
                        style={{ borderRadius: '8px', fontSize: '14px' }}
                      />
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {resumeData.summary.length} characters
                        </small>
                        <button 
                          className="btn btn-sm btn-outline-dark"
                          style={{ borderRadius: '6px' }}
                          disabled={isEnhancingSummary}
                          onClick={handleAIEnhanceSummary}
                        >
                          {isEnhancingSummary
                            ? <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Enhancing...</>
                            : <><i className="bi bi-magic me-1"></i>AI Enhance</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'experience' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-briefcase me-2" aria-hidden="true"></i>
                          Work Experience
                        </h6>
                        <button
                          className="btn btn-sm btn-dark"
                          style={{ borderRadius: '8px' }}
                          onClick={() => {
                            const newExperience = {
                              id: Date.now(),
                              position: '',
                              company: '',
                              location: '',
                              startDate: '',
                              endDate: '',
                              current: false,
                              bulletPoints: ['']
                            }
                            setResumeData(prev => ({
                              ...prev,
                              experiences: [...prev.experiences, newExperience]
                            }))
                          }}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Add Experience
                        </button>
                      </div>

                      {resumeData.experiences.length === 0 ? (
                        <div className="text-center py-4" style={{ border: '2px dashed #dee2e6', borderRadius: '12px' }}>
                          <i className="bi bi-briefcase display-6 text-muted d-block mb-2"></i>
                          <p className="text-muted mb-3">ยังไม่มีประสบการณ์ทำงาน</p>
                          <button
                            className="btn btn-sm btn-dark"
                            style={{ borderRadius: '8px' }}
                            onClick={() => {
                              const newExp = { id: Date.now(), position: '', company: '', location: '', startDate: '', endDate: '', current: false, bulletPoints: [''] }
                              setResumeData(prev => ({ ...prev, experiences: [...prev.experiences, newExp] }))
                            }}
                          >
                            <i className="bi bi-plus-circle me-1"></i> เพิ่มประสบการณ์แรก
                          </button>
                        </div>
                      ) : (
                        resumeData.experiences.map((exp, index) => (
                          <div key={exp.id} className="card mb-3" style={{ borderRadius: '12px' }}>
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <strong className="small text-muted">#{index + 1} {exp.position || 'Untitled'}</strong>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  style={{ borderRadius: '6px', padding: '2px 8px' }}
                                  onClick={() => setResumeData(prev => ({ ...prev, experiences: prev.experiences.filter(e => e.id !== exp.id) }))}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                              <div className="row g-2 mb-2">
                                <div className="col-6">
                                  <input type="text" className="form-control form-control-sm" placeholder="Position Title *" value={exp.position}
                                    onChange={(e) => { const n = [...resumeData.experiences]; n[index] = { ...n[index], position: e.target.value }; setResumeData(prev => ({ ...prev, experiences: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-6">
                                  <input type="text" className="form-control form-control-sm" placeholder="Company Name *" value={exp.company}
                                    onChange={(e) => { const n = [...resumeData.experiences]; n[index] = { ...n[index], company: e.target.value }; setResumeData(prev => ({ ...prev, experiences: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-12">
                                  <input type="text" className="form-control form-control-sm" placeholder="Location (e.g. Bangkok, Thailand)" value={exp.location || ''}
                                    onChange={(e) => { const n = [...resumeData.experiences]; n[index] = { ...n[index], location: e.target.value }; setResumeData(prev => ({ ...prev, experiences: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-5">
                                  <label className="form-label small mb-1 text-muted">Start Date</label>
                                  <input type="month" className="form-control form-control-sm" value={exp.startDate || ''}
                                    onChange={(e) => { const n = [...resumeData.experiences]; n[index] = { ...n[index], startDate: e.target.value }; setResumeData(prev => ({ ...prev, experiences: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-5">
                                  <label className="form-label small mb-1 text-muted">End Date</label>
                                  <input type="month" className="form-control form-control-sm" value={exp.endDate || ''} disabled={exp.current}
                                    onChange={(e) => { const n = [...resumeData.experiences]; n[index] = { ...n[index], endDate: e.target.value }; setResumeData(prev => ({ ...prev, experiences: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-2 d-flex align-items-end pb-1">
                                  <div className="form-check">
                                    <input type="checkbox" className="form-check-input" id={`current-${exp.id}`} checked={exp.current || false}
                                      onChange={(e) => { const n = [...resumeData.experiences]; n[index] = { ...n[index], current: e.target.checked, endDate: e.target.checked ? '' : n[index].endDate }; setResumeData(prev => ({ ...prev, experiences: n })) }} />
                                    <label className="form-check-label small" htmlFor={`current-${exp.id}`}>Now</label>
                                  </div>
                                </div>
                              </div>
                              <label className="form-label small fw-semibold">Key Achievements / Responsibilities</label>
                              {(exp.bulletPoints || ['']).map((bp, bpIdx) => (
                                <div key={bpIdx} className="d-flex gap-1 mb-1">
                                  <span className="text-muted mt-1" style={{ fontSize: '12px' }}>•</span>
                                  <input type="text" className="form-control form-control-sm" placeholder="e.g. Led team of 5 engineers to deliver project on time" value={bp}
                                    onChange={(e) => {
                                      const n = [...resumeData.experiences]
                                      const bps = [...(n[index].bulletPoints || [''])]
                                      bps[bpIdx] = e.target.value
                                      n[index] = { ...n[index], bulletPoints: bps }
                                      setResumeData(prev => ({ ...prev, experiences: n }))
                                    }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                  <button className="btn btn-sm btn-outline-secondary" style={{ padding: '2px 6px', borderRadius: '6px' }}
                                    onClick={() => {
                                      const n = [...resumeData.experiences]
                                      const bps = (n[index].bulletPoints || ['']).filter((_, i) => i !== bpIdx)
                                      n[index] = { ...n[index], bulletPoints: bps.length ? bps : [''] }
                                      setResumeData(prev => ({ ...prev, experiences: n }))
                                    }}>
                                    <i className="bi bi-dash"></i>
                                  </button>
                                </div>
                              ))}
                              <button className="btn btn-sm btn-outline-dark mt-1" style={{ borderRadius: '6px', fontSize: '12px' }}
                                onClick={() => {
                                  const n = [...resumeData.experiences]
                                  n[index] = { ...n[index], bulletPoints: [...(n[index].bulletPoints || ['']), ''] }
                                  setResumeData(prev => ({ ...prev, experiences: n }))
                                }}>
                                <i className="bi bi-plus me-1"></i>Add bullet
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'education' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-mortarboard me-2" aria-hidden="true"></i>
                          Education
                        </h6>
                        <button
                          className="btn btn-sm btn-dark"
                          style={{ borderRadius: '8px' }}
                          onClick={() => {
                            const newEducation = {
                              id: Date.now(),
                              degree: '',
                              school: '',
                              location: '',
                              graduationDate: '',
                              gpa: '',
                              coursework: []
                            }
                            setResumeData(prev => ({
                              ...prev,
                              education: [...prev.education, newEducation]
                            }))
                          }}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Add Education
                        </button>
                      </div>

                      {resumeData.education.length === 0 ? (
                        <div className="text-center py-4" style={{ border: '2px dashed #dee2e6', borderRadius: '12px' }}>
                          <i className="bi bi-mortarboard display-6 text-muted d-block mb-2"></i>
                          <p className="text-muted mb-3">ยังไม่มีข้อมูลการศึกษา</p>
                          <button className="btn btn-sm btn-dark" style={{ borderRadius: '8px' }}
                            onClick={() => {
                              const newEdu = { id: Date.now(), degree: '', school: '', location: '', startDate: '', graduationDate: '', gpa: '' }
                              setResumeData(prev => ({ ...prev, education: [...prev.education, newEdu] }))
                            }}>
                            <i className="bi bi-plus-circle me-1"></i> เพิ่มการศึกษา
                          </button>
                        </div>
                      ) : (
                        resumeData.education.map((edu, index) => (
                          <div key={edu.id} className="card mb-3" style={{ borderRadius: '12px' }}>
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <strong className="small text-muted">#{index + 1} {edu.school || 'Untitled'}</strong>
                                <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: '6px', padding: '2px 8px' }}
                                  onClick={() => setResumeData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== edu.id) }))}>
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                              <div className="row g-2">
                                <div className="col-12">
                                  <input type="text" className="form-control form-control-sm" placeholder="Degree / Major (e.g. B.Eng Computer Engineering)" value={edu.degree}
                                    onChange={(e) => { const n = [...resumeData.education]; n[index] = { ...n[index], degree: e.target.value }; setResumeData(prev => ({ ...prev, education: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-8">
                                  <input type="text" className="form-control form-control-sm" placeholder="School / University *" value={edu.school}
                                    onChange={(e) => { const n = [...resumeData.education]; n[index] = { ...n[index], school: e.target.value }; setResumeData(prev => ({ ...prev, education: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-4">
                                  <input type="text" className="form-control form-control-sm" placeholder="GPA (e.g. 3.52)" value={edu.gpa || ''}
                                    onChange={(e) => { const n = [...resumeData.education]; n[index] = { ...n[index], gpa: e.target.value }; setResumeData(prev => ({ ...prev, education: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-6">
                                  <label className="form-label small mb-1 text-muted">Start Date</label>
                                  <input type="month" className="form-control form-control-sm" value={edu.startDate || ''}
                                    onChange={(e) => { const n = [...resumeData.education]; n[index] = { ...n[index], startDate: e.target.value }; setResumeData(prev => ({ ...prev, education: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-6">
                                  <label className="form-label small mb-1 text-muted">Graduation Date</label>
                                  <input type="month" className="form-control form-control-sm" value={edu.graduationDate || ''}
                                    onChange={(e) => { const n = [...resumeData.education]; n[index] = { ...n[index], graduationDate: e.target.value }; setResumeData(prev => ({ ...prev, education: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                <div className="col-12">
                                  <input type="text" className="form-control form-control-sm" placeholder="Location (optional)" value={edu.location || ''}
                                    onChange={(e) => { const n = [...resumeData.education]; n[index] = { ...n[index], location: e.target.value }; setResumeData(prev => ({ ...prev, education: n })) }}
                                    style={{ borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'skills' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-lightning me-2" aria-hidden="true"></i>
                          Skills
                        </h6>
                        <button
                          className="btn btn-sm btn-dark"
                          style={{ borderRadius: '8px' }}
                          onClick={() => {
                            const newSkill = { name: '', level: 50 }
                            setResumeData(prev => ({
                              ...prev,
                              skills: [...prev.skills, newSkill]
                            }))
                          }}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Add Skill
                        </button>
                      </div>

                      {resumeData.skills.length === 0 ? (
                        <div className="alert alert-secondary text-center" style={{ borderRadius: '12px' }}>
                          <i className="bi bi-lightning me-2"></i>
                          No skills added yet
                        </div>
                      ) : (
                        resumeData.skills.map((skill, index) => (
                          <div key={index} className="card mb-3 p-3" style={{ borderRadius: '12px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <input
                                type="text"
                                className="form-control form-control-sm me-2"
                                placeholder="Skill name"
                                value={skill.name}
                                onChange={(e) => {
                                  const newSkills = [...resumeData.skills]
                                  newSkills[index].name = e.target.value
                                  setResumeData(prev => ({ ...prev, skills: newSkills }))
                                }}
                                style={{ borderRadius: '6px', fontSize: '13px', flex: 1 }}
                              />
                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{ borderRadius: '6px', padding: '2px 8px' }}
                                onClick={() => {
                                  setResumeData(prev => ({
                                    ...prev,
                                    skills: prev.skills.filter((_, i) => i !== index)
                                  }))
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <small className="text-muted">Level</small>
                                <small className="fw-semibold">{skill.level}%</small>
                              </div>
                              <input
                                type="range"
                                className="form-range"
                                min="0"
                                max="100"
                                value={skill.level}
                                onChange={(e) => {
                                  const newSkills = [...resumeData.skills]
                                  newSkills[index].level = parseInt(e.target.value)
                                  setResumeData(prev => ({ ...prev, skills: newSkills }))
                                }}
                              />
                              <div className="progress mt-1" style={{ height: '6px', borderRadius: '3px' }}>
                                <div 
                                  className="progress-bar bg-dark" 
                                  style={{ width: `${skill.level}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'projects' && (
                    <div>
                      <h6 className="fw-bold mb-3">Personal Projects</h6>
                      <button
                        className="btn btn-sm btn-dark w-100 mb-3"
                        style={{ borderRadius: '8px' }}
                        onClick={() => {
                          const newProject = { 
                            id: Date.now(), 
                            name: '', 
                            period: '', 
                            description: '' 
                          }
                          setResumeData(prev => ({
                            ...prev,
                            projects: [...prev.projects, newProject]
                          }))
                        }}
                      >
                        <i className="bi bi-plus-circle me-1"></i> Add Project
                      </button>

                      {resumeData.projects.length === 0 ? (
                        <div className="alert alert-secondary text-center" style={{ borderRadius: '12px' }}>
                          <i className="bi bi-folder me-2"></i>
                          No projects added yet
                        </div>
                      ) : (
                        resumeData.projects.map((project, index) => (
                          <div key={project.id} className="card mb-3 p-3" style={{ borderRadius: '12px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <input
                                type="text"
                                className="form-control form-control-sm me-2"
                                placeholder="Project Name"
                                value={project.name}
                                onChange={(e) => {
                                  const newProjects = [...resumeData.projects]
                                  newProjects[index].name = e.target.value
                                  setResumeData(prev => ({ ...prev, projects: newProjects }))
                                }}
                                style={{ borderRadius: '6px', fontSize: '13px' }}
                              />
                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{ borderRadius: '6px', padding: '2px 8px' }}
                                onClick={() => {
                                  setResumeData(prev => ({
                                    ...prev,
                                    projects: prev.projects.filter((_, i) => i !== index)
                                  }))
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                            <input
                              type="text"
                              className="form-control form-control-sm mb-2"
                              placeholder="Period (e.g., 2017 - Present)"
                              value={project.period}
                              onChange={(e) => {
                                const newProjects = [...resumeData.projects]
                                newProjects[index].period = e.target.value
                                setResumeData(prev => ({ ...prev, projects: newProjects }))
                              }}
                              style={{ borderRadius: '6px', fontSize: '13px' }}
                            />
                            <textarea
                              className="form-control form-control-sm"
                              placeholder="Project description..."
                              rows="3"
                              value={project.description}
                              onChange={(e) => {
                                const newProjects = [...resumeData.projects]
                                newProjects[index].description = e.target.value
                                setResumeData(prev => ({ ...prev, projects: newProjects }))
                              }}
                              style={{ borderRadius: '6px', fontSize: '13px' }}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'highlights' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="me-3">
                          <h6 className="fw-bold mb-1">
                            <i className="bi bi-star me-2" aria-hidden="true"></i>
                            Key Highlights
                          </h6>
                          <p className="text-muted small mb-0">
                            ใช้การ์ดสั้นๆ เพื่อโชว์ผลลัพธ์, impact หรือ strength ที่อยากเน้น
                          </p>
                        </div>
                        <button
                          className="btn btn-sm btn-dark"
                          style={{ borderRadius: '8px' }}
                          onClick={() => {
                            const newCard = {
                              id: Date.now(),
                              title: '',
                              description: ''
                            }
                            updateHighlights((current) => [...current, newCard])
                          }}
                        >
                          <i className="bi bi-plus-circle me-1"></i>
                          Add Card
                        </button>
                      </div>

                      {resumeData.highlights.length === 0 ? (
                        <div className="alert alert-secondary text-center" style={{ borderRadius: '12px' }}>
                          <i className="bi bi-stars me-2"></i>
                          ยังไม่มี highlight — เริ่มจากการเพิ่มการ์ดแรกเลย
                        </div>
                      ) : (
                        resumeData.highlights.map((highlight, index) => (
                          <div key={highlight.id || index} className="card mb-3" style={{ borderRadius: '12px' }}>
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <strong className="small">Card #{index + 1}</strong>
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    style={{ borderRadius: '6px', padding: '2px 8px' }}
                                    onClick={() => {
                                      updateHighlights((current) => {
                                        const draft = [...current]
                                        const duplicate = { ...draft[index], id: Date.now() }
                                        draft.splice(index + 1, 0, duplicate)
                                        return draft
                                      })
                                    }}
                                  >
                                    <i className="bi bi-files"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    style={{ borderRadius: '6px', padding: '2px 8px' }}
                                    onClick={() => {
                                      updateHighlights((current) => current.filter((_, i) => i !== index))
                                    }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </div>
                              <input
                                type="text"
                                className="form-control form-control-sm mb-2"
                                placeholder="เช่น Increased conversion rate by 45%"
                                value={highlight.title || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  updateHighlights((current) =>
                                    current.map((card, cardIndex) =>
                                      cardIndex === index ? { ...card, title: value } : card
                                    )
                                  )
                                }}
                                style={{ borderRadius: '6px', fontSize: '13px' }}
                              />
                              <textarea
                                className="form-control form-control-sm"
                                rows="3"
                                placeholder="รายละเอียดสั้นๆ พร้อม metrics หรือบริบท"
                                value={highlight.description || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  updateHighlights((current) =>
                                    current.map((card, cardIndex) =>
                                      cardIndex === index ? { ...card, description: value } : card
                                    )
                                  )
                                }}
                                style={{ borderRadius: '6px', fontSize: '13px' }}
                              ></textarea>
                              <div className="d-flex justify-content-between align-items-center mt-2">
                                <small className="text-muted">{(highlight.description || '').length} chars</small>
                                <small className="text-muted">แนะนำ 1-2 sentence</small>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'languages' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-translate me-2" aria-hidden="true"></i>
                          Languages
                        </h6>
                        <button
                          className="btn btn-sm btn-dark"
                          style={{ borderRadius: '8px' }}
                          onClick={() => {
                            const newLanguage = { 
                              id: Date.now(), 
                              name: '', 
                              proficiency: 'proficient' 
                            }
                            setResumeData(prev => ({
                              ...prev,
                              languages: [...prev.languages, newLanguage]
                            }))
                          }}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Add Language
                        </button>
                      </div>

                      {resumeData.languages.length === 0 ? (
                        <div className="alert alert-secondary text-center" style={{ borderRadius: '12px' }}>
                          <i className="bi bi-translate me-2"></i>
                          No languages added yet
                        </div>
                      ) : (
                        resumeData.languages.map((lang, index) => (
                          <div key={lang.id} className="card mb-3 p-3" style={{ borderRadius: '12px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <input
                                type="text"
                                className="form-control form-control-sm me-2"
                                placeholder="Language name"
                                value={lang.name}
                                onChange={(e) => {
                                  const newLanguages = [...resumeData.languages]
                                  newLanguages[index].name = e.target.value
                                  setResumeData(prev => ({ ...prev, languages: newLanguages }))
                                }}
                                style={{ borderRadius: '6px', fontSize: '13px', flex: 1 }}
                              />
                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{ borderRadius: '6px', padding: '2px 8px' }}
                                onClick={() => {
                                  setResumeData(prev => ({
                                    ...prev,
                                    languages: prev.languages.filter((_, i) => i !== index)
                                  }))
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                            <select
                              className="form-select form-select-sm"
                              value={lang.proficiency}
                              onChange={(e) => {
                                const newLanguages = [...resumeData.languages]
                                newLanguages[index].proficiency = e.target.value
                                setResumeData(prev => ({ ...prev, languages: newLanguages }))
                              }}
                              style={{ borderRadius: '6px', fontSize: '13px' }}
                            >
                              <option value="native">Native or Bilingual Proficiency</option>
                              <option value="proficient">Full Professional Proficiency</option>
                              <option value="working">Professional Working Proficiency</option>
                              <option value="limited">Limited Working Proficiency</option>
                              <option value="elementary">Elementary Proficiency</option>
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'interests' && (
                    <div>
                      <h6 className="fw-bold mb-3">Interests & Hobbies</h6>
                      <button
                        className="btn btn-sm btn-dark w-100 mb-3"
                        style={{ borderRadius: '8px' }}
                        onClick={() => {
                          const newInterest = { 
                            id: Date.now(), 
                            name: '', 
                            icon: '🎯' 
                          }
                          setResumeData(prev => ({
                            ...prev,
                            interests: [...prev.interests, newInterest]
                          }))
                        }}
                      >
                        <i className="bi bi-plus-circle me-1"></i> Add Interest
                      </button>

                      {resumeData.interests.length === 0 ? (
                        <div className="alert alert-secondary text-center" style={{ borderRadius: '12px' }}>
                          <i className="bi bi-heart me-2"></i>
                          No interests added yet
                        </div>
                      ) : (
                        resumeData.interests.map((interest, index) => (
                          <div key={interest.id} className="card mb-3 p-3" style={{ borderRadius: '12px' }}>
                            <div className="d-flex justify-content-between align-items-center gap-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Interest name"
                                value={interest.name}
                                onChange={(e) => {
                                  const newInterests = [...resumeData.interests]
                                  newInterests[index].name = e.target.value
                                  setResumeData(prev => ({ ...prev, interests: newInterests }))
                                }}
                                style={{ borderRadius: '6px', fontSize: '13px', flex: 1 }}
                              />
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Icon"
                                value={interest.icon}
                                onChange={(e) => {
                                  const newInterests = [...resumeData.interests]
                                  newInterests[index].icon = e.target.value
                                  setResumeData(prev => ({ ...prev, interests: newInterests }))
                                }}
                                style={{ borderRadius: '6px', fontSize: '13px', width: '60px', textAlign: 'center' }}
                              />
                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{ borderRadius: '6px', padding: '2px 8px' }}
                                onClick={() => {
                                  setResumeData(prev => ({
                                    ...prev,
                                    interests: prev.interests.filter((_, i) => i !== index)
                                  }))
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      <small className="text-muted">
                        <i className="bi bi-lightbulb me-1" aria-hidden="true"></i>
                        Tip: ใช้ emoji เป็นไอคอน เช่น ⚽ 🎨 📚 🎸 ✈️
                      </small>
                    </div>
                  )}

                  {activeTab === 'styling' && (
                    <div>
                      <h6 className="fw-bold mb-3">
                        <i className="bi bi-palette me-2" aria-hidden="true"></i>
                        Colors & Styling
                      </h6>
                      
                      {/* Column Colors (for 2-column layout) */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Column Colors</label>
                        <div className="row g-2">
                          <div className="col-6">
                            <small className="text-muted d-block mb-1">Left Column</small>
                            <input
                              type="color"
                              className="form-control form-control-color w-100"
                              value={resumeData.leftColumnBg}
                              onChange={(e) => updateResumeData('leftColumnBg', e.target.value)}
                              style={{ height: '45px', borderRadius: '8px' }}
                            />
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block mb-1">Right Column</small>
                            <input
                              type="color"
                              className="form-control form-control-color w-100"
                              value={resumeData.rightColumnBg}
                              onChange={(e) => updateResumeData('rightColumnBg', e.target.value)}
                              style={{ height: '45px', borderRadius: '8px' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Accent Color */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Accent Color</label>
                        <p className="text-muted small mb-2">ใช้กับวันที่, bullet points, highlights</p>
                        <input
                          type="color"
                          className="form-control form-control-color w-100"
                          value={resumeData.accentColor}
                          onChange={(e) => updateResumeData('accentColor', e.target.value)}
                          style={{ height: '45px', borderRadius: '8px' }}
                        />
                      </div>

                      {/* Content Block Colors */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-1">Content Block Colors</label>
                        <small className="text-muted d-block mb-3">เลือกสีเฉพาะสำหรับแต่ละส่วนเพื่อเน้นข้อมูลให้ชัดขึ้น</small>
                        <div className="d-flex flex-column gap-2">
                          {contentBlockOptions.map((block) => {
                            const appliedColor = getSectionColor(block.id)
                            const isCustom = !!resumeData.sectionColors?.[block.id]
                            return (
                              <div
                                key={block.id}
                                className="d-flex align-items-center justify-content-between p-2"
                                style={{
                                  borderRadius: '12px',
                                  border: '1px solid #edf0f5',
                                  backgroundColor: '#fff'
                                }}
                              >
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    className="d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '10px',
                                      backgroundColor: `${appliedColor}22`,
                                      color: appliedColor,
                                      fontSize: '18px'
                                    }}
                                  >
                                    <i className={`bi ${block.icon}`}></i>
                                  </div>
                                  <div>
                                    <div className="fw-semibold" style={{ fontSize: '13px' }}>{block.label}</div>
                                    <small className="text-muted">{block.description}</small>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <input
                                    type="color"
                                    className="form-control form-control-color"
                                    id={`section-color-${block.id}`}
                                    value={appliedColor}
                                    title={`เลือกสีสำหรับ ${block.label}`}
                                    onChange={(e) => updateSectionColor(block.id, e.target.value)}
                                    style={{ width: '52px', height: '38px', borderRadius: '8px' }}
                                  />
                                  {isCustom ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      style={{ borderRadius: '8px' }}
                                      onClick={() => updateSectionColor(block.id, null)}
                                    >
                                      รีเซ็ต
                                    </button>
                                  ) : (
                                    <span className="badge bg-light text-dark" style={{ borderRadius: '20px' }}>default</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <hr className="my-4" />

                      {/* Section Icons Toggle */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Section Icons</label>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="sectionIconsToggle"
                            checked={resumeData.showSectionIcons}
                            onChange={(e) => updateResumeData('showSectionIcons', e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <label className="form-check-label text-muted small" htmlFor="sectionIconsToggle" style={{ cursor: 'pointer' }}>
                            แสดงไอคอนที่หัวข้อแต่ละ section
                          </label>
                        </div>
                      </div>

                      <hr className="my-4" />

                      {/* Font Family */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Font Family</label>
                        <button
                          onClick={() => setShowFontModal(true)}
                          className="btn btn-outline-dark w-100 text-start d-flex justify-content-between align-items-center"
                          style={{ borderRadius: '12px', padding: '12px 16px' }}
                        >
                          <span style={{ fontFamily: resumeData.fontFamily }}>{resumeData.fontFamily}</span>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>

                      {/* Font Size */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Font Size</label>
                        <div className="btn-group w-100" role="group">
                          {fontSizes.map(size => (
                            <button
                              key={size.id}
                              onClick={() => updateResumeData('fontSize', size.id)}
                              className={`btn ${resumeData.fontSize === size.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                              style={{ borderRadius: '8px' }}
                            >
                              {size.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Spacing */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold mb-2">Line Spacing</label>
                        <div className="btn-group w-100" role="group">
                          {spacingOptions.map(spacing => (
                            <button
                              key={spacing.id}
                              onClick={() => updateResumeData('spacing', spacing.id)}
                              className={`btn ${resumeData.spacing === spacing.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                              style={{ borderRadius: '8px' }}
                            >
                              {spacing.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="alert alert-light" style={{ borderRadius: '12px', fontSize: '13px' }}>
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Tip:</strong> ดูผลลัพธ์ได้ที่ Preview panel ทางขวา
                      </div>
                    </div>
                  )}

                  {/* Other tabs content */}
                  {!['ai-generator', 'template', 'header', 'summary', 'highlights', 'experience', 'education', 'skills', 'projects', 'languages', 'interests', 'styling'].includes(activeTab) && (
                    <div className="alert alert-info" style={{ borderRadius: '12px' }}>
                      <i className="bi bi-info-circle me-2"></i>
                      เลือก tab ด้านซ้ายเพื่อแก้ไขข้อมูล Resume ของคุณ
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="col-lg-7 col-xl-8">
            <div className="resume-preview-sticky">
              <div className="resume-preview-scroll">
                <div className="card shadow-sm" style={{ borderRadius: '16px', border: 'none', minHeight: compactPreview ? 'auto' : '800px' }}>
                  <div className="card-header bg-white border-0 p-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold">Preview</h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {profiles.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Editing:</label>
                            <select 
                              className="form-select form-select-sm" 
                              style={{ width: 'auto', minWidth: '200px' }}
                              value={currentProfileId || ''}
                              onChange={onProfileSwitch}
                            >
                              {profiles.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.type})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        <button
                          onClick={() => {
                            onUpdateRef.current({
                              ...profile,
                              ...resumeData
                            })
                            setShowSuccessNotification(true)
                            setTimeout(() => setShowSuccessNotification(false), 3000)
                          }}
                          className="btn btn-dark btn-sm"
                          style={{
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
                            border: '2px solid rgba(255,255,255,0.15)',
                            boxShadow: '0 0 20px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
                            textShadow: '0 0 10px rgba(255,255,255,0.5)'
                          }}
                        >
                          Save
                        </button>
                        
                        <button
                          className="btn btn-outline-dark btn-sm"
                          style={{ borderRadius: '8px' }}
                          onClick={handleDownloadResumePdf}
                        >
                          <i className="bi bi-download me-1"></i> Export PDF
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`card-body preview-stage preview-stage--${previewBackdrop}`}
                    style={{ padding: previewShellPadding }}
                  >
                    {/* Resume Preview */}
                    <div style={{
                      backgroundColor: 'white',
                      boxShadow: previewPaperShadow,
                      borderRadius: resumeData.template === 'minimal' ? '0px' : resumeData.template === 'creative' ? '20px' : '8px',
                      maxWidth: '800px',
                      margin: '0 auto',
                      minHeight: previewPaperMinHeight,
                      fontFamily: resumeData.fontFamily || 'Inter',
                      fontSize: fontSizes.find(s => s.id === resumeData.fontSize)?.size || '1em',
                      lineHeight: spacingOptions.find(s => s.id === resumeData.spacing)?.value || '1',
                      overflow: 'hidden',
                      transform: compactPreview ? 'scale(0.97)' : 'scale(1)',
                      transformOrigin: 'top center',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                    }}>
                      {renderPreviewLayout()}
                    </div>
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

export default ResumeCustomize
