import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const qweatherHost = env.VITE_QWEATHER_HOST || 'devapi.qweather.com'
  const reactRefreshPreamble = {
    name: 'react-refresh-preamble-fix',
    apply: 'serve' as const,
    transformIndexHtml(html: string) {
      const preamble = `
    <script type="module">
      import RefreshRuntime from "/@react-refresh"
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>`

      return html.includes('__vite_plugin_react_preamble_installed__')
        ? html
        : html.replace('<head>', `<head>${preamble}`)
    },
  }

  return {
    plugins: [react(), tailwindcss(), reactRefreshPreamble],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'vendor-react', test: /node_modules[\\/]react/, priority: 20 },
              { name: 'vendor-framer', test: /node_modules[\\/]framer-motion/, priority: 15 },
              { name: 'vendor', test: /node_modules/, minSize: 20000, priority: 10 },
            ],
          },
        },
      },
    },
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      hmr: {
        host: 'localhost',
        protocol: 'ws',
        port: 5173,
        clientPort: 5173,
      },
      proxy: {
        '/api/qweather': {
          target: `https://${qweatherHost}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qweather/, ''),
          secure: true,
        },
      },
    },
  }
})
