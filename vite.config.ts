import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { briefPlugin } from './vite-brief';

// 생성 버튼이 쓰는 /api/brief는 개발 서버가 직접 처리한다. 별도 Node 서버는 없다.
export default defineConfig({
  plugins: [react(), briefPlugin()],
  server: {
    host: '127.0.0.1',
    cors: false,
    fs: {
      deny: [
        '.env', '.env.*', '*.{crt,pem,key}', '**/.git/**',
        '**/brief/**', '**/renders/**', '**/.codex/**', '**/.claude/**', '**/.gemini/**',
        '**/.mcp.json', '**/*_token.txt',
      ],
    },
  },
});
