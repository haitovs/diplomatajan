import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './AppV2.jsx'
import { ThemeProvider } from './components/ThemeProvider.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
