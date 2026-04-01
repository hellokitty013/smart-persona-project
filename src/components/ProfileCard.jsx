import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActiveProfile } from '../services/profileManager'
import { getProfile } from '../services/auth'

function ProfileCard({ profileData, username: usernameProp, name: nameProp, title: titleProp, bio: bioProp }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(profileData || null)
  const [authUser, setAuthUser] = useState(usernameProp ? { username: usernameProp } : null)

  useEffect(() => {
    if (profileData) {
      setProfile(profileData)
      return
    }
    const load = async () => {
      try {
        const activeProfile = await getActiveProfile()
        if (activeProfile && activeProfile.data) {
          setProfile(activeProfile.data)
        }
      } catch (e) {
        setProfile(null)
      }
    }
    load()
  }, [profileData])

  useEffect(() => {
    if (usernameProp) {
      setAuthUser({ username: usernameProp })
      return
    }

    try {
      const user = getProfile()
      if (user) {
        setAuthUser(user)
      }
    } catch (e) {
      setAuthUser(null)
    }
  }, [usernameProp])

  const displayName = (profile?.displayName || profile?.firstName || nameProp || 'User')
  const username = usernameProp || authUser?.username || 'username'
  const avatar = profile?.avatar || null
  const firstLetter = displayName.charAt(0).toUpperCase()
  const jobTitle = profile?.jobTitle || titleProp || ''
  const bio = profile?.description || bioProp || ''

  const handleClick = () => {
    if (username && username !== 'username') {
      navigate(`/u/${username}`)
    }
  }

  return (
    <div 
      className="profile-card d-flex align-items-center p-3"
      onClick={handleClick}
      style={{ cursor: username && username !== 'username' ? 'pointer' : 'default' }}
    >
      <div className="avatar me-3">
        {avatar ? (
          <img 
            src={avatar} 
            alt={displayName}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div className="avatar-inner">{firstLetter}</div>
        )}
      </div>

      <div className="profile-meta">
        <div className="profile-name fw-bold">{displayName}</div>
        <div className="profile-title text-muted">@{username}</div>
        {jobTitle && <div className="text-muted small">{jobTitle}</div>}
        {bio && <div className="text-muted small">{bio}</div>}
      </div>
    </div>
  )
}

export default ProfileCard
