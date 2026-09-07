import { Router, Request, Response } from 'express';
import { dbStore } from '../db';

const router = Router();

// GET /api/test-plans - List test plans
router.get('/', (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const plans = dbStore.getTestPlans(projectId as string);
    res.json({ success: true, count: plans.length, data: plans });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/test-plans/:id - Get single test plan with associated test cases
router.get('/:id', (req: Request, res: Response) => {
  try {
    const plan = dbStore.getTestPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Test plan not found' });
    }
    const testCases = dbStore.getTestCases(plan.projectId, plan.id);
    res.json({ success: true, data: { ...plan, testCases } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/test-plans - Create test plan
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, projectId } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ success: false, message: 'Title and projectId are required' });
    }

    const project = dbStore.getProject(projectId);
    const projectKey = project?.key || 'QA';
    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Lead';

    const plan = dbStore.saveTestPlan(req.body, projectKey, String(actorName));
    res.status(201).json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/test-plans/:id - Update test plan
router.put('/:id', (req: Request, res: Response) => {
  try {
    const existing = dbStore.getTestPlan(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Test plan not found' });
    }

    const project = dbStore.getProject(req.body.projectId || existing.projectId);
    const projectKey = project?.key || 'QA';
    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Lead';

    const updated = dbStore.saveTestPlan({
      ...req.body,
      id: req.params.id,
    }, projectKey, String(actorName));

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/test-plans/:id - Delete test plan
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const actorName = req.body?.actorName || req.headers['x-user-name'] || 'QA Lead';
    const deleted = dbStore.deleteTestPlan(req.params.id, String(actorName));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Test plan not found' });
    }

    res.json({ success: true, message: 'Test plan deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
