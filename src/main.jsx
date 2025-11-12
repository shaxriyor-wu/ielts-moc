import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles.css'
import { AuthProvider } from './contexts/AuthContext'
import { setupMockServiceWorker } from './mocks/browser'

// Initialize MSW in development or when API_BASE_URL is not set
const shouldUseMock = !import.meta.env.VITE_API_BASE_URL || import.meta.env.MODE === 'development'

if (shouldUseMock) {
  console.log('🔧 Starting app with MSW (Mock Service Worker)')
  setupMockServiceWorker()
    .then(() => {
      console.log('✅ MSW initialized, rendering app')
      renderApp()
    })
    .catch((error) => {
      console.error('❌ MSW initialization failed, rendering app anyway', error)
      renderApp()
    })
} else {
  console.log('🔧 Starting app with real API:', import.meta.env.VITE_API_BASE_URL)
  renderApp()
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  )
}

