import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Button, Form, Badge, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { getPublicProfessionalProfiles, searchProfessionalProfiles, getAllSkills, getAllLocations, adjustVheartLikes } from '../services/professionalProfileManager';
import { isProfileSaved, saveProfile, unsaveProfile } from '../services/savedProfiles';
import Sidebar from '../components/Sidebar';
import LoginModal from '../components/LoginModal';

function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [savedProfileIds, setSavedProfileIds] = useState(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 12;

  // Load saved IDs once on mount
  useEffect(() => {
    import('../services/savedProfiles').then(({ getSavedProfiles }) => {
      getSavedProfiles().then(ids => setSavedProfileIds(new Set(ids)));
    });
  }, []);

  // Load public profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      const publicProfiles = await getPublicProfessionalProfiles();
      setProfiles(publicProfiles);
      setFilteredProfiles(sortProfiles(publicProfiles, sortBy));
    };
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters when any filter changes
  useEffect(() => {
    const applyFilters = async () => {
      const filters = {};
      if (selectedSkill) filters.skill = selectedSkill;
      if (selectedLocation) filters.location = selectedLocation;
      if (experienceLevel) filters.experienceLevel = experienceLevel;
      let results = await searchProfessionalProfiles(searchQuery, filters);
      results = sortProfiles(results, sortBy);
      setFilteredProfiles(results);
      setCurrentPage(1);
    };
    applyFilters();
  }, [searchQuery, selectedSkill, selectedLocation, experienceLevel, profiles, sortBy]);

  const sortProfiles = (profileList, sortOption) => {
    const sorted = [...profileList];
    
    switch(sortOption) {
      case 'recent':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA; // Newest first
        });
      
      case 'name':
        return sorted.sort((a, b) => {
          const nameA = (a.data?.displayName || '').toLowerCase();
          const nameB = (b.data?.displayName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
      case 'experience':
        return sorted.sort((a, b) => {
          const expA = a.data?.experienceYears || 0;
          const expB = b.data?.experienceYears || 0;
          return expB - expA; // Most experienced first
        });
      
      default:
        return sorted;
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSkill('');
    setSelectedLocation('');
    setExperienceLevel('');
    setSortBy('recent');
  };

  const [allSkills, setAllSkills] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  useEffect(() => {
    getAllSkills().then(setAllSkills);
    getAllLocations().then(setAllLocations);
  }, [profiles]);

  // Pagination logic
  const indexOfLastProfile = currentPage * profilesPerPage;
  const indexOfFirstProfile = indexOfLastProfile - profilesPerPage;
  const currentProfiles = filteredProfiles.slice(indexOfFirstProfile, indexOfLastProfile);
  const totalPages = Math.ceil(filteredProfiles.length / profilesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProfile = async (e, profileId) => {
    e.stopPropagation();
    const user = getCurrentUser();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const alreadySaved = savedProfileIds.has(profileId);
    if (alreadySaved) {
      await unsaveProfile(profileId);
      await adjustVheartLikes(profileId, -1);
      setSavedProfileIds(prev => { const next = new Set(prev); next.delete(profileId); return next; });
    } else {
      await saveProfile(profileId);
      await adjustVheartLikes(profileId, 1);
      setSavedProfileIds(prev => new Set([...prev, profileId]));
    }
    setFilteredProfiles(prev => [...prev]);
  };

  const handleProfileClick = (profile) => {
    const user = getCurrentUser();
    if (!user) {
      setShowLoginModal(true);
    } else {
      const username = profile.data?.username;
      if (username) {
        navigate(`/u/${username}`);
      }
    }
  };

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    navigate('/signup');
  };

  return (
    <div className="dashboard-shell p-4">
      <div className="dashboard-card d-flex">
        <Sidebar />
        
        <main className="dashboard-main p-4">
          <div className="text-center mb-4">
            <h2 className="fw-bold">{t('explore_people')}</h2>
            <p className="text-muted">{t('discover_talented')}</p>
          </div>

        {/* Search and Filters */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <Row className="g-3">
              {/* Search Bar */}
              <Col md={12}>
                <Form.Group>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder={t('search_placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '40px' }}
                    />
                    <i className="bi bi-search position-absolute" 
                       style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}></i>
                  </div>
                </Form.Group>
              </Col>

              {/* Filters Row */}
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">{t('filter_by_skill')}</Form.Label>
                  <Form.Select 
                    value={selectedSkill} 
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    size="sm"
                  >
                    <option value="">{t('all_skills')}</option>
                    {allSkills.map((skill, idx) => (
                      <option key={idx} value={skill}>{skill}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">{t('filter_by_location')}</Form.Label>
                  <Form.Select 
                    value={selectedLocation} 
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    size="sm"
                  >
                    <option value="">{t('all_locations')}</option>
                    {allLocations.map((loc, idx) => (
                      <option key={idx} value={loc}>{loc}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">{t('experience_level')}</Form.Label>
                  <Form.Select 
                    value={experienceLevel} 
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    size="sm"
                  >
                    <option value="">{t('all_levels') || 'All Levels'}</option>
                    <option value="entry">{t('junior')}</option>
                    <option value="mid">{t('mid')}</option>
                    <option value="senior">{t('senior')}</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">{t('sort_by')}</Form.Label>
                  <Form.Select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    size="sm"
                  >
                    <option value="recent">{t('recent')}</option>
                    <option value="name">{t('name_az')}</option>
                    <option value="experience">{t('most_experienced')}</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Clear Filters Button */}
              {(searchQuery || selectedSkill || selectedLocation || experienceLevel || sortBy !== 'recent') && (
                <Col md={12} className="text-end">
                  <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                    <i className="bi bi-x-circle me-1"></i>
                    {t('clear_filters')}
                  </Button>
                </Col>
              )}
            </Row>

            {/* Results Count */}
            <div className="mt-3 d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                {t('showing_results')} {indexOfFirstProfile + 1}-{Math.min(indexOfLastProfile, filteredProfiles.length)} {t('of')} {filteredProfiles.length} {t('profiles')}
              </div>
              {totalPages > 1 && (
                <div className="text-muted small">
                  {t('page')} {currentPage} {t('of')} {totalPages}
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Profiles Grid */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted"></i>
            <h5 className="mt-3 text-muted">{t('no_profiles_found')}</h5>
            <p className="text-muted">{t('try_different_filters')}</p>
          </div>
        ) : (
          <Row className="g-4">
            {currentProfiles.map((profile, index) => {
              const data = profile.data || {};
              const skills = data.skills || [];
              const topSkills = skills.slice(0, 3);
              const isSaved = savedProfileIds.has(profile.id);

              return (
                <Col key={profile.id || index} md={6} lg={4}>
                  <Card 
                    className="h-100 shadow-sm border-0 position-relative" 
                    style={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                    onClick={() => handleProfileClick(profile)}
                  >
                    {/* Save Button */}
                    <Button
                      variant={isSaved ? 'danger' : 'light'}
                      size="sm"
                      className="position-absolute"
                      style={{
                        top: '10px',
                        right: '10px',
                        zIndex: 10,
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      onClick={(e) => handleSaveProfile(e, profile.id)}
                    >
                      <i className={`bi ${isSaved ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                    </Button>
                    
                    <div 
                      style={{
                        height: '100px',
                        background: data.bgColor || '#6c5ce7',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px'
                      }}
                    />
                    <Card.Body className="text-center" style={{ marginTop: '-50px' }}>
                      <img
                        src={data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || 'User')}&background=random&color=fff&size=200`}
                        alt={data.displayName}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          border: '4px solid white',
                          marginBottom: '12px',
                          objectFit: 'cover'
                        }}
                      />
                      
                      <h5 className="fw-bold mb-1" style={{ fontSize: '18px' }}>
                        {data.displayName || t('anonymous')}
                      </h5>
                      
                      {data.jobTitle && (
                        <p className="text-primary mb-2" style={{ fontSize: '14px', fontWeight: '500' }}>
                          {data.jobTitle}
                        </p>
                      )}

                      {data.location && (
                        <p className="text-muted small mb-2">
                          <i className="bi bi-geo-alt me-1"></i>
                          {data.location}
                        </p>
                      )}

                      {data.experienceYears > 0 && (
                        <p className="text-muted small mb-3">
                          <i className="bi bi-briefcase me-1"></i>
                          {data.experienceYears} {data.experienceYears === 1 ? 'year' : 'years'} experience
                        </p>
                      )}

                      {/* Top Skills */}
                      {topSkills.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 justify-content-center mb-3">
                          {topSkills.map((skill, idx) => (
                            <Badge 
                              key={idx} 
                              bg="light" 
                              text="dark" 
                              className="px-2 py-1"
                              style={{ fontSize: '11px', fontWeight: '500' }}
                            >
                              {skill}
                            </Badge>
                          ))}
                          {skills.length > 3 && (
                            <Badge 
                              bg="secondary" 
                              className="px-2 py-1"
                              style={{ fontSize: '11px' }}
                            >
                              +{skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                        <Button variant="dark" size="sm" className="w-100">
                          {t('view_profile')}
                        </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-5">
            <Pagination>
              <Pagination.First 
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              />
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                
                // Show first page, last page, current page, and pages around current
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <Pagination.Item
                      key={pageNumber}
                      active={pageNumber === currentPage}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Pagination.Item>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return <Pagination.Ellipsis key={pageNumber} disabled />;
                }
                return null;
              })}
              
              <Pagination.Next 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last 
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}

        {/* CTA Section */}
        {!getCurrentUser() && (
          <div className="text-center mt-5 p-4 bg-light rounded">
            <h5 className="fw-bold mb-3">{t('want_create_profile') || 'Want to create your own profile?'}</h5>
            <p className="text-muted mb-3">
              {t('join_showcase_skills') || 'Join our community and showcase your skills to the world'}
            </p>
            <Button 
              variant="dark" 
              size="lg"
              onClick={() => setShowLoginModal(true)}
            >
              {t('get_started')}
            </Button>
          </div>
        )}
        
        <LoginModal 
          show={showLoginModal} 
          onHide={() => setShowLoginModal(false)}
          onSwitchToSignup={handleSwitchToSignup}
        />
        </main>
      </div>
    </div>
  );
}

export default Explore;
