import { Router, Request, Response } from 'express';
import { dbStore } from '../db';

const router = Router();

// GET /api/comments - List comments (optional filter by entityId / bugId)
router.get('/', (req: Request, res: Response) => {
  try {
    const { entityId, bugId } = req.query;
    const comments = dbStore.getComments((entityId || bugId) as string);
    res.json({ success: true, count: comments.length, data: comments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/comments - Post a new comment
router.post('/', (req: Request, res: Response) => {
  try {
    const { entityId, bugId, content, authorName, authorRole } = req.body;
    if (!content || (!entityId && !bugId)) {
      return res.status(400).json({ success: false, message: 'Content and entityId/bugId are required' });
    }

    const comment = dbStore.saveComment(req.body, authorName, authorRole);
    res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/comments/:id - Delete a comment
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const actorName = req.body?.actorName || req.headers['x-user-name'] || 'QA Engineer';
    const deleted = dbStore.deleteComment(req.params.id, String(actorName));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
