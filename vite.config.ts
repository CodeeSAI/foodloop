import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {
  resolveAiConfig,
  getAiStatusResponse,
  handleAiInference,
} from './api/ai';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const config = resolveAiConfig(env);

  return {
    plugins: [
      react(),
      {
        name: 'foodloop-ai-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // Health / Status Check Endpoint (GET /api/ai or GET /api/ai/status)
            if ((req.url === '/api/ai' || req.url === '/api/ai/status') && req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(getAiStatusResponse(config)));
              return;
            }

            // Inference Endpoint (POST /api/ai)
            if (req.url === '/api/ai' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });

              req.on('end', async () => {
                const response = await handleAiInference(body, config);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = response.status;
                res.end(JSON.stringify(response.body));
              });
              return;
            }
            next();
          });
        },
      },
    ],
  };
});
