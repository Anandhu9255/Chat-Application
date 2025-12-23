import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Dev helper: allow passing token in URL hash like #token=... so newly opened windows can set their token
try{
  const hash = window.location.hash
  if (hash && hash.startsWith('#token=')){
    const token = decodeURIComponent(hash.replace('#token=', ''))
    if (token) {
      // store token per-tab (sessionStorage). Persist to localStorage only if you want long-lived login
      // default: sessionStorage to allow separate tabs with different users
      import('./services/api').then(({ default: api }) => {
        api.setToken(token)
        // remove token from URL for cleanliness
        history.replaceState(null, '', window.location.pathname + window.location.search)
        // navigate to /chat
        window.location.href = '/chat'
      })
    }
  }
}catch(e){ /* ignore */ }

// Suppress specific React Router future-flag warnings during development to reduce noise.
if (import.meta.env.DEV) {
  const _warn = console.warn.bind(console)
  console.warn = (...args) => {
    try {
      const msg = args[0]
      if (typeof msg === 'string' && msg.includes('React Router Future Flag Warning')) return
    } catch (e) {
      // ignore
    }
    _warn(...args)
  }
}

// Initialize theme from localStorage (simple class-based dark mode)
try {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') document.documentElement.classList.add('dark')
} catch (e) {
  // ignore
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
