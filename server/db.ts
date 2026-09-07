import { 
  Project, 
  Bug, 
  TestPlan, 
  TestCase, 
  TestRun, 
  Comment, 
  Activity, 
  TeamMember,
  BugStatus
} from '../src/types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_BUGS, 
  INITIAL_TEST_PLANS, 
  INITIAL_TEST_CASES, 
  INITIAL_TEST_RUNS, 
  INITIAL_COMMENTS, 
  INITIAL_ACTIVITIES,
  INITIAL_TEAM_MEMBERS 
} from '../src/data/seedData';

class BackendDatabase {
  private projects: Map<string, Project> = new Map();
  private bugs: Map<string, Bug> = new Map();
  private testPlans: Map<string, TestPlan> = new Map();
  private testCases: Map<string, TestCase> = new Map();
  private testRuns: Map<string, TestRun> = new Map();
  private comments: Map<string, Comment> = new Map();
  private activities: Activity[] = [];
  private teamMembers: TeamMember[] = [];

  constructor() {
    this.seed();
  }

  public seed() {
    this.projects.clear();
    this.bugs.clear();
    this.testPlans.clear();
    this.testCases.clear();
    this.testRuns.clear();
    this.comments.clear();
    this.activities = [];

    INITIAL_PROJECTS.forEach(p => this.projects.set(p.id, { ...p }));
    INITIAL_BUGS.forEach(b => this.bugs.set(b.id, { ...b }));
    INITIAL_TEST_PLANS.forEach(tp => this.testPlans.set(tp.id, { ...tp }));
    INITIAL_TEST_CASES.forEach(tc => this.testCases.set(tc.id, { ...tc }));
    INITIAL_TEST_RUNS.forEach(tr => this.testRuns.set(tr.id, { ...tr }));
    INITIAL_COMMENTS.forEach(c => this.comments.set(c.id, { ...c }));
    this.activities = [...INITIAL_ACTIVITIES];
    this.teamMembers = [...INITIAL_TEAM_MEMBERS];
  }

