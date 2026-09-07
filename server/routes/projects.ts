import { Router, Request, Response } from 'express';
import { dbStore } from '../db';

const router = Router();

// GET /api/projects - List all projects
router.get('/', (req: Request, res: Response) => {
  try {
    const projects = dbStore.getProjects();
    res.json({ success: true, count: projects.length, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', (req: Request, res: Response) => {
  try {
    const project = dbStore.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/projects - Create new project
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, key, description, color, lead, targetVersion, status } = req.body;
    if (!name || !key) {
      return res.status(400).json({ success: false, message: 'Name and key are required' });
    }

    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Lead';
    const project = dbStore.saveProject({
      name,
      key: key.toUpperCase(),
      description,
      color,
      lead,
      targetVersion,
      status,
    }, String(actorName));

    res.status(201).json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/projects/:id - Update existing project
router.put('/:id', (req: Request, res: Response) => {
  try {
    const existing = dbStore.getProject(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const actorName = req.body.actorName || req.headers['x-user-name'] || 'QA Lead';
    const updated = dbStore.saveProject({
      ...req.body,
      id: req.params.id,
    }, String(actorName));

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const actorName = req.body?.actorName || req.headers['x-user-name'] || 'QA Lead';
    const deleted = dbStore.deleteProject(req.params.id, String(actorName));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
