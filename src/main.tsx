import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // register service worker relative to the app base (works on GitHub Pages)
    const swPath = import.meta.env.BASE_URL + 'sw.js'
    navigator.serviceWorker.register(swPath).catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(<App />)
