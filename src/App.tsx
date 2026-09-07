import React, { useState, useEffect, useCallback } from 'react';
import { 
  Project, 
  Bug, 
  TestPlan, 
  TestCase, 
  TestRun, 
  Comment,
  Activity, 
  TeamMember, 
  ViewTab, 
  BugStatus, 
  TestCaseStatus 
} from './types';
import { 
  subscribeProjects, 
  subscribeBugs, 
  subscribeTestPlans, 
  subscribeTestCases, 
  subscribeTestRuns, 
  subscribeComments,
  subscribeActivities, 
  saveBug, 
  deleteBug, 
  saveComment, 
  saveProject, 
  deleteProject,
  saveTestPlan, 
  deleteTestPlan, 
  saveTestCase, 
  deleteTestCase, 
  saveTestRun, 
  deleteTestRun,
  deleteComment,
  logActivity 
} from './lib/firebase';
import { INITIAL_TEAM_MEMBERS, INITIAL_PROJECTS, INITIAL_BUGS, INITIAL_TEST_PLANS, INITIAL_TEST_CASES, INITIAL_TEST_RUNS, INITIAL_ACTIVITIES, INITIAL_COMMENTS } from './data/seedData';

// Subcomponents
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BugsList } from './components/BugsList';
import { BugDetailModal } from './components/BugDetailModal';
import { BugFormModal } from './components/BugFormModal';
import { TestPlansView } from './components/TestPlansView';
import { TestCasesView } from './components/TestCasesView';
import { TestRunsAndReportsView } from './components/TestRunsAndReportsView';
import { TeamActivityFeed } from './components/TeamActivityFeed';
import { ProjectModal } from './components/ProjectModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function App() {
  // Navigation & User State
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<TeamMember>(INITIAL_TEAM_MEMBERS[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Core Data Collections
  const [projects, setProjects] = useState<Project[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [viewingBugId, setViewingBugId] = useState<string | null>(null);
  const [isBugFormOpen, setIsBugFormOpen] = useState<boolean>(false);
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // 1. Subscribe to all data streams (Firestore with local fallback)
  useEffect(() => {
    setIsLoading(true);

    const unsubProjects = subscribeProjects((data) => setProjects(data));
    const unsubBugs = subscribeBugs((data) => setBugs(data));
    const unsubTestPlans = subscribeTestPlans((data) => setTestPlans(data));
    const unsubTestCases = subscribeTestCases((data) => setTestCases(data));
    const unsubTestRuns = subscribeTestRuns((data) => setTestRuns(data));
    const unsubComments = subscribeComments((data) => setComments(data));
    const unsubActivities = subscribeActivities((data) => {
      setActivities(data);
      setIsLoading(false);
    });

    return () => {
      unsubProjects();
      unsubBugs();
      unsubTestPlans();
      unsubTestCases();
      unsubTestRuns();
      unsubComments();
      unsubActivities();
    };
  }, []);

  // Bug Actions Handlers
  const handleOpenNewBugModal = (prefillData?: Partial<Bug>) => {
    if (prefillData) {
      setEditingBug(prefillData as Bug);
    } else {
      setEditingBug(null);
    }
    setIsBugFormOpen(true);
  };

  const handleEditBug = (bug: Bug) => {
    setEditingBug(bug);
    setIsBugFormOpen(true);
  };

  const handleSaveBug = async (bugData: Partial<Bug>) => {
    try {
      const isNew = !bugData.id;
      const targetProj = projects.find(p => p.id === (bugData.projectId || selectedProjectId));
      const projectKey = targetProj?.key || 'QA';

      const saved = await saveBug(bugData, projectKey, currentUser);
      
      setBugs(prev => {
        const exists = prev.some(b => b.id === saved.id);
        if (exists) return prev.map(b => b.id === saved.id ? saved : b);
        return [saved, ...prev];
      });

      setIsBugFormOpen(false);
      setEditingBug(null);

      // If we are in detail view of this bug, keep it fresh
      if (viewingBugId === saved.id) {
        setViewingBugId(saved.id);
      }

      showToast(
        isNew 
          ? `Defect ${saved.bugNumber} created and assigned to ${saved.assignedTo}` 
          : `Defect ${saved.bugNumber} updated successfully!`,
        'success'
      );
    } catch (err: any) {
      console.error('Save bug failed:', err);
      showToast(`Error saving bug: ${err?.message || 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteBug = async (bugId: string) => {
    try {
      const bug = bugs.find(b => b.id === bugId);
      // Optimistic update
      setBugs(prev => prev.filter(b => b.id !== bugId));
      if (viewingBugId === bugId) {
        setViewingBugId(null);
      }
      await deleteBug(bugId, bug?.projectId, currentUser);
      showToast(`Defect ${bug?.bugNumber || ''} removed from backlog.`, 'info');
    } catch (err: any) {
      console.error('Error deleting defect:', err);
      showToast(`Error deleting defect: ${err?.message || 'Unknown error'}`, 'error');
    }
  };

  const handleUpdateBugStatus = async (bugId: string, newStatus: BugStatus, resolutionNotes?: string) => {
    try {
      const bug = bugs.find(b => b.id === bugId);
      if (!bug) return;

      const updatedBug = {
        ...bug,
        status: newStatus,
        ...(resolutionNotes ? { resolutionNotes } : {}),
        ...(newStatus === 'resolved' || newStatus === 'closed' ? { resolvedAt: new Date().toISOString() } : {}),
      };

      setBugs(prev => prev.map(b => b.id === bugId ? updatedBug : b));

      await saveBug(
        updatedBug,
        projects.find(p => p.id === bug.projectId)?.key || 'QA',
        currentUser
      );

      showToast(`Defect ${bug.bugNumber} marked as ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err: any) {
      showToast(`Status update error: ${err?.message}`, 'error');
    }
  };

  const handleAddComment = async (commentPayload: Partial<Comment>) => {
    try {
      const bug = bugs.find(b => b.id === commentPayload.entityId);
      await saveComment(commentPayload.entityId || '', commentPayload.content || '', currentUser, bug?.projectId);
      showToast('Comment posted to defect thread.', 'success');
    } catch (err: any) {
      showToast('Failed to post comment.', 'error');
    }
  };

  // Test Plan Actions Handlers
  const handleSaveTestPlan = async (planData: Partial<TestPlan>) => {
    try {
      const isNew = !planData.id;
      const targetProj = projects.find(p => p.id === (planData.projectId || selectedProjectId));
      const projectKey = targetProj?.key || 'QA';

      const saved = await saveTestPlan(planData, projectKey, currentUser);
      setTestPlans(prev => {
        const exists = prev.some(p => p.id === saved.id);
        if (exists) return prev.map(p => p.id === saved.id ? saved : p);
        return [saved, ...prev];
      });
      showToast(isNew ? `Test Plan ${saved.planNumber} created!` : `Test Plan updated!`, 'success');
    } catch (err: any) {
      showToast(`Error saving test plan: ${err?.message}`, 'error');
    }
  };

  const handleDeleteTestPlan = async (planId: string) => {
    try {
      const plan = testPlans.find(p => p.id === planId);
      setTestPlans(prev => prev.filter(p => p.id !== planId));
      await deleteTestPlan(planId, plan?.projectId, currentUser);
      showToast(`Test Plan ${plan?.planNumber || ''} deleted.`, 'info');
    } catch (err: any) {
      showToast(`Error deleting test plan: ${err?.message}`, 'error');
    }
  };

  // Test Case Actions Handlers
  const handleSaveTestCase = async (caseData: Partial<TestCase>) => {
    try {
      const isNew = !caseData.id;
      const targetProj = projects.find(p => p.id === (caseData.projectId || selectedProjectId));
      const projectKey = targetProj?.key || 'QA';

      const saved = await saveTestCase(caseData, projectKey, currentUser);
      setTestCases(prev => {
        const exists = prev.some(c => c.id === saved.id);
        if (exists) return prev.map(c => c.id === saved.id ? saved : c);
        return [saved, ...prev];
      });
      showToast(isNew ? `Test Case ${saved.caseNumber} added!` : `Test Case updated!`, 'success');
    } catch (err: any) {
      showToast(`Error saving test case: ${err?.message}`, 'error');
    }
  };

  const handleDeleteTestCase = async (caseId: string) => {
    try {
      const tc = testCases.find(c => c.id === caseId);
      setTestCases(prev => prev.filter(c => c.id !== caseId));
      await deleteTestCase(caseId, tc?.projectId, currentUser);
      showToast(`Test case ${tc?.caseNumber || ''} removed.`, 'info');
    } catch (err: any) {
      showToast(`Error deleting test case: ${err?.message}`, 'error');
    }
  };

  const handleQuickUpdateCaseStatus = async (caseId: string, status: TestCaseStatus) => {
    try {
      const tc = testCases.find(c => c.id === caseId);
      if (!tc) return;

      await saveTestCase(
        {
          ...tc,
          status,
          lastExecutedAt: new Date().toISOString(),
          lastExecutedBy: currentUser.name,
        },
        projects.find(p => p.id === tc.projectId)?.key || 'QA',
        currentUser
      );

      showToast(`Test case ${tc.caseNumber} marked as ${status.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(`Error updating test case: ${err?.message}`, 'error');
    }
  };

  const handleReportBugFromTestCase = (tc: TestCase, actualResult?: string, notes?: string) => {
    const prefilledSteps = tc.steps && tc.steps.length > 0 
      ? tc.steps.map(s => `${s.stepNumber}. ${s.action} (Expected: ${s.expectedResult})`).join('\n')
      : '1. Execute test step\n2. Observe discrepancy';

    const prefilledBug: Partial<Bug> = {
      projectId: tc.projectId,
      testCaseId: tc.id,
      testPlanId: tc.testPlanId,
      title: `[Failed: ${tc.caseNumber}] ${tc.title}`,
      description: `Discovered during QA execution of test case ${tc.caseNumber}.\n\nPreconditions: ${tc.preconditions || 'None'}\n\nExecution Notes: ${notes || 'Test failed verification.'}`,
      stepsToReproduce: prefilledSteps,
      expectedResult: tc.steps?.[tc.steps.length - 1]?.expectedResult || 'Should pass all assertion steps.',
      actualResult: actualResult || 'Test validation failed unexpectedly.',
      severity: tc.priority === 'critical' ? 'critical' : tc.priority === 'high' ? 'high' : 'medium',
      priority: tc.priority === 'critical' ? 'P0' : tc.priority === 'high' ? 'P1' : 'P2',
      status: 'open',
      environment: 'staging',
      reportedBy: currentUser.name,
      assignedTo: 'Elena Rostova',
      tags: [...(tc.tags || []), 'failed-test-case', tc.type],
    };

    handleOpenNewBugModal(prefilledBug);
  };

  // Test Run Action Handlers
  const handleSaveTestRun = async (run: TestRun) => {
    try {
      await saveTestRun(run, currentUser);
      showToast(`Test run ${run.runNumber} progress saved!`, 'success');
    } catch (err: any) {
      showToast(`Error saving test run: ${err?.message}`, 'error');
    }
  };

  const handleDeleteTestRun = async (runId: string) => {
    try {
      const run = testRuns.find(r => r.id === runId);
      setTestRuns(prev => prev.filter(r => r.id !== runId));
      await deleteTestRun(runId, run?.projectId, currentUser);
      showToast(`Test run ${run?.runNumber || ''} deleted.`, 'info');
    } catch (err: any) {
      showToast(`Error deleting test run: ${err?.message}`, 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setComments(prev => prev.filter(c => c.id !== commentId));
      await deleteComment(commentId, currentUser);
      showToast('Comment deleted.', 'info');
    } catch (err: any) {
      showToast(`Error deleting comment: ${err?.message}`, 'error');
    }
  };

  // Project Actions Handlers
  const handleOpenNewProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (proj: Project) => {
    setEditingProject(proj);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (projectData: Partial<Project>) => {
    try {
      const isNew = !projectData.id;
      const saved = await saveProject(projectData, currentUser);
      setProjects(prev => {
        const exists = prev.some(p => p.id === saved.id);
        if (exists) return prev.map(p => p.id === saved.id ? saved : p);
        return [...prev, saved];
      });
      setIsProjectModalOpen(false);
      setEditingProject(null);
      showToast(isNew ? `Project "${saved.name}" initialized!` : `Project "${saved.name}" updated!`, 'success');
    } catch (err: any) {
      showToast(`Error saving project: ${err?.message}`, 'error');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const targetProj = projects.find(p => p.id === projectId);
      if (selectedProjectId === projectId) {
        setSelectedProjectId('all');
      }
      
      // Cascade delete across all state variables in React immediately
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setBugs(prev => prev.filter(b => b.projectId !== projectId));
      setTestPlans(prev => prev.filter(tp => tp.projectId !== projectId));
      setTestCases(prev => prev.filter(tc => tc.projectId !== projectId));
      setTestRuns(prev => prev.filter(tr => tr.projectId !== projectId));
      
      setIsProjectModalOpen(false);
      setEditingProject(null);

      await deleteProject(projectId, currentUser);
      showToast(`Project "${targetProj?.name || 'Project'}" and all associated artifacts permanently deleted.`, 'info');
    } catch (err: any) {
      showToast(`Error deleting project: ${err?.message}`, 'error');
    }
  };

  // Reset demo handler
  const handleResetDemoData = () => {
    localStorage.clear();
    showToast('Demo data reset to initial default state.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Active viewing bug object
  const activeViewingBug = bugs.find(b => b.id === viewingBugId) || null;
  const pendingBugsCount = bugs.filter(b => b.status === 'open' || b.status === 'in_progress').length;

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200 shadow-red-500/10'
              : toast.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-blue-500/10'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
          }`}>
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Sleek Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingBugsCount={pendingBugsCount}
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        onResetDemo={handleResetDemoData}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onOpenNewProject={handleOpenNewProject}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onOpenNewBug={() => handleOpenNewBugModal()}
          onOpenNewProject={handleOpenNewProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Dynamic Tab Views */}
            {currentTab === 'dashboard' && (
              <Dashboard
                projects={projects}
                bugs={bugs}
                testPlans={testPlans}
                testCases={testCases}
                testRuns={testRuns}
                activities={activities}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onSelectTab={setCurrentTab}
                onOpenNewBugModal={() => handleOpenNewBugModal()}
                onOpenNewBug={() => handleOpenNewBugModal()}
                onOpenBugDetail={(id) => setViewingBugId(id)}
                onSelectBug={(bug) => setViewingBugId(bug.id)}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
                onOpenNewProject={handleOpenNewProject}
                onDeleteBug={handleDeleteBug}
              />
            )}

            {currentTab === 'bugs' && (
              <BugsList
                bugs={bugs}
                projects={projects}
                testPlans={testPlans}
                testCases={testCases}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onSelectBug={(bug) => setViewingBugId(bug.id)}
                onOpenBugDetail={(id) => setViewingBugId(id)}
                onOpenNewBug={(projectId) => handleOpenNewBugModal(projectId ? { projectId } : undefined)}
                onOpenNewBugModal={(projectId) => handleOpenNewBugModal(projectId ? { projectId } : undefined)}
                onUpdateBugStatus={handleUpdateBugStatus}
                onQuickUpdateStatus={handleUpdateBugStatus}
                onDeleteBug={handleDeleteBug}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {currentTab === 'test_plans' && (
              <TestPlansView
                testPlans={testPlans}
                projects={projects}
                testCases={testCases}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onSaveTestPlan={handleSaveTestPlan}
                onDeleteTestPlan={handleDeleteTestPlan}
                onSelectTab={setCurrentTab}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'test_cases' && (
              <TestCasesView
                testCases={testCases}
                projects={projects}
                testPlans={testPlans}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onSaveTestCase={handleSaveTestCase}
                onDeleteTestCase={handleDeleteTestCase}
                onQuickUpdateStatus={handleQuickUpdateCaseStatus}
                onReportBugFromTestCase={handleReportBugFromTestCase}
                currentUser={currentUser}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {currentTab === 'test_reports' && (
              <TestRunsAndReportsView
                testRuns={testRuns}
                projects={projects}
                testPlans={testPlans}
                testCases={testCases}
                bugs={bugs}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onSaveTestRun={handleSaveTestRun}
                onDeleteTestRun={handleDeleteTestRun}
                onReportDefectFromRun={(tc, actual, notes) => handleReportBugFromTestCase(tc, actual, notes)}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'activity' && (
              <TeamActivityFeed
                activities={activities}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}

      {/* 1. Bug Detail & Discussion Modal */}
      {viewingBugId && activeViewingBug && (
        <BugDetailModal
          bug={activeViewingBug}
          projects={projects}
          testCases={testCases}
          testPlans={testPlans}
          comments={comments}
          currentUser={currentUser}
          onClose={() => setViewingBugId(null)}
          onEditBug={(bug) => {
            setViewingBugId(null);
            handleEditBug(bug);
          }}
          onDeleteBug={(id) => handleDeleteBug(id)}
          onUpdateStatus={(id, status, notes) => handleUpdateBugStatus(id, status, notes)}
          onAddComment={(commentPayload) => handleAddComment(commentPayload)}
          onDeleteComment={(commentId) => handleDeleteComment(commentId)}
          onNavigateToTestCase={(tcId) => {
            setCurrentTab('test_cases');
          }}
        />
      )}

      {/* 2. Bug Create / Edit Form Modal */}
      {isBugFormOpen && (
        <BugFormModal
          initialBug={editingBug}
          projects={projects}
          testCases={testCases}
          testPlans={testPlans}
          currentUser={currentUser}
          defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
          onClose={() => {
            setIsBugFormOpen(false);
            setEditingBug(null);
          }}
          onSave={handleSaveBug}
        />
      )}

      {/* 3. Project Creation / Edit Modal */}
      {isProjectModalOpen && (
        <ProjectModal
          initialProject={editingProject}
          currentUser={currentUser}
          onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
        />
      )}
    </div>
  );
}
