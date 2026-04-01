import { supabase } from '../supabaseClient'
import { getActiveProfile, updateProfile } from './profileManager'

const COLOR_TOKEN_KEYS = [
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

const BASE_THEME_LIBRARY = [
  {
    id: 'personal-purple-gradient',
    profileType: 'personal',
    name: 'Purple Gradient',
    author: 'VERE',
    source: 'builtin',
    tags: ['dark', 'neon', 'free'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    stats: { uses: 15200, trending: true },
    tokens: {
      bgColor: '#0a0a0a',
      blockColor: '#1a1a1a',
      nameColor: '#00ff88',
      descColor: '#888888',
      fontFamily: '"Courier New", monospace'
    }
  },
  {
    id: 'personal-pastel-dream',
    profileType: 'personal',
    name: 'Pastel Dream',
    author: 'VERE',
    source: 'builtin',
    tags: ['aesthetic', 'free'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    stats: { uses: 28400, trending: true },
    tokens: {
      bgColor: '#f5f5f5',
      blockColor: '#ffffff',
      nameColor: '#1a1a1a',
      descColor: '#666666',
      fontFamily: '"Inter", -apple-system, sans-serif'
    }
  },
  {
    id: 'personal-deep-blue',
    profileType: 'personal',
    name: 'Deep Blue',
    author: 'VERE',
    source: 'builtin',
    tags: ['aesthetic', 'free'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' },
    stats: { uses: 32100, trending: true },
    tokens: {
      bgColor: '#ffffff',
      blockColor: '#f3f6f8',
      nameColor: '#0a66c2',
      descColor: '#191919',
      fontFamily: '"Segoe UI", -apple-system, sans-serif'
    }
  },
  {
    id: 'personal-neon-cyberpunk',
    profileType: 'personal',
    name: 'Neon Cyberpunk',
    author: 'VERE',
    source: 'builtin',
    tags: ['dark', 'neon', 'free'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a0ca3 100%)' },
    stats: { uses: 18700, trending: false },
    tokens: {
      bgColor: '#0d0221',
      blockColor: '#1a1a2e',
      nameColor: '#ff006e',
      descColor: '#8338ec',
      fontFamily: '"Orbitron", "Rajdhani", sans-serif'
    }
  },
  {
    id: 'personal-minimal-white',
    profileType: 'personal',
    name: 'Minimalist White',
    author: 'VERE',
    source: 'builtin',
    tags: ['aesthetic', 'free'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' },
    stats: { uses: 21300, trending: false },
    tokens: {
      bgColor: '#ffffff',
      blockColor: '#fafafa',
      nameColor: '#2d3436',
      descColor: '#636e72',
      fontFamily: '"Helvetica Neue", Arial, sans-serif'
    }
  },
  {
    id: 'personal-dark-mode-pro',
    profileType: 'personal',
    name: 'Dark Mode Pro',
    author: 'VERE',
    source: 'builtin',
    tags: ['dark', 'free'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #434343 0%, #000000 100%)' },
    stats: { uses: 25600, trending: true },
    tokens: {
      bgColor: '#121212',
      blockColor: '#1e1e1e',
      nameColor: '#ffffff',
      descColor: '#b3b3b3',
      fontFamily: '"SF Pro Display", -apple-system, sans-serif'
    }
  },
  {
    id: 'personal-sunset-gradient',
    profileType: 'personal',
    name: 'Sunset Gradient',
    author: 'VERE',
    source: 'builtin',
    tags: ['aesthetic', 'free'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    stats: { uses: 19800, trending: false },
    tokens: {
      bgColor: '#ff9a56',
      blockColor: '#ffffff',
      nameColor: '#ff4757',
      descColor: '#2f3542',
      fontFamily: '"Poppins", sans-serif'
    }
  },
  {
    id: 'personal-sky-blue',
    profileType: 'personal',
    name: 'Sky Blue',
    author: 'VERE',
    source: 'builtin',
    tags: ['aesthetic', 'free'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    stats: { uses: 16400, trending: false },
    tokens: {
      bgColor: '#0984e3',
      blockColor: '#ffffff',
      nameColor: '#0652dd',
      descColor: '#2d3436',
      fontFamily: '"Roboto", sans-serif'
    }
  },
  {
    id: 'creative-neon-grid',
    profileType: 'creative',
    name: 'Neon Grid',
    author: 'VERE',
    source: 'builtin',
    tags: ['creative', 'neon', 'dark'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #f97316 0%, #c026d3 55%, #5b21b6 100%)' },
    stats: { uses: 5800, trending: true },
    tokens: {
      bgColor: '#050014',
      blockColor: '#12021c',
      nameColor: '#ffd369',
      descColor: '#e0e7ff',
      bgOverlay: 0.45,
      fontFamily: '"Space Grotesk", sans-serif'
    }
  },
  {
    id: 'creative-holo-fade',
    profileType: 'creative',
    name: 'Holographic Fade',
    author: 'VERE',
    source: 'builtin',
    tags: ['creative', 'glass', 'gradient'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #94bbe9 0%, #eeaeca 100%)' },
    stats: { uses: 4300, trending: false },
    tokens: {
      bgColor: '#0f1024',
      blockColor: 'rgba(255,255,255,0.08)',
      nameColor: '#f8f6ff',
      descColor: '#cad7ff',
      bgOverlay: 0.32,
      fontFamily: '"Sora", sans-serif'
    }
  },
  {
    id: 'creative-editorial-luxe',
    profileType: 'creative',
    name: 'Muse Lab',
    author: 'VERE',
    source: 'builtin',
    tags: ['creative', 'editorial', 'warm'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #0f172a 0%, #4338ca 55%, #f97316 100%)' },
    stats: { uses: 3900, trending: true },
    tokens: {
      bgColor: '#1a120f',
      blockColor: '#12090a',
      nameColor: '#f7e0c3',
      descColor: '#fcd8c6',
      bgOverlay: 0.34,
      fontFamily: '"Playfair Display", serif'
    }
  },
  {
    id: 'vtree-neon-links',
    profileType: 'vtree',
    name: 'Neon Links',
    author: 'VERE',
    source: 'builtin',
    tags: ['linktree', 'dark'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)' },
    stats: { uses: 8200, trending: true },
    tokens: {
      bgColor: '#050017',
      blockColor: 'rgba(15, 23, 42, 0.85)',
      nameColor: '#7dd3fc',
      descColor: '#c4b5fd',
      buttonColor: '#fb7185',
      linkColor: '#a5b4fc',
      fontFamily: '"Space Grotesk", sans-serif'
    }
  },
  {
    id: 'vtree-glass-deck',
    profileType: 'vtree',
    name: 'Glass Deck',
    author: 'VERE',
    source: 'builtin',
    tags: ['light', 'glassmorphism'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))' },
    stats: { uses: 6100, trending: false },
    tokens: {
      bgColor: '#0f172a',
      blockColor: 'rgba(255,255,255,0.2)',
      nameColor: '#f8fafc',
      descColor: '#e2e8f0',
      buttonColor: '#38bdf8',
      linkColor: '#e879f9',
      fontFamily: '"General Sans", sans-serif'
    }
  },
  {
    id: 'vtree-organic-cards',
    profileType: 'vtree',
    name: 'Organic Cards',
    author: 'VERE',
    source: 'builtin',
    tags: ['earthy', 'warm'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' },
    stats: { uses: 5400, trending: false },
    tokens: {
      bgColor: '#fdf6ec',
      blockColor: '#ffffff',
      nameColor: '#92400e',
      descColor: '#78350f',
      buttonColor: '#ea580c',
      linkColor: '#0f172a',
      fontFamily: '"Nunito", sans-serif'
    }
  },
  {
    id: 'vtree-carbon-fiber',
    profileType: 'vtree',
    name: 'Carbon Fiber',
    author: 'VERE',
    source: 'builtin',
    tags: ['premium', 'dark'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #1f1f1f 0%, #090909 100%)' },
    stats: { uses: 4900, trending: true },
    tokens: {
      bgColor: '#040404',
      blockColor: '#111827',
      nameColor: '#fcd34d',
      descColor: '#d1d5db',
      buttonColor: '#fbbf24',
      linkColor: '#fef9c3',
      fontFamily: '"Outfit", sans-serif'
    }
  },
  {
    id: 'resume-classic-navy',
    profileType: 'resume',
    name: 'Classic Navy',
    author: 'VERE',
    source: 'builtin',
    tags: ['corporate', 'trusted'],
    preview: { type: 'solid', value: '#0a192f' },
    stats: { uses: 13800, trending: true },
    tokens: {
      bgColor: '#f2f6fb',
      blockColor: '#ffffff',
      sectionBg: '#e6eef7',
      headingColor: '#0a192f',
      nameColor: '#0a66c2',
      descColor: '#1f2933',
      fontFamily: '"Inter", -apple-system, sans-serif'
    }
  },
  {
    id: 'resume-minimal-ivory',
    profileType: 'resume',
    name: 'Minimal Ivory',
    author: 'VERE',
    source: 'builtin',
    tags: ['minimal', 'light'],
    preview: { type: 'solid', value: '#fffbf5' },
    stats: { uses: 9400, trending: false },
    tokens: {
      bgColor: '#fffaf3',
      blockColor: '#ffffff',
      sectionBg: '#fef3e7',
      headingColor: '#a855f7',
      nameColor: '#4c1d95',
      descColor: '#4b5563',
      fontFamily: '"Times New Roman", serif'
    }
  },
  {
    id: 'resume-modern-slate',
    profileType: 'resume',
    name: 'Modern Slate',
    author: 'VERE',
    source: 'builtin',
    tags: ['dark', 'modern'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' },
    stats: { uses: 10300, trending: true },
    tokens: {
      bgColor: '#0f172a',
      blockColor: '#1f2937',
      sectionBg: '#111827',
      headingColor: '#f8fafc',
      nameColor: '#38bdf8',
      descColor: '#e2e8f0',
      fontFamily: '"IBM Plex Sans", sans-serif'
    }
  },
  {
    id: 'resume-warm-ochre',
    profileType: 'resume',
    name: 'Warm Ochre',
    author: 'VERE',
    source: 'builtin',
    tags: ['creative', 'warm'],
    preview: { type: 'gradient', value: 'linear-gradient(135deg, #f97316 0%, #fed7aa 100%)' },
    stats: { uses: 8700, trending: false },
    tokens: {
      bgColor: '#fff7ed',
      blockColor: '#fffbeb',
      sectionBg: '#fef3c7',
      headingColor: '#9a3412',
      nameColor: '#b45309',
      descColor: '#92400e',
      fontFamily: '"Source Serif Pro", serif'
    }
  }
]

const cloneTheme = (theme) => JSON.parse(JSON.stringify(theme))

export const getBaseThemesByType = (profileType) => {
  return BASE_THEME_LIBRARY.filter(theme => theme.profileType === profileType).map(cloneTheme)
}

export const getCommunityThemes = async () => {
  const { data, error } = await supabase.from('community_themes').select('*').order('created_at', { ascending: false })
  if (error) { console.error('getCommunityThemes:', error); return [] }
  return data || []
}

export const getSavedThemes = async () => {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return []
  const { data, error } = await supabase.from('saved_themes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) { console.error('getSavedThemes:', error); return [] }
  return data || []
}

export const getThemesForType = async (profileType) => {
  const base = getBaseThemesByType(profileType)
  const community = (await getCommunityThemes()).filter(t => t.profileType === profileType)
  return [...base, ...community]
}

const normalizeThemeInput = (themeInput, source) => {
  if (!themeInput?.profileType) {
    throw new Error('profileType is required')
  }
  if (!themeInput?.name) {
    throw new Error('Theme name is required')
  }

  const timestamp = Date.now()
  return {
    id: themeInput.id || `${source}_theme_${timestamp}`,
    profileType: themeInput.profileType,
    name: themeInput.name,
    author: themeInput.author || 'You',
    source,
    tags: themeInput.tags || [],
    preview: themeInput.preview || { type: 'solid', value: themeInput.tokens?.bgColor || '#000000' },
    stats: themeInput.stats || { uses: 0, trending: false },
    tokens: themeInput.tokens || {},
    createdAt: themeInput.createdAt || new Date(timestamp).toISOString()
  }
}

export const publishTheme = async (themeInput) => {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  const theme = normalizeThemeInput(themeInput, 'community')
  const { data, error } = await supabase
    .from('community_themes')
    .upsert({ ...theme, user_id: user?.id || null }, { onConflict: 'id' })
    .select().single()
  if (error) { console.error('publishTheme:', error); return theme }
  return data
}

export const saveThemeLocally = async (themeInput) => {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return null
  const theme = normalizeThemeInput(themeInput, 'saved')
  const { data, error } = await supabase
    .from('saved_themes')
    .upsert({ ...theme, user_id: user.id }, { onConflict: 'id' })
    .select().single()
  if (error) { console.error('saveThemeLocally:', error); return theme }
  return data
}

export const deleteSavedTheme = async (themeId) => {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user
  if (!user) return
  await supabase.from('saved_themes').delete().eq('id', themeId).eq('user_id', user.id)
}

export const getThemeById = async (themeId) => {
  const base = BASE_THEME_LIBRARY.find(theme => theme.id === themeId)
  if (base) return cloneTheme(base)
  const community = (await getCommunityThemes()).find(t => t.id === themeId)
  if (community) return community
  const saved = (await getSavedThemes()).find(t => t.id === themeId)
  return saved || null
}

export const buildThemeUpdates = (theme) => {
  if (!theme) {
    throw new Error('Theme payload missing')
  }
  const tokens = theme.tokens || {}
  const updates = {
    themeMeta: {
      id: theme.id,
      name: theme.name,
      source: theme.source || 'custom',
      profileType: theme.profileType,
      author: theme.author || 'Unknown'
    }
  }

  COLOR_TOKEN_KEYS.forEach(key => {
    if (tokens[key] !== undefined && tokens[key] !== null) {
      updates[key] = tokens[key]
    }
  })

  return updates
}

export const applyThemeToActiveProfile = async (theme) => {
  const activeProfile = await getActiveProfile()
  if (!activeProfile) {
    throw new Error('No active profile found')
  }

  const updates = buildThemeUpdates(theme)
  await updateProfile(activeProfile.id, updates)
  return updates
}

export const createThemeFromProfile = ({ profileType, name, profileData, preview }, options = {}) => {
  if (!profileType || !profileData) {
    throw new Error('profileType and profileData are required')
  }

  const tokens = {}
  COLOR_TOKEN_KEYS.forEach(key => {
    if (profileData[key] !== undefined && profileData[key] !== null) {
      tokens[key] = profileData[key]
    }
  })

  return normalizeThemeInput(
    {
      profileType,
      name: name || 'My Theme',
      author: options.author,
      tokens,
      preview: preview || { type: 'solid', value: profileData.bgColor || '#000000' }
    },
    options.source || 'saved'
  )
}

export const deleteCommunityTheme = async (themeId) => {
  await supabase.from('community_themes').delete().eq('id', themeId)
}

