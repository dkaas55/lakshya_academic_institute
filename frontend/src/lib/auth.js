const TOKEN_KEY = 'authToken'
const ROLE_KEY = 'authRole'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getToken())
}

// ── Role helpers ──────────────────────────────────────────────────────────────

export function getRole() {
  return localStorage.getItem(ROLE_KEY)
}

export function setRole(role) {
  localStorage.setItem(ROLE_KEY, role)
}

export function clearRole() {
  localStorage.removeItem(ROLE_KEY)
}
