// 1. เราจะเปลี่ยนไปใช้ Dropdown พื้นฐาน (ไม่ใช่ NavDropdown)
import React, { useEffect, useState } from 'react'
import { Navbar, Container, Nav, Dropdown, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login, getCurrentUser, logout } from '../services/auth'
import LoginModal from './LoginModal'
import { useTheme } from '../contexts/ThemeContext'

function VereHeader() {
  const { t, i18n } = useTranslation();
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [current, setCurrent] = useState(getCurrentUser())
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { theme, availableThemes, setTheme } = useTheme()
  const navigate = useNavigate()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  useEffect(() => {
    setCurrent(getCurrentUser())
    // If user just registered, pre-fill login fields
    try {
      const raw = localStorage.getItem('lastRegistered')
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj) {
          if (obj.identifier) setIdentifier(obj.identifier)
          if (obj.password) setPassword(obj.password)
        }
        localStorage.removeItem('lastRegistered')
      }
    } catch (e) {}
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await login(identifier, password)
    if (!res.ok) {
      alert(res.message || 'Login failed')
      return
    }
    // navigate to my profile
    navigate('/my-profile')
    // update state
    setCurrent({ username: res.user.username, email: res.user.email })
  }

  const handleLogout = () => {
    logout()
    setCurrent(null)
    navigate('/')
  }

  const handleDashboardClick = (e) => {
    e.preventDefault()
    const user = getCurrentUser()
    if (!user) {
      setShowLoginModal(true)
    } else {
      navigate('/my-profile')
    }
  }

  const themeIcon = theme === 'dark'
    ? 'bi-moon-stars'
    : theme === 'vheart'
    ? 'bi-heart-fill'
    : 'bi-brightness-high'

  return (
    <>
    {/* Layout 3 ส่วน (flex: 1) ยังคงอยู่เหมือนเดิม เพื่อ "ล็อค" โลโก้ไว้ */}
    <Navbar bg="light" expand={false} className="shadow sticky-top">
      <Container fluid className="d-flex justify-content-between align-items-center">

        {/* left menu */}
        <div style={{ flex: '1 1 0' }}>
          <Dropdown>
            <Dropdown.Toggle as={Nav.Link} className="p-0" id="main-menu-toggle">
              <i className="bi bi-list fs-4"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleDashboardClick}>Dashboard</Dropdown.Item>
              <Dropdown.Item href="/about">About</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
        {/* right */}
        <div style={{ flex: '1 1 0' }} className="d-flex justify-content-end align-items-center gap-2">
          {/* Theme Switcher */}
          <Dropdown align="end">
            <Dropdown.Toggle 
              variant="link"
              className="text-decoration-none p-0 border-0 theme-toggle"
              aria-label="Switch theme"
              style={{ boxShadow: 'none' }}
            >
              <i className={`bi ${themeIcon} fs-5`}></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {availableThemes.map((option) => (
                <Dropdown.Item
                  key={option.id}
                  active={option.id === theme}
                  onClick={() => setTheme(option.id)}
                >
                  <i className={`bi ${option.icon} me-2`}></i>
                  {option.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          {/* Language Switcher */}
          <Dropdown align="end">
            <Dropdown.Toggle 
              variant="link" 
              className="text-decoration-none text-dark p-0 border-0"
              style={{ boxShadow: 'none' }}
            >
              <i className="bi bi-translate fs-5"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item 
                onClick={() => changeLanguage('en')}
                active={i18n.language === 'en'}
              >
                🇺🇸 English
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => changeLanguage('th')}
                active={i18n.language === 'th'}
              >
                🇹🇭 ไทย
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Profile Menu */}
          <Dropdown align="end">
            <Dropdown.Toggle as={Nav.Link} className="p-0" id="profile-menu-toggle">
              <i className="bi bi-person fs-4"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {!current && (
                <>
                  <Dropdown.Item as={Link} to="/create-account" className='text-center '>
                    <Button className='btn-secondary fw-bold'>{t('get_started')}</Button>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <div className="p-3" style={{ minWidth: '250px' }}>
                    <p className="fw-bold text-center mb-2">{t('login')}</p>
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-2">
                        <Form.Control value={identifier} onChange={e=>setIdentifier(e.target.value)} type="text" placeholder="Username or email" size="sm" />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Control value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" size="sm" />
                      </Form.Group>
                      <Button variant="secondary" type="submit" className="w-100 btn-sm">{t('login')}</Button>
                    </Form>
                  </div>
                </>
              )}

              {current && (
                <div className="p-2" style={{ minWidth: '200px' }}>
                  <div className="mb-2 text-center">Signed in as <strong>{current.username}</strong></div>
                  <div className="d-grid">
                    <Button variant="secondary" size="sm" onClick={handleLogout}>{t('logout')}</Button>
                  </div>
                </div>
              )}

            </Dropdown.Menu>
          </Dropdown>
        </div>

      </Container>
    </Navbar>
    {showLoginModal && (
      <LoginModal 
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false)
          navigate('/signup')
        }}
      />
    )}
    </>
  )
}

export default VereHeader;