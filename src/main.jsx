import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './AppV2.jsx'
import { AppErrorBoundary } from './components/AppErrorBoundary.jsx'
import { ThemeProvider } from './components/ThemeProvider.jsx'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <AppErrorBoundary>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AppErrorBoundary>
    </I18nProvider>
  </StrictMode>,
)
