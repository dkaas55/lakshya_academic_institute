import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('app-theme')
    return stored ? stored : 'system'
  })

  const [isDark, setIsDark] = useState(false)

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

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
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
