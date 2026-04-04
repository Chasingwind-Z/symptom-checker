import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const qweatherHost = env.VITE_QWEATHER_HOST || 'devapi.qweather.com'

  return {
    plugins: [react(), tailwindcss()],
    server: {
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
