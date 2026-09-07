import React, { useState, useMemo } from 'react';
import { 
  Bug as BugIcon, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  FlaskConical, 
  Layers, 
  CheckSquare, 
  Plus, 
  ArrowUpRight, 
  TrendingUp, 
  ShieldAlert, 
  Play,
  ArrowRight,
  Edit3,
  Trash2,
  FolderGit2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Project, Bug as BugType, TestPlan, TestCase, TestRun, Activity, ViewTab } from '../types';
import { computeProjectStats, getSeverityBadge, getStatusBadge, formatRelativeTime } from '../lib/utils';

interface DashboardProps {
  projects: Project[];
  bugs: BugType[];
  testPlans: TestPlan[];
  testCases: TestCase[];
  testRuns: TestRun[];
  activities?: Activity[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onSelectTab: (tab: ViewTab) => void;
  onOpenNewBugModal?: () => void;
  onOpenNewBug?: () => void;
  onOpenBugDetail?: (bugId: string) => void;
  onSelectBug?: (bug: BugType) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenNewProject?: () => void;
  onDeleteBug?: (bugId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  bugs,
  testPlans,
  testCases,
  testRuns,
  activities,
  selectedProjectId,
  onSelectProject,
  onSelectTab,
  onOpenNewBugModal,
  onOpenNewBug,
  onOpenBugDetail,
  onSelectBug,
  onEditProject,
  onDeleteProject,
  onOpenNewProject,
  onDeleteBug,
}) => {
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);
  const [confirmDeleteBugId, setConfirmDeleteBugId] = useState<string | null>(null);
  
  const handleOpenBug = (bug: BugType) => {
    if (onOpenBugDetail) onOpenBugDetail(bug.id);
    if (onSelectBug) onSelectBug(bug);
  };

  const handleCreateBug = () => {
    if (onOpenNewBugModal) onOpenNewBugModal();
    else if (onOpenNewBug) onOpenNewBug();
  };

  const validProjectIds = useMemo(() => new Set(projects.map(p => p.id)), [projects]);

