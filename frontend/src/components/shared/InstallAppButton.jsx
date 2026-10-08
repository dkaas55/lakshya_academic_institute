import { useEffect, useState } from 'react'
import { Download, Smartphone, X, Monitor, Share } from 'lucide-react'
import { BRANDING } from '../../config/branding'

export default function InstallAppButton({ className = '' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  useEffect(() => {
    // Check if already running in standalone / installed PWA mode
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isApp) {
      setIsStandalone(true)
      return
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  // Do not show button if already installed and running as standalone app
  if (isStandalone) {
    return null
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else {
      // If native prompt is not yet ready or browser requires manual install (iOS/Desktop)
      setShowHelpModal(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title={`Install ${BRANDING.shortName} App on your phone/desktop`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-primary text-white shadow-sm hover:bg-brand-primary/90 transition-all cursor-pointer ${className}`}
      >
        <Smartphone size={14} className="shrink-0" />
        <span>Install App</span>
        <Download size={13} className="shrink-0 opacity-80" />
      </button>

      {/* Fallback Install Help Modal */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-2xl max-w-sm w-full space-y-4 text-left animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <img src={BRANDING.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                <h3 className="font-bold text-sm text-brand-text">Install {BRANDING.shortName}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowHelpModal(false)}
                className="text-brand-text-muted hover:text-brand-text p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-brand-text">
              <div className="p-3 rounded-xl bg-brand-surface-tint border border-brand-border/60 flex items-start gap-2.5">
                <Monitor size={18} className="text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-primary">On Desktop (Chrome / Edge):</p>
                  <p className="text-brand-text-muted mt-0.5">
                    Look for the <strong>Install App icon (🖥️ / 📥)</strong> in your browser's address bar (top right), or click <strong>⋮ (Menu) → &quot;Install {BRANDING.shortName}&quot;</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-brand-surface-tint border border-brand-border/60 flex items-start gap-2.5">
                <Share size={18} className="text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-primary">On iPhone / iPad (Safari):</p>
                  <p className="text-brand-text-muted mt-0.5">
                    Tap the <strong>Share button</strong> at the bottom of Safari, scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-brand-surface-tint border border-brand-border/60 flex items-start gap-2.5">
                <Smartphone size={18} className="text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-primary">On Android (Chrome):</p>
                  <p className="text-brand-text-muted mt-0.5">
                    Tap <strong>⋮ (Menu) → &quot;Install App&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-brand-primary text-white font-bold text-xs hover:bg-brand-primary/90 transition-all cursor-pointer text-center"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
