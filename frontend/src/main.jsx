import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initBranding } from './config/branding'
import { initTheme } from './context/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'

initBranding()
initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
