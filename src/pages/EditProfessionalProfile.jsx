import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Form, Button, Badge, ListGroup, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { 
  getCurrentUserProfessionalProfile, 
  createProfessionalProfile,
  updateProfessionalProfile,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  addSkill,
  removeSkill
} from '../services/professionalProfileManager';
import Sidebar from '../components/Sidebar';
import LoginModal from '../components/LoginModal';

function EditProfessionalProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState(null);
  
  // Basic info
  const [displayName, setDisplayName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [about, setAbout] = useState('');
  const [avatar, setAvatar] = useState('');
  const [coverColor, setCoverColor] = useState('#0a66c2');
  const [isPublic, setIsPublic] = useState(true);
  
  // Experience modal
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [expPosition, setExpPosition] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expBullets, setExpBullets] = useState('');
  
  // Education modal
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [editingEducation, setEditingEducation] = useState(null);
  const [eduDegree, setEduDegree] = useState('');
  const [eduSchool, setEduSchool] = useState('');
  const [eduLocation, setEduLocation] = useState('');
  const [eduStartDate, setEduStartDate] = useState('');
  const [eduEndDate, setEduEndDate] = useState('');
  const [eduCoursework, setEduCoursework] = useState('');
  
  // Skills
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    loadProfile();
  }, []);

  const loadProfile = async () => {
    const user = getCurrentUser();
    let professionalProfile = await getCurrentUserProfessionalProfile();
    
    if (!professionalProfile) {
      professionalProfile = await createProfessionalProfile(user.username);
    }

    if (professionalProfile) {
      setProfile(professionalProfile);
      setProfileId(professionalProfile.id);
      
      const data = professionalProfile.data;
      setDisplayName(data.displayName || '');
      setJobTitle(data.jobTitle || '');
      setLocation(data.location || '');
      setAbout(data.about || '');
      setAvatar(data.avatar || '');
      setCoverColor(data.coverColor || '#0a66c2');
      setIsPublic(data.isPublic !== false);
      setSkills(data.skills || []);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!profileId) return;

    await updateProfessionalProfile(profileId, {
      displayName,
      jobTitle,
      location,
      about,
      avatar,
      coverColor,
      isPublic
    });

    alert('Profile updated successfully!');
  };

  // Experience handlers
  const handleAddExperience = () => {
    setEditingExperience(null);
    setExpPosition('');
    setExpCompany('');
    setExpLocation('');
    setExpStartDate('');
    setExpEndDate('');
    setExpDescription('');
    setExpBullets('');
    setShowExperienceModal(true);
  };

  const handleEditExperience = (exp) => {
    setEditingExperience(exp);
    setExpPosition(exp.position || '');
    setExpCompany(exp.company || '');
    setExpLocation(exp.location || '');
    setExpStartDate(exp.startDate || '');
    setExpEndDate(exp.endDate || '');
    setExpDescription(exp.description || '');
    setExpBullets(exp.bullets ? exp.bullets.join('\n') : '');
    setShowExperienceModal(true);
  };

  const handleSaveExperience = async () => {
    if (!profileId) return;

    const bullets = expBullets.split('\n').filter(b => b.trim());
    const experienceData = {
      position: expPosition,
      company: expCompany,
      location: expLocation,
      startDate: expStartDate,
      endDate: expEndDate,
      description: expDescription,
      bullets
    };

    if (editingExperience) {
      await updateExperience(profileId, editingExperience.id, experienceData);
    } else {
      await addExperience(profileId, experienceData);
    }

    setShowExperienceModal(false);
    await loadProfile();
  };

  const handleDeleteExperience = async (expId) => {
    if (window.confirm('Are you sure you want to delete this experience?')) {
      await deleteExperience(profileId, expId);
      await loadProfile();
    }
  };

  // Education handlers
  const handleAddEducation = () => {
    setEditingEducation(null);
    setEduDegree('');
    setEduSchool('');
    setEduLocation('');
    setEduStartDate('');
    setEduEndDate('');
    setEduCoursework('');
    setShowEducationModal(true);
  };

  const handleEditEducation = (edu) => {
    setEditingEducation(edu);
    setEduDegree(edu.degree || '');
    setEduSchool(edu.school || '');
    setEduLocation(edu.location || '');
    setEduStartDate(edu.startDate || '');
    setEduEndDate(edu.endDate || '');
    setEduCoursework(edu.coursework || '');
    setShowEducationModal(true);
  };

  const handleSaveEducation = async () => {
    if (!profileId) return;

    const educationData = {
      degree: eduDegree,
      school: eduSchool,
      location: eduLocation,
      startDate: eduStartDate,
      endDate: eduEndDate,
      coursework: eduCoursework
    };

    if (editingEducation) {
      await updateEducation(profileId, editingEducation.id, educationData);
    } else {
      await addEducation(profileId, educationData);
    }

    setShowEducationModal(false);
    await loadProfile();
  };

  const handleDeleteEducation = async (eduId) => {
    if (window.confirm('Are you sure you want to delete this education?')) {
      await deleteEducation(profileId, eduId);
      await loadProfile();
    }
  };

  // Skills handlers
  const handleAddSkill = async () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      await addSkill(profileId, newSkill.trim());
      setNewSkill('');
      await loadProfile();
    }
  };

  const handleRemoveSkill = async (skill) => {
    await removeSkill(profileId, skill);
    await loadProfile();
  };

  if (!profile) {
    return null;
  }

  return (
    <>
      <div className="d-flex">
        <Sidebar />
        <Container fluid className="p-4" style={{ marginLeft: '250px' }}>
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="fw-bold">{t('edit_professional_profile')}</h2>
                  <p className="text-muted">{t('manage_linkedin_profile')}</p>
                </div>
                <Button 
                  variant="outline-primary"
                  onClick={() => navigate('/my-profile')}
                >
                  <i className="bi bi-eye me-2"></i>
                  {t('view_profile')}
                </Button>
              </div>
            </Col>
          </Row>

          {/* Basic Information */}
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">{t('basic_information')}</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t('display_name')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t('display_name')}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t('job_title')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={t('job_title')}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t('location')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t('location')}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t('cover_color')}</Form.Label>
                    <Form.Control
                      type="color"
                      value={coverColor}
                      onChange={(e) => setCoverColor(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>{t('avatar_url')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder={t('avatar_url')}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>{t('about')}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      placeholder={t('about')}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Check
                    type="checkbox"
                    label={t('make_public')}
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                </Col>

                <Col md={12}>
                  <Button variant="primary" onClick={handleSaveBasicInfo}>
                    <i className="bi bi-save me-2"></i>
                    {t('save_basic_info')}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* VIEW MODE Section */}
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted text-uppercase fw-semibold d-block mb-1">VIEW MODE</small>
                  <p className="mb-0 small text-muted">เลือก layout ที่สอดคล้องกับจุดประสงค์ของหน้าคุณ</p>
                </div>
                <Button variant="outline-secondary" size="sm">
                  <i className="bi bi-magic me-1"></i>
                  เลือก Preset
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <div 
                    className="p-3 border rounded h-100 position-relative"
                    style={{ cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#f8f9fa' }}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-2"
                        style={{ width: '40px', height: '40px', backgroundColor: '#0d6efd', color: 'white' }}
                      >
                        <i className="bi bi-briefcase"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between">
                          <strong>Professional</strong>
                          <Badge bg="primary" className="ms-2">ATS Ready</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="small text-muted mb-2">CV-style layout best for recruiters</p>
                    <div className="d-flex align-items-center">
                      <Badge bg="info" className="me-1"><i className="bi bi-check-circle-fill me-1"></i>Preset: Link Hub</Badge>
                    </div>
                  </div>
                </Col>
                
                <Col md={4}>
                  <div 
                    className="p-3 border rounded h-100"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-2"
                        style={{ width: '40px', height: '40px', backgroundColor: '#6c757d', color: 'white' }}
                      >
                        <i className="bi bi-stars"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between">
                          <strong>Showcase</strong>
                          <Badge bg="secondary" className="ms-2">Spotlight</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="small text-muted mb-0">Hero cover with highlight cards</p>
                  </div>
                </Col>
                
                <Col md={4}>
                  <div 
                    className="p-3 border rounded h-100"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-2"
                        style={{ width: '40px', height: '40px', backgroundColor: '#6c757d', color: 'white' }}
                      >
                        <i className="bi bi-link-45deg"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between">
                          <strong>Link Hub</strong>
                          <Badge bg="secondary" className="ms-2">Multi-link</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="small text-muted mb-0">Compact link-in-bio inspired view</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* SMART ASSISTANTS Section */}
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted text-uppercase fw-semibold d-block mb-1">SMART ASSISTANTS</small>
                  <h6 className="mb-0">Automate profile updates & exports</h6>
                </div>
                <Badge bg="light" text="dark">Beta</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="mb-2">Import from social</h6>
                          <p className="small text-muted mb-2">
                            Pull the latest roles, links, and bio from LinkedIn, Twitter, or Medium in one click.
                          </p>
                          <small className="text-muted">Best for quick refreshes before sharing your profile.</small>
                        </div>
                        <Badge bg="primary" pill>Sync</Badge>
                      </div>
                      <Button variant="outline-primary" size="sm">
                        <i className="bi bi-cloud-arrow-down me-1"></i>
                        Start import
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="mb-2">AI Draft Builder</h6>
                          <p className="small mb-2" style={{ opacity: 0.9 }}>
                            Let our AI summarize your wins, write highlights, and suggest sections instantly.
                          </p>
                          <small style={{ opacity: 0.8 }}>Great for brand-new profiles or major rewrites.</small>
                        </div>
                        <Badge bg="light" text="dark" pill>AI</Badge>
                      </div>
                      <Button variant="light" size="sm">
                        <i className="bi bi-stars me-1"></i>
                        Launch builder
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <small className="text-muted d-block mt-3">
                Use these assistants to sync profile data instantly.
              </small>
            </Card.Body>
          </Card>

          {/* Experience Section */}
          <Card className="mb-4">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('experience')}</h5>
              <Button variant="primary" size="sm" onClick={handleAddExperience}>
                <i className="bi bi-plus-lg me-1"></i> {t('add_experience')}
              </Button>
            </Card.Header>
            <Card.Body>
              {profile.data.experience && profile.data.experience.length > 0 ? (
                <ListGroup variant="flush">
                  {profile.data.experience.map((exp, idx) => (
                    <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{exp.position}</h6>
                        <p className="mb-1 text-muted">{exp.company} • {exp.location}</p>
                        <small className="text-muted">{exp.startDate} - {exp.endDate || 'Present'}</small>
                      </div>
                      <div>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEditExperience(exp)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteExperience(exp.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted text-center py-3">{t('no_experience')}</p>
              )}
            </Card.Body>
          </Card>

          {/* Education Section */}
          <Card className="mb-4">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('education')}</h5>
              <Button variant="primary" size="sm" onClick={handleAddEducation}>
                <i className="bi bi-plus-lg me-1"></i> {t('add_education')}
              </Button>
            </Card.Header>
            <Card.Body>
              {profile.data.education && profile.data.education.length > 0 ? (
                <ListGroup variant="flush">
                  {profile.data.education.map((edu, idx) => (
                    <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{edu.degree}</h6>
                        <p className="mb-1 text-muted">{edu.school} • {edu.location}</p>
                        <small className="text-muted">{edu.startDate} - {edu.endDate}</small>
                      </div>
                      <div>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEditEducation(edu)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteEducation(edu.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted text-center py-3">{t('no_education')}</p>
              )}
            </Card.Body>
          </Card>

          {/* Skills Section */}
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">{t('skills')}</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder={t('skill_placeholder')}
                  />
                  <Button variant="primary" onClick={handleAddSkill}>
                    {t('add')}
                  </Button>
                </div>
              </Form.Group>

              <div className="d-flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <Badge 
                    key={idx} 
                    bg="primary" 
                    className="d-flex align-items-center gap-2 py-2 px-3"
                    style={{ fontSize: '14px' }}
                  >
                    {skill}
                    <i 
                      className="bi bi-x-lg" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRemoveSkill(skill)}
                    ></i>
                  </Badge>
                ))}
              </div>

              {skills.length === 0 && (
                <p className="text-muted text-center py-3">{t('no_skills')}</p>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Experience Modal */}
      <Modal show={showExperienceModal} onHide={() => setShowExperienceModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingExperience ? t('edit_experience') : t('add_experience')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('position')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={expPosition}
                    onChange={(e) => setExpPosition(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('company')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={expCompany}
                    onChange={(e) => setExpCompany(e.target.value)}
                    placeholder="e.g. Google"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>{t('location')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={expLocation}
                    onChange={(e) => setExpLocation(e.target.value)}
                    placeholder="e.g. Bangkok, Thailand"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('start_date')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={expStartDate}
                    onChange={(e) => setExpStartDate(e.target.value)}
                    placeholder="e.g. 2020-01 or Jan 2020"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('end_date')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={expEndDate}
                    onChange={(e) => setExpEndDate(e.target.value)}
                    placeholder="e.g. 2023-12 or Present"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>{t('description')}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    placeholder="Brief description of your role"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>{t('key_achievements')}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={expBullets}
                    onChange={(e) => setExpBullets(e.target.value)}
                    placeholder="Led development of new feature&#10;Improved performance by 50%&#10;Mentored junior developers"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExperienceModal(false)}>
            {t('cancel')}
          </Button>
          <Button variant="primary" onClick={handleSaveExperience}>
            {t('save')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Education Modal */}
      <Modal show={showEducationModal} onHide={() => setShowEducationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingEducation ? t('edit_education') : t('add_education')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>{t('degree')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={eduDegree}
                    onChange={(e) => setEduDegree(e.target.value)}
                    placeholder="e.g. B.S. Computer Science"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>{t('school')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={eduSchool}
                    onChange={(e) => setEduSchool(e.target.value)}
                    placeholder="e.g. Chulalongkorn University"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>{t('location')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={eduLocation}
                    onChange={(e) => setEduLocation(e.target.value)}
                    placeholder="e.g. Bangkok, Thailand"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('start_date')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={eduStartDate}
                    onChange={(e) => setEduStartDate(e.target.value)}
                    placeholder="e.g. 2015 or 2015-08"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('end_date')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={eduEndDate}
                    onChange={(e) => setEduEndDate(e.target.value)}
                    placeholder="e.g. 2019 or 2019-05"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>{t('coursework')}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={eduCoursework}
                    onChange={(e) => setEduCoursework(e.target.value)}
                    placeholder="e.g. Data Structures, Algorithms, Web Development"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEducationModal(false)}>
            {t('cancel')}
          </Button>
          <Button variant="primary" onClick={handleSaveEducation}>
            {t('save')}
          </Button>
        </Modal.Footer>
      </Modal>

      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        onSwitchToSignup={() => navigate('/signup')}
      />
    </>
  );
}

export default EditProfessionalProfile;
