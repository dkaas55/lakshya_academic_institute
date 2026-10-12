import { useEffect, useState } from 'react'
import { ExternalLink, Smartphone, X, Monitor, Share, Download } from 'lucide-react'
import { BRANDING } from '../../config/branding'

export default function InstallAppButton({ className = '' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Device detection
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '')
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent || '')
  const isDesktop = !isAndroid && !isIOS

  useEffect(() => {
    // Check if already running inside standalone installed PWA or app window
    const checkIsStandalone = () => {
      if (typeof window === 'undefined') return false
      const urlParams = new URLSearchParams(window.location.search)
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.navigator.standalone === true ||
        window.name === 'LakshyaAppWindow' ||
        urlParams.get('mode') === 'standalone'
      )
    }

    if (checkIsStandalone()) {
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

  // Do not render button if already running inside the installed app
  if (isStandalone) {
    return null
  }

  // Opens the installed PWA on Desktop via Chrome Navigation Capturing
  // (Uses semantic link without popup window features so Chrome routes directly to the installed PWA)
  const launchDesktopApp = () => {
    try {
      const link = document.createElement('a')
      link.href = window.location.href
      link.target = '_blank'
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setShowHelpModal(false)
      return true
    } catch (err) {
      console.warn('Desktop PWA launch failed:', err)
      return false
    }
  }

  // Launches the installed PWA on Android via intent
  const launchAndroidIntent = () => {
    try {
      const cleanHostAndPath = window.location.href.replace(/^https?:\/\//, '')
      const protocol = window.location.protocol.replace(':', '')
      const fallbackUrl = encodeURIComponent(window.location.href)
      const intentUrl = `intent://${cleanHostAndPath}#Intent;scheme=${protocol};package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end;`

      const link = document.createElement('a')
      link.href = intentUrl
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setShowHelpModal(false)
      return true
    } catch (err) {
      console.warn('Android intent launch failed:', err)
      return false
    }
  }

  // Prompts native browser install
  const handleNativeInstall = async () => {
    if (!deferredPrompt) return false
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice?.outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowHelpModal(false)
        return true
      }
    } catch (err) {
      console.warn('Native install prompt failed:', err)
    }
    return false
  }

  // Main action handler for "Open in App" button
  const handleOpenInAppClick = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    // Background service worker update check (non-blocking)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.update().catch(() => {}))
      }).catch(() => {})
    }

    // 1. If native install prompt is ready, trigger it immediately
    if (deferredPrompt) {
      const installed = await handleNativeInstall()
      if (installed) return
    }

    // 2. On Desktop: If already installed, launch the standalone PWA window
    if (isDesktop) {
      launchDesktopApp()
      return
    }

    // 3. On Mobile (Android / iOS): Show the tailored action sheet modal with step-by-step guidance
    setShowHelpModal(true)
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

      {/* Actionable Open / Install App Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-2xl max-w-sm w-full space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <img src={BRANDING.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                <h3 className="font-bold text-sm text-brand-text">Open in {BRANDING.shortName}</h3>
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
              Experience the fast, full-screen portal with offline capabilities on your device:
            </p>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              {deferredPrompt && (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-primary text-brand-surface font-bold text-xs hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  <span>Install / Open App Now</span>
                </button>
              )}

              {isDesktop && (
                <button
                  type="button"
                  onClick={launchDesktopApp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-primary text-brand-surface font-bold text-xs hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                >
                  <ExternalLink size={14} />
                  <span>Open Installed App Window</span>
                </button>
              )}
            </div>

            {/* Device-Specific Instructions */}
            <div className="space-y-2.5 text-xs text-brand-text pt-1">
              {isDesktop && (
                <div className="p-3 rounded-xl bg-brand-surface-tint border border-brand-border/60 flex items-start gap-2.5">
                  <Monitor size={18} className="text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-brand-text">Desktop (Chrome / Edge):</p>
                    <p className="text-brand-text-muted mt-0.5 text-[11px] leading-relaxed">
                      Click the <strong>App icon (🖥️ / 📥)</strong> in your address bar (top right), or click <strong>⋮ (Menu) → &quot;Install / Open in {BRANDING.shortName}&quot;</strong>.
                    </p>
                  </div>
                </div>
              )}

              {isAndroid && (
                <div className="p-3 rounded-xl bg-brand-surface-tint border border-brand-border/60 flex items-start gap-2.5">
                  <Smartphone size={18} className="text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-brand-text">Android (Chrome):</p>
                    <p className="text-brand-text-muted mt-0.5 text-[11px] leading-relaxed">
                      Tap <strong>⋮ (Menu) → &quot;Install App&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong> to place the dedicated app on your phone.
                    </p>
                  </div>
                </div>
              )}

              {isIOS && (
                <div className="p-3 rounded-xl bg-brand-surface-tint border border-brand-border/60 flex items-start gap-2.5">
                  <Share size={18} className="text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-brand-text">iPhone / iPad (Safari):</p>
                    <p className="text-brand-text-muted mt-0.5 text-[11px] leading-relaxed">
                      Tap the <strong>Share button (📤)</strong> at the bottom of Safari, scroll down and select <strong>&quot;Add to Home Screen (➕)&quot;</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 rounded-xl bg-brand-surface-tint text-brand-text-muted hover:text-brand-text text-xs font-semibold hover:bg-brand-surface transition-colors cursor-pointer text-center"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
