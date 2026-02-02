import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Sentry initialization (guarded by environment variable)
if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then(({ init, browserTracingIntegration }) => {
    init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [browserTracingIntegration()],
      tracesSampleRate: 1.0,
      environment: import.meta.env.MODE,
      enabled: import.meta.env.PROD,
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