  // Filtered bugs if a single project is selected and remove orphan records
  const activeBugs = useMemo(() => {
    return bugs.filter(b => {
      if (projects.length > 0 && (!b.projectId || !validProjectIds.has(b.projectId))) return false;
      if (selectedProjectId !== 'all' && b.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [bugs, projects.length, validProjectIds, selectedProjectId]);

  const activeTestCases = useMemo(() => {
    return testCases.filter(t => {
      if (projects.length > 0 && (!t.projectId || !validProjectIds.has(t.projectId))) return false;
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [testCases, projects.length, validProjectIds, selectedProjectId]);

  const activeTestPlans = useMemo(() => {
    return testPlans.filter(p => {
      if (projects.length > 0 && (!p.projectId || !validProjectIds.has(p.projectId))) return false;
      if (selectedProjectId !== 'all' && p.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [testPlans, projects.length, validProjectIds, selectedProjectId]);

  const activeTestRuns = useMemo(() => {
    return testRuns.filter(r => {
      if (projects.length > 0 && (!r.projectId || !validProjectIds.has(r.projectId))) return false;
      if (selectedProjectId !== 'all' && r.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [testRuns, projects.length, validProjectIds, selectedProjectId]);

  // Stats calculation
  const totalBugs = activeBugs.length;
  const pendingBugs = activeBugs.filter(b => b.status === 'open' || b.status === 'in_progress' || b.status === 'reopened');
  const resolvedBugs = activeBugs.filter(b => b.status === 'resolved' || b.status === 'closed');
  const criticalBugs = activeBugs.filter(b => b.severity === 'critical' || b.priority === 'P0');
  
  const passedCasesCount = activeTestCases.filter(tc => tc.status === 'passed').length;
  const failedCasesCount = activeTestCases.filter(tc => tc.status === 'failed').length;
  const passRate = activeTestCases.length > 0 
    ? ((passedCasesCount / activeTestCases.length) * 100).toFixed(1)
    : '100';

  // Project-wise stats
  const projectStats = computeProjectStats(projects, bugs);

  // Project-wise chart data
  const projectChartData = projectStats.map(ps => ({
    name: ps.projectKey,
    fullName: ps.projectName,
    Pending: ps.pendingBugs,
    Resolved: ps.resolvedBugs,
    Total: ps.totalBugs,
  }));

  // Severity Distribution Data
  const severityData = [
    { name: 'Critical', value: activeBugs.filter(b => b.severity === 'critical').length, color: '#ef4444' },
    { name: 'High', value: activeBugs.filter(b => b.severity === 'high').length, color: '#f97316' },
    { name: 'Medium', value: activeBugs.filter(b => b.severity === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: activeBugs.filter(b => b.severity === 'low').length, color: '#10b981' },
  ].filter(d => d.value > 0);

  const recentBugs = [...activeBugs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const latestRun = activeTestRuns[0];

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Issues */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/90">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Defects</p>
          <p className="text-3xl font-bold text-slate-900">{totalBugs}</p>
          <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
            <span>Across {selectedProjectId === 'all' ? projects.length : 1} active projects</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/90">
          <p className="text-slate-500 text-sm font-medium mb-1">Pending</p>
          <p className="text-3xl font-bold text-orange-500">{pendingBugs.length}</p>
          <div className="mt-2 flex items-center text-xs text-slate-500 font-medium">
            <span className="text-rose-600 font-semibold">{criticalBugs.length} Critical</span>
            <span className="mx-1">•</span>
            <span>{totalBugs > 0 ? Math.round((pendingBugs.length / totalBugs) * 100) : 0}% of backlog</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/90">
          <p className="text-slate-500 text-sm font-medium mb-1">Resolved</p>
          <p className="text-3xl font-bold text-emerald-500">{resolvedBugs.length}</p>
          <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
            <span>{totalBugs > 0 ? Math.round((resolvedBugs.length / totalBugs) * 100) : 100}% resolution rate</span>
          </div>
        </div>

        {/* Coverage / Pass Rate */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/90">
          <p className="text-slate-500 text-sm font-medium mb-1">Test Coverage</p>
          <p className="text-3xl font-bold text-blue-600">{passRate}%</p>
          <div className="mt-2 flex items-center text-xs text-slate-500 font-medium">
            <span>{passedCasesCount}/{activeTestCases.length || 0} Test Cases Passed</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Recent Defects Table + Project Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (span 2): Recent Critical Defects Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/90 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Recent Defects & Bugs</h3>
              <p className="text-xs text-slate-500 mt-0.5">High priority issues requiring developer resolution</p>
            </div>
            <button
              onClick={() => onSelectTab('bugs')}
              className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {recentBugs.length > 0 ? (
                  recentBugs.map(bug => {
                    const sev = getSeverityBadge(bug.severity);
                    const stat = getStatusBadge(bug.status);
                    const proj = projects.find(p => p.id === bug.projectId);

                    return (
                      <tr 
                        key={bug.id} 
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => handleOpenBug(bug)}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500 font-semibold whitespace-nowrap">
                          {bug.bugNumber}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                          {bug.title}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: proj?.color || '#3b82f6' }}
                            />
                            {proj?.name || 'Project'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${sev.bg}`}>
                            {sev.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stat.bg}`}>
                            {stat.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-700 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                              {bug.assignedTo.charAt(0)}
                            </div>
                            <span>{bug.assignedTo}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-75" />
                      <p className="font-semibold text-slate-800">No Defects Found</p>
                      <p className="text-xs text-slate-500 mt-1">All quality assertions are currently passing.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Project Distribution & Test Run Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Project Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Resolution rate & active workloads</p>
            </div>
            {onOpenNewProject && (
              <button
                type="button"
                onClick={onOpenNewProject}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                title="Create New Project"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col space-y-5">
            {projectStats.map(ps => {
              const fullProj = projects.find(p => p.id === ps.projectId);

              return (
                <div 
                  key={ps.projectId} 
                  className="space-y-1.5 cursor-pointer group"
                  onClick={() => onSelectProject(ps.projectId)}
                >
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-700 group-hover:text-blue-600 transition-colors font-medium flex items-center gap-1.5 truncate max-w-[180px]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ps.color }} />
                      <span className="truncate">{ps.projectName}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">({ps.projectKey})</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {confirmDeleteProjectId === ps.projectId ? (
                        <div 
                          className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 text-[10px] text-red-700 animate-in fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-bold">Delete?</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteProjectId(null);
                              if (onDeleteProject) onDeleteProject(ps.projectId);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold shadow-xs"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteProjectId(null);
                            }}
                            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {onEditProject && fullProj && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditProject(fullProj);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit Project Settings"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteProject && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteProjectId(ps.projectId);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-slate-900 font-bold">{ps.resolutionRate}%</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${ps.resolutionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{ps.pendingBugs} pending issues</span>
                    <span>{ps.resolvedBugs} fixed</span>
                  </div>
                </div>
              );
            })}

            {/* Test Run Status Banner at Bottom */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-100/80">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">Test Run Status</p>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {latestRun ? latestRun.environment : 'Staging'}
                  </span>
                </div>
                {latestRun ? (
                  <div>
                    <p className="text-sm text-blue-900 leading-tight">
                      <strong>{latestRun.title}</strong> is currently at{' '}
                      <strong>{Math.round((latestRun.passedCases / (latestRun.totalCases || 1)) * 100)}% pass rate</strong>.
                    </p>
                    <button
                      onClick={() => onSelectTab('test_reports')}
                      className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Execute or view report</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-blue-900 leading-tight">
                    Sprint regression cycles are active. Coverage metrics verified across all project endpoints.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Project Comparison Bar Chart + Severity Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Comparison Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/90 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Defect Resolution Metrics</h3>
              <p className="text-xs text-slate-500 mt-0.5">Comparative breakdown of pending vs resolved defects across repositories</p>
            </div>
            <button
              onClick={() => onSelectTab('bugs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage Backlog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(label, payload) => {
                    const item = payload[0]?.payload;
                    return item ? `${item.fullName} (${label})` : label;
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => <span className="text-slate-600 font-medium">{value} Defects</span>}
                />
                <Bar dataKey="Pending" fill="#f97316" radius={[4, 4, 0, 0]} name="Pending Issues" />
                <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved / Closed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown Donut */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Severity Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Defect distribution by impact level</p>

            <div className="h-44 w-full my-2">
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  No active defects in scope
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 flex items-center justify-between">
                <span className="text-red-700 font-semibold">Critical</span>
                <span className="font-bold text-red-800">
                  {activeBugs.filter(b => b.severity === 'critical').length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-between">
                <span className="text-orange-700 font-semibold">High</span>
                <span className="font-bold text-orange-800">
                  {activeBugs.filter(b => b.severity === 'high').length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-between">
                <span className="text-amber-700 font-semibold">Medium</span>
                <span className="font-bold text-amber-800">
                  {activeBugs.filter(b => b.severity === 'medium').length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <span className="text-emerald-700 font-semibold">Low</span>
                <span className="font-bold text-emerald-800">
                  {activeBugs.filter(b => b.severity === 'low').length}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => onSelectTab('test_cases')}
              className="w-full py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Browse Test Cases ({activeTestCases.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
