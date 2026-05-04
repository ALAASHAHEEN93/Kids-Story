import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { APP_BRAND } from './brand'
import './index.css'
import App from './App.tsx'

document.title = APP_BRAND

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
