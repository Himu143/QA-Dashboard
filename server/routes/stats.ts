import { Router, Request, Response } from 'express';
import { dbStore } from '../db';

const router = Router();

// GET /api/stats/dashboard - Get aggregated QA KPIs, burndown rates, and health metrics
router.get('/dashboard', (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const stats = dbStore.getDashboardStats(projectId as string);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/stats/reset-demo - Reset data back to initial seed data fixtures
router.post('/reset-demo', (req: Request, res: Response) => {
  try {
    dbStore.seed();
    res.json({ success: true, message: 'Database reset to factory seed fixtures successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
