import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './AppV2.jsx'
import { ThemeProvider } from './components/ThemeProvider.jsx'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
)
