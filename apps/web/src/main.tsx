import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ReactQueryProvider } from './contexts/ReactQueryProvider'
import { AuthProvider } from './contexts/AuthProvider'
import App from './App'
import './index.css'

// Prevent third-party browser extensions (e.g. PerformanceObserver, Web Vitals, Grammarly) from crashing on layout shifts
window.addEventListener('error', (event) => {
  if (
    event.message?.includes("reading 'startTime'") ||
    event.message?.includes("reportAllChanges")
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <HelmetProvider>
      <BrowserRouter>
        <ReactQueryProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ReactQueryProvider>
      </BrowserRouter>
    </HelmetProvider>,
)
