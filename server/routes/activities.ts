import { Router, Request, Response } from 'express';
import { dbStore } from '../db';

const router = Router();

// GET /api/activities - Retrieve chronological audit log
router.get('/', (req: Request, res: Response) => {
  try {
    const { projectId, limit } = req.query;
    const max = limit ? parseInt(limit as string, 10) : 50;
    const activities = dbStore.getActivities(projectId as string, isNaN(max) ? 50 : max);
    res.json({ success: true, count: activities.length, data: activities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/activities - Record custom activity log
router.post('/', (req: Request, res: Response) => {
  try {
    const { entityType, entityId, entityTitle, actionType, actorName, actorRole, details, projectId } = req.body;
    if (!entityType || !entityId || !actionType) {
      return res.status(400).json({ success: false, message: 'entityType, entityId, and actionType are required' });
    }

    dbStore.logActivity({
      entityType,
      entityId,
      entityTitle: entityTitle || `${entityType} ${entityId}`,
      actionType,
      actorName: actorName || 'QA Member',
      actorRole: actorRole || 'QA Engineer',
      details: details || `Performed ${actionType} on ${entityType}`,
      projectId,
    });

    res.status(201).json({ success: true, message: 'Activity logged successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
