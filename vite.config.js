import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
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