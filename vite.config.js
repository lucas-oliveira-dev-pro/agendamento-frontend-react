import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Certifique-se de usar o "export default" exatamente assim:
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Agendamento Frontend',
        short_name: 'Agendamento',
        description: 'Aplicativo de Agendamento em React',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
