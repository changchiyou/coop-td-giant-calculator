import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the site under /<repo>/ — keep base in sync with deploy.yml.
export default defineConfig({
  base: '/coop-td-giant-calculator/',
  plugins: [react(), tailwindcss()],
})
