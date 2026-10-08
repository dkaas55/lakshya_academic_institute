const TOKEN_KEY = 'authToken'
const ROLE_KEY = 'authRole'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token, role = null) {
  // If explicitly designated for student or current stored role is student, use localStorage
  const targetRole = role || getRole()
  if (targetRole === 'student') {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getToken())
}

// ── Role helpers ──────────────────────────────────────────────────────────────

export function getRole() {
  return localStorage.getItem(ROLE_KEY) || sessionStorage.getItem(ROLE_KEY)
}

export function setRole(role) {
  if (role === 'student') {
    localStorage.setItem(ROLE_KEY, role)
    sessionStorage.removeItem(ROLE_KEY)

    // Migrate any token temporarily set in sessionStorage to localStorage
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      sessionStorage.removeItem(TOKEN_KEY)
    }
  } else {
    sessionStorage.setItem(ROLE_KEY, role)
    localStorage.removeItem(ROLE_KEY)

    // Migrate any token in localStorage to sessionStorage for non-student
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token)
      localStorage.removeItem(TOKEN_KEY)
    }
  }
}

export function clearRole() {
  localStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(ROLE_KEY)
}

