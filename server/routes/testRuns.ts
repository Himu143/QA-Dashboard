import { Router, Request, Response } from 'express';
import { dbStore } from '../db';

const router = Router();

// GET /api/test-runs - List test execution runs
router.get('/', (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const runs = dbStore.getTestRuns(projectId as string);
    res.json({ success: true, count: runs.length, data: runs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/test-runs/:id - Get single test run
router.get('/:id', (req: Request, res: Response) => {
  try {
    const run = dbStore.getTestRun(req.params.id);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Test execution run not found' });
    }
    res.json({ success: true, data: run });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/test-runs - Create or record test execution run
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, projectId } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ success: false, message: 'Title and projectId are required' });
    }

    const project = dbStore.getProject(projectId);
    const projectKey = project?.key || 'QA';
    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Automation Lead';

    const run = dbStore.saveTestRun(req.body, projectKey, String(actorName));
    res.status(201).json({ success: true, data: run });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/test-runs/:id - Delete a test execution run
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const actorName = req.body?.actorName || req.headers['x-user-name'] || 'QA Automation Lead';
    const deleted = dbStore.deleteTestRun(req.params.id, String(actorName));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Test execution run not found' });
    }

    res.json({ success: true, message: 'Test execution run deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
