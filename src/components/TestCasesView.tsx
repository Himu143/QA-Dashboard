import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  MinusCircle, 
  Play, 
  Bug, 
  Layers, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Sparkles,
  Download,
  Loader2,
  ListPlus
} from 'lucide-react';
import { 
  TestCase, 
  Project, 
  TestPlan, 
  TestCaseStatus, 
  TestCasePriority, 
  TestCaseType, 
  TestStep, 
  TeamMember 
} from '../types';
import { getTestCaseStatusBadge, formatDateTime, formatRelativeTime } from '../lib/utils';
import { api } from '../lib/api';

interface TestCasesViewProps {
  testCases: TestCase[];
  projects: Project[];
  testPlans: TestPlan[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onSaveTestCase: (tc: Partial<TestCase>) => void;
  onDeleteTestCase: (id: string) => void;
  onQuickUpdateStatus: (id: string, status: TestCaseStatus, notes?: string) => void;
  onReportBugFromTestCase: (testCase: TestCase) => void;
  currentUser: TeamMember;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TestCasesView: React.FC<TestCasesViewProps> = ({
  testCases,
  projects,
  testPlans,
  selectedProjectId,
  onSelectProject,
  onSaveTestCase,
  onDeleteTestCase,
  onQuickUpdateStatus,
  onReportBugFromTestCase,
  currentUser,
  searchQuery,
  onSearchChange,
}) => {
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [confirmDeleteCaseId, setConfirmDeleteCaseId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);

  // Form states
  const [formProjectId, setFormProjectId] = useState(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
  const [formPlanId, setFormPlanId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [priority, setPriority] = useState<TestCasePriority>('high');
  const [type, setType] = useState<TestCaseType>('functional');
  const [status, setStatus] = useState<TestCaseStatus>('untested');
  const [steps, setSteps] = useState<TestStep[]>([
    { stepNumber: 1, action: 'Open application', expectedResult: 'Home dashboard loads successfully' }
  ]);
  const [tagsString, setTagsString] = useState('');

  // AI Test Suite Generator states
  const [isAiGenModalOpen, setIsAiGenModalOpen] = useState(false);
  const [aiRequirement, setAiRequirement] = useState('');
  const [aiTargetProjectId, setAiTargetProjectId] = useState(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
  const [aiTargetPlanId, setAiTargetPlanId] = useState('');
  const [isGeneratingAiCases, setIsGeneratingAiCases] = useState(false);
  const [generatedAiCases, setGeneratedAiCases] = useState<any[]>([]);
  const [aiGenError, setAiGenError] = useState('');

  const handleGenerateAiTestCases = async () => {
    if (!aiRequirement.trim()) {
      setAiGenError('Please provide a feature requirement or user story.');
      return;
    }

    try {
      setIsGeneratingAiCases(true);
      setAiGenError('');
      const targetProj = projects.find(p => p.id === aiTargetProjectId);
      const projectKey = targetProj?.key || 'QA';

      const cases = await api.generateTestCases(aiRequirement.trim(), projectKey);
      setGeneratedAiCases(cases);
    } catch (err: any) {
      setAiGenError(err.message || 'Failed to generate test cases.');
    } finally {
      setIsGeneratingAiCases(false);
    }
  };

  const handleSaveAllGeneratedCases = () => {
    if (generatedAiCases.length === 0) return;

    generatedAiCases.forEach((tc) => {
      onSaveTestCase({
        projectId: aiTargetProjectId || (projects[0]?.id || 'proj-1'),
        testPlanId: aiTargetPlanId || undefined,
        title: tc.title,
        description: `Generated from requirement: "${aiRequirement.slice(0, 100)}..."`,
        preconditions: tc.preconditions || 'Target environment configured and test data available',
        steps: tc.steps || [{ stepNumber: 1, action: 'Execute test step', expectedResult: 'Success verification' }],
        priority: tc.priority || 'medium',
        type: tc.type || 'functional',
        status: 'untested',
        tags: ['ai-generated', tc.type || 'functional'],
        createdBy: `${currentUser.name} (AI)`,
      });
    });

    setIsAiGenModalOpen(false);
    setGeneratedAiCases([]);
    setAiRequirement('');
  };

  const openCreateModal = () => {
    setEditingCase(null);
    setFormProjectId(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
    setFormPlanId('');
    setTitle('');
    setDescription('');
    setPreconditions('');
    setPriority('high');
    setType('functional');
    setStatus('untested');
    setSteps([
      { stepNumber: 1, action: '', expectedResult: '' }
    ]);
    setTagsString('');
    setIsModalOpen(true);
  };

  const openEditModal = (tc: TestCase) => {
    setEditingCase(tc);
    setFormProjectId(tc.projectId);
    setFormPlanId(tc.testPlanId || '');
    setTitle(tc.title);
    setDescription(tc.description);
    setPreconditions(tc.preconditions || '');
    setPriority(tc.priority);
    setType(tc.type);
    setStatus(tc.status);
    setSteps(tc.steps && tc.steps.length > 0 ? tc.steps : [{ stepNumber: 1, action: '', expectedResult: '' }]);
    setTagsString(tc.tags?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    setSteps([...steps, { stepNumber: steps.length + 1, action: '', expectedResult: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(next);
  };

  const handleStepChange = (index: number, field: 'action' | 'expectedResult', val: string) => {
    const next = [...steps];
    next[index] = { ...next[index], [field]: val };
    setSteps(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
    const validSteps = steps.filter(s => s.action.trim() || s.expectedResult.trim());

    onSaveTestCase({
      ...(editingCase ? { id: editingCase.id, caseNumber: editingCase.caseNumber } : {}),
      projectId: formProjectId,
      testPlanId: formPlanId || undefined,
      title: title.trim(),
      description: description.trim(),
      preconditions: preconditions.trim(),
      steps: validSteps.length > 0 ? validSteps : [{ stepNumber: 1, action: 'Execute test step', expectedResult: 'Expected verification passes' }],
      priority,
      type,
      status,
      tags,
      createdBy: editingCase?.createdBy || currentUser.name,
    });
    setIsModalOpen(false);
  };

  // Filtered cases
  const filteredCases = useMemo(() => {
    const validProjectIds = new Set(projects.map(p => p.id));
    return testCases.filter(tc => {
      if (projects.length > 0 && (!tc.projectId || !validProjectIds.has(tc.projectId))) return false;
      if (selectedProjectId !== 'all' && tc.projectId !== selectedProjectId) return false;
      if (selectedPlanFilter !== 'all' && tc.testPlanId !== selectedPlanFilter) return false;
      if (statusFilter !== 'all' && tc.status !== statusFilter) return false;
      if (typeFilter !== 'all' && tc.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && tc.priority !== priorityFilter) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = tc.title.toLowerCase().includes(q);
        const mNum = tc.caseNumber.toLowerCase().includes(q);
        const mDesc = tc.description?.toLowerCase().includes(q);
        const mTags = tc.tags?.some(t => t.toLowerCase().includes(q));
        if (!mTitle && !mNum && !mDesc && !mTags) return false;
      }
      return true;
    });
  }, [testCases, projects, selectedProjectId, selectedPlanFilter, statusFilter, typeFilter, priorityFilter, searchQuery]);

  const availableTestPlans = useMemo(() => {
    const validProjectIds = new Set(projects.map(p => p.id));
    return testPlans.filter(tp => {
      if (projects.length > 0 && (!tp.projectId || !validProjectIds.has(tp.projectId))) return false;
      if (selectedProjectId !== 'all') return tp.projectId === selectedProjectId;
      return true;
    });
  }, [testPlans, projects, selectedProjectId]);

  const handleExportCasesCSV = () => {
    const headers = ['Case ID', 'Project', 'Title', 'Type', 'Priority', 'Status', 'Preconditions', 'Steps Count', 'Created By'];
    const rows = filteredCases.map(c => {
      const p = projects.find(proj => proj.id === c.projectId);
      return [
        c.caseNumber,
        p?.name || c.projectId,
        `"${c.title.replace(/"/g, '""')}"`,
        c.type,
        c.priority,
        c.status,
        `"${(c.preconditions || '').replace(/"/g, '""')}"`,
        c.steps?.length || 0,
        c.createdBy
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `qa_test_cases_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span>Test Case Repository</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Standardized test procedures with preconditions, executable steps, and pass/fail quality gates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCasesCSV}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm transition-colors"
            title="Export Test Suite to CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setAiTargetProjectId(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
              setAiTargetPlanId('');
              setGeneratedAiCases([]);
              setAiGenError('');
              setIsAiGenModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Generate Suite</span>
          </button>

          <button
            id="create-test-case-btn"
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Test Case</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        {/* Status quick tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {['all', 'passed', 'failed', 'blocked', 'untested'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Project Selector */}
        <select
          value={selectedProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
          ))}
        </select>

        {/* Test Plan Filter */}
        <select
          value={selectedPlanFilter}
          onChange={(e) => setSelectedPlanFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Test Plans</option>
          {availableTestPlans.map(tp => (
            <option key={tp.id} value={tp.id}>{tp.planNumber} - {tp.title}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Test Types</option>
          <option value="functional">Functional</option>
          <option value="smoke">Smoke</option>
          <option value="regression">Regression</option>
          <option value="security">Security</option>
          <option value="performance">Performance</option>
          <option value="ui_ux">UI / UX</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {(statusFilter !== 'all' || selectedPlanFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setStatusFilter('all');
              setSelectedPlanFilter('all');
              setTypeFilter('all');
              setPriorityFilter('all');
              onSearchChange('');
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {filteredCases.length > 0 ? (
          filteredCases.map(tc => {
            const isExpanded = expandedCaseId === tc.id;
            const statusBadge = getTestCaseStatusBadge(tc.status);
            const project = projects.find(p => p.id === tc.projectId);
            const plan = testPlans.find(tp => tp.id === tc.testPlanId);

            return (
              <div
                key={tc.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-5 shadow-sm transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* Title & Metadata */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 flex-shrink-0">
                      {tc.caseNumber}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {tc.type}
                        </span>

                        <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color || '#3b82f6' }} />
                          {project?.name}
                        </span>

                        {plan && (
                          <span className="text-xs text-slate-400 font-mono">
                            • [{plan.planNumber}]
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {tc.title}
                      </h3>

                      {tc.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {tc.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Quick Execution Buttons & Expand */}
                  <div className="flex items-center gap-2 self-end lg:self-center flex-shrink-0">
                    {/* Quick result buttons */}
                    <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200 gap-1">
                      <button
                        type="button"
                        onClick={() => onQuickUpdateStatus(tc.id, 'passed')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                          tc.status === 'passed'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title="Mark Passed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onQuickUpdateStatus(tc.id, 'failed');
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                          tc.status === 'failed'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-red-700 hover:bg-red-50'
                        }`}
                        title="Mark Failed"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onQuickUpdateStatus(tc.id, 'blocked')}
                        className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                          tc.status === 'blocked'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                        }`}
                        title="Mark Blocked"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Block</span>
                      </button>
                    </div>

                    {/* Defect button if failed */}
                    {tc.status === 'failed' && (
                      <button
                        type="button"
                        onClick={() => onReportBugFromTestCase(tc)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 text-xs font-semibold flex items-center gap-1 transition-all"
                        title="Log Defect from this failed test case"
                      >
                        <Bug className="w-3.5 h-3.5" />
                        <span>Log Defect</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                      {confirmDeleteCaseId === tc.id ? (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-2 py-0.5 animate-in fade-in">
                          <span className="text-[10px] font-bold text-red-700">Delete Case?</span>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteCaseId(null);
                              onDeleteTestCase(tc.id);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-xs"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCaseId(null)}
                            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(tc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Test Case"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setConfirmDeleteCaseId(tc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Test Case"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setExpandedCaseId(isExpanded ? null : tc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Collapse Steps' : 'View Steps'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Expanded Details: Preconditions, Step-by-Step Table */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-1">
                    {tc.preconditions && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Preconditions:</span>
                        <p className="text-slate-800 leading-relaxed">{tc.preconditions}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Verification Steps ({tc.steps?.length || 0})
                      </h4>
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 w-12 font-semibold">#</th>
                              <th className="py-2.5 px-3 font-semibold">Test Action</th>
                              <th className="py-2.5 px-3 font-semibold">Expected Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tc.steps && tc.steps.length > 0 ? (
                              tc.steps.map(step => (
                                <tr key={step.stepNumber} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{step.stepNumber}</td>
                                  <td className="py-2.5 px-3 font-medium text-slate-900">{step.action}</td>
                                  <td className="py-2.5 px-3 text-emerald-700 font-medium">{step.expectedResult}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="p-3 text-center text-slate-400">No steps recorded</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2">
                      <span>Author: <strong className="text-slate-800">{tc.createdBy}</strong></span>
                      {tc.lastExecutedAt && (
                        <span>Last Executed: {formatRelativeTime(tc.lastExecutedAt)} by <strong className="text-slate-800">{tc.lastExecutedBy || 'QA'}</strong></span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center bg-white border border-slate-200/90 rounded-xl shadow-sm">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-800">No test cases match filter criteria</p>
            <p className="text-xs text-slate-500 mt-1">Create test cases or adjust your project/status filter.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Test Case</span>
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Test Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 md:p-10 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span>{editingCase ? `Edit Test Case: ${editingCase.caseNumber}` : 'Create New QA Test Case'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Project *</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => {
                      setFormProjectId(e.target.value);
                      setFormPlanId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Test Plan (Optional)</label>
                  <select
                    value={formPlanId}
                    onChange={(e) => setFormPlanId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None (Standalone)</option>
                    {testPlans.filter(tp => tp.projectId === formProjectId).map(tp => (
                      <option key={tp.id} value={tp.id}>{tp.planNumber} — {tp.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Test Case Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Verify biometric FaceID fallback to 6-digit PIN on 3 consecutive failures"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TestCaseType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="functional">Functional</option>
                    <option value="smoke">Smoke</option>
                    <option value="regression">Regression</option>
                    <option value="integration">Integration</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="ui_ux">UI / UX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Priority *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TestCasePriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TestCaseStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="untested">Untested</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="blocked">Blocked</option>
                    <option value="skipped">Skipped</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Preconditions & Environment Setup</label>
                <input
                  type="text"
                  value={preconditions}
                  onChange={(e) => setPreconditions(e.target.value)}
                  placeholder="e.g. Test user is logged in with valid active credit card linked"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Step-by-Step Test Procedure Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Step-by-Step Test Procedure</label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Step
                  </button>
                </div>

                <div className="space-y-2.5">
                  {steps.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-600">Step {idx + 1}</span>
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="text-slate-400 hover:text-red-600 text-xs font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={step.action}
                          onChange={(e) => handleStepChange(idx, 'action', e.target.value)}
                          placeholder="Action: e.g. Click 'Submit Payment' button"
                          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          required
                          value={step.expectedResult}
                          onChange={(e) => handleStepChange(idx, 'expectedResult', e.target.value)}
                          placeholder="Expected: e.g. Payment success modal appears with receipt ID"
                          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-emerald-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsString}
                  onChange={(e) => setTagsString(e.target.value)}
                  placeholder="smoke, checkout, security, biometrics"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  {editingCase ? 'Save Test Case' : 'Create Test Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Test Suite Generator Modal */}
      {isAiGenModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 md:p-10 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Test Suite Generator</h3>
                  <p className="text-xs text-slate-500">
                    Transform user stories or acceptance criteria into comprehensive, executable QA test cases.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiGenModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {aiGenError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                  <span>{aiGenError}</span>
                </div>
              )}

              {/* Target Project & Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Target Project</label>
                  <select
                    value={aiTargetProjectId}
                    onChange={(e) => {
                      setAiTargetProjectId(e.target.value);
                      setAiTargetPlanId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Assign To Test Plan (Optional)</label>
                  <select
                    value={aiTargetPlanId}
                    onChange={(e) => setAiTargetPlanId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No Plan (General Repository)</option>
                    {testPlans
                      .filter(tp => !aiTargetProjectId || tp.projectId === aiTargetProjectId)
                      .map(tp => (
                        <option key={tp.id} value={tp.id}>{tp.planNumber}: {tp.title}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Requirement input */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  User Story / Requirement Prompt *
                </label>
                <textarea
                  rows={4}
                  value={aiRequirement}
                  onChange={(e) => setAiRequirement(e.target.value)}
                  placeholder="e.g. As a customer, I want to authenticate using passkeys or biometric facial recognition with automatic fallback to SMS OTP, and have account locked for 15 minutes after 5 consecutive failures."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleGenerateAiTestCases}
                  disabled={isGeneratingAiCases || !aiRequirement.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isGeneratingAiCases ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Test Scenarios...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Test Suite</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated results review */}
              {generatedAiCases.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Generated Scenarios ({generatedAiCases.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveAllGeneratedCases}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <ListPlus className="w-4 h-4" />
                      <span>Import All {generatedAiCases.length} Cases</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {generatedAiCases.map((tc, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-indigo-100 text-indigo-700">
                              {tc.type || 'functional'}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{tc.title}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 uppercase">
                            Priority: {tc.priority}
                          </span>
                        </div>

                        {tc.preconditions && (
                          <p className="text-[11px] text-slate-600">
                            <strong className="text-slate-700">Preconditions:</strong> {tc.preconditions}
                          </p>
                        )}

                        <div className="space-y-1 pt-1">
                          {tc.steps?.map((step: any, sIdx: number) => (
                            <div key={sIdx} className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-1.5 rounded border border-slate-200/70">
                              <div><strong className="text-blue-600">Step {sIdx + 1}:</strong> {step.action}</div>
                              <div className="text-emerald-700"><strong className="text-emerald-800">Expected:</strong> {step.expectedResult}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
