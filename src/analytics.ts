import type { PostHog } from 'posthog-js'

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY

// Resolves with the initialized client once posthog-js has loaded. Stays null
// when analytics are disabled (no key), so trackEvent becomes a no-op.
let client: Promise<PostHog> | null = null

// Loads posthog-js as a separate async chunk (kept out of the critical bundle)
// and initializes it on the next idle frame. The automatic pageview fires at
// init time, so deferring here still captures the initial pageview — just a
// few hundred ms after load rather than during the critical path.
export function initAnalytics() {
  if (!posthogKey || client) return

  client = new Promise<PostHog>((resolve) => {
    const start = () =>
      import('posthog-js').then(({ default: posthog }) => {
        posthog.init(posthogKey, {
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
          defaults: '2025-05-24',
          capture_pageview: true,
        })
        resolve(posthog)
      })

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => void start(), { timeout: 2000 })
    } else {
      window.setTimeout(() => void start(), 1)
    }
  })
}

/**
 * Captures a custom PostHog event. Safe to call before posthog-js has finished
 * loading (the event is sent once it is ready) and a no-op when analytics are disabled.
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  void client?.then((posthog) => posthog.capture(event, properties))
}
