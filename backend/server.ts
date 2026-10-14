import express, { Request, Response } from 'express';
import { apiRouter } from './api/routes';
import path from 'path';

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers & CORS
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Mount BrandGuard API endpoints
app.use('/api', apiRouter);

// Root healthcheck
app.get('/api-status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    app: 'BrandGuard Intelligence Engine',
    version: '1.0.3',
    backend: 'Express / TypeScript',
  });
});

export function startServer(port: number = PORT) {
  return app.listen(port, () => {
    console.log(`[BrandGuard Backend] Server running on http://0.0.0.0:${port}`);
  });
}

// Auto-start when executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.VITE_DEV_SERVER) {
  // If started standalone (e.g. via tsx backend/server.ts)
  if (require.main === module || process.argv[1]?.includes('server')) {
    startServer(PORT);
  }
}