  // --- Projects ---
  public getProjects(): Project[] {
    return Array.from(this.projects.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  public saveProject(data: Partial<Project>, actorName = 'System'): Project {
    const isNew = !data.id || !this.projects.has(data.id);
    const id = data.id || `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const existing = this.projects.get(id);
    const project: Project = {
      id,
      name: data.name || existing?.name || 'Untitled Project',
      key: (data.key || existing?.key || 'QA').toUpperCase(),
      description: data.description ?? existing?.description ?? '',
      color: data.color || existing?.color || '#3b82f6',
      lead: data.lead || existing?.lead || actorName,
      targetVersion: data.targetVersion ?? existing?.targetVersion ?? 'v1.0.0',
      status: data.status || existing?.status || 'active',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.projects.set(id, project);

    this.logActivity({
      entityType: 'project',
      entityId: id,
      entityTitle: `[${project.key}] ${project.name}`,
      actionType: isNew ? 'created' : 'updated',
      actorName,
      actorRole: 'QA Lead',
      details: isNew ? `Created QA project repository ${project.name}` : `Updated settings for ${project.name}`,
      projectId: id,
    });

    return project;
  }

  public deleteProject(id: string, actorName = 'System'): boolean {
    const project = this.projects.get(id);
    if (!project) return false;

    this.projects.delete(id);

    // Cascading delete for all associated resources
    const projectBugs = Array.from(this.bugs.values()).filter(b => b.projectId === id);
    projectBugs.forEach(b => {
      this.deleteBug(b.id, actorName);
    });

    const projectPlans = Array.from(this.testPlans.values()).filter(tp => tp.projectId === id);
    projectPlans.forEach(tp => {
      this.deleteTestPlan(tp.id, actorName);
    });

    const projectCases = Array.from(this.testCases.values()).filter(tc => tc.projectId === id);
    projectCases.forEach(tc => {
      this.deleteTestCase(tc.id, actorName);
    });

    const projectRuns = Array.from(this.testRuns.values()).filter(tr => tr.projectId === id);
    projectRuns.forEach(tr => {
      this.deleteTestRun(tr.id, actorName);
    });

    this.logActivity({
      entityType: 'project',
      entityId: id,
      entityTitle: `[${project.key}] ${project.name}`,
      actionType: 'deleted',
      actorName,
      actorRole: 'QA Lead',
      details: `Deleted QA project repository ${project.name} and cascaded child defects & test suites`,
      projectId: id,
    });

    return true;
  }

  // --- Bugs ---
  public getBugs(projectId?: string): Bug[] {
    let list = Array.from(this.bugs.values());
    if (projectId && projectId !== 'all') {
      list = list.filter(b => b.projectId === projectId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getBug(id: string): Bug | undefined {
    return this.bugs.get(id);
  }

  public saveBug(data: Partial<Bug>, projectKey = 'QA', actorName = 'System'): Bug {
    const isNew = !data.id || !this.bugs.has(data.id);
    const id = data.id || `bug-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const existing = this.bugs.get(id);

    const projectBugs = Array.from(this.bugs.values()).filter(b => b.projectId === data.projectId);
    const bugNum = isNew 
      ? `${projectKey}-BUG-${projectBugs.length + 101}` 
      : (existing?.bugNumber || `${projectKey}-BUG-100`);

    const bug: Bug = {
      id,
      projectId: data.projectId || existing?.projectId || '',
      bugNumber: data.bugNumber || existing?.bugNumber || bugNum,
      title: data.title || existing?.title || 'Untitled Bug',
      description: data.description ?? existing?.description ?? '',
      stepsToReproduce: data.stepsToReproduce ?? existing?.stepsToReproduce ?? '',
      expectedResult: data.expectedResult ?? existing?.expectedResult ?? '',
      actualResult: data.actualResult ?? existing?.actualResult ?? '',
      severity: data.severity || existing?.severity || 'medium',
      priority: data.priority || existing?.priority || 'P2',
      status: data.status || existing?.status || 'open',
      environment: data.environment || existing?.environment || 'staging',
      assignedTo: data.assignedTo || existing?.assignedTo || actorName,
      reportedBy: data.reportedBy || existing?.reportedBy || actorName,
      testCaseId: data.testCaseId ?? existing?.testCaseId,
      testPlanId: data.testPlanId ?? existing?.testPlanId,
      tags: data.tags || existing?.tags || [],
      resolutionNotes: data.resolutionNotes ?? existing?.resolutionNotes,
      resolvedAt: data.status === 'resolved' || data.status === 'closed' 
        ? (existing?.resolvedAt || now) 
        : undefined,
      reproductionUrl: data.reproductionUrl ?? existing?.reproductionUrl,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.bugs.set(id, bug);

    this.logActivity({
      entityType: 'bug',
      entityId: id,
      entityTitle: `${bug.bugNumber}: ${bug.title}`,
      actionType: isNew ? 'created' : (existing?.status !== bug.status ? 'status_changed' : 'updated'),
      actorName,
      actorRole: 'QA Engineer',
      details: isNew 
        ? `Reported defect [${bug.severity.toUpperCase()}/${bug.priority}] in ${bug.environment}` 
        : `Updated defect status to ${bug.status.toUpperCase()}`,
      projectId: bug.projectId,
    });

    return bug;
  }

  public updateBugStatus(id: string, status: BugStatus, actorName = 'System', resolutionNotes?: string): Bug | undefined {
    const bug = this.bugs.get(id);
    if (!bug) return undefined;

    const now = new Date().toISOString();
    bug.status = status;
    bug.updatedAt = now;
    if (resolutionNotes) bug.resolutionNotes = resolutionNotes;
    if (status === 'resolved' || status === 'closed') {
      bug.resolvedAt = bug.resolvedAt || now;
    } else {
      bug.resolvedAt = undefined;
    }

    this.bugs.set(id, bug);

    this.logActivity({
      entityType: 'bug',
      entityId: id,
      entityTitle: `${bug.bugNumber}: ${bug.title}`,
      actionType: status === 'resolved' ? 'resolved' : 'status_changed',
      actorName,
      actorRole: 'QA Engineer',
      details: `Changed bug status to ${status.toUpperCase()}${resolutionNotes ? ` (${resolutionNotes})` : ''}`,
      projectId: bug.projectId,
    });

    return bug;
  }

  public deleteBug(id: string, actorName = 'System'): boolean {
    const bug = this.bugs.get(id);
    if (!bug) return false;

    this.bugs.delete(id);

    // Clean up all comments associated with this bug
    const commentIdsToDelete: string[] = [];
    this.comments.forEach((c, cId) => {
      if (c.entityId === id || c.bugId === id) {
        commentIdsToDelete.push(cId);
      }
    });
    commentIdsToDelete.forEach(cId => this.comments.delete(cId));

    this.logActivity({
      entityType: 'bug',
      entityId: id,
      entityTitle: `${bug.bugNumber}: ${bug.title}`,
      actionType: 'deleted',
      actorName,
      actorRole: 'QA Engineer',
      details: `Deleted bug ${bug.bugNumber}`,
      projectId: bug.projectId,
    });

    return true;
  }

  // --- Test Plans ---
  public getTestPlans(projectId?: string): TestPlan[] {
    let list = Array.from(this.testPlans.values());
    if (projectId && projectId !== 'all') {
      list = list.filter(tp => tp.projectId === projectId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTestPlan(id: string): TestPlan | undefined {
    return this.testPlans.get(id);
  }

  public saveTestPlan(data: Partial<TestPlan>, projectKey = 'QA', actorName = 'System'): TestPlan {
    const isNew = !data.id || !this.testPlans.has(data.id);
    const id = data.id || `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const existing = this.testPlans.get(id);

    const projectPlans = Array.from(this.testPlans.values()).filter(tp => tp.projectId === data.projectId);
    const planNum = isNew ? `${projectKey}-TP-0${projectPlans.length + 1}` : (existing?.planNumber || `${projectKey}-TP-01`);

    const plan: TestPlan = {
      id,
      projectId: data.projectId || existing?.projectId || '',
      planNumber: data.planNumber || existing?.planNumber || planNum,
      title: data.title || existing?.title || 'Untitled Test Plan',
      description: data.description ?? existing?.description ?? '',
      version: data.version || existing?.version || 'v1.0.0',
      status: data.status || existing?.status || 'active',
      startDate: data.startDate || existing?.startDate || now.slice(0, 10),
      endDate: data.endDate || existing?.endDate || now.slice(0, 10),
      objectives: data.objectives ?? existing?.objectives ?? '',
      scope: data.scope ?? existing?.scope ?? '',
      createdBy: data.createdBy || existing?.createdBy || actorName,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.testPlans.set(id, plan);

    this.logActivity({
      entityType: 'testPlan',
      entityId: id,
      entityTitle: `${plan.planNumber}: ${plan.title}`,
      actionType: isNew ? 'created' : 'updated',
      actorName,
      actorRole: 'QA Lead',
      details: isNew ? `Created test plan (${plan.version})` : `Updated test plan ${plan.planNumber}`,
      projectId: plan.projectId,
    });

    return plan;
  }

  public deleteTestPlan(id: string, actorName = 'System'): boolean {
    const plan = this.testPlans.get(id);
    if (!plan) return false;

    this.testPlans.delete(id);

    this.logActivity({
      entityType: 'testPlan',
      entityId: id,
      entityTitle: `${plan.planNumber}: ${plan.title}`,
      actionType: 'deleted',
      actorName,
      actorRole: 'QA Lead',
      details: `Deleted test plan ${plan.planNumber}`,
      projectId: plan.projectId,
    });

    return true;
  }

  // --- Test Cases ---
  public getTestCases(projectId?: string, testPlanId?: string): TestCase[] {
    let list = Array.from(this.testCases.values());
    if (projectId && projectId !== 'all') {
      list = list.filter(tc => tc.projectId === projectId);
    }
    if (testPlanId && testPlanId !== 'all') {
      list = list.filter(tc => tc.testPlanId === testPlanId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTestCase(id: string): TestCase | undefined {
    return this.testCases.get(id);
  }

  public saveTestCase(data: Partial<TestCase>, projectKey = 'QA', actorName = 'System'): TestCase {
    const isNew = !data.id || !this.testCases.has(data.id);
    const id = data.id || `tc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const existing = this.testCases.get(id);

    const projectCases = Array.from(this.testCases.values()).filter(tc => tc.projectId === data.projectId);
    const caseNum = isNew ? `${projectKey}-TC-${projectCases.length + 101}` : (existing?.caseNumber || `${projectKey}-TC-101`);

    const testCase: TestCase = {
      id,
      projectId: data.projectId || existing?.projectId || '',
      testPlanId: data.testPlanId ?? existing?.testPlanId,
      caseNumber: data.caseNumber || existing?.caseNumber || caseNum,
      title: data.title || existing?.title || 'Untitled Test Case',
      description: data.description ?? existing?.description ?? '',
      preconditions: data.preconditions ?? existing?.preconditions ?? '',
      steps: data.steps || existing?.steps || [],
      priority: data.priority || existing?.priority || 'medium',
      type: data.type || existing?.type || 'functional',
      status: data.status || existing?.status || 'untested',
      tags: data.tags || existing?.tags || [],
      createdBy: data.createdBy || existing?.createdBy || actorName,
      lastExecutedAt: data.lastExecutedAt ?? existing?.lastExecutedAt,
      lastExecutedBy: data.lastExecutedBy ?? existing?.lastExecutedBy,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.testCases.set(id, testCase);

    this.logActivity({
      entityType: 'testCase',
      entityId: id,
      entityTitle: `${testCase.caseNumber}: ${testCase.title}`,
      actionType: isNew ? 'created' : 'updated',
      actorName,
      actorRole: 'QA Tester',
      details: isNew ? `Created ${testCase.type} test case with ${testCase.steps.length} steps` : `Updated test case ${testCase.caseNumber}`,
      projectId: testCase.projectId,
    });

    return testCase;
  }

  public deleteTestCase(id: string, actorName = 'System'): boolean {
    const tc = this.testCases.get(id);
    if (!tc) return false;

    this.testCases.delete(id);

    this.logActivity({
      entityType: 'testCase',
      entityId: id,
      entityTitle: `${tc.caseNumber}: ${tc.title}`,
      actionType: 'deleted',
      actorName,
      actorRole: 'QA Tester',
      details: `Deleted test case ${tc.caseNumber}`,
      projectId: tc.projectId,
    });

    return true;
  }

  // --- Test Runs ---
  public getTestRuns(projectId?: string): TestRun[] {
    let list = Array.from(this.testRuns.values());
    if (projectId && projectId !== 'all') {
      list = list.filter(tr => tr.projectId === projectId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTestRun(id: string): TestRun | undefined {
    return this.testRuns.get(id);
  }

  public saveTestRun(data: Partial<TestRun>, projectKey = 'QA', actorName = 'System'): TestRun {
    const isNew = !data.id || !this.testRuns.has(data.id);
    const id = data.id || `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const existing = this.testRuns.get(id);

    const projectRuns = Array.from(this.testRuns.values()).filter(tr => tr.projectId === data.projectId);
    const runNum = isNew ? `${projectKey}-RUN-${projectRuns.length + 101}` : (existing?.runNumber || `${projectKey}-RUN-101`);

    const run: TestRun = {
      id,
      projectId: data.projectId || existing?.projectId || '',
      testPlanId: data.testPlanId ?? existing?.testPlanId,
      runNumber: data.runNumber || existing?.runNumber || runNum,
      title: data.title || existing?.title || 'Execution Run',
      description: data.description ?? existing?.description,
      environment: data.environment || existing?.environment || 'staging',
      executedBy: data.executedBy || existing?.executedBy || actorName,
      status: data.status || existing?.status || 'in_progress',
      totalCases: data.totalCases ?? existing?.totalCases ?? 0,
      passedCases: data.passedCases ?? existing?.passedCases ?? 0,
      failedCases: data.failedCases ?? existing?.failedCases ?? 0,
      blockedCases: data.blockedCases ?? existing?.blockedCases ?? 0,
      skippedCases: data.skippedCases ?? existing?.skippedCases ?? 0,
      caseResults: data.caseResults || existing?.caseResults || [],
      startedAt: data.startedAt || existing?.startedAt || now,
      completedAt: data.completedAt ?? existing?.completedAt,
      createdAt: existing?.createdAt || now,
    };

    this.testRuns.set(id, run);

    // Sync testCase statuses if results are recorded
    if (run.caseResults && run.caseResults.length > 0) {
      run.caseResults.forEach(res => {
        const tc = this.testCases.get(res.testCaseId);
        if (tc) {
          tc.status = res.status;
          tc.lastExecutedAt = res.executedAt || now;
          tc.lastExecutedBy = res.executedBy || actorName;
          this.testCases.set(tc.id, tc);
        }
      });
    }

    this.logActivity({
      entityType: 'testRun',
      entityId: id,
      entityTitle: `${run.runNumber}: ${run.title}`,
      actionType: isNew ? 'created' : 'executed',
      actorName,
      actorRole: 'QA Automation Lead',
      details: `${run.status === 'completed' ? 'Completed test run' : 'Started test execution'} (${run.passedCases}/${run.totalCases} Passed)`,
      projectId: run.projectId,
    });

    return run;
  }

  // --- Test Runs Deletion ---
  public deleteTestRun(id: string, actorName = 'System'): boolean {
    const run = this.testRuns.get(id);
    if (!run) return false;

    this.testRuns.delete(id);

    this.logActivity({
      entityType: 'testRun',
      entityId: id,
      entityTitle: `${run.runNumber}: ${run.title}`,
      actionType: 'deleted',
      actorName,
      actorRole: 'QA Automation Lead',
      details: `Deleted test execution run ${run.runNumber}`,
      projectId: run.projectId,
    });

    return true;
  }

  // --- Comments ---
  public deleteComment(id: string, actorName = 'System'): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;

    this.comments.delete(id);
    return true;
  }
  public getComments(entityId?: string): Comment[] {
    let list = Array.from(this.comments.values());
    if (entityId) {
      list = list.filter(c => c.entityId === entityId || c.bugId === entityId);
    }
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public saveComment(data: Partial<Comment>, actorName = 'System', actorRole = 'QA Engineer'): Comment {
    const id = data.id || `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const comment: Comment = {
      id,
      entityType: data.entityType || 'bug',
      entityId: data.entityId || data.bugId || '',
      bugId: data.bugId || data.entityId,
      authorName: data.authorName || actorName,
      authorRole: data.authorRole || actorRole,
      authorAvatar: data.authorAvatar,
      content: data.content || '',
      createdAt: data.createdAt || now,
    };

    this.comments.set(id, comment);

    this.logActivity({
      entityType: comment.entityType,
      entityId: comment.entityId,
      entityTitle: `Comment on ${comment.entityType} ${comment.entityId}`,
      actionType: 'commented',
      actorName: comment.authorName,
      actorRole: comment.authorRole,
      details: `Commented: "${comment.content.slice(0, 50)}${comment.content.length > 50 ? '...' : ''}"`,
    });

    return comment;
  }

  // --- Activities ---
  public getActivities(projectId?: string, limit = 50): Activity[] {
    let list = [...this.activities];
    if (projectId && projectId !== 'all') {
      list = list.filter(a => !a.projectId || a.projectId === projectId);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  public logActivity(activity: Omit<Activity, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) {
    const fullActivity: Activity = {
      id: activity.id || `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: activity.timestamp || new Date().toISOString(),
      ...activity,
    };
    this.activities.unshift(fullActivity);
    if (this.activities.length > 300) {
      this.activities = this.activities.slice(0, 300);
    }
  }

  // --- Team Members ---
  public getTeamMembers(): TeamMember[] {
    return this.teamMembers;
  }

  // --- Dashboard Aggregated Metrics ---
  public getDashboardStats(projectId?: string) {
    const bugs = this.getBugs(projectId);
    const testCases = this.getTestCases(projectId);
    const testRuns = this.getTestRuns(projectId);
    const projects = this.getProjects();

    const totalBugs = bugs.length;
    const openBugs = bugs.filter(b => b.status === 'open' || b.status === 'in_progress' || b.status === 'reopened').length;
    const resolvedBugs = bugs.filter(b => b.status === 'resolved' || b.status === 'closed').length;
    const criticalBugs = bugs.filter(b => (b.severity === 'critical' || b.priority === 'P0') && (b.status === 'open' || b.status === 'in_progress')).length;

    const totalCases = testCases.length;
    const passedCases = testCases.filter(tc => tc.status === 'passed').length;
    const failedCases = testCases.filter(tc => tc.status === 'failed').length;
    const blockedCases = testCases.filter(tc => tc.status === 'blocked').length;
    const untestedCases = testCases.filter(tc => tc.status === 'untested' || tc.status === 'skipped').length;

    const passRate = totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0;
    const resolutionRate = totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 100;

    const severityBreakdown = {
      critical: bugs.filter(b => b.severity === 'critical').length,
      high: bugs.filter(b => b.severity === 'high').length,
      medium: bugs.filter(b => b.severity === 'medium').length,
      low: bugs.filter(b => b.severity === 'low').length,
    };

    const statusBreakdown = {
      open: bugs.filter(b => b.status === 'open').length,
      in_progress: bugs.filter(b => b.status === 'in_progress').length,
      resolved: bugs.filter(b => b.status === 'resolved').length,
      closed: bugs.filter(b => b.status === 'closed').length,
      reopened: bugs.filter(b => b.status === 'reopened').length,
    };

    const projectDistribution = projects.map(proj => {
      const projBugs = this.getBugs(proj.id);
      const projCases = this.getTestCases(proj.id);
      const projResolved = projBugs.filter(b => b.status === 'resolved' || b.status === 'closed').length;
      return {
        projectId: proj.id,
        projectName: proj.name,
        projectKey: proj.key,
        color: proj.color,
        totalBugs: projBugs.length,
        pendingBugs: projBugs.length - projResolved,
        resolvedBugs: projResolved,
        totalTestCases: projCases.length,
        resolutionRate: projBugs.length > 0 ? Math.round((projResolved / projBugs.length) * 100) : 100,
      };
    });

    return {
      totalBugs,
      openBugs,
      resolvedBugs,
      criticalBugs,
      totalCases,
      passedCases,
      failedCases,
      blockedCases,
      untestedCases,
      passRate,
      resolutionRate,
      severityBreakdown,
      statusBreakdown,
      projectDistribution,
      totalRuns: testRuns.length,
      recentActivities: this.getActivities(projectId, 10),
    };
  }
}

export const dbStore = new BackendDatabase();
