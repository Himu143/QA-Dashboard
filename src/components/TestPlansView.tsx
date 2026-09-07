import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Calendar, 
  User, 
  CheckSquare, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Play, 
  CheckCircle2, 
  Clock, 
  FileText, 
  X, 
  Target
} from 'lucide-react';
import { TestPlan, Project, TestCase, TestPlanStatus, TeamMember, ViewTab } from '../types';
import { formatDate } from '../lib/utils';

interface TestPlansViewProps {
  testPlans: TestPlan[];
  projects: Project[];
  testCases: TestCase[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onSaveTestPlan: (plan: Partial<TestPlan>) => void;
  onDeleteTestPlan: (id: string) => void;
  onSelectTab: (tab: ViewTab) => void;
  currentUser: TeamMember;
}

export const TestPlansView: React.FC<TestPlansViewProps> = ({
  testPlans,
  projects,
  testCases,
  selectedProjectId,
  onSelectProject,
  onSaveTestPlan,
  onDeleteTestPlan,
  onSelectTab,
  currentUser,
}) => {
  const [editingPlan, setEditingPlan] = useState<TestPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeletePlanId, setConfirmDeletePlanId] = useState<string | null>(null);

  // Form states
  const [formProjectId, setFormProjectId] = useState(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [status, setStatus] = useState<TestPlanStatus>('active');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [objectives, setObjectives] = useState('');
  const [scope, setScope] = useState('');

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormProjectId(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
    setTitle('');
    setDescription('');
    setVersion('v2.0.0');
    setStatus('active');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    setObjectives('');
    setScope('');
    setIsCreating(true);
  };

  const openEditModal = (plan: TestPlan) => {
    setEditingPlan(plan);
    setFormProjectId(plan.projectId);
    setTitle(plan.title);
    setDescription(plan.description);
    setVersion(plan.version);
    setStatus(plan.status);
    setStartDate(plan.startDate);
    setEndDate(plan.endDate);
    setObjectives(plan.objectives || '');
    setScope(plan.scope || '');
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveTestPlan({
      ...(editingPlan ? { id: editingPlan.id, planNumber: editingPlan.planNumber } : {}),
      projectId: formProjectId,
      title: title.trim(),
      description: description.trim(),
      version: version.trim(),
      status,
      startDate,
      endDate,
      objectives: objectives.trim(),
      scope: scope.trim(),
      createdBy: editingPlan?.createdBy || currentUser.name,
    });
    setIsCreating(false);
  };

  const validProjectIds = new Set(projects.map(p => p.id));
  const filteredPlans = testPlans.filter(tp => {
    if (projects.length > 0 && (!tp.projectId || !validProjectIds.has(tp.projectId))) return false;
    if (selectedProjectId !== 'all' && tp.projectId !== selectedProjectId) return false;
    return true;
  });

  const getPlanStatusBadge = (st: TestPlanStatus) => {
    switch (st) {
      case 'active':
        return 'bg-blue-100 text-blue-700 border border-blue-200 font-bold';
      case 'in_review':
        return 'bg-amber-100 text-amber-800 border border-amber-200 font-bold';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200 font-medium';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>QA Test Plans & Strategies</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredPlans.length} {filteredPlans.length === 1 ? 'plan' : 'plans'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize sprint test cycles, target release scopes, and quality gate milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
            ))}
          </select>

          <button
            id="create-test-plan-btn"
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Test Plan</span>
          </button>
        </div>
      </div>

      {/* Test Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.length > 0 ? (
          filteredPlans.map(plan => {
            const project = projects.find(p => p.id === plan.projectId);
            const planCases = testCases.filter(tc => tc.testPlanId === plan.id || tc.projectId === plan.projectId);
            const passed = planCases.filter(tc => tc.status === 'passed').length;
            const progress = planCases.length > 0 ? Math.round((passed / planCases.length) * 100) : 0;

            return (
              <div
                key={plan.id}
                className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 group transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {plan.planNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color || '#3b82f6' }} />
                        {project?.name}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider ${getPlanStatusBadge(plan.status)}`}>
                      {plan.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {plan.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Scope & Objectives box */}
                  <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    {plan.scope && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scope:</span>
                        <p className="text-slate-700 line-clamp-1">{plan.scope}</p>
                      </div>
                    )}
                    {plan.objectives && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Milestone:</span>
                        <p className="text-slate-700 line-clamp-1">{plan.objectives}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {/* Progress & Test Cases count */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1 font-medium">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>{planCases.length} Test Cases</span>
                      </span>
                      <span className="font-mono text-emerald-600 font-bold">{progress}% Passed</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(plan.startDate)} – {formatDate(plan.endDate)}</span>
                    </div>
                    <span className="font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {plan.version}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {confirmDeletePlanId === plan.id ? (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-2 py-0.5 animate-in fade-in">
                          <span className="text-[10px] font-bold text-red-700">Delete Plan?</span>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeletePlanId(null);
                              onDeleteTestPlan(plan.id);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-xs"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePlanId(null)}
                            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(plan)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Plan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePlanId(plan.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectTab('test_cases')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <span>View Cases</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center bg-white border border-slate-200/90 rounded-xl shadow-sm">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-800">No test plans found</p>
            <p className="text-xs text-slate-500 mt-1">Create your first test plan to organize your test suites.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Test Plan</span>
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Plan Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 md:p-10 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>{editingPlan ? `Edit Test Plan: ${editingPlan.planNumber}` : 'Create New QA Test Plan'}</span>
              </h2>
              <button
                onClick={() => setIsCreating(false)}
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
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Target Release Version *</label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. v2.4.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Test Plan Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sprint 29 Checkout & Payment Gateway Verification"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Description & Strategy</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of testing approach, team responsibilities, and key quality gates..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TestPlanStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Testing Scope</label>
                <input
                  type="text"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="e.g. Payment modal, Apple Pay, FX calculation, Tax breakdown"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Objectives & Exit Criteria</label>
                <input
                  type="text"
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="e.g. 100% Critical P0 cases pass, Zero unhandled exceptions in logs"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  {editingPlan ? 'Save Test Plan' : 'Create Test Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
