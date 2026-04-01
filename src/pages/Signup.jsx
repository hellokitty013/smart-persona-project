import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/auth'
import LoginModal from '../components/LoginModal'

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!agreed) {
      alert("โปรดยอมรับเงื่อนไขการใช้งาน");
      return;
    }

    const username = formData.username.trim();
    const firstName = username;
    const lastName = '-';
    const birthDate = '2000-01-01'; 
    
    const res = await registerUser({ 
      username, 
      email: formData.email, 
      password: formData.password, 
      firstName, 
      lastName, 
      birthDate 
    });
    
    if (!res.ok) {
      alert(res.message || 'การสมัครสมาชิกขัดข้อง โปรดลองใหม่อีกครั้ง');
      return;
    }
    
    try { 
      localStorage.setItem('lastRegistered', JSON.stringify({ identifier: username, password: formData.password })) 
    } catch (e) {}
    
    window.dispatchEvent(new Event('authChange'));
    
    // Auto-login succeeds -> direct to dashboard instead of home
    navigate('/my-profile');
  };

  const handleSocialClick = (platform) => {
    alert(`ระบบล็อกอินผ่าน ${platform} กำลังอยู่ระหว่างการพัฒนา กรุณาสมัครด้วยอีเมลไปก่อนนะครับ!`);
  };

  const colors = {
    primary: '#6b5fff',
    bgDark: '#121212',
    textMuted: '#8b8b99',
    inputBg: '#f4f6f8'
  };

  return (
    <>
    <style>
      {`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 0.1s; opacity: 0; }
        .delay-200 { animation-delay: 0.2s; opacity: 0; }
        
        .premium-input:focus {
          background-color: #fff !important;
          border: 1px solid ${colors.primary} !important;
          box-shadow: 0 0 0 4px rgba(107, 95, 255, 0.1) !important;
          outline: none;
        }
        
        .social-btn {
          transition: all 0.3s ease;
        }
        .social-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          background-color: #f8f9fa !important;
        }

        .submit-btn {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .submit-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(107, 95, 255, 0.35) !important;
        }
        
        .submit-btn:active {
          transform: translateY(0px);
          box-shadow: 0 4px 15px rgba(107, 95, 255, 0.2) !important;
        }
      `}
    </style>
    <div style={{ backgroundColor: '#fafafa', minHeight: 'calc(100vh - 76px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <Container style={{ maxWidth: '1000px' }} className="p-0 animate-fade-in-up">
        <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', backgroundColor: '#fff', transition: 'all 0.4s ease' }}>
          <Row className="m-0 align-items-stretch" style={{ minHeight: '650px' }}>
            
            {/* Left Panel - Dark Mode Info */}
            <Col md={5} className="d-none d-md-flex flex-column justify-content-center p-5 relative animate-fade-in-up delay-100" style={{ backgroundColor: colors.bgDark, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="mb-4">
                <h2 className="fw-bolder text-white mb-0" style={{ fontSize: '2rem' }}>ยินดีต้อนรับสู่</h2>
                <h1 className="fw-bolder mb-3" style={{ color: colors.primary, fontSize: '2.5rem', letterSpacing: '-0.5px' }}>Smart Persona</h1>
                <p style={{ color: colors.textMuted, fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '90%' }}>
                  สร้างแอคเคาท์เพื่อเริ่มต้นสร้างตัวตนดิจิทัลที่โดดเด่นพร้อม AI อัจฉริยะ
                </p>
              </div>

              <div className="mt-4 d-flex flex-column gap-3">
                {[
                  "สร้างโปรไฟล์ไม่จำกัด",
                  "AI ช่วยเหลืออัจฉริยะ",
                  "ธีมพรีเมียมฟรี",
                  "แชร์โปรไฟล์ง่ายดาย"
                ].map((feature, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '24px', height: '24px', backgroundColor: 'rgba(107, 95, 255, 0.15)', color: colors.primary }}>
                      <i className="bi bi-check" style={{ fontSize: '1.2rem', strokeWidth: '1px' }}></i>
                    </div>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </Col>

            {/* Right Panel - Signup Form */}
            <Col md={7} className="p-4 p-lg-5 bg-white d-flex flex-column justify-content-center animate-fade-in-up delay-200">
              {/* Logo matching the original image mockup Logo */}
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: colors.primary, width: '30px', height: '30px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                  SP
                </div>
                <span className="fw-bolder" style={{ color: '#1a1a2e', fontSize: '1.2rem' }}>Smart Persona</span>
              </div>

              <h3 className="fw-bolder text-dark mb-1">สมัครสมาชิก</h3>
              <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>สร้างแอคเคาท์ใหม่เพื่อเริ่มต้นใช้งาน</p>

              {/* Social Buttons */}
              <Row className="mb-4">
                <Col xs={6}>
                  <Button variant="light" onClick={() => handleSocialClick('Google')} className="w-100 bg-white border d-flex align-items-center justify-content-center gap-2 py-2 social-btn" style={{ borderRadius: '10px' }}>
                    <i className="bi bi-google text-danger"></i> <small className="fw-bold text-dark">Google</small>
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button variant="light" onClick={() => handleSocialClick('GitHub')} className="w-100 bg-white border d-flex align-items-center justify-content-center gap-2 py-2 social-btn" style={{ borderRadius: '10px' }}>
                    <i className="bi bi-github text-dark"></i> <small className="fw-bold text-dark">GitHub</small>
                  </Button>
                </Col>
              </Row>

              <div className="d-flex align-items-center my-3">
                <div className="flex-grow-1" style={{ height: '1px', backgroundColor: '#e9ecef' }}></div>
                <span className="px-3 text-muted" style={{ fontSize: '0.8rem' }}>หรือสมัครด้วยอีเมล</span>
                <div className="flex-grow-1" style={{ height: '1px', backgroundColor: '#e9ecef' }}></div>
              </div>

              <Form onSubmit={handleSubmit} className="mt-3">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>ชื่อผู้ใช้งาน (Username)</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    placeholder="somchai99"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="border-0 p-3 premium-input"
                    style={{ backgroundColor: colors.inputBg, borderRadius: '10px', fontSize: '0.9rem', transition: 'all 0.2s' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>อีเมล</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="border-0 p-3 premium-input"
                    style={{ backgroundColor: colors.inputBg, borderRadius: '10px', fontSize: '0.9rem', transition: 'all 0.2s' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>รหัสผ่าน</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="border-0 p-3 premium-input"
                      style={{ backgroundColor: colors.inputBg, borderRadius: '10px', fontSize: '0.9rem', transition: 'all 0.2s' }}
                    />
                    <i 
                      className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted position-absolute social-btn`} 
                      style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', padding: '5px' }}
                      onClick={() => setShowPassword(!showPassword)}
                    ></i>
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>ยืนยันรหัสผ่าน</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="border-0 p-3 premium-input"
                    style={{ backgroundColor: colors.inputBg, borderRadius: '10px', fontSize: '0.9rem', transition: 'all 0.2s' }}
                  />
                </Form.Group>

                <Form.Group className="mb-4 d-flex align-items-center gap-2">
                  <Form.Check 
                    type="checkbox" 
                    id="terms" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="m-0 premium-checkbox"
                    style={{ accentColor: colors.primary }}
                  />
                  <Form.Label htmlFor="terms" className="m-0 text-muted" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    ยอมรับ <Link to="#" className="text-decoration-none premium-link" style={{ color: colors.primary, transition: 'color 0.2s' }}>เงื่อนไขการใช้งาน</Link> และ <Link to="#" className="text-decoration-none premium-link" style={{ color: colors.primary, transition: 'color 0.2s' }}>นโยบายความเป็นส่วนตัว</Link>
                  </Form.Label>
                </Form.Group>

                <Button 
                  type="submit" 
                  className="w-100 rounded-pill py-3 fw-bold border-0 mt-2 mb-4 submit-btn"
                  style={{ backgroundColor: colors.primary, fontSize: '0.95rem', boxShadow: '0 8px 24px rgba(107, 95, 255, 0.25)' }}
                >
                  สมัครสมาชิก
                </Button>

                <div className="text-center">
                  <span className="text-muted" style={{ fontSize: '0.9rem' }}>มีแอคเคาท์แล้ว? </span>
                  <span 
                    onClick={() => setShowLoginModal(true)} 
                    className="fw-bold text-decoration-none" 
                    style={{ color: colors.primary, cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    เข้าสู่ระบบ
                  </span>
                </div>
              </Form>
            </Col>
          </Row>
        </div>
      </Container>
    </div>

    {showLoginModal && (
      <LoginModal 
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        onSwitchToSignup={() => setShowLoginModal(false)}
      />
    )}
    </>
  );
}

export default Signup;
