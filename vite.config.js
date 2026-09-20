import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // CHỈ cache asset tĩnh (JS/CSS/HTML/font/ảnh) — KHÔNG cache response
        // API ở bước này. Dữ liệu tồn kho/danh mục sẽ được cache riêng qua
        // IndexedDB ở Giai đoạn 2, có kiểm soát rõ ràng khi nào làm mới —
        // để Workbox tự cache API theo cơ chế mặc định rất dễ khiến nhân
        // viên nhìn thấy số tồn cũ mà tưởng là mới.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      manifest: {
        name: 'WMS Pro',
        short_name: 'WMS Pro',
        description: 'Hệ thống quản lý kho WMS Pro',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: { port: 5173 },
  // Cấu hình Vitest — đọc chung file này, không cần file riêng.
  // environment: 'node' là đủ cho unit test hàm thuần (utils/), không cần
  // giả lập DOM (chỉ cần khi test component React thật sự render ra HTML).
  test: {
    globals: true,        // dùng test()/expect() mà không cần import thủ công mỗi file
    environment: 'node',
  },
})