// 1. เราจะเปลี่ยนไปใช้ Dropdown พื้นฐาน (ไม่ใช่ NavDropdown)
import React, { useEffect, useState } from 'react'
import { Navbar, Container, Nav, Dropdown, Form, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation()
  const currentPath = location.pathname

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  useEffect(() => {
    setCurrent(getCurrentUser())
    const handleAuthChange = () => setCurrent(getCurrentUser())
    
    window.addEventListener('authChange', handleAuthChange)
    window.addEventListener('storage', handleAuthChange) // Sync cross-tab

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

    return () => {
      window.removeEventListener('authChange', handleAuthChange)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await login(identifier, password)
    if (!res.ok) {
      alert(res.message || 'Login failed')
      return
    }
    navigate('/my-profile')
    setCurrent({ username: res.user.username, email: res.user.email })
    window.dispatchEvent(new Event('authChange'))
  }

  const handleLogout = async () => {
    await logout()
    setCurrent(null)
    navigate('/')
    window.dispatchEvent(new Event('authChange'))
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
    <Navbar bg="white" expand="lg" className="shadow-sm sticky-top py-3">
      <Container>
        {/* Left - Modern Logo VERE text only */}
        <Navbar.Brand as={Link} to="/" className="fw-bolder fs-4 d-flex align-items-center gap-2" style={{ letterSpacing: '0.5px', color: '#1a1a2e' }}>
          <span>VERE</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Centered / Right Aligned Nav Links dynamically styled based on the current page */}
          <Nav className="ms-auto align-items-center gap-1 gap-lg-3">
            
            {(() => {
              const renderNavLink = (to, pathMatch, label, onClick = null) => {
                const active = pathMatch === '/' ? currentPath === '/' : currentPath.startsWith(pathMatch);
                
                if (active) {
                  return (
                    <Nav.Link as={to ? Link : "span"} to={to} onClick={onClick} className="px-4 py-2 rounded-pill fw-bold" style={{ backgroundColor: 'rgba(107, 95, 255, 0.1)', color: '#6b5fff', fontSize: '0.95rem', cursor: 'pointer' }}>
                      {label}
                    </Nav.Link>
                  );
                }
                
                return (
                  <Nav.Link as={to ? Link : "span"} to={to} onClick={onClick} className="fw-bold px-3" style={{ color: '#6c757d', fontSize: '0.95rem', transition: 'color 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.color = '#1a1a2e'} onMouseLeave={(e) => e.target.style.color = '#6c757d'}>
                    {label}
                  </Nav.Link>
                );
              };

              return (
                <>
                  {renderNavLink("/", "/", "หน้าแรก")}
                  {renderNavLink(null, "/my-profile", "สร้างโปรไฟล์", handleDashboardClick)}
                </>
              );
            })()}

            {/* Language Switcher */}
            <Dropdown align="end" className="nav-item ms-lg-2">
              <Dropdown.Toggle as={Nav.Link} className="text-secondary border-0 bg-transparent p-2" style={{ transition: 'color 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.color = '#1a1a2e'} onMouseLeave={(e) => e.target.style.color = '#6c757d'}>
                <div className="d-flex align-items-center gap-1 fw-bold" style={{ fontSize: '0.85rem' }}>
                  <i className="bi bi-globe"></i> <span>{i18n.language === 'en' ? 'EN' : 'TH'}</span>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="border-0 shadow-lg rounded-4 mt-2" style={{ minWidth: '120px' }}>
                <Dropdown.Item onClick={() => changeLanguage('th')} active={i18n.language === 'th'} className="py-2" style={{ fontSize: '0.9rem' }}>🇹🇭 ภาษาไทย</Dropdown.Item>
                <Dropdown.Item onClick={() => changeLanguage('en')} active={i18n.language === 'en'} className="py-2" style={{ fontSize: '0.9rem' }}>🇺🇸 English</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Auth section corresponding to "สมัครสมาชิก" */}
            {!current ? (
              (() => {
                const active = currentPath.startsWith('/signup');
                if (active) {
                  return (
                    <Nav.Link as={Link} to="/signup" className="ms-lg-2 px-4 py-2 rounded-pill fw-bold" style={{ backgroundColor: 'rgba(107, 95, 255, 0.1)', color: '#6b5fff', fontSize: '0.95rem' }}>
                      สมัครสมาชิก
                    </Nav.Link>
                  );
                }
                return (
                  <Nav.Link as={Link} to="/signup" className="fw-bold ms-lg-2 px-3" style={{ color: '#6c757d', fontSize: '0.95rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1a1a2e'} onMouseLeave={(e) => e.target.style.color = '#6c757d'}>
                    สมัครสมาชิก
                  </Nav.Link>
                );
              })()
            ) : (
              <Dropdown align="end" className="ms-lg-2">
                <Dropdown.Toggle bsPrefix="a" className="nav-link border-0 bg-transparent p-0 d-flex align-items-center" style={{ cursor: 'pointer' }}>
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '38px', height: '38px', backgroundColor: '#6b5fff', transition: 'transform 0.2s', boxShadow: '0 4px 10px rgba(107, 95, 255, 0.3)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <i className="bi bi-person-fill fs-5"></i>
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu className="border-0 shadow-lg rounded-4 mt-3 p-3" style={{ minWidth: '220px' }}>
                  <div className="text-center mb-3">
                    <small className="text-muted d-block mb-1">Signed in as</small>
                    <strong className="d-block text-dark fs-6">{current.username}</strong>
                  </div>
                  <Dropdown.Divider />
                  <Button variant="light" className="w-100 text-danger fw-bold rounded-pill mt-2" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> ออกจากระบบ
                  </Button>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>

    {showLoginModal && (
      <LoginModal 
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
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