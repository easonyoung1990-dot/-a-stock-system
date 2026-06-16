import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base 是「网址子路径」：部署到 GitHub Pages 时，网址形如
// https://easonyoung1990-dot.github.io/-a-stock-system/
// 所以静态资源前缀要设成 /-a-stock-system/，否则页面会白屏（找不到 JS/CSS）。
export default defineConfig({
  base: '/-a-stock-system/',
  plugins: [react()],
})
