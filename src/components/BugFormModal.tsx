import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bug, 
  AlertCircle, 
  Check, 
  Layers, 
  CheckSquare, 
  Tag, 
  User, 
  Cpu,
  Sparkles,
  Loader2,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { 
  Bug as BugType, 
  Project, 
  TestCase, 
  TestPlan, 
  TeamMember, 
  BugSeverity, 
  BugPriority, 
  BugStatus, 
  QAEnvironment 
} from '../types';
import { api } from '../lib/api';

interface BugFormModalProps {
  initialBug?: BugType | null;
  projects: Project[];
  testCases: TestCase[];
  testPlans: TestPlan[];
  currentUser: TeamMember;
  defaultProjectId?: string;
  onClose: () => void;
  onSave: (bugData: Partial<BugType>) => void;
}

export const BugFormModal: React.FC<BugFormModalProps> = ({
  initialBug,
  projects,
  testCases,
  testPlans,
  currentUser,
  defaultProjectId,
  onClose,
  onSave,
}) => {
  const [projectId, setProjectId] = useState<string>(
    initialBug?.projectId || defaultProjectId || (projects[0]?.id || 'proj-1')
  );
  const [title, setTitle] = useState(initialBug?.title || '');
  const [description, setDescription] = useState(initialBug?.description || '');
  const [stepsToReproduce, setStepsToReproduce] = useState(
    initialBug?.stepsToReproduce || '1. Navigate to feature\n2. Trigger action\n3. Observe defect'
  );
  const [expectedResult, setExpectedResult] = useState(initialBug?.expectedResult || '');
  const [actualResult, setActualResult] = useState(initialBug?.actualResult || '');
  const [severity, setSeverity] = useState<BugSeverity>(initialBug?.severity || 'high');
  const [priority, setPriority] = useState<BugPriority>(initialBug?.priority || 'P1');
  const [status, setStatus] = useState<BugStatus>(initialBug?.status || 'open');
  const [environment, setEnvironment] = useState<QAEnvironment>(initialBug?.environment || 'staging');
  const [assignedTo, setAssignedTo] = useState(initialBug?.assignedTo || 'Elena Rostova');
  const [reportedBy, setReportedBy] = useState(initialBug?.reportedBy || currentUser.name);
  const [testPlanId, setTestPlanId] = useState<string>(initialBug?.testPlanId || '');
  const [testCaseId, setTestCaseId] = useState<string>(initialBug?.testCaseId || '');
  const [tagsString, setTagsString] = useState(initialBug?.tags?.join(', ') || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    possibleRootCauses?: string[];
    suggestedSeverity?: string;
    suggestedPriority?: string;
    enhancedSteps?: string;
    reproductionAdvice?: string;
    testCaseRecommendations?: string[];
  } | null>(null);

  // Sync valid project if current projectId is not in list
  useEffect(() => {
    if (projects.length > 0 && !projects.some(p => p.id === projectId)) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  // Filter test plans & test cases for selected project
  const availableTestPlans = testPlans.filter(tp => tp.projectId === projectId);
  const availableTestCases = testCases.filter(tc => tc.projectId === projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a descriptive defect title.');
      return;
    }

    const safeSteps = stepsToReproduce.trim() || '1. Navigate to feature\n2. Trigger action\n3. Observe defect';

    const tags = tagsString
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await onSave({
        ...(initialBug?.id ? { id: initialBug.id, bugNumber: initialBug.bugNumber } : {}),
        projectId: projectId || (projects[0]?.id || 'proj-1'),
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: safeSteps,
        expectedResult: expectedResult.trim(),
        actualResult: actualResult.trim(),
        severity,
        priority,
        status,
        environment,
        assignedTo: assignedTo.trim() || 'Elena Rostova',
        reportedBy: reportedBy.trim() || currentUser.name,
        testPlanId: testPlanId.trim() ? testPlanId : undefined,
        testCaseId: testCaseId.trim() ? testCaseId : undefined,
        tags: tags.length > 0 ? tags : ['defect'],
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit bug. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a bug summary/title first before requesting AI analysis.');
      return;
    }

    try {
      setIsAiAnalyzing(true);
      setErrorMsg('');
      const result = await api.analyzeDefect({
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim(),
        expectedResult: expectedResult.trim(),
        actualResult: actualResult.trim(),
        environment,
      });

      setAiAnalysisResult(result);

      // Auto-apply severity and priority if suggested
      if (result.suggestedSeverity) {
        setSeverity(result.suggestedSeverity.toLowerCase() as BugSeverity);
      }
      if (result.suggestedPriority) {
        setPriority(result.suggestedPriority.toUpperCase() as BugPriority);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI defect analysis failed. Please try again.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const applyEnhancedSteps = () => {
    if (aiAnalysisResult?.enhancedSteps) {
      setStepsToReproduce(aiAnalysisResult.enhancedSteps);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 md:p-10 animate-in fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialBug ? `Edit Defect: ${initialBug.bugNumber}` : 'Report New Software Defect'}
              </h2>
              <p className="text-xs text-slate-500">
                Log reproduction details, severity levels, and project assignment for QA tracking.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Project & Environment Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Target Project *
              </label>
              <select
                id="bug-form-project-select"
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setTestPlanId('');
                  setTestCaseId('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Environment *
              </label>
              <select
                id="bug-form-env-select"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as QAEnvironment)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="qa">QA / Test</option>
                <option value="dev">Local Development</option>
              </select>
            </div>
          </div>

          {/* Defect Title with AI Assist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">
                Bug Summary / Title *
              </label>
              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAiAnalyzing || !title.trim()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Use Gemini AI to analyze bug defect, suggest severity, priority, and root causes"
              >
                {isAiAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Analyze Defect</span>
                  </>
                )}
              </button>
            </div>
            <input
              id="bug-form-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3DS verification modal freezes during Apple Pay checkout"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          {/* AI Insights Card if available */}
          {aiAnalysisResult && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-200 text-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    AI Defect Intelligence
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">
                    Suggested: {aiAnalysisResult.suggestedSeverity?.toUpperCase()} / {aiAnalysisResult.suggestedPriority?.toUpperCase()}
                  </span>
                </div>
              </div>

              {aiAnalysisResult.possibleRootCauses && aiAnalysisResult.possibleRootCauses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    Possible Root Causes:
                  </p>
                  <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5 ml-1">
                    {aiAnalysisResult.possibleRootCauses.map((cause, idx) => (
                      <li key={idx}>{cause}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnalysisResult.reproductionAdvice && (
                <div className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-lg border border-indigo-100">
                  <span className="font-semibold text-slate-700">Reproduction Advice: </span>
                  {aiAnalysisResult.reproductionAdvice}
                </div>
              )}

              {aiAnalysisResult.enhancedSteps && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-indigo-700 font-medium">
                    Detailed reproduction steps generated by AI
                  </span>
                  <button
                    type="button"
                    onClick={applyEnhancedSteps}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded font-medium transition-colors"
                  >
                    Apply AI Steps to Form
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Severity & Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Severity *
              </label>
              <select
                id="bug-form-severity-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="critical">Critical (Blocker)</option>
                <option value="high">High (Major defect)</option>
                <option value="medium">Medium (Moderate impact)</option>
                <option value="low">Low (Trivial / cosmetic)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Priority *
              </label>
              <select
                id="bug-form-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as BugPriority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="P0">P0 - Fix Immediately</option>
                <option value="P1">P1 - Current Sprint</option>
                <option value="P2">P2 - Next Sprint</option>
                <option value="P3">P3 - Backlog</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Status
              </label>
              <select
                id="bug-form-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as BugStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="reopened">Reopened</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Defect Description & Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of what happens, affected users, and edge conditions..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Steps to Reproduce *
            </label>
            <textarea
              id="bug-form-steps-textarea"
              rows={4}
              required
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Open checkout&#10;2. Select item&#10;3. Click confirm"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Expected vs Actual Result */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-emerald-700 mb-1.5">
                Expected Result
              </label>
              <textarea
                rows={2}
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="What should occur per product spec..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-red-700 mb-1.5">
                Actual Observed Result
              </label>
              <textarea
                rows={2}
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                placeholder="What actually happens (error, freeze, wrong data)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Assignee & Reporter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Assigned Developer / Owner
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Reported By (QA Tester)
              </label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Linked Test Suite Associations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Link to Test Plan (Optional)
              </label>
              <select
                value={testPlanId}
                onChange={(e) => setTestPlanId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Ad-hoc defect)</option>
                {availableTestPlans.map(tp => (
                  <option key={tp.id} value={tp.id}>
                    {tp.planNumber} — {tp.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Link to Failed Test Case (Optional)
              </label>
              <select
                value={testCaseId}
                onChange={(e) => setTestCaseId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {availableTestCases.map(tc => (
                  <option key={tc.id} value={tc.id}>
                    {tc.caseNumber} — {tc.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder="checkout, payments, safari, regression"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="submit-bug-form-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{initialBug ? 'Saving Changes...' : 'Creating Ticket...'}</span>
                </>
              ) : (
                <span>{initialBug ? 'Save Defect Changes' : 'Submit Defect Ticket'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
