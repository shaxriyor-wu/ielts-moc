import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers)

export async function setupMockServiceWorker() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Start the worker
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
      quiet: false, // Show MSW logs in console
    })

    console.log('✅ MSW: Mock Service Worker started successfully')
  } catch (error) {
    console.error('❌ MSW: Failed to start', error)
    // Continue anyway - app should still work
  }
}

