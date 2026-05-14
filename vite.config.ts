import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
// @ts-ignore
import chatHandler from './api/chat.js';

const apiPlugin = (mode: string) => ({
  name: 'api-plugin',
  configureServer(server: any) {
    const env = loadEnv(mode, process.cwd(), '');
    Object.assign(process.env, env);

    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString() });
        req.on('end', async () => {
          try {
            req.body = body ? JSON.parse(body) : {};
          } catch(e) {
            req.body = {};
          }

          res.status = (code: number) => { res.statusCode = code; return res; };
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          
          try {
            await chatHandler(req, res);
          } catch (err) {
            console.error('API Error in dev server:', err);
            res.status(500).json({ error: 'Internal Dev Server Error' });
          }
        });
        return;
      }
      next();
    });
  }
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), apiPlugin(mode)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
