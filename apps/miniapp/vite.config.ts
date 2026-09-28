import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = 'http://127.0.0.1:8000';
const botTarget = 'http://127.0.0.1:8001';

const apiProxy: ProxyOptions = { target: apiTarget, changeOrigin: true };
const botProxy: ProxyOptions = { target: botTarget, changeOrigin: true };

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 3000,
    proxy: {
      // Exact bot routes before the general /api prefix. A prefix match would
      // send /api/v1/measures/saved and /save to the catalog API, where "saved"
      // is only an unknown measure id.
      '/webhooks/max': botProxy,
      '/api/v1/auth/max/launch-data': botProxy,
      '/api/v1/quiz/submit': botProxy,
      '/api/v1/notifications/opt-in': botProxy,
      '/api/v1/measures/saved': botProxy,
      '^/api/v1/measures/[^/]+/save$': botProxy,
      '/bot/health': {
        target: botTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bot/, ''),
      },
      '/api': apiProxy,
      '/health': apiProxy,
    },
  },
});
