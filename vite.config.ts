import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // 도메인 로직 단위 테스트 (architecture.md §2). UI 검증은 Playwright MCP로 한다.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
