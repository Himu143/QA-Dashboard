export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BugPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
export type QAEnvironment = 'production' | 'staging' | 'qa' | 'dev';

export type TestPlanStatus = 'draft' | 'active' | 'in_review' | 'completed';
export type TestCasePriority = 'critical' | 'high' | 'medium' | 'low';
export type TestCaseType = 'functional' | 'smoke' | 'regression' | 'integration' | 'performance' | 'security' | 'ui_ux';
export type TestCaseStatus = 'untested' | 'passed' | 'failed' | 'blocked' | 'skipped';

export type TestRunStatus = 'in_progress' | 'completed' | 'aborted';

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  lead: string;
  targetVersion?: string;
  status: 'active' | 'archived' | 'planning';
  createdAt: string;
  updatedAt: string;
}

export interface Bug {
  id: string;
  projectId: string;
  bugNumber: string; // e.g. "APX-BUG-101"
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: BugSeverity;
  priority: BugPriority;
  status: BugStatus;
  environment: QAEnvironment;
  assignedTo: string;
  reportedBy: string;
  testCaseId?: string;
  testPlanId?: string;
  tags: string[];
  resolutionNotes?: string;
  resolvedAt?: string;
  reproductionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
}

export interface TestCase {
  id: string;
  projectId: string;
  testPlanId?: string;
  caseNumber: string; // e.g. "APX-TC-042"
  title: string;
  description: string;
  preconditions: string;
  steps: TestStep[];
  priority: TestCasePriority;
  type: TestCaseType;
  status: TestCaseStatus;
  tags: string[];
  createdBy: string;
  lastExecutedAt?: string;
  lastExecutedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestPlan {
  id: string;
  projectId: string;
  planNumber: string; // e.g. "APX-TP-01"
  title: string;
  description: string;
  version: string;
  status: TestPlanStatus;
  startDate: string;
  endDate: string;
  objectives: string;
  scope: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCaseExecutionResult {
  testCaseId: string;
  testCaseTitle: string;
  status: TestCaseStatus;
  actualResult?: string;
  notes?: string;
  defectBugId?: string;
  defectBugNumber?: string;
  executedAt: string;
  executedBy: string;
}

export interface TestRun {
  id: string;
  projectId: string;
  testPlanId?: string;
  runNumber: string; // e.g. "APX-RUN-09"
  title: string;
  description?: string;
  environment: QAEnvironment;
  executedBy: string;
  status: TestRunStatus;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  blockedCases: number;
  skippedCases: number;
  caseResults: TestCaseExecutionResult[];
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  entityType: 'bug' | 'testCase' | 'testPlan' | 'testRun' | 'project';
  entityId: string;
  bugId?: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  projectId?: string;
  entityType: 'bug' | 'testCase' | 'testPlan' | 'testRun' | 'project';
  entityId: string;
  entityTitle: string;
  actionType: 'created' | 'updated' | 'status_changed' | 'resolved' | 'commented' | 'executed' | 'deleted';
  actorName: string;
  actorRole: string;
  details: string;
  timestamp: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'QA Lead' | 'Senior QA Tester' | 'Automation Engineer' | 'Frontend Dev' | 'Backend Dev' | 'Product Manager';
  avatarBg: string;
  email: string;
}

export type ViewTab = 'dashboard' | 'bugs' | 'test_plans' | 'test_cases' | 'test_runs' | 'test_reports' | 'activity';
