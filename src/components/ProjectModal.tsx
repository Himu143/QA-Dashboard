import React, { useState } from 'react';
import { X, FolderGit2, AlertCircle, Trash2 } from 'lucide-react';
import { Project, TeamMember } from '../types';

interface ProjectModalProps {
  initialProject?: Project | null;
  currentUser: TeamMember;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
  onDelete?: (projectId: string) => void;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  initialProject,
  currentUser,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(initialProject?.name || '');
  const [key, setKey] = useState(initialProject?.key || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [lead, setLead] = useState(initialProject?.lead || currentUser.name);
  const [color, setColor] = useState(initialProject?.color || PRESET_COLORS[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialProject && !key) {
      const generatedKey = val
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      if (generatedKey) setKey(generatedKey);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a project name.');
      return;
    }
    if (!key.trim()) {
      setErrorMsg('Please specify a 2-5 letter project prefix key.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave({
        ...(initialProject?.id ? { id: initialProject.id } : {}),
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        lead: lead.trim(),
        color,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (initialProject?.id && onDelete) {
      onDelete(initialProject.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialProject ? 'Edit QA Project' : 'Create New QA Project'}
              </h2>
              <p className="text-xs text-slate-500">
                Segment defect queues, test plans, and team reporting.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Inline Delete Confirmation Prompt */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2.5 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2">
                <Trash2 className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-red-900">
                    Delete Project "{initialProject?.name}"?
                  </h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Are you sure you want to permanently delete this project repository and its settings?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  id="confirm-delete-project-modal-btn"
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  Yes, Delete Project
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

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Core Payment Gateway"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Project Key (Prefix) *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="e.g. PAY"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Used for bug numbering (e.g. PAY-101)</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                QA Lead / Owner
              </label>
              <input
                type="text"
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Description & Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary features, architectures, and testing focus for this project repository..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Color theme */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-blue-600 ring-offset-2 ring-offset-white' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {initialProject && onDelete ? (
              <button
                type="button"
                id="delete-project-trigger-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-project-btn"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{initialProject ? 'Save Project Changes' : 'Create Project'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
