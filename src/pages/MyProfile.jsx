import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Button, Badge, InputGroup, FormControl, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { 
  getCurrentUserProfessionalProfile, 
  createProfessionalProfile, 
  updateProfessionalProfile,
  addExperience,
  addEducation,
  addSkill,
  addFeaturedItem,
  addActivityEntry,
  deleteExperience,
  deleteEducation,
  removeSkill,
  removeFeaturedItem,
  removeActivityEntry
} from '../services/professionalProfileManager';
import { getProfileAnalytics } from '../services/profileAnalytics';
import Sidebar from '../components/Sidebar';
import LoginModal from '../components/LoginModal';
import { fetchSocialProfile, SOCIAL_PROVIDERS } from '../services/socialSync';
import { generateAIProfileDraft, AI_TONES, AI_FOCUS_OPTIONS } from '../services/aiAssistant';
import { VIEW_MODES, PROFILE_PRESETS, VIEW_MODE_LABELS } from '../config/profileViewModes';
import './myprofile.css';

const APP_LINK_OPTIONS = [
  { id: 'linkedin', label: 'LinkedIn', icon: 'bi-linkedin', color: '#0a66c2', iconColor: '#ffffff', placeholder: 'https://www.linkedin.com/in/username' },
  { id: 'facebook', label: 'Facebook', icon: 'bi-facebook', color: '#1778f2', iconColor: '#ffffff', placeholder: 'https://www.facebook.com/username' },
  { id: 'instagram', label: 'Instagram', icon: 'bi-instagram', color: '#d62976', iconColor: '#ffffff', placeholder: 'https://www.instagram.com/username' },
  { id: 'tiktok', label: 'TikTok', icon: 'bi-tiktok', color: '#000000', iconColor: '#ffffff', placeholder: 'https://www.tiktok.com/@username' },
  { id: 'line', label: 'LINE', icon: 'bi-chat-dots-fill', color: '#06c755', iconColor: '#ffffff', placeholder: 'https://line.me/ti/p/your-id' },
  { id: 'youtube', label: 'YouTube', icon: 'bi-youtube', color: '#ff0000', iconColor: '#ffffff', placeholder: 'https://www.youtube.com/@channel' },
  { id: 'telegram', label: 'Telegram', icon: 'bi-telegram', color: '#229ed9', iconColor: '#ffffff', placeholder: 'https://t.me/username' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'bi-whatsapp', color: '#25d366', iconColor: '#ffffff', placeholder: 'https://wa.me/123456789' },
  { id: 'github', label: 'GitHub', icon: 'bi-github', color: '#24292e', iconColor: '#ffffff', placeholder: 'https://github.com/username' },
  { id: 'website', label: 'Website', icon: 'bi-globe', color: '#0f172a', iconColor: '#ffffff', placeholder: 'https://your-site.com' },
  { id: 'custom', label: 'Custom', icon: 'bi-link-45deg', color: '#475569', iconColor: '#ffffff', placeholder: 'https://your-link.com' }
];

const APP_LINK_MAP = APP_LINK_OPTIONS.reduce((acc, option) => {
  acc[option.id] = option;
  return acc;
}, {});


const normalizeContactLinks = (links = []) => {
  const timestamp = Date.now();
  return (links || []).map((link, index) => ({
    id: link.id || `contact-link-${timestamp}-${index}`,
    service: link.service || 'custom',
    url: link.url || ''
  }));
};

function MyProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showAddHighlight, setShowAddHighlight] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const highlightInitialState = {
    title: '',
    type: 'Project',
    description: '',
    url: '',
    cover: ''
  };
  const activityInitialState = {
    type: 'Update',
    title: '',
    description: '',
    icon: 'bi-activity'
  };
  const experienceInitialState = {
    position: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    bullets: ''
  };
  const educationInitialState = {
    school: '',
    degree: '',
    location: '',
    startDate: '',
    endDate: '',
    coursework: ''
  };
  const [highlightForm, setHighlightForm] = useState(highlightInitialState);
  const [activityForm, setActivityForm] = useState(activityInitialState);
  const [experienceForm, setExperienceForm] = useState(experienceInitialState);
  const [educationForm, setEducationForm] = useState(educationInitialState);
  const [skillsInput, setSkillsInput] = useState('');
  const [contactForm, setContactForm] = useState({ email: '', phone: '', address: '', tagline: '', links: [] });
  const [showBasicsModal, setShowBasicsModal] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState({ displayName: '', jobTitle: '', tagline: '', description: '' });
  const avatarInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);
  const [showSocialImport, setShowSocialImport] = useState(false);
  const [socialForm, setSocialForm] = useState({ provider: 'linkedin', handle: '' });
  const [socialPreview, setSocialPreview] = useState(null);
  const [socialStatus, setSocialStatus] = useState({ loading: false, error: '' });
  const [showAIBuild, setShowAIBuild] = useState(false);
  const [aiForm, setAiForm] = useState({ role: '', tone: 'professional', focus: 'job_search' });
  const [aiDraft, setAiDraft] = useState(null);
  const [aiStatus, setAiStatus] = useState({ loading: false, error: '' });
  // Removed unused smartToolsOpen state
  const [showPresetModal, setShowPresetModal] = useState(false);

  const setProfileFromRecord = (record) => {
    if (!record) return;
    setProfile({ ...record.data, username: record.username });
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile?.username) {
      setSocialForm(prev => ({ ...prev, handle: prev.handle || profile.username }));
    }
  }, [profile?.username]);

  const loadProfile = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      // Get or create professional profile for current user
      let professionalProfile = await getCurrentUserProfessionalProfile();
      if (!professionalProfile) {
        professionalProfile = await createProfessionalProfile(currentUser.username);
      }

      if (professionalProfile) {
        setProfileId(professionalProfile.id);
        setProfileFromRecord(professionalProfile);
        setContactForm({
          email: professionalProfile.data.contact?.email || '',
          phone: professionalProfile.data.contact?.phone || '',
          address: professionalProfile.data.contact?.address || '',
          tagline: professionalProfile.data.tagline || '',
          links: normalizeContactLinks(professionalProfile.data.contact?.links || [])
        });

        // Get analytics
        const analyticsData = await getProfileAnalytics(professionalProfile.id);
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Failed to load professional profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (avatarInputRef.current) avatarInputRef.current.click();
  };

  const handleCoverClick = () => {
    if (coverInputRef.current) coverInputRef.current.click();
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      if (type === 'avatar') {
        setProfile(prev => ({ ...prev, avatar: dataUrl }));
        if (profileId) {
          await updateProfessionalProfile(profileId, { avatar: dataUrl });
        }
      } else if (type === 'cover') {
        setProfile(prev => ({ ...prev, bgImage: dataUrl }));
        if (profileId) {
          await updateProfessionalProfile(profileId, { bgImage: dataUrl });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    navigate('/signup');
  };

  const handleShareProfile = () => {
    if (profile?.isPublic === false) {
      window.alert(t('profile_private_share_warning', { defaultValue: 'Switch your profile to public before sharing.' }));
      return;
    }
    if (typeof window === 'undefined') return;

    const profileUrl = getProfileUrl();

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: profile?.displayName || 'My Profile',
          text: profile?.jobTitle || 'Check out my professional profile',
          url: profileUrl
        })
        .catch(() => {});
      return;
    }

    setShowSharePanel(true);
  };

  const handleVisibilityChange = async (makePublic) => {
    if (!profileId || !profile || isUpdatingVisibility) return;
    const nextValue = !!makePublic;
    if ((profile.isPublic !== false) === nextValue) return;

    if (nextValue === false) {
      const confirmed = window.confirm(t('confirm_private_profile', { defaultValue: 'Hide this profile from public view?' }));
      if (!confirmed) return;
    }

    setIsUpdatingVisibility(true);
    const updated = await updateProfessionalProfile(profileId, { isPublic: nextValue });
    if (updated) {
      setProfileFromRecord(updated);
    }
    setIsUpdatingVisibility(false);
  };

  const handleViewModeChange = async (modeId) => {
    if (!profileId || !modeId) return;
    if (activeViewMode === modeId) return;
    const updated = await updateProfessionalProfile(profileId, { viewMode: modeId });
    if (updated) {
      setProfileFromRecord(updated);
    }
  };

  const handleApplyPreset = async (preset) => {
    if (!profileId || !preset) return;
    const updates = {
      profilePreset: preset.id,
      viewMode: preset.viewMode,
      coverColor: preset.color || profile.coverColor
    };
    if (!profile?.tagline) {
      updates.tagline = preset.defaultTagline;
    }
    if (!profile?.description) {
      updates.description = preset.defaultDescription;
    }
    const updated = await updateProfessionalProfile(profileId, updates);
    if (updated) {
      setProfileFromRecord(updated);
      if (updates.tagline) {
        setContactForm(prev => ({ ...prev, tagline: updates.tagline }));
      }
      setShowPresetModal(false);
    }
  };

  const getProfileUrl = () => {
    if (typeof window === 'undefined') return '';
    return profile?.username
      ? `${window.location.origin}/pro/${profile.username}`
      : window.location.href;
  };

  const handleSharePlatform = (platform) => {
    const profileUrl = getProfileUrl();
    const title = encodeURIComponent(profile?.displayName || 'Professional Profile');
    const text = encodeURIComponent(profile?.jobTitle || 'Check out this professional profile');
    const encodedUrl = encodeURIComponent(profileUrl);

    const shareUrl = platform.buildUrl({ url: encodedUrl, rawUrl: profileUrl, title, text });
    window.open(shareUrl, '_blank', 'noopener');
  };

  const handleCopyLink = () => {
    const profileUrl = getProfileUrl();
    if (!profileUrl) return;

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      navigator.clipboard
        .writeText(profileUrl)
        .then(() => {
          window.dispatchEvent(new CustomEvent('profile-link-copied'));
        })
        .catch(() => {
          window.prompt('Copy profile URL', profileUrl);
        });
    } else {
      window.prompt('Copy profile URL', profileUrl);
    }
  };

  const handleCloseSocialModal = () => {
    setShowSocialImport(false);
    setSocialPreview(null);
    setSocialStatus({ loading: false, error: '' });
    setSocialForm(prev => ({ ...prev, handle: profile?.username || '' }));
  };

  const handleCloseAIModal = () => {
    setShowAIBuild(false);
    setAiDraft(null);
    setAiStatus({ loading: false, error: '' });
  };

  const uniqueMergeList = (source = [], target = [], keyFn) => {
    const seen = new Set((target || []).map(item => keyFn(item)));
    const merged = [...(target || [])];
    (source || []).forEach(item => {
      const key = keyFn(item);
      if (!seen.has(key)) {
        seen.add(key);
        merged.unshift(item);
      }
    });
    return merged;
  };

  const handleSocialLookup = async (event) => {
    if (event) event.preventDefault();
    if (!socialForm.handle) {
      setSocialStatus({ loading: false, error: 'กรุณาใส่ชื่อผู้ใช้หรือ URL' });
      return;
    }
    setSocialPreview(null);
    setSocialStatus({ loading: true, error: '' });
    try {
      const data = await fetchSocialProfile(socialForm.provider, socialForm.handle);
      setSocialPreview(data);
    } catch (err) {
      setSocialPreview(null);
      setSocialStatus({ loading: false, error: err.message || 'ไม่สามารถเชื่อมต่อโซเชียลได้' });
      return;
    }
    setSocialStatus({ loading: false, error: '' });
  };

  const handleApplySocialPreview = async () => {
    if (!profileId || !socialPreview) return;
    const mergedExperience = uniqueMergeList(socialPreview.experience, profile.experience, (item = {}) => `${item.company}-${item.position}-${item.startDate}`);
    const mergedEducation = uniqueMergeList(socialPreview.education, profile.education, (item = {}) => `${item.school}-${item.degree}`);
    const mergedSkills = Array.from(new Set([...(profile.skills || []), ...(socialPreview.skills || [])]));
    const contactLinksFromSocial = (socialPreview.contact?.links || []).filter(link => link.url);
    const mergedLinks = uniqueMergeList(contactLinksFromSocial, profile.contact?.links || [], (link) => `${link.service}-${link.url}`);
    const updates = {
      displayName: socialPreview.displayName || profile.displayName,
      jobTitle: socialPreview.jobTitle || profile.jobTitle,
      tagline: socialPreview.tagline || profile.tagline,
      description: socialPreview.summary || profile.description,
      experience: mergedExperience,
      education: mergedEducation,
      skills: mergedSkills,
      contact: {
        email: socialPreview.contact?.email || profile.contact?.email || '',
        phone: socialPreview.contact?.phone || profile.contact?.phone || '',
        address: socialPreview.contact?.address || profile.contact?.address || '',
        links: mergedLinks
      }
    };
    const updated = await updateProfessionalProfile(profileId, updates);
    if (updated) {
      setProfileFromRecord(updated);
      setContactForm({
        email: updates.contact.email,
        phone: updates.contact.phone,
        address: updates.contact.address,
        tagline: updates.tagline || profile.tagline || '',
        links: normalizeContactLinks(updates.contact.links)
      });
      setSocialPreview(null);
      setSocialStatus({ loading: false, error: '' });
      setShowSocialImport(false);
    }
  };

  const handleGenerateAIDraft = async (event) => {
    if (event) event.preventDefault();
    if (!aiForm.role) {
      setAiStatus({ loading: false, error: 'ระบุตำแหน่งหรือบทบาทก่อน' });
      return;
    }
    setAiDraft(null);
    setAiStatus({ loading: true, error: '' });
    try {
      const draft = await generateAIProfileDraft({
        ...aiForm,
        existingSkills: profile?.skills || [],
        location: profile?.contact?.address || '',
        username: profile?.username || ''
      });
      setAiDraft(draft);
      setAiStatus({ loading: false, error: '' });
    } catch (err) {
      setAiStatus({ loading: false, error: err.message || 'สร้างข้อมูลด้วย AI ไม่สำเร็จ' });
    }
  };

  const handleApplyAIDraft = async () => {
    if (!profileId || !aiDraft) return;
    const mergedSkills = Array.from(new Set([...(aiDraft.skills || []), ...(profile.skills || [])]));
    const mergedExperience = uniqueMergeList(aiDraft.experience, profile.experience, (item = {}) => `${item.company}-${item.position}-${item.startDate}`);
    const mergedHighlights = uniqueMergeList(aiDraft.featuredItems, profile.featuredItems || profile.featured || [], (item = {}) => `${item.title}-${item.url}`);
    const updates = {
      displayName: aiDraft.displayName || profile.displayName,
      jobTitle: aiDraft.jobTitle || profile.jobTitle,
      tagline: aiDraft.tagline || profile.tagline,
      description: aiDraft.summary || profile.description,
      skills: mergedSkills,
      experience: mergedExperience,
      featuredItems: mergedHighlights,
      recentActivity: uniqueMergeList(aiDraft.recentActivity, profile.recentActivity || [], (item = {}) => `${item.title}-${item.timestamp}`)
    };
    const updated = await updateProfessionalProfile(profileId, updates);
    if (updated) {
      setProfileFromRecord(updated);
      setAiDraft(null);
      setAiStatus({ loading: false, error: '' });
      setShowAIBuild(false);
    }
  };

  const handleHighlightSubmit = async (event) => {
    event.preventDefault();
    if (!profileId) return;
    const updated = await addFeaturedItem(profileId, highlightForm);
    if (updated) {
      setProfileFromRecord(updated);
      setHighlightForm(highlightInitialState);
      setShowAddHighlight(false);
    }
  };

  const handleActivitySubmit = async (event) => {
    event.preventDefault();
    if (!profileId) return;
    const updated = await addActivityEntry(profileId, activityForm);
    if (updated) {
      setProfileFromRecord(updated);
      setActivityForm(activityInitialState);
      setShowAddActivity(false);
    }
  };

  const handleExperienceSubmit = async (event) => {
    event.preventDefault();
    if (!profileId) return;
    const payload = {
      ...experienceForm,
      bullets: experienceForm.bullets
        ? experienceForm.bullets.split('\n').map(item => item.trim()).filter(Boolean)
        : []
    };
    const updated = await addExperience(profileId, payload);
    if (updated) {
      setProfileFromRecord(updated);
      setExperienceForm(experienceInitialState);
      setShowAddExperience(false);
    }
  };

  const handleEducationSubmit = async (event) => {
    event.preventDefault();
    if (!profileId) return;
    const updated = await addEducation(profileId, educationForm);
    if (updated) {
      setProfileFromRecord(updated);
      setEducationForm(educationInitialState);
      setShowAddEducation(false);
    }
  };

  const handleSkillSubmit = async (event) => {
    event.preventDefault();
    if (!profileId || !skillsInput.trim()) return;
    const entries = skillsInput
      .split(/[,\n]/)
      .map(skill => skill.trim())
      .filter(Boolean);

    let updatedProfile = null;
    for (const skill of entries) {
      const result = await addSkill(profileId, skill);
      if (result) {
        updatedProfile = result;
      }
    }

    if (updatedProfile) {
      setProfileFromRecord(updatedProfile);
      setSkillsInput('');
      setShowAddSkill(false);
    }
  };

  const handleDeleteHighlight = async (itemId, fallbackIndex) => {
    if (!profileId) return;
    if (typeof window !== 'undefined' && !window.confirm(t('confirm_delete_highlight', { defaultValue: 'Remove this highlight?' }))) return;
    let updated = itemId ? await removeFeaturedItem(profileId, itemId) : null;
    if (!updated) {
      const nextItems = (profile.featuredItems || []).filter((_, idx) => idx !== fallbackIndex);
      updated = await updateProfessionalProfile(profileId, { featuredItems: nextItems });
    }
    if (updated) {
      setProfileFromRecord(updated);
    }
  };

  const handleDeleteActivity = async (entryId, fallbackIndex) => {
    if (!profileId) return;
    if (typeof window !== 'undefined' && !window.confirm(t('confirm_delete_activity', { defaultValue: 'Remove this activity entry?' }))) return;
    let updated = entryId ? await removeActivityEntry(profileId, entryId) : null;
    if (!updated) {
      const nextItems = (profile.recentActivity || []).filter((_, idx) => idx !== fallbackIndex);
      updated = await updateProfessionalProfile(profileId, { recentActivity: nextItems });
    }
    if (updated) {
      setProfileFromRecord(updated);
    }
  };

  const handleDeleteExperience = async (expId, fallbackIndex) => {
    if (!profileId) return;
    if (typeof window !== 'undefined' && !window.confirm(t('confirm_delete_experience', { defaultValue: 'Remove this experience?' }))) return;
    let updated = expId ? await deleteExperience(profileId, expId) : null;
    if (!updated) {
      const nextItems = (profile.experience || []).filter((_, idx) => idx !== fallbackIndex);
      updated = await updateProfessionalProfile(profileId, { experience: nextItems });
    }
    if (updated) {
      setProfileFromRecord(updated);
    }
  };

  const handleDeleteEducation = async (eduId, fallbackIndex) => {
    if (!profileId) return;
    if (typeof window !== 'undefined' && !window.confirm(t('confirm_delete_education', { defaultValue: 'Remove this education entry?' }))) return;
    let updated = eduId ? await deleteEducation(profileId, eduId) : null;
    if (!updated) {
      const nextItems = (profile.education || []).filter((_, idx) => idx !== fallbackIndex);
      updated = await updateProfessionalProfile(profileId, { education: nextItems });
    }
    if (updated) {
      setProfileFromRecord(updated);
    }
  };

  const handleDeleteSkill = async (skill) => {
    if (!profileId) return;
    const updated = await removeSkill(profileId, skill);
    if (updated) {
      setProfileFromRecord(updated);
    }
  };

  const handleAddContactLink = () => {
    setContactForm(prev => ({
      ...prev,
      links: [
        ...prev.links,
        {
          id: `contact-link-${Date.now()}`,
          service: APP_LINK_OPTIONS[0]?.id || 'custom',
          url: ''
        }
      ]
    }));
  };

  const handleContactLinkChange = (linkId, field, value) => {
    setContactForm(prev => ({
      ...prev,
      links: prev.links.map(link =>
        link.id === linkId ? { ...link, [field]: value } : link
      )
    }));
  };

  const handleRemoveContactLink = (linkId) => {
    setContactForm(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== linkId)
    }));
  };

  const openBasicsModal = () => {
    setBasicInfoForm({
      displayName: profile?.displayName || '',
      jobTitle: profile?.jobTitle || '',
      tagline: profile?.tagline || '',
      description: profile?.description || ''
    });
    setShowBasicsModal(true);
  };

  const handleBasicsSubmit = async (event) => {
    event.preventDefault();
    if (!profileId) return;
    const updates = {
      displayName: basicInfoForm.displayName?.trim() || '',
      jobTitle: basicInfoForm.jobTitle?.trim() || '',
      tagline: basicInfoForm.tagline?.trim() || '',
      description: basicInfoForm.description?.trim() || ''
    };
    const updated = await updateProfessionalProfile(profileId, updates);
    if (updated) {
      setProfileFromRecord(updated);
      setContactForm(prev => ({ ...prev, tagline: updates.tagline }));
      setShowBasicsModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-shell p-4">
        <div className="dashboard-card d-flex">
          <Sidebar />
          <main className="dashboard-main p-4">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </main>
        </div>
        <LoginModal
          show={showLoginModal}
          onHide={() => setShowLoginModal(false)}
          onSwitchToSignup={handleSwitchToSignup}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-shell p-4">
        <div className="dashboard-card d-flex">
          <Sidebar />
          <main className="dashboard-main p-4">
            <div className="text-center py-5 text-muted">
              <p>ไม่พบข้อมูล Profile — กรุณารัน SQL ใน Supabase ก่อน</p>
            </div>
          </main>
        </div>
        <LoginModal
          show={showLoginModal}
          onHide={() => setShowLoginModal(false)}
          onSwitchToSignup={handleSwitchToSignup}
        />
      </div>
    );
  }

  const experience = profile.experience || [];
  const education = profile.education || [];
  const skills = profile.skills || [];
  const featuredItems = profile.featuredItems || profile.featured || [];
  const recentActivity = profile.recentActivity || profile.activity || [];
  const contactLinks = (profile.contact?.links || [])
    .map(link => ({
      ...link,
      url: link.url?.trim()
    }))
    .filter(link => Boolean(link.url));
  const primaryLocation = profile.contact?.address || profile.location || '';
  const vheartLikes = profile.vheartLikes ?? profile.followers ?? 0;
  const vheartCount = (analytics?.uniqueViewers || 0) + vheartLikes;
  const selectedProvider = SOCIAL_PROVIDERS.find(item => item.id === socialForm.provider) || SOCIAL_PROVIDERS[0];
  const activeViewMode = profile.viewMode || 'standard';
  const activePresetId = profile.profilePreset || '';
  const activePreset = PROFILE_PRESETS.find(preset => preset.id === activePresetId) || null;

  const sharePlatforms = [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: 'bi-linkedin',
      color: '#0a66c2',
      buildUrl: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: 'bi-facebook',
      color: '#1778f2',
      buildUrl: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${url}`
    },
    {
      id: 'twitter',
      label: 'X / Twitter',
      icon: 'bi-twitter-x',
      color: '#000000',
      buildUrl: ({ url, text }) => `https://twitter.com/intent/tweet?url=${url}&text=${text}`
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: 'bi-whatsapp',
      color: '#25d366',
      buildUrl: ({ rawUrl, text }) => `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(rawUrl)}`
    },
    {
      id: 'email',
      label: 'Email',
      icon: 'bi-envelope-fill',
      color: '#d44638',
      buildUrl: ({ rawUrl, title }) => `mailto:?subject=${title}&body=${encodeURIComponent('Check out my profile: ' + rawUrl)}`
    }
  ];

  return (
    <div className="dashboard-shell p-4">
      <div className="dashboard-card d-flex">
        <Sidebar />

        <main className="dashboard-main p-4 d-flex justify-content-center">
          <Container className="linkedin-profile" style={{ maxWidth: '1200px', width: '100%' }}>
            {/* Header Card */}
            <Card className="profile-header-card border-0 shadow-sm mb-3">
              {/* Cover Photo */}
              <div 
                className="cover-photo position-relative"
                style={{
                  height: '200px',
                  background: profile.bgColor || profile.bgImage 
                    ? `url(${profile.bgImage}) center/cover` 
                    : 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
                  backgroundColor: profile.bgColor || '#f43f5e'
                }}
                onClick={handleCoverClick}
              >
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, 'cover')}
                />
                <div className="cover-actions">
                  <Button 
                    variant="light" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCoverClick()
                    }}
                    style={{ borderRadius: '8px' }}
                  >
                    <i className="bi bi-camera me-1"></i>
                    เพิ่มรูปภาพหน้าปก
                  </Button>
                </div>
              </div>

              <Card.Body className="profile-header-body">
                <div className="d-flex flex-column align-items-center text-center">
                  {/* Profile Photo */}
                  <div 
                    className="profile-photo-container position-relative"
                    style={{ cursor: 'pointer' }}
                    onClick={handleAvatarClick}
                  >
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileChange(e, 'avatar')}
                    />
                    <img
                      src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || 'User')}&background=0D47A1&color=fff&size=200`}
                      alt={profile.displayName}
                      className="profile-photo"
                    />
                    <div 
                      className="position-absolute bg-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        bottom: '5px',
                        right: '5px',
                        width: '40px',
                        height: '40px',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <i className="bi bi-camera-fill" style={{ fontSize: '18px', color: '#666' }}></i>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="mt-3">
                    <h2 className="profile-name mb-1">{profile.displayName || 'Your Name'}</h2>
                    
                    {profile.jobTitle && (
                      <p className="profile-headline mb-2">{profile.jobTitle}</p>
                    )}

                    {profile.tagline && (
                      <p className="profile-tagline text-muted mb-2">{profile.tagline}</p>
                    )}

                    <div className="profile-meta text-muted small">
                      {primaryLocation && (
                        <span className="me-3">
                          <i className="bi bi-geo-alt me-1"></i>
                          {primaryLocation}
                        </span>
                      )}
                      {analytics && (
                        <span className="me-3">
                          <i className="bi bi-eye me-1"></i>
                          {analytics.totalViews} profile views
                        </span>
                      )}
                      {profile.username && (
                        <span>
                          <i className="bi bi-link-45deg me-1"></i>
                          vere.me/{profile.username}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="profile-action-bar mt-3">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={openBasicsModal}
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        {t('edit_profile', { defaultValue: 'Edit Profile' })}
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => profile?.isPublic === false ? null : window.open(`/pro/${profile.username}`, '_blank')}
                        disabled={profile?.isPublic === false}
                      >
                        <i className="bi bi-eye me-1"></i>
                        {t('view_public_profile', { defaultValue: 'View Public Profile' })}
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={handleShareProfile}
                        disabled={profile?.isPublic === false}
                      >
                        <i className="bi bi-share me-1"></i>
                        {t('share', { defaultValue: 'Share' })}
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setShowAddContact(true)}
                      >
                        <i className="bi bi-person-lines-fill me-1"></i>
                        {t('add_contact', { defaultValue: 'Add contact' })}
                      </Button>
                    </div>

                    <div className="profile-vheart mt-3">
                      <div className="vheart-icon" aria-label="Vheart">
                        <i className="bi bi-heart-fill vheart-heart" aria-hidden="true"></i>
                        <span className="vheart-count">{vheartCount}</span>
                      </div>
                      <span className="vheart-label">Vheart</span>
                    </div>

                    {(profile.contact?.email || profile.contact?.phone || contactLinks.length > 0) && (
                      <div className="profile-contact-grid mt-3">
                        {profile.contact?.email && (
                          <div className="contact-field">
                            <small className="text-muted">Email</small>
                            <div className="contact-value">{profile.contact.email}</div>
                          </div>
                        )}
                        {profile.contact?.phone && (
                          <div className="contact-field">
                            <small className="text-muted">{t('phone', { defaultValue: 'Phone' })}</small>
                            <div className="contact-value">{profile.contact.phone}</div>
                          </div>
                        )}
                        {contactLinks.length > 0 && (
                          <div className="contact-field">
                            <div className="profile-app-links">
                              {contactLinks.map((link, index) => {
                                const config = APP_LINK_MAP[link.service] || APP_LINK_MAP.custom;
                                return (
                                  <button
                                    type="button"
                                    key={link.id || `${config.id}-${index}`}
                                    className="app-link-pill"
                                    style={{
                                      backgroundColor: config.color,
                                      color: config.iconColor || '#ffffff'
                                    }}
                                    onClick={() => window.open(link.url, '_blank', 'noopener')}
                                    title={config.label}
                                    aria-label={`${config.label} link`}
                                  >
                                    <i className={`bi ${config.icon}`}></i>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {showSharePanel && (
                      <div className="share-panel shadow-sm mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <h6 className="mb-0">{t('share_profile', { defaultValue: 'Share your profile' })}</h6>
                            <small className="text-muted">{t('share_profile_helper', { defaultValue: 'Copy your profile link or share directly to your favorite network.' })}</small>
                          </div>
                          <Button variant="light" size="sm" onClick={() => setShowSharePanel(false)}>
                            <i className="bi bi-x"></i>
                          </Button>
                        </div>

                        <InputGroup className="share-link-box mb-3">
                          <FormControl
                            readOnly
                            value={getProfileUrl()}
                            aria-label="Profile share link"
                          />
                          <Button variant="outline-secondary" onClick={handleCopyLink}>
                            <i className="bi bi-clipboard"></i>
                            <span className="ms-2">{t('copy_link', { defaultValue: 'Copy link' })}</span>
                          </Button>
                        </InputGroup>

                        <div className="share-options-grid">
                          {sharePlatforms.map((platform) => (
                            <button
                              key={platform.id}
                              type="button"
                              className="share-option"
                              onClick={() => handleSharePlatform(platform)}
                            >
                              <span
                                className="share-option-icon"
                                style={{ backgroundColor: platform.color }}
                              >
                                <i className={`bi ${platform.icon}`}></i>
                              </span>
                              <span className="share-option-label">{platform.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analytics Summary */}
                {analytics && (
                  <div className="analytics-bar mt-3 pt-3 border-top">
                    <Row className="text-center">
                      <Col xs={3}>
                        <div className="analytics-item">
                          <div className="analytics-value">{analytics.uniqueViewers}</div>
                          <div className="analytics-label">{t('unique_visitors')}</div>
                        </div>
                      </Col>
                      <Col xs={3}>
                        <div className="analytics-item">
                          <div className="analytics-value">{analytics.last7DaysViews}</div>
                          <div className="analytics-label">{t('last_7_days')}</div>
                        </div>
                      </Col>
                      <Col xs={3}>
                        <div className="analytics-item">
                          <div className="analytics-value">{skills.length}</div>
                          <div className="analytics-label">{t('skills')}</div>
                        </div>
                      </Col>
                      <Col xs={3}>
                        <div className="analytics-item">
                          <div className="analytics-value">{experience.length}</div>
                          <div className="analytics-label">{t('experience')}</div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Highlights Section */}
            <Card className="section-card border-0 shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="section-title mb-0">{t('highlights', { defaultValue: 'Highlights' })}</h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowAddHighlight(true)}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    {t('add_featured', { defaultValue: 'Add Featured' })}
                  </Button>
                </div>

                {featuredItems.length === 0 ? (
                  <div className="empty-state text-center py-4">
                    <i className="bi bi-bookmark-star display-4 text-muted"></i>
                    <p className="text-muted mt-2">
                      {t('no_featured_items', { defaultValue: 'Showcase links, projects, or media to highlight your best work.' })}
                    </p>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowAddHighlight(true)}
                    >
                      {t('add_your_first_featured', { defaultValue: 'Add Your First Highlight' })}
                    </Button>
                  </div>
                ) : (
                  <div className="highlights-grid">
                    {featuredItems.map((item, index) => (
                      <div key={item.id || index} className="highlight-card">
                        <button
                          type="button"
                          className="section-card-action"
                          aria-label={t('delete_highlight', { defaultValue: 'Delete highlight' })}
                          onClick={() => handleDeleteHighlight(item.id, index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                        {item.cover && (
                          <div 
                            className="highlight-cover"
                            style={{ backgroundImage: `url(${item.cover})` }}
                          />
                        )}
                        <div className="highlight-meta">
                          <div className="highlight-label text-uppercase small text-muted">{item.type || t('featured', { defaultValue: 'Featured' })}</div>
                          <h6 className="highlight-title mb-1">{item.title || t('untitled', { defaultValue: 'Untitled highlight' })}</h6>
                          {item.description && (
                            <p className="text-muted small mb-2">{item.description}</p>
                          )}
                          {item.url && (
                            <Button 
                              variant="link" 
                              size="sm"
                              className="p-0"
                              onClick={() => window.open(item.url, '_blank')}
                            >
                              {t('view', { defaultValue: 'View' })}
                              <i className="bi bi-box-arrow-up-right ms-1"></i>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Activity Section */}
            <Card className="section-card border-0 shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="section-title mb-0">{t('activity', { defaultValue: 'Activity' })}</h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowAddActivity(true)}
                  >
                    <i className="bi bi-pencil-square me-1"></i>
                    {t('share_update', { defaultValue: 'Share an update' })}
                  </Button>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="empty-state text-center py-4">
                    <i className="bi bi-activity display-4 text-muted"></i>
                    <p className="text-muted mt-2">
                      {t('no_activity_yet', { defaultValue: 'Post updates, articles, or comments to start building your activity feed.' })}
                    </p>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowAddActivity(true)}
                    >
                      {t('create_first_post', { defaultValue: 'Create your first post' })}
                    </Button>
                  </div>
                ) : (
                  <div className="activity-timeline">
                    {recentActivity.map((item, index) => (
                      <div key={item.id || index} className="activity-item position-relative">
                        <div className="activity-badge">
                          <i className="bi bi-dot"></i>
                          {item.type || t('update', { defaultValue: 'Update' })}
                        </div>
                        <div className="activity-content">
                          <div className="d-flex justify-content-between align-items-start">
                            <h6 className="activity-title mb-1">{item.title || item.summary || t('activity_item', { defaultValue: 'New activity' })}</h6>
                            {item.timestamp && (
                              <span className="activity-meta text-muted small">{item.timestamp}</span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-muted small mb-0">{item.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="section-card-action"
                          aria-label={t('delete_activity', { defaultValue: 'Delete activity' })}
                          onClick={() => handleDeleteActivity(item.id, index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* About Section */}
            {profile.description && (
              <Card className="section-card border-0 shadow-sm mb-3">
                <Card.Body>
                  <h5 className="section-title mb-3">{t('about')}</h5>
                  <div className={`about-text ${showFullAbout ? 'expanded' : 'collapsed'}`}>
                    {profile.description}
                  </div>
                  {profile.description.length > 200 && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 mt-2"
                      onClick={() => setShowFullAbout(!showFullAbout)}
                    >
                      {showFullAbout ? t('show_less') : t('show_more')}
                      <i className={`bi bi-chevron-${showFullAbout ? 'up' : 'down'} ms-1`}></i>
                    </Button>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Experience Section */}
            <Card className="section-card border-0 shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="section-title mb-0">{t('experience')}</h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowAddExperience(true)}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    {t('add_experience')}
                  </Button>
                </div>

                {experience.length === 0 ? (
                  <div className="empty-state text-center py-4">
                    <i className="bi bi-briefcase display-4 text-muted"></i>
                    <p className="text-muted mt-2">{t('no_experience')}</p>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowAddExperience(true)}
                    >
                      {t('add_your_first_experience')}
                    </Button>
                  </div>
                ) : (
                  <div className="experience-list">
                    {experience.map((exp, index) => (
                      <div key={exp.id || index} className="experience-item">
                        <div className="d-flex gap-3">
                          <div className="experience-icon">
                            <i className="bi bi-building"></i>
                          </div>
                          <div className="flex-grow-1 section-item-content">
                            <button
                              type="button"
                              className="section-card-action"
                              aria-label={t('delete_experience', { defaultValue: 'Delete experience' })}
                              onClick={() => handleDeleteExperience(exp.id, index)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                            <h6 className="experience-position mb-1">{exp.position}</h6>
                            <div className="experience-company mb-1">{exp.company}</div>
                            <div className="experience-meta text-muted small mb-2">
                              {exp.startDate} - {exp.endDate || 'Present'}
                              {exp.location && ` • ${exp.location}`}
                            </div>
                            {exp.description && (
                              <p className="experience-description small">{exp.description}</p>
                            )}
                            {exp.bullets && exp.bullets.length > 0 && (
                              <ul className="experience-bullets small">
                                {exp.bullets.map((bullet, idx) => (
                                  <li key={idx}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Education Section */}
            <Card className="section-card border-0 shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="section-title mb-0">{t('education')}</h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowAddEducation(true)}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    {t('add_education')}
                  </Button>
                </div>

                {education.length === 0 ? (
                  <div className="empty-state text-center py-4">
                    <i className="bi bi-mortarboard display-4 text-muted"></i>
                    <p className="text-muted mt-2">{t('no_education')}</p>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowAddEducation(true)}
                    >
                      {t('add_your_first_education')}
                    </Button>
                  </div>
                ) : (
                  <div className="education-list">
                    {education.map((edu, index) => (
                      <div key={edu.id || index} className="education-item">
                        <div className="d-flex gap-3">
                          <div className="education-icon">
                            <i className="bi bi-mortarboard"></i>
                          </div>
                          <div className="flex-grow-1 section-item-content">
                            <button
                              type="button"
                              className="section-card-action"
                              aria-label={t('delete_education', { defaultValue: 'Delete education entry' })}
                              onClick={() => handleDeleteEducation(edu.id, index)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                            <h6 className="education-school mb-1">{edu.school}</h6>
                            <div className="education-degree mb-1">{edu.degree}</div>
                            <div className="education-meta text-muted small mb-2">
                              {edu.startDate} - {edu.endDate}
                              {edu.location && ` • ${edu.location}`}
                            </div>
                            {edu.coursework && (
                              <p className="education-coursework small text-muted">
                                Coursework: {edu.coursework}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Skills Section */}
            <Card className="section-card border-0 shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="section-title mb-0">{t('skills')}</h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowAddSkill(true)}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    {t('add_skills')}
                  </Button>
                </div>

                {skills.length === 0 ? (
                  <div className="empty-state text-center py-4">
                    <i className="bi bi-star display-4 text-muted"></i>
                    <p className="text-muted mt-2">{t('no_skills')}</p>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowAddSkill(true)}
                    >
                      {t('add_your_first_skill')}
                    </Button>
                  </div>
                ) : (
                  <div className="skills-grid">
                    {skills.map((skill, index) => (
                      <Badge 
                        key={index}
                        bg="light"
                        text="dark"
                        className="skill-badge closable"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          className="skill-remove"
                          aria-label={t('delete_skill', { defaultValue: 'Delete skill' })}
                          onClick={() => handleDeleteSkill(skill)}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>
        </main>
      </div>

      {/* Highlight Modal */}
      <Modal
        show={showSocialImport}
        onHide={handleCloseSocialModal}
        centered
        dialogClassName="sheet-modal profile-modal social-modal"
      >
        <Form onSubmit={handleSocialLookup}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title>ดึงข้อมูลจากโซเชียล</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="social-hint">
              <i className="bi bi-magic"></i>
              <div>
                <strong>Sync once, reuse everywhere</strong>
                <p className="mb-0 text-muted small">ดึงข้อมูลตำแหน่ง งาน และไบโอล่าสุดจากแพลตฟอร์มที่ไว้ใจได้ แล้วเลือกสิ่งที่อยากอัปเดตในคลิกเดียว</p>
              </div>
            </div>
            <Row className="g-3">
              <Col md={5}>
                <Form.Label>แพลตฟอร์ม</Form.Label>
                <Form.Select
                  value={socialForm.provider}
                  onChange={(e) => {
                    setSocialForm(prev => ({ ...prev, provider: e.target.value }));
                    setSocialStatus({ loading: false, error: '' });
                    setSocialPreview(null);
                  }}
                >
                  {SOCIAL_PROVIDERS.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.label}
                    </option>
                  ))}
                </Form.Select>
                <small className="text-muted d-block mt-1">
                  {selectedProvider?.description}
                </small>
              </Col>
              <Col md={7}>
                <Form.Label>ชื่อผู้ใช้หรือ URL</Form.Label>
                <InputGroup>
                  <FormControl
                    value={socialForm.handle}
                    placeholder={selectedProvider?.placeholder || 'profile' }
                    onChange={(e) => {
                      setSocialForm(prev => ({ ...prev, handle: e.target.value }));
                      setSocialStatus({ loading: false, error: '' });
                    }}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={socialStatus.loading}
                  >
                    {socialStatus.loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-search"></i>
                    )}
                  </Button>
                </InputGroup>
              </Col>
            </Row>

            {socialStatus.error && (
              <div className="alert alert-danger mt-3" role="alert">
                {socialStatus.error}
              </div>
            )}

            {socialPreview && (
              <div className="social-preview-card mt-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{socialPreview.displayName}</h5>
                    <p className="mb-1 text-muted">{socialPreview.jobTitle}</p>
                    <small className="text-muted">{socialPreview.tagline}</small>
                  </div>
                  <Badge bg="light" text="dark" className="text-uppercase">
                    {socialPreview.provider}
                  </Badge>
                </div>

                <div className="social-preview-section mt-3">
                  <strong>สรุป</strong>
                  <p className="text-muted small mb-0">{socialPreview.summary}</p>
                </div>

                <div className="social-preview-section mt-3">
                  <strong>ทักษะ</strong>
                  <div className="ai-skill-pill-group">
                    {(socialPreview.skills || []).map((skill, idx) => (
                      <span key={idx} className="ai-skill-pill">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="social-preview-grid mt-3">
                  <div>
                    <strong>ประสบการณ์ล่าสุด</strong>
                    <ul className="social-preview-list">
                      {(socialPreview.experience || []).slice(0, 2).map((exp, idx) => (
                        <li key={idx}>
                          <div className="fw-semibold">{exp.position}</div>
                          <small className="text-muted">{exp.company}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>การศึกษา</strong>
                    <ul className="social-preview-list">
                      {(socialPreview.education || []).slice(0, 2).map((edu, idx) => (
                        <li key={idx}>
                          <div className="fw-semibold">{edu.school}</div>
                          <small className="text-muted">{edu.degree}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-between">
            <Button variant="link" onClick={handleCloseSocialModal}>
              ยกเลิก
            </Button>
            <Button
              variant="primary"
              disabled={!socialPreview}
              onClick={handleApplySocialPreview}
            >
              เพิ่มข้อมูลเข้าสู่โปรไฟล์
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showAIBuild}
        onHide={handleCloseAIModal}
        centered
        dialogClassName="sheet-modal ai-modal"
      >
        <Form onSubmit={handleGenerateAIDraft}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title>AI Draft Builder</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="ai-modal-hero">
              <div>
                <span className="ai-chip">
                  <i className="bi bi-stars me-1"></i>
                  VERE AI Copilot
                </span>
                <h4 className="mb-2">ให้ AI ช่วยเล่าเรื่องของคุณ</h4>
                <p className="mb-0">เลือกโทน เสียง และเป้าหมาย เราจะสรุปผลงานและประสบการณ์ให้พร้อมใช้ในไม่กี่วินาที</p>
              </div>
              <div className="ai-orb" aria-hidden="true"></div>
            </div>

            <Row className="g-3 mt-1 ai-modal-fields">
              <Col md={6}>
                <Form.Label>ตำแหน่ง/บทบาท</Form.Label>
                <Form.Control
                  value={aiForm.role}
                  placeholder="เช่น Product Marketing Lead"
                  onChange={(e) => setAiForm(prev => ({ ...prev, role: e.target.value }))}
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Label>โทนเสียง</Form.Label>
                <Form.Select
                  value={aiForm.tone}
                  onChange={(e) => setAiForm(prev => ({ ...prev, tone: e.target.value }))}
                >
                  {AI_TONES.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label>เป้าหมาย</Form.Label>
                <Form.Select
                  value={aiForm.focus}
                  onChange={(e) => setAiForm(prev => ({ ...prev, focus: e.target.value }))}
                >
                  {AI_FOCUS_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            {aiStatus.error && (
              <div className="alert alert-danger mt-3" role="alert">
                {aiStatus.error}
              </div>
            )}

            <div className="d-flex justify-content-end mt-3">
              <Button type="submit" variant="primary" disabled={aiStatus.loading}>
                {aiStatus.loading ? 'กำลังสร้าง...' : 'สร้างร่างโปรไฟล์'}
              </Button>
            </div>

            {aiDraft && (
              <div className="ai-draft-card mt-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{aiDraft.displayName}</h5>
                    <p className="text-muted mb-1">{aiDraft.jobTitle}</p>
                    <small className="text-muted">{aiDraft.tagline}</small>
                  </div>
                  <Badge bg="light" text="dark">AI</Badge>
                </div>

                <div className="ai-draft-section mt-3">
                  <strong>สรุป</strong>
                  <p className="text-muted small mb-0">{aiDraft.summary}</p>
                </div>

                <div className="ai-draft-section mt-3">
                  <strong>ทักษะที่แนะนำ</strong>
                  <div className="ai-skill-pill-group">
                    {(aiDraft.skills || []).map((skill, idx) => (
                      <span key={idx} className="ai-skill-pill">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="ai-draft-section mt-3">
                  <strong>ประสบการณ์</strong>
                  <ul className="ai-draft-list">
                    {(aiDraft.experience || []).map((exp, idx) => (
                      <li key={idx}>
                        <span className="fw-semibold">{exp.position}</span>
                        <small className="text-muted d-block">{exp.company} • {exp.startDate} - {exp.endDate || 'ปัจจุบัน'}</small>
                        <small className="text-muted">{exp.description}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-between">
            <Button variant="link" onClick={handleCloseAIModal}>
              ปิด
            </Button>
            <Button
              variant="primary"
              disabled={!aiDraft}
              onClick={handleApplyAIDraft}
            >
              ใช้ร่าง AI กับโปรไฟล์
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Highlight Modal */}
      <Modal
        show={showAddHighlight}
        onHide={() => setShowAddHighlight(false)}
        centered
        dialogClassName="spotlight-modal"
      >
        <Form onSubmit={handleHighlightSubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title>{t('add_featured', { defaultValue: 'Add Highlight' })}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t('title', { defaultValue: 'Title' })}</Form.Label>
              <Form.Control
                value={highlightForm.title}
                onChange={(e) => setHighlightForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('highlight_title_placeholder', { defaultValue: 'e.g. Product launch, keynote, case study' })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('type', { defaultValue: 'Type' })}</Form.Label>
              <Form.Select
                value={highlightForm.type}
                onChange={(e) => setHighlightForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="Project">Project</option>
                <option value="Article">Article</option>
                <option value="Media">Media</option>
                <option value="Award">Award</option>
                <option value="Presentation">Presentation</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('description', { defaultValue: 'Description' })}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={highlightForm.description}
                onChange={(e) => setHighlightForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('highlight_description_placeholder', { defaultValue: 'Why is this highlight memorable?' })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL</Form.Label>
              <Form.Control
                type="url"
                value={highlightForm.url}
                onChange={(e) => setHighlightForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t('cover_image', { defaultValue: 'Cover image URL' })}</Form.Label>
              <Form.Control
                type="url"
                value={highlightForm.cover}
                onChange={(e) => setHighlightForm(prev => ({ ...prev, cover: e.target.value }))}
                placeholder={t('optional', { defaultValue: 'Optional' })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-between">
            <Button variant="link" onClick={() => setShowAddHighlight(false)}>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" variant="primary">
              {t('save_highlight', { defaultValue: 'Save highlight' })}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Activity Modal */}
      <Modal
        show={showAddActivity}
        onHide={() => setShowAddActivity(false)}
        centered
        dialogClassName="spotlight-modal"
      >
        <Form onSubmit={handleActivitySubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title>{t('share_update', { defaultValue: 'Share an update' })}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t('type', { defaultValue: 'Type' })}</Form.Label>
              <Form.Select
                value={activityForm.type}
                onChange={(e) => setActivityForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="Update">Update</option>
                <option value="Launch">Launch</option>
                <option value="Announcement">Announcement</option>
                <option value="Achievement">Achievement</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('title', { defaultValue: 'Title' })}</Form.Label>
              <Form.Control
                value={activityForm.title}
                onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('activity_title_placeholder', { defaultValue: 'Share the headline' })}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t('description', { defaultValue: 'Description' })}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={activityForm.description}
                onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('activity_description_placeholder', { defaultValue: 'Add more context or a link' })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-between">
            <Button variant="link" onClick={() => setShowAddActivity(false)}>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" variant="primary">
              {t('post_update', { defaultValue: 'Post update' })}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Experience Modal */}
      <Modal
        show={showAddExperience}
        onHide={() => setShowAddExperience(false)}
        centered
        dialogClassName="sheet-modal"
      >
        <Form onSubmit={handleExperienceSubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title>{t('add_experience', { defaultValue: 'Add Experience' })}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t('position', { defaultValue: 'Position' })}</Form.Label>
              <Form.Control
                value={experienceForm.position}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, position: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('company', { defaultValue: 'Company' })}</Form.Label>
              <Form.Control
                value={experienceForm.company}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, company: e.target.value }))}
                required
              />
            </Form.Group>
            <Row className="mb-3">
              <Col>
                <Form.Label>{t('start_date', { defaultValue: 'Start date' })}</Form.Label>
                <Form.Control
                  type="month"
                  value={experienceForm.startDate}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </Col>
              <Col>
                <Form.Label>{t('end_date', { defaultValue: 'End date' })}</Form.Label>
                <Form.Control
                  type="month"
                  value={experienceForm.endDate}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>{t('location', { defaultValue: 'Location' })}</Form.Label>
              <Form.Control
                value={experienceForm.location}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('description', { defaultValue: 'Description' })}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={experienceForm.description}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t('key_results', { defaultValue: 'Key achievements (one per line)' })}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={experienceForm.bullets}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, bullets: e.target.value }))}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-between">
            <Button variant="link" onClick={() => setShowAddExperience(false)}>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" variant="primary">
              {t('save', { defaultValue: 'Save' })}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Education Modal */}
      <Modal
        show={showAddEducation}
        onHide={() => setShowAddEducation(false)}
        centered
        dialogClassName="sheet-modal"
      >
        <Form onSubmit={handleEducationSubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title>{t('add_education', { defaultValue: 'Add Education' })}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t('school', { defaultValue: 'School' })}</Form.Label>
              <Form.Control
                value={educationForm.school}
                onChange={(e) => setEducationForm(prev => ({ ...prev, school: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('degree', { defaultValue: 'Degree' })}</Form.Label>
              <Form.Control
                value={educationForm.degree}
                onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
              />
            </Form.Group>
            <Row className="mb-3">
              <Col>
                <Form.Label>{t('start_date', { defaultValue: 'Start date' })}</Form.Label>
                <Form.Control
                  type="month"
                  value={educationForm.startDate}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </Col>
              <Col>
                <Form.Label>{t('end_date', { defaultValue: 'End date' })}</Form.Label>
                <Form.Control
                  type="month"
                  value={educationForm.endDate}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </Col>
            </Row>
            <Form.Group>
              <Form.Label>{t('coursework', { defaultValue: 'Focus / coursework' })}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={educationForm.coursework}
                onChange={(e) => setEducationForm(prev => ({ ...prev, coursework: e.target.value }))}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-between">
            <Button variant="link" onClick={() => setShowAddEducation(false)}>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" variant="primary">
              {t('save', { defaultValue: 'Save' })}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Basic Info Modal */}
      <Modal
        show={showBasicsModal}
        onHide={() => setShowBasicsModal(false)}
        centered
        size="lg"
        dialogClassName="sheet-modal profile-edit-modal"
      >
        <Form onSubmit={handleBasicsSubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title>{t('edit_profile', { defaultValue: 'Edit Profile' })}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Profile Visibility Toggle */}
            <div className="mb-4 p-3" style={{ 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '12px',
              border: '1px solid #dee2e6'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1 fw-bold">Profile Visibility</h6>
                  <small className="text-muted">เลือกว่าโปรไฟล์ของคุณจะเปิดเผยต่อสาธารณะหรือไม่</small>
                </div>
                <div className="visibility-floating-controls compact">
                  <button
                    type="button"
                    className={`visibility-toggle-btn ${profile?.isPublic === false ? '' : 'active'}`}
                    title={t('make_public', { defaultValue: 'Make profile public' })}
                    aria-pressed={profile?.isPublic !== false}
                    disabled={isUpdatingVisibility || profile?.isPublic !== false}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVisibilityChange(true)
                    }}
                  >
                    <i className="bi bi-globe"></i>
                    <span>{t('public', { defaultValue: 'Public' })}</span>
                  </button>
                  <button
                    type="button"
                    className={`visibility-toggle-btn ${profile?.isPublic === false ? 'active' : ''}`}
                    title={t('make_private', { defaultValue: 'Hide profile (private)' })}
                    aria-pressed={profile?.isPublic === false}
                    disabled={isUpdatingVisibility || profile?.isPublic === false}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVisibilityChange(false)
                    }}
                  >
                    <i className="bi bi-lock-fill"></i>
                    <span>{t('private', { defaultValue: 'Private' })}</span>
                  </button>
                </div>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>{t('display_name', { defaultValue: 'Display name' })}</Form.Label>
              <Form.Control
                value={basicInfoForm.displayName}
                onChange={(e) => setBasicInfoForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder={t('display_name_placeholder', { defaultValue: 'e.g. Jane Doe' })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('job_title', { defaultValue: 'Headline / role' })}</Form.Label>
              <Form.Control
                value={basicInfoForm.jobTitle}
                onChange={(e) => setBasicInfoForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder={t('job_title_placeholder', { defaultValue: 'e.g. Senior Product Strategist' })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('tagline', { defaultValue: 'Tagline' })}</Form.Label>
              <Form.Control
                value={basicInfoForm.tagline}
                onChange={(e) => setBasicInfoForm(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder={t('tagline_placeholder', { defaultValue: 'Short punchy intro' })}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>{t('about', { defaultValue: 'About / description' })}</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={basicInfoForm.description}
                onChange={(e) => setBasicInfoForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('about_placeholder', { defaultValue: 'Tell people what you do, wins you are proud of, or what you are building next.' })}
              />
            </Form.Group>

            {/* VIEW MODE Section */}
            <div className="mb-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="mb-1 fw-bold">VIEW MODE</h6>
                  <small className="text-muted">เลือก layout ที่สอดคล้องกับจุดประสงค์ของหน้าคุณ</small>
                </div>
                <Button variant="outline-secondary" size="sm" onClick={() => setShowPresetModal(true)}>
                  <i className="bi bi-magic me-1"></i>
                  เลือก Preset
                </Button>
              </div>
              <div className="row g-2">
                {VIEW_MODES.map(mode => (
                  <div key={mode.id} className="col-4">
                    <button
                      type="button"
                      className={`w-100 p-3 border-0 rounded text-start shadow-sm ${activeViewMode === mode.id ? 'bg-primary text-white' : 'bg-white'}`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '110px' }}
                      onClick={() => handleViewModeChange(mode.id)}
                    >
                      <div className="d-flex align-items-start mb-2">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center me-2"
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            backgroundColor: activeViewMode === mode.id ? 'rgba(255,255,255,0.3)' : '#0d6efd',
                            color: 'white',
                            flexShrink: 0
                          }}
                        >
                          <i className={`bi ${mode.icon}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold mb-1" style={{ fontSize: '13px' }}>{mode.label}</div>
                          <Badge 
                            bg={activeViewMode === mode.id ? 'light' : 'primary'} 
                            text={activeViewMode === mode.id ? 'dark' : 'white'}
                            style={{ fontSize: '10px' }}
                          >
                            {mode.badge}
                          </Badge>
                        </div>
                      </div>
                      <p className={`mb-0 ${activeViewMode === mode.id ? 'text-white' : 'text-muted'}`} style={{ fontSize: '11px', opacity: activeViewMode === mode.id ? 0.9 : 1 }}>
                        {mode.description}
                      </p>
                      {activePreset && activeViewMode === mode.id && (
                        <Badge bg="light" text="primary" className="mt-2" style={{ fontSize: '10px' }}>
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Preset: {activePreset.title}
                        </Badge>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SMART ASSISTANTS Section */}
            <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="mb-1 fw-bold">SMART ASSISTANTS</h6>
                  <small className="text-muted">Automate profile updates & exports</small>
                </div>
                <Badge bg="primary" style={{ fontSize: '11px' }}>Beta</Badge>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="bg-white rounded shadow-sm p-3 h-100 border-0">
                    <div className="d-flex align-items-start mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ width: '40px', height: '40px', backgroundColor: '#e7f3ff', color: '#0d6efd', flexShrink: 0 }}
                      >
                        <i className="bi bi-cloud-arrow-down" style={{ fontSize: '18px' }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-1 fw-semibold">Import from social</h6>
                          <Badge bg="primary" pill style={{ fontSize: '10px' }}>Sync</Badge>
                        </div>
                        <p className="text-muted mb-2" style={{ fontSize: '12px' }}>
                          Pull the latest roles, links, and bio from LinkedIn, Twitter, or Medium in one click.
                        </p>
                        <small className="text-muted d-block mb-3" style={{ fontSize: '11px' }}>Best for quick refreshes before sharing your profile.</small>
                        <Button variant="outline-primary" size="sm" className="w-100" onClick={() => setShowSocialImport(true)}>
                          <i className="bi bi-cloud-arrow-down me-1"></i>
                          Start import
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="rounded shadow-sm p-3 h-100 border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <div className="d-flex align-items-start mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.3)', color: 'white', flexShrink: 0 }}
                      >
                        <i className="bi bi-stars" style={{ fontSize: '18px' }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-1 fw-semibold">AI Draft Builder</h6>
                          <Badge bg="light" text="dark" pill style={{ fontSize: '10px' }}>AI</Badge>
                        </div>
                        <p className="mb-2" style={{ opacity: 0.95, fontSize: '12px' }}>
                          Let our AI summarize your wins, write highlights, and suggest sections instantly.
                        </p>
                        <small className="d-block mb-3" style={{ opacity: 0.85, fontSize: '11px' }}>Great for brand-new profiles or major rewrites.</small>
                        <Button variant="light" size="sm" className="w-100" onClick={() => setShowAIBuild(true)}>
                          <i className="bi bi-stars me-1"></i>
                          Launch builder
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <small className="text-muted d-block mt-3 text-center" style={{ fontSize: '11px' }}>
                <i className="bi bi-info-circle me-1"></i>
                Use these assistants to sync profile data instantly.
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-between">
            <Button variant="link" onClick={() => setShowBasicsModal(false)}>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" variant="primary">
              {t('save_changes', { defaultValue: 'Save changes' })}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Skills Modal */}
      <Modal
        show={showAddSkill}
        onHide={() => setShowAddSkill(false)}
        centered
        dialogClassName="mini-modal"
      >
        <Form onSubmit={handleSkillSubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title>{t('add_skills', { defaultValue: 'Add skills' })}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted small mb-2">
              {t('skills_helper', { defaultValue: 'Type multiple skills separated by commas or new lines.' })}
            </p>
            <Form.Control
              as="textarea"
              rows={3}
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Product Strategy, Storytelling, UX Research"
              required
            />
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-between">
            <Button variant="link" onClick={() => setShowAddSkill(false)}>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" variant="primary">
              {t('add_skills', { defaultValue: 'Add skills' })}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Contact Modal */}
      <Modal
        show={showAddContact}
        onHide={() => setShowAddContact(false)}
        centered
        dialogClassName="sheet-modal profile-modal contact-modal"
      >
        <Form onSubmit={async (e) => {
          e.preventDefault();
          if (!profileId) return;
          const formattedLinks = (contactForm.links || [])
            .map(link => ({
              id: link.id || `contact-link-${Date.now()}`,
              service: link.service || 'custom',
              url: link.url?.trim()
            }))
            .filter(link => Boolean(link.url));
          const updates = {
            contact: {
              email: contactForm.email,
              phone: contactForm.phone,
              address: contactForm.address,
              links: formattedLinks
            },
            tagline: contactForm.tagline
          };
          const updated = await updateProfessionalProfile(profileId, updates);
          if (updated) {
            setProfileFromRecord(updated);
            setContactForm({
              email: updated.data.contact?.email || '',
              phone: updated.data.contact?.phone || '',
              address: updated.data.contact?.address || '',
              tagline: updated.data.tagline || '',
              links: normalizeContactLinks(updated.data.contact?.links || [])
            });
            setShowAddContact(false);
          }
        }}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title>{t('contact_card', { defaultValue: 'Contact card' })}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="modal-subtitle">
              {t('contact_card_helper', { defaultValue: 'Keep your preferred channels tidy so collaborators can reach you anywhere.' })}
            </p>
            <Form.Group className="mb-3">
              <Form.Label>{t('tagline', { defaultValue: 'Tagline' })}</Form.Label>
              <Form.Control
                value={contactForm.tagline}
                onChange={(e) => setContactForm(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder={t('tagline_placeholder', { defaultValue: 'e.g. Product strategist obsessed with community-led growth' })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('phone', { defaultValue: 'Phone' })}</Form.Label>
              <Form.Control
                value={contactForm.phone}
                onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t('address', { defaultValue: 'Address / Location' })}</Form.Label>
              <Form.Control
                value={contactForm.address}
                onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>{t('app_links', { defaultValue: 'App links' })}</Form.Label>
              <div className="contact-links-editor">
                {contactForm.links.length === 0 && (
                  <p className="text-muted small mb-2">
                    {t('app_links_helper', { defaultValue: 'Add links to other apps so people can reach you anywhere.' })}
                  </p>
                )}
                {contactForm.links.map((link) => {
                  const linkOption = APP_LINK_MAP[link.service] || APP_LINK_MAP.custom;
                  return (
                    <div className="contact-link-row" key={link.id}>
                      <Form.Select
                        value={link.service}
                        onChange={(e) => handleContactLinkChange(link.id, 'service', e.target.value)}
                      >
                        {APP_LINK_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control
                        type="url"
                        value={link.url}
                        placeholder={linkOption.placeholder}
                        onChange={(e) => handleContactLinkChange(link.id, 'url', e.target.value)}
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        type="button"
                        aria-label={t('delete_link', { defaultValue: 'Delete link' })}
                        onClick={() => handleRemoveContactLink(link.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleAddContactLink}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  {t('add_link', { defaultValue: 'Add link' })}
                </Button>
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 d-flex justify-content-between">
            <Button variant="link" onClick={() => setShowAddContact(false)}>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" variant="primary">
              {t('save_contact', { defaultValue: 'Save contact card' })}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Preset Modal */}
      <Modal
        show={showPresetModal}
        onHide={() => setShowPresetModal(false)}
        centered
        dialogClassName="sheet-modal profile-modal preset-modal"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title>เลือก Preset ให้โปรไฟล์</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="modal-subtitle">
            ปรับโทนและ layout ให้เหมาะกับ Use-case ทันที พร้อมตั้ง view mode อัตโนมัติ
          </p>
          <div className="preset-grid">
            {PROFILE_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className={`preset-card ${activePresetId === preset.id ? 'active' : ''}`}
              >
                <div className="preset-card-icon" style={{ backgroundColor: preset.color }}>
                  <i className={`bi ${preset.icon}`}></i>
                </div>
                <div className="preset-card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <h5 className="mb-0">{preset.title}</h5>
                      <small className="text-muted">View mode: {VIEW_MODE_LABELS[preset.viewMode] || preset.viewMode}</small>
                    </div>
                    <Badge bg="light" text="dark">{preset.badge}</Badge>
                  </div>
                  <p className="text-muted small mb-3">{preset.description}</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <Button
                      variant={activePresetId === preset.id ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleApplyPreset(preset)}
                    >
                      {activePresetId === preset.id ? 'Preset กำลังใช้งาน' : 'ใช้ preset นี้'}
                    </Button>
                    {activePresetId === preset.id && (
                      <span className="text-primary small">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        กำลังใช้อยู่
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="link" onClick={() => setShowPresetModal(false)}>
            ปิดหน้าต่าง
          </Button>
        </Modal.Footer>
      </Modal>

      <LoginModal 
        show={showLoginModal} 
        onHide={() => setShowLoginModal(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </div>
  );
}

export default MyProfile;
