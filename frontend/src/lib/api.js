import axios from 'axios'
import { getToken, clearToken, clearRole } from './auth'

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach the stored JWT to every request ───────────────
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: handle auth failures globally ───────────────────────
//
// When the backend returns 401 (no/invalid token) or 403 (wrong role), we:
//   1. Wipe the stale token + role from localStorage
//   2. Hard-redirect to /login so the user can authenticate with the correct account
//
// Using window.location instead of react-router's navigate because this module
// lives outside the React component tree.
api.interceptors.response.use(
  (response) => response, // pass successful responses straight through
  (error) => {
    const status = error.response?.status

    if (status === 401 || status === 403) {
      clearToken()
      clearRole()

      // Only redirect if we aren't already on the login page (prevents loops)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login')
      }
    }

    return Promise.reject(error)
  }
)

export default api
