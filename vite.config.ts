import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true, 
      },
      plugins: [
        react(),
        // EJS 문법을 사용하여 HTML에 변수를 주입
        createHtmlPlugin({
          minify: true,
          inject: {
            data: {
              naverClientId: env.VITE_NAVER_MAPS_CLIENT_ID,
            },
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
function htmlConfig(arg0: { headScripts: { src: string; type: string; }[]; }): import("vite").PluginOption {
  throw new Error('Function not implemented.');
}

