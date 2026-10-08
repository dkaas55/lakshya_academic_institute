import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function dynamicManifestPlugin(env) {
  const getManifest = () => {
    const name = env.VITE_APP_NAME || 'Happy English School'
    const shortName = env.VITE_APP_SHORT_NAME || 'Happy English'
    const logo = env.VITE_APP_LOGO_URL || '/hes_images.png'

    return JSON.stringify(
      {
        short_name: shortName,
        name: name,
        description: `${name} - Student, Teacher and Administrative Portal`,
        icons: [
          {
            src: '/icon-192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any maskable'
          },
          {
            src: logo,
            type: 'image/png',
            sizes: 'any',
            purpose: 'any'
          }
        ],
        start_url: '/',
        id: `/pwa-${encodeURIComponent(shortName.toLowerCase().replace(/[^a-z0-9]/g, ''))}`,
        background_color: '#ffffff',
        theme_color: '#1e3a8a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/'
      },
      null,
      2
    )
  }

  return {
    name: 'dynamic-manifest-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url ? req.url.split('?')[0] : ''
        if (pathname === '/manifest.json') {
          res.setHeader('Content-Type', 'application/json')
          res.end(getManifest())
          return
        }
        next()
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: getManifest()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load from both process.cwd() and the directory where vite.config.js is located
  const env = {
    ...loadEnv(mode, process.cwd(), ''),
    ...loadEnv(mode, __dirname, '')
  }

  return {
    plugins: [react(), tailwindcss(), dynamicManifestPlugin(env)],
    resolve: {
      alias: {
        html2canvas: 'html2canvas-pro',
      },
    },
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || env.VITE_API_URL || '')
    }
  }
})


