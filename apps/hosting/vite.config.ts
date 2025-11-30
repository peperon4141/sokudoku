import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // apps/.env.developmentから環境変数を読み込み
  const envDir = fileURLToPath(new URL('../', import.meta.url))
  const env = loadEnv(mode, envDir, 'VITE_')
  // process.envに環境変数を設定（ビルド時に必要）
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value
  }
  
  return {
    plugins: [
      vue(),
      tailwindcss(),
      Components({
        resolvers: [PrimeVueResolver()],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      outDir: '../firebase/hosting_contents',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
          },
        },
      },
    },
    optimizeDeps: {
      include: [],
    },
    // 開発サーバーの設定（dev:serveスクリプトで使用）
    server: {
      port: 50502,
      host: '127.0.0.1',
    },
  }
})

