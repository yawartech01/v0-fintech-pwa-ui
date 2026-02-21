// Sentry Integration - Guarded by environment variables
import * as Sentry from '@sentry/react'

/**
 * Initialize Sentry for error monitoring
 * Only activates if VITE_SENTRY_DSN is set
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development'
  const release = import.meta.env.VITE_SENTRY_RELEASE || 'veltox-pwa@1.0.0'

  // Guard: Only initialize if DSN is provided
  if (!dsn) {
    console.log('[Sentry] Skipped: VITE_SENTRY_DSN not set')
    return
  }

  try {
    Sentry.init({
      dsn,
      environment,
      release,
      integrations: [
        new Sentry.BrowserTracing({
          // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
          // We recommend adjusting this value in production
          tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
        }),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // Capture 10% of transactions in prod
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Ignore common errors
      ignoreErrors: [
        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
      ],

      beforeSend(event, hint) {
        // Don't send events in development
        if (environment === 'development') {
          console.log('[Sentry] Event captured (dev):', event)
          return null
        }

        // Filter out localStorage errors (expected in private browsing)
        const originalException = hint.originalException
        if (
          originalException &&
          typeof originalException === 'object' &&
          'message' in originalException &&
          typeof originalException.message === 'string' &&
          originalException.message.includes('localStorage')
        ) {
          return null
        }

        return event
      },
    })

    console.log(`[Sentry] Initialized for ${environment}`)
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
  }
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!import.meta.env.VITE_SENTRY_DSN) return

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!import.meta.env.VITE_SENTRY_DSN) return

  Sentry.captureMessage(message, level)
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (!import.meta.env.VITE_SENTRY_DSN) return

  if (user) {
    Sentry.setUser(user)
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  if (!import.meta.env.VITE_SENTRY_DSN) return

  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  })
}
