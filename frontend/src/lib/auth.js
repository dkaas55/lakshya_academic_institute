const TOKEN_KEY = 'authToken'
const ROLE_KEY = 'authRole'

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getToken())
}

// ── Role helpers ──────────────────────────────────────────────────────────────

export function getRole() {
  return sessionStorage.getItem(ROLE_KEY)
}

export function setRole(role) {
  sessionStorage.setItem(ROLE_KEY, role)
}

export function clearRole() {
  sessionStorage.removeItem(ROLE_KEY)
}
