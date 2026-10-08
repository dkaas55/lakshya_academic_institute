/**
 * branding.js
 *
 * Centralized dynamic branding & terminology configuration.
 * Configured via Vite environment variables (.env) or uses sensible defaults.
 *
 * Supported environment variables:
 * - VITE_APP_NAME: Full name (e.g., "Lakshya Academic Institute" or "St. Xavier's High School")
 * - VITE_APP_SHORT_NAME: Short name for sidebars (e.g., "Lakshya Academy" or "St. Xavier's")
 * - VITE_APP_TAGLINE: Slogan on receipts & login (e.g., "Excellence in Education")
 * - VITE_APP_LOGO_URL: Path or URL to the logo (defaults to "/logo.png")
 * - VITE_APP_MODE: "school" or "institute" (defaults to "institute")
 */

const mode = (import.meta.env.VITE_APP_MODE || 'institute').toLowerCase().trim();
const isSchool = mode === 'school';

export const BRANDING = {
  name: import.meta.env.VITE_APP_NAME || 'Happy English School',
  shortName: import.meta.env.VITE_APP_SHORT_NAME || 'Happy English',
  tagline: import.meta.env.VITE_APP_TAGLINE || 'Excellence in Education',
  logoUrl: import.meta.env.VITE_APP_LOGO_URL || '/hes_images.png',
  mode,
  isSchool,

  // Terminology helpers based on mode
  batchLabel: isSchool ? 'Class' : 'Batch',
  batchesLabel: isSchool ? 'Classes' : 'Batches',
  batchSectionLabel: isSchool ? 'Class & Section' : 'Batch',
  batchesNavLabel: isSchool ? 'Classes' : 'Batches',
  batchManagementLabel: isSchool ? 'Class Management' : 'Batch Management',
  createBatchLabel: isSchool ? 'Create Class' : 'Create Batch',
  editBatchLabel: isSchool ? 'Edit Class' : 'Edit Batch',
  batchNameLabel: isSchool ? 'Class Name' : 'Batch Name',
  batchDetailsLabel: isSchool ? 'Class Details' : 'Batch Details',
  assignedBatchesLabel: isSchool ? 'Assigned Classes' : 'Assigned Batches',
  allBatchesLabel: isSchool ? 'All Classes' : 'All Batches',
};

/**
 * Initializes browser document title, metadata, Service Worker, and PWA manifest.
 */
export function initBranding() {
  if (typeof document === 'undefined') return;

  document.title = BRANDING.name;

  const favicon = document.querySelector("link[rel*='icon']");
  if (favicon && BRANDING.logoUrl) {
    favicon.href = BRANDING.logoUrl;
  }

  const appleIcon = document.querySelector("link[rel='apple-touch-icon']");
  if (appleIcon && BRANDING.logoUrl) {
    appleIcon.href = BRANDING.logoUrl;
  }

  // Register Service Worker for PWA installability and offline support
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    const registerSW = () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
        .catch((err) => console.warn('PWA Service Worker registration failed:', err));
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  }
}

export default BRANDING;
