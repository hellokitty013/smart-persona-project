import html2pdf from 'html2pdf.js';

const PAGE_WIDTH = 595.28; // A4 width pt
const PAGE_MARGIN = 48;
const LINE_HEIGHT = 18;

// Removed unused ensureSpace

// Removed unused addSectionHeading, addParagraph, addList

export const generateCvPdf = async (profile, options = {}) => {
  if (typeof window === 'undefined') {
    throw new Error('PDF export ใช้ได้ในเบราว์เซอร์เท่านั้น');
  }
  // Target only the white resume card, not the background wrapper
  const element = document.getElementById('resume-pdf-target') || document.querySelector('.preview-stage');
  if (!element) throw new Error('ไม่พบ preview สำหรับ export');

  // Temporarily reset transform so html2canvas captures full size
  const prevTransform = element.style.transform;
  const prevBorderRadius = element.style.borderRadius;
  const prevBoxShadow = element.style.boxShadow;
  element.style.transform = 'scale(1)';
  element.style.borderRadius = '0';
  element.style.boxShadow = 'none';

  const opt = {
    margin: 0,
    filename: options.filename || `${profile.username || 'profile'}-cv.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };
  await html2pdf().set(opt).from(element).save();

  // Restore styles
  element.style.transform = prevTransform;
  element.style.borderRadius = prevBorderRadius;
  element.style.boxShadow = prevBoxShadow;

  return opt.filename;
};
