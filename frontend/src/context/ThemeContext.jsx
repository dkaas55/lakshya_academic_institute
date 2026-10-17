import React, { createContext, useContext, useEffect, useState } from 'react'
import { THEME_PRESETS, DEFAULT_COLOR_THEME, applyThemeVariables } from '../config/theme'

const ThemeContext = createContext()

export function initTheme() {
  if (typeof window === 'undefined') return

  const savedTheme = localStorage.getItem('app-theme') || 'system'
  let isDark = false
  if (savedTheme === 'dark') {
    isDark = true
  } else if (savedTheme === 'system') {
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(isDark ? 'dark' : 'light')

  // Detect if code DEFAULT_COLOR_THEME changed
  const savedCodeDefault = localStorage.getItem('app-code-default-theme')
  let activeColor = DEFAULT_COLOR_THEME
  if (savedCodeDefault !== DEFAULT_COLOR_THEME) {
    localStorage.setItem('app-code-default-theme', DEFAULT_COLOR_THEME)
    localStorage.setItem('app-color-theme', DEFAULT_COLOR_THEME)
  } else {
    const stored = localStorage.getItem('app-color-theme')
    if (stored && THEME_PRESETS[stored]) {
      activeColor = stored
    }
  }

  applyThemeVariables(activeColor, isDark)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('app-theme')
    return stored ? stored : 'system'
  })

  const [colorTheme, setColorThemeState] = useState(() => {
    // If developer changed DEFAULT_COLOR_THEME in code, prioritize the new code default!
    const savedCodeDefault = localStorage.getItem('app-code-default-theme')
    if (savedCodeDefault !== DEFAULT_COLOR_THEME) {
      localStorage.setItem('app-code-default-theme', DEFAULT_COLOR_THEME)
      localStorage.setItem('app-color-theme', DEFAULT_COLOR_THEME)
      return DEFAULT_COLOR_THEME
    }
    const stored = localStorage.getItem('app-color-theme')
    return stored && THEME_PRESETS[stored] ? stored : DEFAULT_COLOR_THEME
  })

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('app-theme') || 'system'
    if (stored === 'dark') return true
    if (stored === 'light') return false
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Apply dark/light class
  useEffect(() => {
    localStorage.setItem('app-theme', theme)
    
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    let active = theme
    if (theme === 'system') {
      active = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    root.classList.add(active)
    setIsDark(active === 'dark')
  }, [theme])

  // Apply accent & primary colors dynamically based on dark/light mode and active color preset
  useEffect(() => {
    localStorage.setItem('app-color-theme', colorTheme)
    applyThemeVariables(colorTheme, isDark)
  }, [colorTheme, isDark])

  // Listen for system theme changes if set to system
  useEffect(() => {
    if (theme !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      const active = e.matches ? 'dark' : 'light'
      root.classList.add(active)
      setIsDark(active === 'dark')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setColorTheme = (newTheme) => {
    if (THEME_PRESETS[newTheme]) {
      localStorage.setItem('app-color-theme', newTheme)
      setColorThemeState(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorTheme, setColorTheme, isDark, presets: THEME_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
