import { Bug, Project, TestCase, TestPlan, TestRun, Comment, Activity } from '../types';

export const API_BASE = '/api';

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE}/projects`);
    const data = await res.json();
    return data.data || [];
  },

  saveProject: async (project: Partial<Project>, actorName?: string): Promise<Project> => {
    const isNew = !project.id;
    const url = isNew ? `${API_BASE}/projects` : `${API_BASE}/projects/${project.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
      body: JSON.stringify(project),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save project');
    return data.data;
  },

  deleteProject: async (id: string, actorName?: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete project');
  },

  // Bugs
  getBugs: async (params?: { projectId?: string; status?: string; severity?: string; priority?: string; search?: string }): Promise<Bug[]> => {
    const query = new URLSearchParams();
    if (params?.projectId && params.projectId !== 'all') query.append('projectId', params.projectId);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.severity && params.severity !== 'all') query.append('severity', params.severity);
    if (params?.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/bugs?${query.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  saveBug: async (bug: Partial<Bug>, projectKey?: string, actorName?: string): Promise<Bug> => {
    const isNew = !bug.id;
    const url = isNew ? `${API_BASE}/bugs` : `${API_BASE}/bugs/${bug.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
      body: JSON.stringify({ ...bug, projectKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save bug');
    return data.data;
  },

  updateBugStatus: async (id: string, status: string, resolutionNotes?: string, actorName?: string): Promise<Bug> => {
    const res = await fetch(`${API_BASE}/bugs/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
      body: JSON.stringify({ status, resolutionNotes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update bug status');
    return data.data;
  },

  deleteBug: async (id: string, actorName?: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/bugs/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete bug');
  },

  // Test Plans
  getTestPlans: async (projectId?: string): Promise<TestPlan[]> => {
    const query = projectId && projectId !== 'all' ? `?projectId=${projectId}` : '';
    const res = await fetch(`${API_BASE}/test-plans${query}`);
    const data = await res.json();
    return data.data || [];
  },

  saveTestPlan: async (plan: Partial<TestPlan>, projectKey?: string, actorName?: string): Promise<TestPlan> => {
    const isNew = !plan.id;
    const url = isNew ? `${API_BASE}/test-plans` : `${API_BASE}/test-plans/${plan.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
      body: JSON.stringify({ ...plan, projectKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save test plan');
    return data.data;
  },

  deleteTestPlan: async (id: string, actorName?: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/test-plans/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete test plan');
  },

  // Test Cases
  getTestCases: async (projectId?: string, testPlanId?: string): Promise<TestCase[]> => {
    const query = new URLSearchParams();
    if (projectId && projectId !== 'all') query.append('projectId', projectId);
    if (testPlanId && testPlanId !== 'all') query.append('testPlanId', testPlanId);

    const res = await fetch(`${API_BASE}/test-cases?${query.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  saveTestCase: async (testCase: Partial<TestCase>, projectKey?: string, actorName?: string): Promise<TestCase> => {
    const isNew = !testCase.id;
    const url = isNew ? `${API_BASE}/test-cases` : `${API_BASE}/test-cases/${testCase.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
      body: JSON.stringify({ ...testCase, projectKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save test case');
    return data.data;
  },

  deleteTestCase: async (id: string, actorName?: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/test-cases/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete test case');
  },

  // Test Runs
  getTestRuns: async (projectId?: string): Promise<TestRun[]> => {
    const query = projectId && projectId !== 'all' ? `?projectId=${projectId}` : '';
    const res = await fetch(`${API_BASE}/test-runs${query}`);
    const data = await res.json();
    return data.data || [];
  },

  saveTestRun: async (testRun: Partial<TestRun>, projectKey?: string, actorName?: string): Promise<TestRun> => {
    const res = await fetch(`${API_BASE}/test-runs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
      body: JSON.stringify({ ...testRun, projectKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to record test run');
    return data.data;
  },

  deleteTestRun: async (id: string, actorName?: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/test-runs/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete test run');
  },

  // Comments
  getComments: async (entityId?: string): Promise<Comment[]> => {
    const query = entityId ? `?entityId=${entityId}` : '';
    const res = await fetch(`${API_BASE}/comments${query}`);
    const data = await res.json();
    return data.data || [];
  },

  saveComment: async (comment: Partial<Comment>): Promise<Comment> => {
    const res = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to post comment');
    return data.data;
  },

  deleteComment: async (id: string, actorName?: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/comments/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(actorName ? { 'x-user-name': actorName } : {})
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete comment');
  },

  // Activities
  getActivities: async (projectId?: string, limit = 50): Promise<Activity[]> => {
    const query = new URLSearchParams();
    if (projectId && projectId !== 'all') query.append('projectId', projectId);
    query.append('limit', limit.toString());

    const res = await fetch(`${API_BASE}/activities?${query.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  // Stats
  getDashboardStats: async (projectId?: string) => {
    const query = projectId && projectId !== 'all' ? `?projectId=${projectId}` : '';
    const res = await fetch(`${API_BASE}/stats/dashboard${query}`);
    return res.json();
  },

  // AI Assistance
  analyzeDefect: async (bugData: { title: string; description?: string; stepsToReproduce?: string; expectedResult?: string; actualResult?: string; environment?: string }) => {
    const res = await fetch(`${API_BASE}/ai/analyze-defect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bugData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'AI analysis failed');
    return data.data;
  },

  generateTestCases: async (requirement: string, projectKey?: string) => {
    const res = await fetch(`${API_BASE}/ai/generate-test-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement, projectKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'AI test case generation failed');
    return data.data;
  },

  resetDemoData: async () => {
    const res = await fetch(`${API_BASE}/stats/reset-demo`, {
      method: 'POST',
    });
    return res.json();
  }
};
