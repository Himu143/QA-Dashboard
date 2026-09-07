import { Bug, BugSeverity, BugStatus, BugPriority, Project, TestCase, TestRun } from '../types';

export function getSeverityBadge(severity: BugSeverity) {
  switch (severity) {
    case 'critical':
      return { label: 'Critical', bg: 'bg-red-100 text-red-700 border border-red-200/80 font-bold' };
    case 'high':
      return { label: 'High', bg: 'bg-orange-100 text-orange-700 border border-orange-200/80 font-bold' };
    case 'medium':
      return { label: 'Medium', bg: 'bg-amber-100 text-amber-800 border border-amber-200/80 font-bold' };
    case 'low':
      return { label: 'Low', bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200/80 font-bold' };
  }
}

export function getPriorityBadge(priority: BugPriority) {
  switch (priority) {
    case 'P0':
      return { label: 'P0 - Blocker', bg: 'bg-red-100 text-red-800 border border-red-300 font-mono font-bold' };
    case 'P1':
      return { label: 'P1 - High', bg: 'bg-orange-100 text-orange-800 border border-orange-300 font-mono font-semibold' };
    case 'P2':
      return { label: 'P2 - Normal', bg: 'bg-blue-50 text-blue-700 border border-blue-200 font-mono font-medium' };
    case 'P3':
      return { label: 'P3 - Low', bg: 'bg-slate-100 text-slate-600 border border-slate-200 font-mono font-medium' };
  }
}

export function getStatusBadge(status: BugStatus) {
  switch (status) {
    case 'open':
      return { label: 'Open', bg: 'bg-red-100 text-red-700 border border-red-200/80 font-bold' };
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-blue-100 text-blue-700 border border-blue-200/80 font-bold' };
    case 'resolved':
      return { label: 'Resolved', bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200/80 font-bold' };
    case 'closed':
      return { label: 'Closed', bg: 'bg-slate-100 text-slate-600 border border-slate-200/80 font-bold' };
    case 'reopened':
      return { label: 'Reopened', bg: 'bg-purple-100 text-purple-700 border border-purple-200/80 font-bold' };
  }
}

export function getTestCaseStatusBadge(status: string) {
  switch (status) {
    case 'passed':
      return { label: 'Passed', bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200/80 font-bold' };
    case 'failed':
      return { label: 'Failed', bg: 'bg-red-100 text-red-700 border border-red-200/80 font-bold' };
    case 'blocked':
      return { label: 'Blocked', bg: 'bg-amber-100 text-amber-800 border border-amber-200/80 font-bold' };
    case 'skipped':
      return { label: 'Skipped', bg: 'bg-slate-100 text-slate-600 border border-slate-200/80 font-bold' };
    default:
      return { label: 'Untested', bg: 'bg-slate-100 text-slate-500 border border-slate-200/80 font-medium' };
  }
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays > 7) {
      return formatDate(dateString);
    } else if (diffDays >= 1) {
      return `${diffDays}d ago`;
    } else if (diffHr >= 1) {
      return `${diffHr}h ago`;
    } else if (diffMin >= 1) {
      return `${diffMin}m ago`;
    } else {
      return 'Just now';
    }
  } catch {
    return dateString;
  }
}

export interface ProjectBugStats {
  projectId: string;
  projectName: string;
  projectKey: string;
  color: string;
  totalBugs: number;
  pendingBugs: number; // open + in_progress + reopened
  resolvedBugs: number; // resolved + closed
  criticalBugs: number;
  highBugs: number;
  mediumBugs: number;
  lowBugs: number;
  resolutionRate: number; // percentage (0-100)
}

export function computeProjectStats(projects: Project[], bugs: Bug[]): ProjectBugStats[] {
  return projects.map(proj => {
    const projBugs = bugs.filter(b => b.projectId === proj.id);
    const total = projBugs.length;
    const pending = projBugs.filter(b => b.status === 'open' || b.status === 'in_progress' || b.status === 'reopened').length;
    const resolved = projBugs.filter(b => b.status === 'resolved' || b.status === 'closed').length;
    const critical = projBugs.filter(b => b.severity === 'critical').length;
    const high = projBugs.filter(b => b.severity === 'high').length;
    const medium = projBugs.filter(b => b.severity === 'medium').length;
    const low = projBugs.filter(b => b.severity === 'low').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    return {
      projectId: proj.id,
      projectName: proj.name,
      projectKey: proj.key,
      color: proj.color || '#6366f1',
      totalBugs: total,
      pendingBugs: pending,
      resolvedBugs: resolved,
      criticalBugs: critical,
      highBugs: high,
      mediumBugs: medium,
      lowBugs: low,
      resolutionRate,
    };
  });
}
