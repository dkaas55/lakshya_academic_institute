import { useEffect, useState } from 'react'
import { ExternalLink, Smartphone, X, Monitor, Share } from 'lucide-react'
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

    const handleAppInstalled = () => {
      setIsStandalone(true)
      setDeferredPrompt(null)
      setShowHelpModal(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Do not show button if already running inside the installed standalone app
  if (isStandalone) {
    return null
  }

  const handleOpenInAppClick = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    // 1. Purge old caches in background so stale assets/manifests are removed
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys()
        await Promise.all(
          cacheKeys
            .filter((key) => key !== 'app-cache-v7')
            .map((key) => caches.delete(key))
        )
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const reg of regs) {
          await reg.update().catch(() => {})
        }
      }
    } catch (err) {
      console.warn('Cache purge notice:', err)
    }

    // 2. Trigger native install/open prompt if available
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        console.log('App prompt result:', choice?.outcome)
      } catch (err) {
        console.warn('App prompt failed or unavailable:', err)
        setShowHelpModal(true)
      } finally {
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
        onClick={handleOpenInAppClick}
        title={`Open ${BRANDING.shortName} in dedicated App mode`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-primary text-brand-surface border border-transparent dark:border-brand-border/60 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer select-none ${className}`}
      >
        <Smartphone size={14} className="shrink-0 text-current" />
        <span>Open in App</span>
        <ExternalLink size={12} className="shrink-0 opacity-80 text-current" />
      </button>

      {/* Fallback Open in App Help Modal */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-2xl max-w-sm w-full space-y-4 text-left animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <img src={BRANDING.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                <h3 className="font-bold text-sm text-brand-text">Open in {BRANDING.shortName} App</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowHelpModal(false)}
                className="text-brand-text-muted hover:text-brand-text p-1 rounded-lg hover:bg-brand-surface-tint cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-brand-text-muted leading-relaxed">
              Experience the fast, full-screen app with offline support on your device:
            </p>

            <div className="space-y-3 text-xs text-brand-text">
              <div className="p-3 rounded-xl bg-brand-surface-tint border border-brand-border/60 flex items-start gap-2.5">
                <Monitor size={18} className="text-brand-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-text">On Desktop (Chrome / Edge):</p>
                  <p className="text-brand-text-muted mt-0.5">
                    Click the <strong>App icon (🖥️ / 📥)</strong> in your address bar (top right), or click <strong>⋮ (Menu) → &quot;Install / Open in {BRANDING.shortName}&quot;</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-brand-surface-tint border border-brand-border/60 flex items-start gap-2.5">
                <Smartphone size={18} className="text-brand-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-text">On Android (Chrome):</p>
                  <p className="text-brand-text-muted mt-0.5">
                    Tap <strong>⋮ (Menu) → &quot;Install App&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong> to open in dedicated app window.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-brand-surface-tint border border-brand-border/60 flex items-start gap-2.5">
                <Share size={18} className="text-brand-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-text">On iPhone / iPad (Safari):</p>
                  <p className="text-brand-text-muted mt-0.5">
                    Tap the <strong>Share button</strong> at the bottom of Safari, scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-brand-primary text-brand-surface font-bold text-xs hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer text-center shadow-sm"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}

