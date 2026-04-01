import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import LoginModal from '../components/LoginModal'
import { getCurrentUser } from '../services/auth'
import { getActiveProfile, updateProfile } from '../services/profileManager'
import './dashboard.css'
import Image from "react-bootstrap/Image";
import ig from "../img/ig.png";
import facebook from "../img/facebook.png";
import x from "../img/twitter.png";
import spotify from "../img/spotify.png";
import discord from "../img/discord.png";
import google from "../img/google.png";
import Line from "../img/Line.png";
import tiktok from "../img/tiktok.png";
import github from "../img/github.png";
import AddSocialModal from '../components/AddSocialModal'

function Links() {
  const navigate = useNavigate()
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedSocial, setSelectedSocial] = useState('')
  const [links, setLinks] = useState({ ig: '', facebook: '', x: '', spotify: '', discord: '', google: '', line: '', tiktok: '', github: '' })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activeProfileId, setActiveProfileId] = useState(null)

  const handleSwitchToSignup = () => {
    setShowLoginModal(false)
    navigate('/signup')
  }

  useEffect(() => {
    const loadLinks = async () => {
      try {
        const activeProfile = await getActiveProfile()
        if (activeProfile) {
          setActiveProfileId(activeProfile.id)
          if (activeProfile.data.socialLinks) {
            setLinks(activeProfile.data.socialLinks)
          }
        } else {
          const raw = localStorage.getItem('socialLinks')
          if (raw) setLinks(JSON.parse(raw))
        }
      } catch (e) {
        console.error('load social links', e)
      }
    }
    loadLinks()
  }, [])

  const openModal = (social) => {
    setSelectedSocial(social)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedSocial('')
  }

  // Always open the modal when an icon is clicked (matches requested UX)
  const handleSocialClick = (social) => {
    openModal(social)
  }

  const handleAdd = async (social, url) => {
    const next = { ...links, [social]: url }
    setLinks(next)
    
    if (activeProfileId) {
      try {
        await updateProfile(activeProfileId, { socialLinks: next })
      } catch (e) {
        console.error('Failed to update profile with social links', e)
      }
    }
    
    try { 
      localStorage.setItem('socialLinks', JSON.stringify(next)) 
    } catch (e) { 
      console.error(e) 
    }
  }


  return (
    <div className="dashboard-shell p-4">
      <div className="dashboard-card d-flex">
        <Sidebar />

        <main className="dashboard-main p-4">
          <div className="links-card p-4">
            <h4 className="mb-1">Link your social media profiles.</h4>
            <p className="text-muted small mb-3">Pick a social media to add to your profile.</p>
            <div className="social-icons d-flex gap-3" style={{ position: 'relative' }}>
              <button className="btn p-0" onClick={() => handleSocialClick('ig')} title={links.ig ? links.ig : 'Add Instagram'} style={{ position: 'relative' }}>
                <Image src={ig} rounded className="social-img" />
                {links.ig && links.ig.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <i className="bi bi-check" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                  </div>
                )}
              </button>

              <button className="btn p-0" onClick={() => handleSocialClick('facebook')} title={links.facebook ? links.facebook : 'Add Facebook'} style={{ position: 'relative' }}>
                <Image src={facebook} rounded className="social-img" />
                {links.facebook && links.facebook.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <i className="bi bi-check" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                  </div>
                )}
              </button>

              <button className="btn p-0" onClick={() => handleSocialClick('x')} title={links.x ? links.x : 'Add X / Twitter'} style={{ position: 'relative' }}>
                <Image src={x} rounded className="social-img" />
                {links.x && links.x.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <i className="bi bi-check" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                  </div>
                )}
              </button>

              <button className="btn p-0" onClick={() => handleSocialClick('spotify')} title={links.spotify ? links.spotify : 'Add Spotify'} style={{ position: 'relative' }}>
                <Image src={spotify} rounded className="social-img" />
                {links.spotify && links.spotify.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <i className="bi bi-check" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                  </div>
                )}
              </button>

              <button className="btn p-0" onClick={() => handleSocialClick('discord')} title={links.discord ? links.discord : 'Add Discord'} style={{ position: 'relative' }}>
                <Image src={discord} rounded className="social-img" />
                {links.discord && links.discord.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <i className="bi bi-check" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                  </div>
                )}
              </button>

              <button className="btn p-0" onClick={() => handleSocialClick('google')} title={links.google ? links.google : 'Add Google'} style={{ position: 'relative' }}>
                <Image src={google} rounded className="social-img" />
                {links.google && links.google.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <i className="bi bi-check" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                  </div>
                )}
              </button>

              <button className="btn p-0" onClick={() => handleSocialClick('line')} title={links.line ? links.line : 'Add Line'} style={{ position: 'relative' }}>
                <Image src={Line} rounded className="social-img" />
                {links.line && links.line.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <i className="bi bi-check" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                  </div>
                )}
              </button>

              <button className="btn p-0" onClick={() => handleSocialClick('tiktok')} title={links.tiktok ? links.tiktok : 'Add TikTok'} style={{ position: 'relative' }}>
                <Image src={tiktok} rounded className="social-img" />
                {links.tiktok && links.tiktok.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <i className="bi bi-check" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                  </div>
                )}
              </button>

              <button className="btn p-0" onClick={() => handleSocialClick('github')} title={links.github ? links.github : 'Add GitHub'} style={{ position: 'relative' }}>
                <Image src={github} rounded className="social-img" />
                {links.github && links.github.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <i className="bi bi-check" style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}></i>
                  </div>
                )}
              </button>

              <AddSocialModal
                social={selectedSocial}
                visible={modalVisible}
                onClose={closeModal}
                onAdd={handleAdd}
                defaultValue={selectedSocial ? links[selectedSocial] || '' : ''}
              />
            </div>
          </div>

          <div style={{ height: 420 }}></div>
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

export default Links
