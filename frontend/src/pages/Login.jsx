import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { setToken, setRole } from '../lib/auth'

const LOGIN_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`

const LOGIN_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
]

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await axios.post(LOGIN_URL, { username, password, role })

      if (!data.success || !data.data?.token) {
        setError(data.message || 'Login failed. Please try again.')
        return
      }

      setToken(data.data.token)
      const userRole = data.data.user?.role ?? role
      setRole(userRole)
      const dest = userRole === 'student' ? '/student' : userRole === 'teacher' ? '/teacher' : '/admin'
      navigate(dest, { replace: true })
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request
          ? 'Unable to reach the server. Is the backend running?'
          : 'Something went wrong. Please try again.')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-brand-surface border border-brand-border rounded-3xl shadow-sm mb-5 transition-colors duration-300">
            <img 
              src="/logo.png" 
              alt="Lakshya Academic Institute Logo" 
              className="h-16 w-auto object-contain" 
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-primary">
            Lakshya Academic Institute
          </h1>
          <p className="mt-2 text-sm text-brand-text-muted">
            Sign in to your learning portal
          </p>
        </div>

        <div className="bg-brand-surface rounded-3xl border border-brand-border p-8 shadow-sm transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="login-as"
                className="block text-sm font-semibold text-brand-text mb-2"
              >
                Login As
              </label>
              <div className="relative">
                <select
                  id="login-as"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-brand-border bg-brand-bg px-4 py-3 pr-10 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
                >
                  {LOGIN_ROLES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text-muted"
                  aria-hidden="true"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-brand-text mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-brand-text placeholder:text-brand-text-muted/40 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-brand-text mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-brand-text placeholder:text-brand-text-muted/40 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm text-brand-accent bg-brand-accent/5 border border-brand-accent/10 rounded-xl px-4 py-2.5"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-primary hover:bg-brand-primary/90 active:scale-[0.99] px-4 py-3 text-sm font-bold text-brand-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

