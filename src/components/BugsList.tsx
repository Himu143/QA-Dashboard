import React, { useState, useMemo } from 'react';
import { 
  Bug as BugIcon, 
  Plus, 
  Search, 
  Filter, 
  Kanban, 
  Table as TableIcon, 
  Grid, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MoreVertical, 
  User, 
  Tag, 
  ExternalLink,
  ChevronRight,
  Download,
  Trash2,
  Edit,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Bug, Project, BugSeverity, BugStatus, BugPriority, QAEnvironment, TeamMember } from '../types';
import { getSeverityBadge, getStatusBadge, getPriorityBadge, formatDate, formatRelativeTime } from '../lib/utils';

interface BugsListProps {
  bugs: Bug[];
  projects: Project[];
  testPlans?: any[];
  testCases?: any[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onSelectBug?: (bug: Bug) => void;
  onOpenBugDetail?: (bugId: string) => void;
  onOpenNewBug?: (projectId?: string) => void;
  onOpenNewBugModal?: (projectId?: string) => void;
  onUpdateBugStatus?: (bugId: string, status: BugStatus) => void;
  onQuickUpdateStatus?: (bugId: string, status: BugStatus) => void;
  onDeleteBug: (bugId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const BugsList: React.FC<BugsListProps> = ({
  bugs,
  projects,
  selectedProjectId,
  onSelectProject,
  onSelectBug,
  onOpenBugDetail,
  onOpenNewBug,
  onOpenNewBugModal,
  onUpdateBugStatus,
  onQuickUpdateStatus,
  onDeleteBug,
  searchQuery,
  onSearchChange,
}) => {
  const handleSelectBug = (bug: Bug) => {
    if (onSelectBug) onSelectBug(bug);
    if (onOpenBugDetail) onOpenBugDetail(bug.id);
  };

  const handleOpenNewBug = (projectId?: string) => {
    if (onOpenNewBug) onOpenNewBug(projectId);
    else if (onOpenNewBugModal) onOpenNewBugModal(projectId);
  };

  const handleStatusChange = (bugId: string, status: BugStatus) => {
    if (onUpdateBugStatus) onUpdateBugStatus(bugId, status);
    else if (onQuickUpdateStatus) onQuickUpdateStatus(bugId, status);
  };
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'priority' | 'severity'>('created_desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract unique assignees
  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    bugs.forEach(b => { if (b.assignedTo) set.add(b.assignedTo); });
    return Array.from(set);
  }, [bugs]);

  // Filter logic
  const filteredBugs = useMemo(() => {
    const validProjectIds = new Set(projects.map(p => p.id));
    return bugs.filter(bug => {
      // Must belong to an active existing project if projects are loaded
      if (projects.length > 0 && (!bug.projectId || !validProjectIds.has(bug.projectId))) return false;
      if (selectedProjectId !== 'all' && bug.projectId !== selectedProjectId) return false;
      if (statusFilter !== 'all' && bug.status !== statusFilter) return false;
      if (severityFilter !== 'all' && bug.severity !== severityFilter) return false;
      if (priorityFilter !== 'all' && bug.priority !== priorityFilter) return false;
      if (environmentFilter !== 'all' && bug.environment !== environmentFilter) return false;
      if (assigneeFilter !== 'all' && bug.assignedTo !== assigneeFilter) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = bug.title.toLowerCase().includes(q);
        const matchNum = bug.bugNumber.toLowerCase().includes(q);
        const matchDesc = bug.description?.toLowerCase().includes(q);
        const matchTags = bug.tags?.some(t => t.toLowerCase().includes(q));
        const matchAssignee = bug.assignedTo?.toLowerCase().includes(q);
        if (!matchTitle && !matchNum && !matchDesc && !matchTags && !matchAssignee) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'created_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'severity') {
        const order: Record<BugSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return order[b.severity] - order[a.severity];
      } else if (sortBy === 'priority') {
        const order: Record<BugPriority, number> = { P0: 4, P1: 3, P2: 2, P3: 1 };
        return order[b.priority] - order[a.priority];
      }
      return 0;
    });
  }, [bugs, projects, selectedProjectId, statusFilter, severityFilter, priorityFilter, environmentFilter, assigneeFilter, searchQuery, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Bug ID', 'Project', 'Title', 'Severity', 'Priority', 'Status', 'Environment', 'Assigned To', 'Reported By', 'Created At'];
    const rows = filteredBugs.map(b => {
      const p = projects.find(proj => proj.id === b.projectId);
      return [
        b.bugNumber,
        p?.name || b.projectId,
        `"${b.title.replace(/"/g, '""')}"`,
        b.severity,
        b.priority,
        b.status,
        b.environment,
        b.assignedTo,
        b.reportedBy,
        b.createdAt
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `qa_bugs_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kanbanColumns: { id: BugStatus; label: string; count: number; badgeColor: string }[] = [
    { id: 'open', label: 'Open Defects', count: filteredBugs.filter(b => b.status === 'open' || b.status === 'reopened').length, badgeColor: 'bg-red-100 text-red-700 border border-red-200' },
    { id: 'in_progress', label: 'In Progress (Fixing)', count: filteredBugs.filter(b => b.status === 'in_progress').length, badgeColor: 'bg-blue-100 text-blue-700 border border-blue-200' },
    { id: 'resolved', label: 'Resolved (Ready for QA)', count: filteredBugs.filter(b => b.status === 'resolved').length, badgeColor: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    { id: 'closed', label: 'Closed & Verified', count: filteredBugs.filter(b => b.status === 'closed').length, badgeColor: 'bg-slate-100 text-slate-600 border border-slate-200' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BugIcon className="w-5 h-5 text-red-600" />
              <span>Defect Tracking & Issues</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredBugs.length} {filteredBugs.length === 1 ? 'defect' : 'defects'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track, assign, prioritize, and collaborate on software defects across project repositories.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm transition-colors"
            title="Export Filtered Defects to CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Create Bug Button */}
          <button
            id="create-new-bug-btn"
            type="button"
            onClick={() => handleOpenNewBug(selectedProjectId === 'all' ? undefined : selectedProjectId)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Defect</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Facets */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'open', label: 'Open' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'resolved', label: 'Resolved' },
              { id: 'closed', label: 'Closed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Project dropdown in filter */}
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

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="P0">P0 - Blocker</option>
            <option value="P1">P1 - High</option>
            <option value="P2">P2 - Normal</option>
            <option value="P3">P3 - Low</option>
          </select>

          {/* Environment filter */}
          <select
            value={environmentFilter}
            onChange={(e) => setEnvironmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="qa">QA</option>
            <option value="dev">Dev</option>
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Assignees</option>
            {allAssignees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto"
          >
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
            <option value="severity">Highest Severity</option>
            <option value="priority">Highest Priority</option>
          </select>

          {(statusFilter !== 'all' || severityFilter !== 'all' || priorityFilter !== 'all' || environmentFilter !== 'all' || assigneeFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSeverityFilter('all');
                setPriorityFilter('all');
                setEnvironmentFilter('all');
                setAssigneeFilter('all');
                onSearchChange('');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Bug ID & Title</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Environment</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Reported</th>
                  <th className="py-3.5 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredBugs.length > 0 ? (
                  filteredBugs.map(bug => {
                    const sev = getSeverityBadge(bug.severity);
                    const pri = getPriorityBadge(bug.priority);
                    const stat = getStatusBadge(bug.status);
                    const proj = projects.find(p => p.id === bug.projectId);

                    return (
                      <tr 
                        key={bug.id}
                        onClick={() => handleSelectBug(bug)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        {/* ID & Title */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="flex items-start gap-2.5">
                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                              {bug.bugNumber}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {bug.title}
                              </p>
                              {bug.tags && bug.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {bug.tags.slice(0, 2).map(t => (
                                    <span key={t} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Project */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj?.color || '#3b82f6' }} />
                            <span className="text-xs text-slate-800 font-semibold">{proj?.name || bug.projectId}</span>
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${sev.bg}`}>
                            {sev.label}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-xs ${pri.bg}`}>
                            {pri.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${stat.bg}`}>
                            {stat.label}
                          </span>
                        </td>

                        {/* Environment */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {bug.environment}
                          </span>
                        </td>

                        {/* Assignee */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                              {bug.assignedTo?.charAt(0) || 'U'}
                            </div>
                            <span className="text-xs text-slate-700 font-medium">{bug.assignedTo || 'Unassigned'}</span>
                          </div>
                        </td>

                        {/* Reported date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                          {formatRelativeTime(bug.createdAt)}
                        </td>

                        {/* Quick action */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {confirmDeleteId === bug.id ? (
                              <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 animate-in fade-in">
                                <span className="text-[10px] font-bold text-red-700">Delete?</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                    onDeleteBug(bug.id);
                                  }}
                                  className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-xs"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <>
                                {bug.status !== 'resolved' && bug.status !== 'closed' ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(bug.id, 'resolved');
                                    }}
                                    className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-medium transition-all"
                                    title="Mark as Resolved"
                                  >
                                    Resolve
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(bug.id, 'in_progress');
                                    }}
                                    className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 text-xs font-medium transition-all"
                                    title="Reopen / In Progress"
                                  >
                                    Reopen
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(bug.id);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete Defect"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <BugIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-800">No defects match current filters</p>
                      <p className="text-xs text-slate-500 mt-1">Try resetting filters or report a new defect.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {kanbanColumns.map(col => {
            const colBugs = filteredBugs.filter(b => {
              if (col.id === 'open') return b.status === 'open' || b.status === 'reopened';
              return b.status === col.id;
            });

            return (
              <div key={col.id} className="bg-slate-100/70 border border-slate-200/90 rounded-xl p-4 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{col.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeColor}`}>
                      {colBugs.length}
                    </span>
                  </div>
                  {col.id === 'open' && (
                    <button 
                      onClick={() => handleOpenNewBug(selectedProjectId === 'all' ? undefined : selectedProjectId)}
                      className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs shadow-xs"
                      title="Add Open Defect"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colBugs.length > 0 ? (
                    colBugs.map(bug => {
                      const sev = getSeverityBadge(bug.severity);
                      const pri = getPriorityBadge(bug.priority);
                      const proj = projects.find(p => p.id === bug.projectId);

                      return (
                        <div
                          key={bug.id}
                          onClick={() => handleSelectBug(bug)}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {bug.bugNumber}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${sev.bg}`}>
                              {sev.label}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {bug.title}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj?.color || '#3b82f6' }} />
                              <span className="truncate">{proj?.key || 'APX'}</span>
                            </div>
                            <span className="text-slate-700 font-medium truncate">{bug.assignedTo}</span>
                          </div>

                          {/* Quick workflow mover & delete */}
                          <div className="flex items-center justify-between gap-1 pt-1" onClick={e => e.stopPropagation()}>
                            <select
                              value={bug.status}
                              onChange={(e) => handleStatusChange(bug.id, e.target.value as BugStatus)}
                              className="flex-1 bg-slate-50 border border-slate-200 text-[10px] text-slate-700 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="open">Move: Open</option>
                              <option value="in_progress">Move: In Progress</option>
                              <option value="resolved">Move: Resolved</option>
                              <option value="closed">Move: Closed</option>
                            </select>

                            {onDeleteBug && (
                              confirmDeleteId === bug.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-1 py-0.5 animate-in fade-in">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(null);
                                      onDeleteBug(bug.id);
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold"
                                  >
                                    Del
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-1 py-0.5 bg-white text-slate-600 rounded text-[9px]"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(bug.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete defect"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-32 flex items-center justify-center border border-dashed border-slate-300 rounded-xl text-xs text-slate-400">
                      No defects in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBugs.map(bug => {
            const sev = getSeverityBadge(bug.severity);
            const pri = getPriorityBadge(bug.priority);
            const stat = getStatusBadge(bug.status);
            const proj = projects.find(p => p.id === bug.projectId);

            return (
              <div
                key={bug.id}
                onClick={() => handleSelectBug(bug)}
                className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {bug.bugNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj?.color || '#3b82f6' }} />
                        {proj?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${stat.bg}`}>
                        {stat.label}
                      </span>
                      {onDeleteBug && (
                        confirmDeleteId === bug.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 text-[10px] text-red-700 animate-in fade-in">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                                onDeleteBug(bug.id);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="px-1 py-0.5 bg-white text-slate-600 rounded text-[10px]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(bug.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete defect"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {bug.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {bug.description || 'No additional summary provided.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${sev.bg}`}>
                        {sev.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] ${pri.bg}`}>
                        {pri.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono uppercase text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {bug.environment}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Assigned: <strong className="text-slate-800">{bug.assignedTo}</strong></span>
                    <span>{formatRelativeTime(bug.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
