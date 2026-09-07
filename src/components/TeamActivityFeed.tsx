import React, { useState } from 'react';
import { 
  Activity as ActivityIcon, 
  Bug, 
  CheckSquare, 
  Layers, 
  FlaskConical, 
  MessageSquare, 
  CheckCircle2, 
  Filter, 
  Clock, 
  User 
} from 'lucide-react';
import { Activity, Project } from '../types';
import { formatDateTime, formatRelativeTime } from '../lib/utils';

interface TeamActivityFeedProps {
  activities: Activity[];
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
}

export const TeamActivityFeed: React.FC<TeamActivityFeedProps> = ({
  activities,
  projects,
  selectedProjectId,
  onSelectProject,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredActivities = activities.filter(act => {
    if (selectedProjectId !== 'all' && act.projectId && act.projectId !== selectedProjectId) {
      return false;
    }
    if (filterType !== 'all' && act.entityType !== filterType) {
      return false;
    }
    return true;
  });

  const getActivityIcon = (entityType: string, actionType: string) => {
    if (actionType === 'resolved') {
      return { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    if (actionType === 'commented') {
      return { icon: MessageSquare, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    switch (entityType) {
      case 'bug':
        return { icon: Bug, color: 'bg-red-100 text-red-700 border-red-200' };
      case 'testCase':
        return { icon: CheckSquare, color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'testPlan':
        return { icon: Layers, color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'testRun':
        return { icon: FlaskConical, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      default:
        return { icon: ActivityIcon, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-blue-600" />
              <span>Team Testing Sync & Audit Log</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Live Updates
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time feed of defects logged, test cases verified, comments posted, and quality gates updated.
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
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Type Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'bug', label: 'Bugs & Defects' },
          { id: 'testCase', label: 'Test Cases' },
          { id: 'testRun', label: 'Test Runs' },
          { id: 'testPlan', label: 'Test Plans' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm">
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {filteredActivities.length > 0 ? (
            filteredActivities.map(act => {
              const { icon: Icon, color } = getActivityIcon(act.entityType, act.actionType);
              const project = projects.find(p => p.id === act.projectId);

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline icon dot */}
                  <div className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-800">{act.actorName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                          {act.actorRole}
                        </span>
                        {project && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-medium">
                            {project.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatRelativeTime(act.timestamp)}</span>
                    </div>

                    <p className="text-xs font-semibold text-slate-900">
                      {act.entityTitle}
                    </p>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {act.details}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No activity logs recorded for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
