import { useState } from 'react'
import api from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'

export default function SettingsModal({ onClose }) {
  const { theme, setTheme, colorTheme, setColorTheme, presets } = useTheme()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setMessage({ text: '', type: '' })
    
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const { data } = await api.patch('/auth/change-password', {
        currentPassword,
        newPassword
      })
      if (data.success) {
        setMessage({ text: 'Password changed successfully!', type: 'success' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to change password. Please try again.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-text/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface shadow-xl overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-brand-border bg-brand-surface-tint flex justify-between items-center">
          <h2 className="text-lg font-extrabold text-brand-text tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            className="text-brand-text-muted hover:text-brand-text cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Theme Section */}
          <section>
            <h3 className="text-sm font-semibold text-brand-text mb-2">Appearance</h3>
            <p className="text-xs text-brand-text-muted mb-2.5">Display Mode</p>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold capitalize border transition-all duration-200 cursor-pointer ${
                    theme === t
                      ? 'border-brand-accent bg-brand-accent/10 text-brand-accent font-extrabold shadow-sm scale-[1.02]'
                      : 'border-brand-border text-brand-text-muted hover:bg-brand-surface-tint'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <p className="text-xs text-brand-text-muted mb-2.5">Accent Color</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(presets || {}).map((preset) => {
                const isSelected = colorTheme === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setColorTheme(preset.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-brand-accent bg-brand-surface-tint shadow-sm font-bold ring-1 ring-brand-accent'
                        : 'border-brand-border hover:bg-brand-surface-tint/60 text-brand-text-muted'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs border border-white/40"
                      style={{ backgroundColor: preset.light.accent }}
                    />
                    <span className="text-[11px] truncate leading-tight text-brand-text">
                      {preset.name.replace(/(Classic|Royal|Warm|Ocean|Electric|Modern)/, '').trim() || preset.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Password Section */}
          <section>
            <h3 className="text-sm font-semibold text-brand-text mb-3">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>
              
              {message.text && (
                <p
                  className={`text-xs px-4 py-2.5 rounded-xl font-medium ${
                    message.type === 'error'
                      ? 'bg-brand-accent/10 text-brand-accent'
                      : 'bg-brand-primary/10 text-brand-primary'
                  }`}
                >
                  {message.text}
                </p>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover px-4 py-3 text-sm font-bold text-white transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
