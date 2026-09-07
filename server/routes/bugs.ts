import { Router, Request, Response } from 'express';
import { dbStore } from '../db';
import { BugStatus } from '../../src/types';

const router = Router();

// GET /api/bugs - List bugs (filterable by projectId, status, severity, priority, search)
router.get('/', (req: Request, res: Response) => {
  try {
    const { projectId, status, severity, priority, search } = req.query;
    let bugs = dbStore.getBugs(projectId as string);

    if (status && status !== 'all') {
      bugs = bugs.filter(b => b.status === status);
    }
    if (severity && severity !== 'all') {
      bugs = bugs.filter(b => b.severity === severity);
    }
    if (priority && priority !== 'all') {
      bugs = bugs.filter(b => b.priority === priority);
    }
    if (search) {
      const q = String(search).toLowerCase();
      bugs = bugs.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.bugNumber.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.assignedTo.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: bugs.length, data: bugs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/bugs/:id - Get single bug
router.get('/:id', (req: Request, res: Response) => {
  try {
    const bug = dbStore.getBug(req.params.id);
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug defect not found' });
    }
    const comments = dbStore.getComments(bug.id);
    res.json({ success: true, data: { ...bug, comments } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/bugs - Create new bug
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, projectId } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ success: false, message: 'Title and projectId are required' });
    }

    const project = dbStore.getProject(projectId);
    const projectKey = project?.key || req.body.projectKey || 'QA';
    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Engineer';

    const bug = dbStore.saveBug(req.body, projectKey, String(actorName));
    res.status(201).json({ success: true, data: bug });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/bugs/:id - Full update of a bug
router.put('/:id', (req: Request, res: Response) => {
  try {
    const existing = dbStore.getBug(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bug defect not found' });
    }

    const project = dbStore.getProject(req.body.projectId || existing.projectId);
    const projectKey = project?.key || 'QA';
    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Engineer';

    const updated = dbStore.saveBug({
      ...req.body,
      id: req.params.id,
    }, projectKey, String(actorName));

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/bugs/:id/status - Quick status transition
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { status, resolutionNotes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Engineer';
    const updated = dbStore.updateBugStatus(
      req.params.id, 
      status as BugStatus, 
      String(actorName), 
      resolutionNotes
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Bug defect not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/bugs/:id - Delete a bug
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const actorName = req.body?.actorName || req.headers['x-user-name'] || 'QA Engineer';
    const deleted = dbStore.deleteBug(req.params.id, String(actorName));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Bug defect not found' });
    }

    res.json({ success: true, message: 'Bug defect deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
