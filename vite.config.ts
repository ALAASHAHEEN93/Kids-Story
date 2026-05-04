import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Relative base fixes blank pages when the app is not served from domain root
// (GitHub Pages project site, `file://` preview of dist, nested paths).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
}))
