import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  MinusCircle, 
  FileText, 
  Download, 
  Printer, 
  Plus, 
  CheckSquare, 
  Clock, 
  User, 
  Layers, 
  ShieldCheck, 
  Bug, 
  ChevronRight, 
  ArrowLeft,
  Share2,
  Sparkles,
  BarChart2,
  Trash2,
  X
} from 'lucide-react';
import { 
  TestRun, 
  Project, 
  TestPlan, 
  TestCase, 
  TestCaseStatus, 
  TestCaseExecutionResult, 
  QAEnvironment, 
  TeamMember, 
  Bug as BugType 
} from '../types';
import { formatDate, formatDateTime, formatRelativeTime } from '../lib/utils';

interface TestRunsAndReportsViewProps {
  testRuns: TestRun[];
  projects: Project[];
  testPlans: TestPlan[];
  testCases: TestCase[];
  bugs: BugType[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onSaveTestRun: (run: TestRun) => void;
  onDeleteTestRun?: (runId: string) => void;
  onReportDefectFromRun: (testCase: TestCase, actualResult?: string, notes?: string) => void;
  currentUser: TeamMember;
}

export const TestRunsAndReportsView: React.FC<TestRunsAndReportsViewProps> = ({
  testRuns,
  projects,
  testPlans,
  testCases,
  bugs,
  selectedProjectId,
  onSelectProject,
  onSaveTestRun,
  onDeleteTestRun,
  onReportDefectFromRun,
  currentUser,
}) => {
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentCaseIndex, setCurrentCaseIndex] = useState<number>(0);
  const [activeRunState, setActiveRunState] = useState<TestRun | null>(null);
  const [executionNote, setExecutionNote] = useState<string>('');
  const [actualResultInput, setActualResultInput] = useState<string>('');
  const [confirmDeleteRunId, setConfirmDeleteRunId] = useState<string | null>(null);

