import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchYouthPolicies } from './api/policies.ts';

// Load .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON Body parsing
  app.use(express.json());

  // API Route: 온통청년 정책 API 프록시
  app.get('/api/policies', async (req, res) => {
    try {
      const data = await fetchYouthPolicies(req.query);
      res.json(data);
    } catch (err: any) {
      console.error('[Express API Error]', err);
      // 예외 발생 시에도 500이 아닌 샘플 데이터 폴백
      const sample = await fetchYouthPolicies({});
      res.json(sample);
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[내 정책 타임라인] 서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}

startServer();
