import { Router, Request, Response } from 'express';
import { analyzeBugDefect, generateTestCasesFromStory } from '../gemini';

const router = Router();

// POST /api/ai/analyze-defect - AI QA analysis of a defect report
router.post('/analyze-defect', async (req: Request, res: Response) => {
  try {
    const { title, description, stepsToReproduce, expectedResult, actualResult, environment } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required for AI analysis' });
    }

    const analysis = await analyzeBugDefect({
      title,
      description,
      stepsToReproduce,
      expectedResult,
      actualResult,
      environment,
    });

    res.json({ success: true, data: analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/generate-test-cases - AI Test Case Generator
router.post('/generate-test-cases', async (req: Request, res: Response) => {
  try {
    const { requirement, projectKey } = req.body;
    if (!requirement) {
      return res.status(400).json({ success: false, message: 'Requirement or user story text is required' });
    }

    const testCases = await generateTestCasesFromStory(requirement, projectKey || 'QA');
    res.json({ success: true, count: testCases.length, data: testCases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
