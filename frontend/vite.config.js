import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function dynamicManifestPlugin(env) {
  const getManifest = () => {
    const name = env.VITE_APP_NAME || 'School Management Portal'
    const shortName = env.VITE_APP_SHORT_NAME || name
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
        id: '/',
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
        if (req.url === '/manifest.json') {
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
  const env = loadEnv(mode, process.cwd(), '')
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

