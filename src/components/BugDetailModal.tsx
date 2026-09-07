import React, { useState } from 'react';
import { 
  X, 
  Bug, 
  Clock, 
  User, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Send, 
  Layers, 
  CheckSquare, 
  ExternalLink, 
  Edit3, 
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { Bug as BugType, Project, Comment, TeamMember, BugStatus, TestCase, TestPlan } from '../types';
import { getSeverityBadge, getPriorityBadge, getStatusBadge, formatDateTime, formatRelativeTime } from '../lib/utils';

interface BugDetailModalProps {
  bug: BugType | null;
  projects: Project[];
  testCases: TestCase[];
  testPlans: TestPlan[];
  comments: Comment[];
  currentUser: TeamMember;
  onClose: () => void;
  onUpdateStatus: (bugId: string, status: BugStatus, resolutionNotes?: string) => void;
  onAddComment: (comment: Partial<Comment>) => void;
  onDeleteComment?: (commentId: string) => void;
  onEditBug: (bug: BugType) => void;
  onDeleteBug: (bugId: string) => void;
  onNavigateToTestCase?: (testCaseId: string) => void;
}

export const BugDetailModal: React.FC<BugDetailModalProps> = ({
  bug,
  projects,
  testCases,
  testPlans,
  comments,
  currentUser,
  onClose,
  onUpdateStatus,
  onAddComment,
  onDeleteComment,
  onEditBug,
  onDeleteBug,
  onNavigateToTestCase,
}) => {
  if (!bug) return null;

  const [commentText, setCommentText] = useState('');
  const [resolutionInput, setResolutionInput] = useState(bug.resolutionNotes || '');
  const [showResolutionBox, setShowResolutionBox] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const project = projects.find(p => p.id === bug.projectId);
  const linkedTestCase = testCases.find(tc => tc.id === bug.testCaseId);
  const linkedTestPlan = testPlans.find(tp => tp.id === bug.testPlanId);
  const bugComments = comments.filter(c => c.entityType === 'bug' && c.entityId === bug.id);

  const sev = getSeverityBadge(bug.severity);
  const pri = getPriorityBadge(bug.priority);
  const stat = getStatusBadge(bug.status);

  const handleCopyId = () => {
    navigator.clipboard.writeText(`${bug.bugNumber}: ${bug.title}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment({
      entityType: 'bug',
      entityId: bug.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: commentText.trim(),
    });
    setCommentText('');
  };

  const handleStatusChange = (newStatus: BugStatus) => {
    if (newStatus === 'resolved' && !bug.resolutionNotes) {
      setShowResolutionBox(true);
    } else {
      onUpdateStatus(bug.id, newStatus, resolutionInput);
    }
  };

  const handleSaveResolution = () => {
    onUpdateStatus(bug.id, 'resolved', resolutionInput);
    setShowResolutionBox(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 md:p-10 animate-in fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {bug.bugNumber}
              </span>
              
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color || '#3b82f6' }} />
                <span>{project?.name || 'Project'}</span>
              </div>

              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${sev.bg}`}>
                {sev.label} Severity
              </span>

              <span className={`px-2 py-0.5 rounded text-xs ${pri.bg}`}>
                {pri.label}
              </span>

              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                Env: {bug.environment}
              </span>

              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 text-xs flex items-center gap-1 ml-auto transition-colors"
                title="Copy Bug Summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {bug.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Status & Action Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
              <select
                value={bug.status}
                onChange={(e) => handleStatusChange(e.target.value as BugStatus)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer shadow-xs ${stat.bg}`}
              >
                <option value="open" className="bg-white text-slate-900">Open (Requires Dev)</option>
                <option value="in_progress" className="bg-white text-slate-900">In Progress (Fixing)</option>
                <option value="resolved" className="bg-white text-slate-900">Resolved (Ready for QA)</option>
                <option value="closed" className="bg-white text-slate-900">Closed & Verified</option>
                <option value="reopened" className="bg-white text-slate-900">Reopened</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditBug(bug)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit Details</span>
              </button>

              <button
                type="button"
                id="delete-bug-trigger-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Delete Confirmation Prompt Box */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3 animate-in slide-in-from-top-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    Delete Defect {bug.bugNumber}?
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    Are you sure you want to permanently remove this defect ticket and its activity records?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="confirm-delete-bug-btn"
                  type="button"
                  onClick={() => {
                    onDeleteBug(bug.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  Yes, Delete Defect
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Resolution Prompt Box if requested */}
          {showResolutionBox && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2.5 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resolution Notes
                </span>
                <button 
                  onClick={() => setShowResolutionBox(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
              <textarea
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                placeholder="Explain the root cause fix, commit SHA, PR link, or configuration change applied..."
                className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[60px]"
              />
              <button
                onClick={handleSaveResolution}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
              >
                Confirm & Mark Resolved
              </button>
            </div>
          )}

          {/* Description */}
          {bug.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Defect Overview</h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {bug.description}
              </div>
            </div>
          )}

          {/* Steps to Reproduce */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Steps to Reproduce</h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {bug.stepsToReproduce || '1. Follow standard user flow.'}
            </div>
          </div>

          {/* Expected vs Actual Result Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Expected Result
              </span>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {bug.expectedResult || 'System operates according to specification.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Actual Observed Result
              </span>
              <p className="text-xs text-red-900 leading-relaxed font-medium">
                {bug.actualResult || 'Error or defect observed.'}
              </p>
            </div>
          </div>

          {/* Resolution Notes Display if already resolved */}
          {bug.resolutionNotes && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fixed Resolution Notes
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {bug.resolutionNotes}
              </p>
              {bug.resolvedAt && (
                <p className="text-[10px] text-slate-500 mt-1">Resolved on {formatDateTime(bug.resolvedAt)}</p>
              )}
            </div>
          )}

          {/* Meta Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Assigned Developer</span>
              <span className="font-semibold text-slate-800">{bug.assignedTo || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Reported By</span>
              <span className="font-semibold text-slate-800">{bug.reportedBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Reported Date</span>
              <span className="font-semibold text-slate-800">{formatDateTime(bug.createdAt)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Last Updated</span>
              <span className="font-semibold text-slate-800">{formatRelativeTime(bug.updatedAt)}</span>
            </div>
          </div>

          {/* Linked Test Suite Entities */}
          {(linkedTestCase || linkedTestPlan) && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Linked QA Test Matrix</h4>
              <div className="flex flex-wrap gap-3">
                {linkedTestCase && (
                  <div 
                    onClick={() => {
                      if (onNavigateToTestCase) {
                        onClose();
                        onNavigateToTestCase(linkedTestCase.id);
                      }
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 cursor-pointer text-xs shadow-xs transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-mono text-[11px] text-blue-700 font-bold">{linkedTestCase.caseNumber}</span>
                      <p className="text-slate-800 font-medium truncate max-w-xs">{linkedTestCase.title}</p>
                    </div>
                  </div>
                )}

                {linkedTestPlan && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-mono text-[11px] text-emerald-700 font-bold">{linkedTestPlan.planNumber}</span>
                      <p className="text-slate-800 font-medium truncate max-w-xs">{linkedTestPlan.title}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collaborative Discussion & Comments Feed */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Team Testing Sync & Discussion ({bugComments.length})</span>
              </h4>
              <span className="text-xs text-slate-500">Collaborating as <strong className="text-slate-800">{currentUser.name}</strong></span>
            </div>

            {/* Comment List */}
            <div className="space-y-3">
              {bugComments.length > 0 ? (
                bugComments.map(c => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{c.authorName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                          {c.authorRole}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{formatRelativeTime(c.createdAt)}</span>
                        {onDeleteComment && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(c.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  No discussion comments yet. Add an update or ask a question below.
                </div>
              )}
            </div>

            {/* Comment Input Box */}
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                id="bug-comment-input"
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Post testing sync update, reproduction feedback, or dev fix notes..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
