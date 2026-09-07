import { Router, Request, Response } from 'express';
import { dbStore } from '../db';

const router = Router();

// GET /api/test-cases/export - Export test cases to CSV
router.get('/export', (req: Request, res: Response) => {
  try {
    const { projectId, testPlanId } = req.query;
    const cases = dbStore.getTestCases(projectId as string, testPlanId as string);

    const headers = ['Case ID', 'Project ID', 'Title', 'Type', 'Priority', 'Status', 'Preconditions', 'Steps Count', 'Created By', 'Created At'];
    const rows = cases.map(tc => [
      `"${tc.caseNumber}"`,
      `"${tc.projectId}"`,
      `"${tc.title.replace(/"/g, '""')}"`,
      `"${tc.type}"`,
      `"${tc.priority}"`,
      `"${tc.status}"`,
      `"${tc.preconditions.replace(/"/g, '""')}"`,
      tc.steps.length,
      `"${tc.createdBy}"`,
      `"${tc.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="test_cases_export_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/test-cases - List test cases
router.get('/', (req: Request, res: Response) => {
  try {
    const { projectId, testPlanId, type, priority, status, search } = req.query;
    let cases = dbStore.getTestCases(projectId as string, testPlanId as string);

    if (type && type !== 'all') {
      cases = cases.filter(tc => tc.type === type);
    }
    if (priority && priority !== 'all') {
      cases = cases.filter(tc => tc.priority === priority);
    }
    if (status && status !== 'all') {
      cases = cases.filter(tc => tc.status === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      cases = cases.filter(tc => 
        tc.title.toLowerCase().includes(q) ||
        tc.caseNumber.toLowerCase().includes(q) ||
        tc.description.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: cases.length, data: cases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/test-cases/:id - Get single test case
router.get('/:id', (req: Request, res: Response) => {
  try {
    const testCase = dbStore.getTestCase(req.params.id);
    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }
    res.json({ success: true, data: testCase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/test-cases - Create test case
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, projectId } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ success: false, message: 'Title and projectId are required' });
    }

    const project = dbStore.getProject(projectId);
    const projectKey = project?.key || 'QA';
    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Tester';

    const testCase = dbStore.saveTestCase(req.body, projectKey, String(actorName));
    res.status(201).json({ success: true, data: testCase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/test-cases/:id - Update test case
router.put('/:id', (req: Request, res: Response) => {
  try {
    const existing = dbStore.getTestCase(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    const project = dbStore.getProject(req.body.projectId || existing.projectId);
    const projectKey = project?.key || 'QA';
    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Tester';

    const updated = dbStore.saveTestCase({
      ...req.body,
      id: req.params.id,
    }, projectKey, String(actorName));

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/test-cases/:id - Delete test case
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const actorName = req.body?.actorName || req.headers['x-user-name'] || 'QA Tester';
    const deleted = dbStore.deleteTestCase(req.params.id, String(actorName));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    res.json({ success: true, message: 'Test case deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
