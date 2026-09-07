import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. AI features will return fallback recommendations.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export interface BugAnalysisRequest {
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  environment?: string;
}

export interface GeneratedTestCase {
  title: string;
  type: 'functional' | 'regression' | 'smoke' | 'security' | 'performance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  preconditions: string;
  steps: {
    stepNumber: number;
    action: string;
    expectedResult: string;
  }[];
}

export async function analyzeBugDefect(data: BugAnalysisRequest) {
  const ai = getGemini();
  if (!ai) {
    return {
      possibleRootCauses: [
        'Uncaught exception or asynchronous race condition during state lifecycle',
        'Payload validation failure or schema mismatch between client and backend',
        'Network timeout or unhandled edge-case error status code'
      ],
      suggestedSeverity: 'high',
      suggestedPriority: 'p1',
      enhancedSteps: data.stepsToReproduce || '1. Navigate to target screen\n2. Trigger input action\n3. Observe abnormal behavior',
      reproductionAdvice: 'Inspect browser devtools console logs and network response payload for error details.',
      testCaseRecommendations: [
        'Validate input bounds and null checks',
        'Verify retry mechanism and user-friendly error display on failure'
      ]
    };
  }

  try {
    const prompt = `You are an expert QA Lead and Principal Software Reliability Engineer.
Analyze the following reported bug defect and provide a structured JSON response.

Bug Title: ${data.title}
Bug Description: ${data.description || 'N/A'}
Steps to Reproduce: ${data.stepsToReproduce || 'N/A'}
Expected Result: ${data.expectedResult || 'N/A'}
Actual Result: ${data.actualResult || 'N/A'}
Environment: ${data.environment || 'N/A'}

Respond with ONLY valid JSON strictly adhering to this schema:
{
  "possibleRootCauses": ["string", "string", "string"],
  "suggestedSeverity": "critical" | "high" | "medium" | "low",
  "suggestedPriority": "p0" | "p1" | "p2" | "p3",
  "enhancedSteps": "string",
  "reproductionAdvice": "string",
  "testCaseRecommendations": ["string", "string"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error('Error analyzing bug with Gemini:', error);
  }

  return {
    possibleRootCauses: ['Unhandled asynchronous rejection or network state mismatch'],
    suggestedSeverity: 'high',
    suggestedPriority: 'p1',
    enhancedSteps: data.stepsToReproduce || '1. Reproduce issue with dev tools open',
    reproductionAdvice: 'Check backend server logs and network traces.',
    testCaseRecommendations: ['Add boundary test coverage for this workflow']
  };
}

export async function generateTestCasesFromStory(promptText: string, projectKey: string = 'QA'): Promise<GeneratedTestCase[]> {
  const ai = getGemini();
  if (!ai) {
    return [
      {
        title: `Verify happy path workflow for ${promptText.slice(0, 40)}`,
        type: 'functional',
        priority: 'high',
        preconditions: 'User is authenticated with valid credentials and network is stable',
        steps: [
          { stepNumber: 1, action: 'Navigate to target module and enter valid inputs', expectedResult: 'Form validates inputs in real-time' },
          { stepNumber: 2, action: 'Submit action', expectedResult: 'Success toast is shown and data is persisted' }
        ]
      },
      {
        title: `Verify edge cases and validation errors for ${promptText.slice(0, 40)}`,
        type: 'regression',
        priority: 'medium',
        preconditions: 'Form is in pristine state',
        steps: [
          { stepNumber: 1, action: 'Submit with empty or malformed parameters', expectedResult: 'Appropriate error validation message is displayed' },
          { stepNumber: 2, action: 'Verify system remains stable without unhandled exceptions', expectedResult: 'UI remains responsive' }
        ]
      }
    ];
  }

  try {
    const prompt = `You are a Senior QA Automation Architect.
Given the following feature requirement, user story, or acceptance criteria:
"${promptText}"

Generate a list of 3-5 comprehensive test cases (including happy path, edge cases, negative tests, and security/performance considerations).
Target Project Key: ${projectKey}

Return ONLY valid JSON with an array of test cases strictly adhering to this schema:
[
  {
    "title": "string",
    "type": "functional" | "regression" | "smoke" | "security" | "performance",
    "priority": "critical" | "high" | "medium" | "low",
    "preconditions": "string",
    "steps": [
      {
        "stepNumber": 1,
        "action": "string",
        "expectedResult": "string"
      }
    ]
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error('Error generating test cases with Gemini:', error);
  }

  return [
    {
      title: `Smoke test for ${promptText.slice(0, 40)}`,
      type: 'smoke',
      priority: 'high',
      preconditions: 'Environment is up and accessible',
      steps: [
        { stepNumber: 1, action: 'Access component', expectedResult: 'Component loads without console errors' }
      ]
    }
  ];
}
