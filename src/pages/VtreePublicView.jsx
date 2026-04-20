import React from 'react'
import './profileview.css'

function VtreePublicView({ profile }) {
  const profileImage = profile.profileImage || ''
  const profileImageLayout = profile.profileImageLayout || 'classic'
  const titleText = profile.displayName || profile.username || 'Your Name'
  const titleFont = profile.titleFont || 'DM Sans'
  const titleColor = profile.nameColor || '#ffffff'
  const titleSize = profile.titleSize || 'small'

  const wallpaperStyle = profile.wallpaperStyle || 'fill'
  const wallpaperColor = profile.bgColor || '#808080'
  const wallpaperImage = profile.wallpaperImage || ''
  const overlayOpacity = profile.overlayOpacity || 0

  const pageFont = profile.pageFont || 'DM Sans'
  const pageTextColor = profile.pageTextColor || '#ffffff'
  const buttonTextColor = profile.buttonTextColor || '#000000'
  const buttonStyle = profile.buttonStyle || 'solid'
  const buttonCorners = profile.buttonCorners || 'rounded'
  const buttonShadow = profile.buttonShadow || 'none'
  const buttonColor = profile.buttonColor || '#ffffff'

  const socialLinks = profile.socialLinks || {}

  const getBackgroundStyle = () => {
    const base = { minHeight: '100vh', fontFamily: pageFont, position: 'relative', overflow: 'hidden' }
    if (wallpaperStyle === 'gradient') {
      return { ...base, background: `linear-gradient(180deg, ${wallpaperColor} 0%, ${wallpaperColor}dd 100%)` }
    }
    if (wallpaperImage) {
      return { ...base, backgroundImage: `url(${wallpaperImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    }
    return { ...base, backgroundColor: wallpaperColor }
  }

  const getTitleFontSize = () => {
    if (titleSize === 'small') return '18px'
    if (titleSize === 'medium') return '24px'
    if (titleSize === 'large') return '32px'
    return '18px'
  }

  const getShadow = () => {
    if (buttonShadow === 'subtle') return '0 2px 4px rgba(0,0,0,0.1)'
    if (buttonShadow === 'strong') return '0 4px 12px rgba(0,0,0,0.2)'
    if (buttonShadow === 'hard') return '0 6px 20px rgba(0,0,0,0.3)'
    return 'none'
  }

  const getBorderRadius = () => {
    if (buttonCorners === 'rounded') return '24px'
    if (buttonCorners === 'smooth') return '12px'
    if (buttonCorners === 'sharp') return '4px'
    if (buttonCorners === 'pill') return '50px'
    if (buttonCorners === 'round') return '8px'
    return '24px'
  }

  const getButtonStyle = () => {
    const base = {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      width: '100%', padding: '14px 20px', marginBottom: '12px',
      borderRadius: getBorderRadius(), fontSize: '15px', fontWeight: '500',
      fontFamily: pageFont, cursor: 'pointer', transition: 'all 0.2s',
      textDecoration: 'none', boxShadow: getShadow()
    }
    if (buttonStyle === 'glass') {
      return { ...base, backgroundColor: 'rgba(255,255,255,0.2)', color: buttonTextColor, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }
    }
    if (buttonStyle === 'outline') {
      return { ...base, backgroundColor: 'transparent', color: buttonTextColor, border: `2px solid ${buttonColor}` }
    }
    return { ...base, backgroundColor: buttonColor, color: buttonTextColor, border: 'none' }
  }

  const platformNames = { ig: 'Instagram', facebook: 'Facebook', x: 'X', spotify: 'Spotify', discord: 'Discord', google: 'Google', line: 'Line', tiktok: 'TikTok', github: 'GitHub' }
  const platformIcons = { ig: 'instagram', facebook: 'facebook', x: 'twitter-x', spotify: 'spotify', discord: 'discord', google: 'google', line: 'line', tiktok: 'tiktok', github: 'github' }
  const activeSocialLinks = Object.entries(socialLinks).filter(([, url]) => url && url.trim() !== '')

  return (
    <div style={getBackgroundStyle()}>
      {overlayOpacity > 0 && wallpaperImage && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})`, zIndex: 0 }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {profileImageLayout === 'vfull' ? (
          <>
            <div style={{ width: '100%', position: 'relative' }}>
              <div style={{ width: '100%', height: '300px', backgroundColor: '#e0e0e0', overflow: 'hidden', position: 'relative' }}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-person-fill" style={{ fontSize: '64px', color: '#999' }}></i>
                  </div>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px', background: `radial-gradient(ellipse 120% 100% at 50% 0%, transparent 0%, transparent 40%, ${wallpaperColor}88 70%, ${wallpaperColor} 100%)`, pointerEvents: 'none' }} />
            </div>
            <h1 style={{ color: titleColor, marginTop: '20px', marginBottom: '16px', fontSize: getTitleFontSize(), fontWeight: 'bold', textAlign: 'center', fontFamily: titleFont }}>
              {titleText}
            </h1>
          </>
        ) : (
          <>
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#e0e0e0', marginTop: '60px', marginBottom: '16px', overflow: 'hidden' }}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-person-fill" style={{ fontSize: '48px', color: '#999' }}></i>
                </div>
              )}
            </div>
            <h1 style={{ color: titleColor, marginBottom: '16px', fontSize: getTitleFontSize(), fontWeight: 'bold', textAlign: 'center', fontFamily: titleFont }}>
              {titleText}
            </h1>
          </>
        )}

        {profile.description && (
          <p style={{ color: pageTextColor, fontSize: '14px', lineHeight: '1.6', textAlign: 'center', marginBottom: '24px', maxWidth: '500px', padding: '0 20px' }}>
            {profile.description}
          </p>
        )}

        <div style={{ width: '100%', padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {activeSocialLinks.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" style={getButtonStyle()}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              <i className={`bi bi-${platformIcons[platform] || 'link'}`}></i>
              {platformNames[platform] || platform}
            </a>
          ))}
          {profile.sections && profile.sections.map((section, idx) => {
            if (section.type === 'link' && section.url) {
              return (
                <a key={idx} href={section.url} target="_blank" rel="noopener noreferrer" style={getButtonStyle()}>
                  {section.title || 'Link'}
                </a>
              )
            }
            return null
          })}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '32px', paddingBottom: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          VERE
        </div>
      </div>
    </div>
  )
}

export default VtreePublicView