  // Wizard state for creating new test run
  const [isCreatingRun, setIsCreatingRun] = useState(false);
  const [runProjectId, setRunProjectId] = useState(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
  const [runPlanId, setRunPlanId] = useState('');
  const [runTitle, setRunTitle] = useState('');
  const [runEnv, setRunEnv] = useState<QAEnvironment>('staging');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  const validProjectIds = new Set(projects.map(p => p.id));

  // Filter test runs
  const filteredRuns = testRuns.filter(tr => {
    if (projects.length > 0 && (!tr.projectId || !validProjectIds.has(tr.projectId))) return false;
    if (selectedProjectId !== 'all' && tr.projectId !== selectedProjectId) return false;
    return true;
  });

  const availablePlans = testPlans.filter(tp => {
    if (projects.length > 0 && (!tp.projectId || !validProjectIds.has(tp.projectId))) return false;
    return tp.projectId === runProjectId;
  });
  
  const availableCases = testCases.filter(tc => {
    if (projects.length > 0 && (!tc.projectId || !validProjectIds.has(tc.projectId))) return false;
    if (tc.projectId !== runProjectId) return false;
    if (runPlanId && tc.testPlanId !== runPlanId) return false;
    return true;
  });

  // Open Wizard
  const handleOpenWizard = () => {
    const defaultProj = selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId;
    setRunProjectId(defaultProj);
    setRunPlanId('');
    setRunTitle(`QA Execution Cycle — ${new Date().toLocaleDateString()}`);
    setRunEnv('staging');
    
    // Select all available cases by default
    const defaultCases = testCases.filter(tc => tc.projectId === defaultProj).map(tc => tc.id);
    setSelectedCaseIds(defaultCases);
    setIsCreatingRun(true);
  };

  // Launch Execution Runner
  const handleLaunchRun = () => {
    if (selectedCaseIds.length === 0) {
      alert('Please select at least 1 test case to execute.');
      return;
    }

    const casesToRun = testCases.filter(tc => selectedCaseIds.includes(tc.id));
    const initialResults: TestCaseExecutionResult[] = casesToRun.map(tc => ({
      testCaseId: tc.id,
      testCaseTitle: tc.title,
      status: 'untested',
      executedAt: '',
      executedBy: '',
    }));

    const newRun: TestRun = {
      id: `run-${Date.now()}`,
      projectId: runProjectId,
      testPlanId: runPlanId || undefined,
      runNumber: `${projects.find(p => p.id === runProjectId)?.key || 'QA'}-RUN-${Math.floor(Math.random() * 899 + 100)}`,
      title: runTitle || 'Sprint Regression Run',
      environment: runEnv,
      executedBy: currentUser.name,
      status: 'in_progress',
      totalCases: casesToRun.length,
      passedCases: 0,
      failedCases: 0,
      blockedCases: 0,
      skippedCases: 0,
      caseResults: initialResults,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setActiveRunState(newRun);
    setCurrentCaseIndex(0);
    setExecutionNote('');
    setActualResultInput('');
    setIsCreatingRun(false);
    setIsExecuting(true);
  };

  // Record Step in Active Run
  const handleRecordCaseResult = (status: TestCaseStatus) => {
    if (!activeRunState) return;

    const currentCase = testCases.find(tc => tc.id === activeRunState.caseResults[currentCaseIndex]?.testCaseId);
    const updatedResults = [...activeRunState.caseResults];
    
    updatedResults[currentCaseIndex] = {
      ...updatedResults[currentCaseIndex],
      status,
      actualResult: actualResultInput || (status === 'passed' ? 'Verified working as expected.' : 'Failed to meet criteria.'),
      notes: executionNote,
      executedAt: new Date().toISOString(),
      executedBy: currentUser.name,
    };

    const passed = updatedResults.filter(r => r.status === 'passed').length;
    const failed = updatedResults.filter(r => r.status === 'failed').length;
    const blocked = updatedResults.filter(r => r.status === 'blocked').length;
    const skipped = updatedResults.filter(r => r.status === 'skipped').length;

    const isLastCase = currentCaseIndex >= activeRunState.caseResults.length - 1;

    const updatedRun: TestRun = {
      ...activeRunState,
      passedCases: passed,
      failedCases: failed,
      blockedCases: blocked,
      skippedCases: skipped,
      caseResults: updatedResults,
      ...(isLastCase ? { status: 'completed', completedAt: new Date().toISOString() } : {}),
    };

    setActiveRunState(updatedRun);
    onSaveTestRun(updatedRun);

    // If failed and tester wants to log bug
    if (status === 'failed' && currentCase) {
      onReportDefectFromRun(currentCase, actualResultInput, executionNote);
    }

    // Advance or finish
    if (!isLastCase) {
      setCurrentCaseIndex(currentCaseIndex + 1);
      setExecutionNote('');
      setActualResultInput('');
    } else {
      setIsExecuting(false);
      setSelectedRun(updatedRun);
    }
  };

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  // Export Report JSON
  const handleExportJSON = (run: TestRun) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(run, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `qa_report_${run.runNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* If Active Execution Mode */}
      {isExecuting && activeRunState && (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-6 shadow-xl space-y-6 animate-in fade-in">
          {/* Top Runner Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="animate-pulse flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono font-bold text-blue-600 uppercase">Live Test Execution Runner</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-mono text-slate-700">{activeRunState.runNumber}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{activeRunState.title}</h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Env: {activeRunState.environment}
              </span>
              <button
                type="button"
                onClick={() => setIsExecuting(false)}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                Pause / Exit
              </button>
            </div>
          </div>

          {/* Progress Bar & Counter */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Test Case <strong>{currentCaseIndex + 1}</strong> of <strong>{activeRunState.caseResults.length}</strong></span>
              <div className="flex gap-3 font-mono font-semibold">
                <span className="text-emerald-600">{activeRunState.passedCases} Passed</span>
                <span className="text-red-600">{activeRunState.failedCases} Failed</span>
                <span className="text-amber-600">{activeRunState.blockedCases} Blocked</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex border border-slate-200">
              <div 
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${(activeRunState.passedCases / activeRunState.totalCases) * 100}%` }}
              />
              <div 
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${(activeRunState.failedCases / activeRunState.totalCases) * 100}%` }}
              />
              <div 
                className="bg-amber-500 transition-all duration-300"
                style={{ width: `${(activeRunState.blockedCases / activeRunState.totalCases) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Test Case Card */}
          {(() => {
            const currentItem = activeRunState.caseResults[currentCaseIndex];
            const currentCase = testCases.find(tc => tc.id === currentItem?.testCaseId);

            if (!currentCase) return null;

            return (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {currentCase.caseNumber}
                  </span>
                  <span className="text-xs uppercase font-mono text-slate-500">{currentCase.type} • {currentCase.priority} priority</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {currentCase.title}
                </h3>

                {currentCase.preconditions && (
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs">
                    <strong className="text-slate-500 block mb-0.5">Preconditions:</strong>
                    <span className="text-slate-800">{currentCase.preconditions}</span>
                  </div>
                )}

                {/* Steps */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Steps to Validate:</h4>
                  <div className="space-y-2">
                    {currentCase.steps && currentCase.steps.map(s => (
                      <div key={s.stepNumber} className="p-3 rounded-lg bg-white border border-slate-200 text-xs flex items-start gap-3">
                        <span className="font-mono font-bold text-blue-600">{s.stepNumber}.</span>
                        <div className="flex-1">
                          <p className="text-slate-900 font-medium">{s.action}</p>
                          <p className="text-emerald-700 font-medium mt-0.5">↳ Expected: {s.expectedResult}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Observed Result (Optional)
                    </label>
                    <input
                      type="text"
                      value={actualResultInput}
                      onChange={(e) => setActualResultInput(e.target.value)}
                      placeholder="e.g. Returned 200 OK with order confirmation #8812"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Tester Execution Notes
                    </label>
                    <input
                      type="text"
                      value={executionNote}
                      onChange={(e) => setExecutionNote(e.target.value)}
                      placeholder="e.g. Tested on Safari 17.2 & Chrome 124"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Gate Decision Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    {currentCaseIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentCaseIndex(currentCaseIndex - 1)}
                        className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                      >
                        Previous Step
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleRecordCaseResult('skipped')}
                      className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <MinusCircle className="w-4 h-4" /> Skip
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRecordCaseResult('blocked')}
                      className="px-3 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <AlertOctagon className="w-4 h-4" /> Block
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRecordCaseResult('failed')}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Mark Failed
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRecordCaseResult('passed')}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Passed & Continue
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Main View: Test Runs Table & Selected Test Report */}
      {!isExecuting && (
        <>
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-blue-600" />
                  <span>Test Runs & Execution Reports</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {filteredRuns.length} {filteredRuns.length === 1 ? 'run' : 'runs'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Execute live QA test suites, record verification results, and generate comprehensive audit reports.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                ))}
              </select>

              <button
                id="start-new-run-btn"
                type="button"
                onClick={handleOpenWizard}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <Play className="w-4 h-4" />
                <span>New Test Run</span>
              </button>
            </div>
          </div>

          {/* Test Runs History Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRuns.map(run => {
              const project = projects.find(p => p.id === run.projectId);
              const plan = testPlans.find(tp => tp.id === run.testPlanId);
              const total = run.totalCases || 1;
              const passPct = Math.round((run.passedCases / total) * 100);
              const isSelected = selectedRun?.id === run.id;

              return (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className={`p-6 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {run.runNumber}
                      </span>
                      <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {run.environment}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {run.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color || '#3b82f6' }} />
                        {project?.name}
                      </span>
                      {plan && <span>• {plan.version}</span>}
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {/* Visual Pass Rate */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">{run.passedCases}/{run.totalCases} Passed</span>
                        <span className={`font-mono font-bold ${passPct >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {passPct}% Pass Rate
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex border border-slate-200">
                        <div className="bg-emerald-500 h-full" style={{ width: `${passPct}%` }} />
                        <div className="bg-red-500 h-full" style={{ width: `${Math.round((run.failedCases / total) * 100)}%` }} />
                        <div className="bg-amber-500 h-full" style={{ width: `${Math.round((run.blockedCases / total) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Tester: <strong className="text-slate-700">{run.executedBy}</strong></span>
                      <span>{formatDate(run.createdAt)}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                        run.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {run.status.replace('_', ' ')}
                      </span>

                      <div className="flex items-center gap-2">
                        {onDeleteTestRun && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteRunId(run.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete test run"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRun(run);
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Report
                        </button>
                      </div>
                    </div>

                    {confirmDeleteRunId === run.id && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs text-red-800 font-medium">Delete this test run history?</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteTestRun) onDeleteTestRun(run.id);
                              if (selectedRun?.id === run.id) setSelectedRun(null);
                              setConfirmDeleteRunId(null);
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteRunId(null)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DETAILED TEST REPORT DRAWER / CARD */}
          {selectedRun && (
            <div id="qa-report-container" className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-lg space-y-6 animate-in slide-in-from-bottom-2">
              
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {selectedRun.runNumber}
                    </span>
                    <span className="text-xs uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Official QA Test Report
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{selectedRun.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Executed by {selectedRun.executedBy} on {formatDateTime(selectedRun.createdAt)} • Environment: <span className="uppercase font-mono text-slate-800">{selectedRun.environment}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onDeleteTestRun && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete test run ${selectedRun.runNumber}?`)) {
                          onDeleteTestRun(selectedRun.id);
                          setSelectedRun(null);
                        }
                      }}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Delete Test Run"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleExportJSON(selectedRun)}
                    className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                    title="Export JSON Report"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={handlePrintReport}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    title="Print / Save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Cases</span>
                  <span className="text-2xl font-extrabold text-slate-900">{selectedRun.totalCases}</span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Passed</span>
                  <span className="text-2xl font-extrabold text-emerald-600">{selectedRun.passedCases}</span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 block">Failed</span>
                  <span className="text-2xl font-extrabold text-red-600">{selectedRun.failedCases}</span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">Pass Rate</span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    {Math.round((selectedRun.passedCases / (selectedRun.totalCases || 1)) * 100)}%
                  </span>
                </div>
              </div>

              {/* Detailed Test Results Table */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Executed Case Matrix ({selectedRun.caseResults?.length || 0})</span>
                </h3>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Test Case</th>
                        <th className="py-3 px-4">Result</th>
                        <th className="py-3 px-4">Observed Output / Notes</th>
                        <th className="py-3 px-4">Logged Defect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedRun.caseResults && selectedRun.caseResults.map((cr, idx) => {
                        const tc = testCases.find(t => t.id === cr.testCaseId);
                        const isPass = cr.status === 'passed';
                        const isFail = cr.status === 'failed';

                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 max-w-sm">
                              <span className="font-mono text-blue-600 font-bold block">{tc?.caseNumber || 'TC'}</span>
                              <p className="font-semibold text-slate-900 mt-0.5">{cr.testCaseTitle}</p>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isFail
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {cr.status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-slate-700">
                              <p>{cr.actualResult || '—'}</p>
                              {cr.notes && <p className="text-slate-400 text-[11px] mt-0.5">Note: {cr.notes}</p>}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              {cr.defectBugNumber ? (
                                <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1 w-fit">
                                  <Bug className="w-3 h-3" />
                                  {cr.defectBugNumber}
                                </span>
                              ) : isFail ? (
                                <button
                                  onClick={() => tc && onReportDefectFromRun(tc, cr.actualResult, cr.notes)}
                                  className="px-2 py-1 rounded bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 text-xs font-semibold flex items-center gap-1 transition-all"
                                >
                                  <Bug className="w-3 h-3" /> Log Bug
                                </button>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* Test Run Wizard Modal */}
      {isCreatingRun && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 md:p-10 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-blue-600" />
                <span>Configure New Test Execution Cycle</span>
              </h2>
              <button
                onClick={() => setIsCreatingRun(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Project *</label>
                  <select
                    value={runProjectId}
                    onChange={(e) => {
                      setRunProjectId(e.target.value);
                      setRunPlanId('');
                      const cases = testCases.filter(tc => tc.projectId === e.target.value).map(tc => tc.id);
                      setSelectedCaseIds(cases);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Target Environment *</label>
                  <select
                    value={runEnv}
                    onChange={(e) => setRunEnv(e.target.value as QAEnvironment)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="staging">Staging (Pre-release)</option>
                    <option value="qa">QA Test Server</option>
                    <option value="production">Production Smoke Test</option>
                    <option value="dev">Local Dev</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Run Title *</label>
                <input
                  type="text"
                  required
                  value={runTitle}
                  onChange={(e) => setRunTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Link to Test Plan (Optional)</label>
                <select
                  value={runPlanId}
                  onChange={(e) => {
                    setRunPlanId(e.target.value);
                    if (e.target.value) {
                      const matched = testCases.filter(tc => tc.testPlanId === e.target.value).map(tc => tc.id);
                      setSelectedCaseIds(matched);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All project cases</option>
                  {availablePlans.map(tp => (
                    <option key={tp.id} value={tp.id}>{tp.planNumber} — {tp.title}</option>
                  ))}
                </select>
              </div>

              {/* Cases selector checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Select Test Cases to Include ({selectedCaseIds.length}/{availableCases.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCaseIds.length === availableCases.length) {
                        setSelectedCaseIds([]);
                      } else {
                        setSelectedCaseIds(availableCases.map(c => c.id));
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    {selectedCaseIds.length === availableCases.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-1">
                  {availableCases.map(tc => {
                    const isChecked = selectedCaseIds.includes(tc.id);
                    return (
                      <label key={tc.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCaseIds([...selectedCaseIds, tc.id]);
                            } else {
                              setSelectedCaseIds(selectedCaseIds.filter(id => id !== tc.id));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-mono text-blue-600 font-bold">{tc.caseNumber}</span>
                        <span className="text-slate-800 truncate flex-1">{tc.title}</span>
                        <span className="text-[10px] uppercase text-slate-400 font-mono">{tc.type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingRun(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLaunchRun}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Live Execution</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
