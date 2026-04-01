import { Container, Row, Col, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import connectingDots from "../img/connecting dot polygon.jpg";
import Image from "react-bootstrap/Image";
import shareIcon from "../img/share.png";
import aiIcon from "../img/ai.png";
import profile from "../img/profile.png";
import { getCurrentUser } from "../services/auth";
import LoginModal from "../components/LoginModal";
import { useTranslation } from "react-i18next";

function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    const handleAuthChange = () => setCurrentUser(getCurrentUser());
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const handleCreatePersona = () => {
    const user = getCurrentUser();
    if (user) {
      navigate('/my-profile');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleExploreDashboard = () => {
    navigate('/explore');
  };

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    navigate('/signup');
  };

  // Modern Purple Color Palette
  const colors = {
    primary: '#6b5fff',
    primaryHover: '#5a4fee',
    lightPurple: 'rgba(107, 95, 255, 0.1)',
    textDark: '#1a1a2e',
    textMuted: '#6c757d',
    bgGray: '#f8f9fa'
  };

  return (
    <>
      {/* 🚀 Modern Hero Section matching the Figma/Design Screenshot */}
      <div 
        style={{ 
          minHeight: 'calc(100vh - 60px)', 
          display: 'flex', 
          alignItems: 'center',
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}
      >
        <Container>
          <Row className="align-items-center mb-5">
            {/* Left Content Column */}
            <Col lg={6} className="py-5 pr-lg-5 pe-lg-5">
              <div className="mb-3 d-inline-block px-3 py-2 rounded-pill fw-bold" 
                   style={{ backgroundColor: colors.lightPurple, color: colors.primary, fontSize: '0.85rem' }}>
                {t('hero_badge')}
              </div>
              
              {!currentUser ? (
                <>
                  <h1 className="fw-bolder mb-3" style={{ fontSize: '3.5rem', color: colors.textDark, lineHeight: 1.1, letterSpacing: '-1px' }}>
                    {t('hero_title1')}<br />
                    <span style={{ color: colors.primary }}>{t('hero_title2')}</span>
                  </h1>
                  
                  <p className="lead mb-4" style={{ color: colors.textMuted, fontSize: '1.2rem', maxWidth: '90%', lineHeight: 1.6 }}>
                    {t('hero_desc')}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="fw-bolder mb-3" style={{ fontSize: '3.5rem', color: colors.textDark, lineHeight: 1.1, letterSpacing: '-1px' }}>
                    {t('welcome_back_title1')}<br />
                    <span style={{ color: colors.primary }}>{t('welcome_back_title2')} {currentUser.username}</span>
                  </h1>
                  
                  <p className="lead mb-4" style={{ color: colors.textMuted, fontSize: '1.2rem', maxWidth: '90%', lineHeight: 1.6 }}>
                    {t('welcome_back_desc')}
                  </p>
                </>
              )}
              
              <div className="d-flex flex-wrap gap-3 mt-4">
                <Button 
                  onClick={handleCreatePersona}
                  className="rounded-pill px-4 py-3 fw-bold border-0 d-flex align-items-center"
                  style={{ backgroundColor: colors.primary, boxShadow: '0 8px 24px rgba(107, 95, 255, 0.3)', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <span className="me-2">{currentUser ? t('manage_profile') : t('start_free')}</span> 
                  <i className="bi bi-arrow-right fs-5"></i>
                </Button>
                
                <Button 
                  onClick={handleExploreDashboard}
                  variant="light"
                  className="rounded-pill px-4 py-3 fw-bold d-flex align-items-center border"
                  style={{ color: colors.textDark, backgroundColor: '#ffffff', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
                >
                  <span className="me-2">🤖</span> {t('explore', 'ทดลอง AI')}
                </Button>
              </div>
            </Col>

            {/* Right Visual Column (Floating Cards & AI Graphics) */}
            <Col lg={6} className="py-5 position-relative mt-5 mt-lg-0">
              <div 
                className="position-relative mx-auto"
                style={{ 
                  maxWidth: '500px',
                  aspectRatio: '1',
                  backgroundColor: colors.bgGray,
                  borderRadius: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 40px rgba(0,0,0,0.02)'
                }}
              >
                {/* Main AI Image PlaceHolder (Brain Graphic) */}
                <Image 
                  src={connectingDots} 
                  alt="AI Network Graphic" 
                  style={{
                    width: '90%',
                    height: '60%',
                    objectFit: 'cover',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
                  }}
                />

                {/* Floating Satisfaction Card (Top Right) */}
                <div 
                  className="position-absolute bg-white px-4 py-3 text-center"
                  style={{
                    top: '15%',
                    right: '-5%',
                    borderRadius: '16px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                    animation: 'float 6s ease-in-out infinite'
                  }}
                >
                  <h3 className="fw-bolder mb-0" style={{ color: colors.primary }}>98%</h3>
                  <small style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>{t('stats_satisfaction')}</small>
                </div>

                {/* Floating AI Feature Card (Bottom Left) */}
                <div 
                  className="position-absolute bg-white p-3 text-center d-flex align-items-center gap-3"
                  style={{
                    bottom: '15%',
                    left: '-5%',
                    borderRadius: '16px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                    animation: 'float 5s ease-in-out infinite reverse'
                  }}
                >
                  <div className="fw-bolder" style={{ fontSize: '1.2rem', color: colors.primary }}>
                    AI
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <small style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>{i18n.language === 'en' ? 'Auto Create' : 'สร้างอัตโนมัติ'}</small>
                  </div>
                </div>

                {/* CSS Animation Keyframes for Floating Effect */}
                <style>
                  {`
                    @keyframes float {
                      0% { transform: translateY(0px); }
                      50% { transform: translateY(-15px); }
                      100% { transform: translateY(0px); }
                    }
                  `}
                </style>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* 🚀 Feature Grid Section */}
      <div className="py-5" style={{ backgroundColor: '#fafafa' }}>
        <Container className="py-4">
          <div className="text-center mb-5">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ backgroundColor: 'rgba(107, 95, 255, 0.1)', color: colors.primary, fontSize: '0.85rem', fontWeight: 700 }}>
              <span style={{ fontSize: '1rem' }}>🚀</span> {t('features_badge')}
            </div>
            <h2 className="fw-bolder mb-3" style={{ color: colors.textDark, fontSize: '2.5rem' }}>{t('features_title')}</h2>
            <p className="text-muted mx-auto" style={{ fontSize: '1.1rem', maxWidth: '600px' }}>
              {t('features_desc')}
            </p>
          </div>

          <Row className="g-4">
            {[
              { icon: '👤', title: t('feature1_title'), desc: t('feature1_desc') },
              { icon: '🤖', title: t('feature2_title'), desc: t('feature2_desc') },
              { icon: '🎨', title: t('feature3_title'), desc: t('feature3_desc') },
              { icon: '📊', title: t('feature4_title'), desc: t('feature4_desc') },
              { icon: '🔗', title: t('feature5_title'), desc: t('feature5_desc') },
              { icon: '🔒', title: t('feature6_title'), desc: t('feature6_desc') }
            ].map((f, idx) => (
              <Col md={4} key={idx}>
                <div 
                  className="p-4 rounded-4 bg-white h-100 feature-card d-flex flex-column" 
                  style={{ 
                    border: '1px solid rgba(0,0,0,0.02)', 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.03)', 
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.03)'; }}
                >
                  <div className="mb-3 d-flex justify-content-center align-items-center rounded-3" style={{ width: '45px', height: '45px', backgroundColor: 'rgba(107, 95, 255, 0.08)', fontSize: '1.3rem' }}>
                    {f.icon}
                  </div>
                  <h5 className="fw-bolder mb-2" style={{ color: colors.textDark, fontSize: '1.1rem' }}>{f.title}</h5>
                  <p className="mb-0" style={{ color: '#8b8b99', fontSize: '0.9rem', lineHeight: '1.6' }}>{f.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* 📈 Stats Section */}
      <div className="py-5" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f1f1' }}>
        <Container className="py-md-4">
          <Row className="text-center g-4">
            {[
              { val: '50,000+', label: t('stats_users') },
              { val: '120,000+', label: t('stats_profiles') },
              { val: '98%', label: t('stats_satisfaction') },
              { val: '24/7', label: t('stats_ai') }
            ].map((s, idx) => (
              <Col md={3} xs={6} key={idx}>
                <h2 className="fw-bolder mb-2" style={{ color: colors.primary, fontSize: '3rem', letterSpacing: '-1px' }}>{s.val}</h2>
                <div className="fw-bold" style={{ color: '#8b8b99', fontSize: '0.9rem' }}>{s.label}</div>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* 🎯 CTA Section */}
      <div className="py-5 position-relative" style={{ backgroundColor: '#111116', overflow: 'hidden' }}>
        {/* Glow effect background */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(107, 95, 255, 0.15) 0%, rgba(17, 17, 22, 0) 60%)', zIndex: 0, pointerEvents: 'none' }}></div>
        
        <Container className="py-5 text-center position-relative" style={{ zIndex: 1 }}>
          <h2 className="fw-bolder mb-3 text-white" style={{ fontSize: '2.5rem', letterSpacing: '-0.5px' }}>
            {t('cta_title')}
          </h2>
          <p className="mb-4 mx-auto" style={{ color: '#a0a0ab', fontSize: '1.1rem', maxWidth: '600px' }}>
            {t('cta_desc')}
          </p>
          <Button 
            onClick={handleCreatePersona}
            className="rounded-pill px-5 py-3 fw-bold border-0 mt-2" 
            style={{ 
              backgroundColor: colors.primary, 
              fontSize: '1rem', 
              boxShadow: '0 0 30px rgba(107, 95, 255, 0.4)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(107, 95, 255, 0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(107, 95, 255, 0.4)'; }}
          >
            {currentUser ? t('cta_btn_logged_in') : t('cta_btn_logged_out')}
          </Button>
        </Container>
      </div>

      {/* 🌑 Footer Section */}
      <div className="py-5" style={{ backgroundColor: '#191920' }}>
        <Container className="pt-3 pb-2">
          <Row className="gx-5">
            <Col lg={4} className="mb-4 mb-lg-0">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: colors.primary, width: '32px', height: '32px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}>SP</div>
                <span className="fw-bolder text-white" style={{ fontSize: '1.25rem', letterSpacing: '0.5px' }}>Smart Persona</span>
              </div>
              <p style={{ color: '#7a7a85', fontSize: '0.85rem', lineHeight: '1.7', maxWidth: '90%' }}>
                {t('footer_desc')}
              </p>
            </Col>
            
            <Col lg={2} xs={6} className="mb-4 mb-lg-0">
              <h6 className="text-white fw-bold mb-4" style={{ fontSize: '0.9rem' }}>{t('footer_menu')}</h6>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>{t('home')}</a></li>
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>{t('feature1_title')}</a></li>
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>{t('feature2_title')}</a></li>
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>{t('themes')}</a></li>
              </ul>
            </Col>

            <Col lg={3} xs={6} className="mb-4 mb-lg-0">
              <h6 className="text-white fw-bold mb-4" style={{ fontSize: '0.9rem' }}>{t('footer_services')}</h6>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>{t('feature1_title')}</a></li>
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>{t('feature2_title')}</a></li>
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>{t('manage_profile')}</a></li>
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>API</a></li>
              </ul>
            </Col>

            <Col lg={3} xs={12}>
              <h6 className="text-white fw-bold mb-4" style={{ fontSize: '0.9rem' }}>{t('footer_contact')}</h6>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>hello@smartpersona.ai</a></li>
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>Help Center</a></li>
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>Terms of Use</a></li>
                 <li><a href="#" className="text-decoration-none" style={{ color: '#8b8b99', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8b8b99'}>Privacy Policy</a></li>
              </ul>
            </Col>
          </Row>
          
          <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#555560', fontSize: '0.8rem' }}>
            © 2026 Smart Persona. All rights reserved.
          </div>
        </Container>
      </div>

      <LoginModal 
        show={showLoginModal} 
        onHide={() => setShowLoginModal(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </>
  );
}

export default HomePage;
