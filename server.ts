import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

import projectsRouter from './server/routes/projects';
import bugsRouter from './server/routes/bugs';
import testPlansRouter from './server/routes/testPlans';
import testCasesRouter from './server/routes/testCases';
import testRunsRouter from './server/routes/testRuns';
import commentsRouter from './server/routes/comments';
import activitiesRouter from './server/routes/activities';
import statsRouter from './server/routes/stats';
import aiRouter from './server/routes/ai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- API Endpoints ---
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'QA Testing & Defect Management Backend',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Mount Feature Routers
  app.use('/api/projects', projectsRouter);
  app.use('/api/bugs', bugsRouter);
  app.use('/api/test-plans', testPlansRouter);
  app.use('/api/test-cases', testCasesRouter);
  app.use('/api/test-runs', testRunsRouter);
  app.use('/api/comments', commentsRouter);
  app.use('/api/activities', activitiesRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/ai', aiRouter);

  // 404 for unhandled API endpoints
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ success: false, message: `API route ${req.method} ${req.originalUrl} not found` });
  });

  // --- Vite & Static Asset Handling ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QA Backend] Express server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[QA Backend] Failed to start server:', err);
  process.exit(1);
});
