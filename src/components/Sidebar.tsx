/** @jsxRuntime classic */
import React, { useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  CheckSquare, 
  Bug, 
  FlaskConical, 
  Activity as ActivityIcon, 
  UserCheck, 
  RefreshCw, 
  ChevronDown, 
  Plus,
  FolderGit2,
  X,
  Edit3,
  Trash2
} from 'lucide-react';
import { ViewTab, TeamMember, Project } from '../types';
import { INITIAL_TEAM_MEMBERS } from '../data/seedData';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: any;
    }
  }
}

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  pendingBugsCount: number;
  currentUser: TeamMember;
  onSelectUser: (user: TeamMember) => void;
  onResetDemo: () => void;
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingBugsCount,
  currentUser,
  onSelectUser,
  onResetDemo,
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [confirmDeleteProjId, setConfirmDeleteProjId] = useState<string | null>(null);

  const navItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'test_plans', label: 'Test Plans', icon: Layers },
    { id: 'test_cases', label: 'Test Cases', icon: CheckSquare },
    { id: 'bugs', label: 'Bug Tracker', icon: Bug, badge: pendingBugsCount },
    { id: 'test_reports', label: 'Test Runs & Reports', icon: FlaskConical },
    { id: 'activity', label: 'Team Activity', icon: ActivityIcon },
  ];

  const handleNavClick = (tabId: ViewTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800/80
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Brand Logo Header */}
        <div className="p-6 flex items-center justify-between">
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center space-x-3 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform">
              Q
            </div>
            <div>
              <span className="text-white font-semibold text-lg tracking-tight flex items-center gap-1.5">
                QA Dashboard
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Sleek
                </span>
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar py-2">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white text-blue-600' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Projects Quick Links Section */}
          <div className="pt-6 pb-2 px-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Projects</span>
            <button
              onClick={onOpenNewProject}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold normal-case text-xs"
              title="Add New Project"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => onSelectProject('all')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedProjectId === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <FolderGit2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="truncate">All Projects</span>
              </div>
              {selectedProjectId === 'all' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              )}
            </button>

            {projects.map(proj => (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedProjectId === proj.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: proj.color }} 
                  />
                  <span className="truncate">{proj.name}</span>
                </div>

                {confirmDeleteProjId === proj.id ? (
                  <div 
                    className="flex items-center gap-1 bg-red-950/90 border border-red-500/50 rounded px-1.5 py-0.5 text-[10px] text-red-200 flex-shrink-0 animate-in fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-semibold text-red-300">Delete?</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteProjId(null);
                        if (onDeleteProject) onDeleteProject(proj.id);
                      }}
                      className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteProjId(null);
                      }}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 group-hover:hidden">
                      {proj.key}
                    </span>
                    
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      {onEditProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(proj);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-700/80 transition-colors"
                          title="Edit Project"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteProjId(proj.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700/80 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* User Identity / Persona Section at Bottom */}
        <div className="p-4 border-t border-slate-800 relative bg-slate-900/90">
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
            title="Switch User Persona"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className={`w-8 h-8 rounded-full ${currentUser.avatarBg || 'bg-blue-600'} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-inner`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-xs min-w-0">
                <p className="text-white font-medium truncate">{currentUser.name}</p>
                <p className="text-slate-400 text-[11px] truncate">{currentUser.role}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>

          {/* Persona Switcher Popup */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setShowUserMenu(false)} />
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden text-xs">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                  <span>Switch Team Persona</span>
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="py-1 max-h-48 overflow-y-auto">
                  {INITIAL_TEAM_MEMBERS.map(member => (
                    <button
                      key={member.id}
                      onClick={() => { onSelectUser(member); setShowUserMenu(false); }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-800 transition-colors ${
                        currentUser.id === member.id ? 'bg-blue-600/20 text-blue-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${member.avatarBg} text-white font-bold text-[10px] flex items-center justify-center`}>
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-200 truncate">{member.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{member.role}</p>
                      </div>
                      {currentUser.id === member.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800 p-2 bg-slate-950/60">
                  <button
                    onClick={() => { setShowUserMenu(false); onResetDemo(); }}
                    className="w-full text-left flex items-center gap-2 text-xs text-slate-400 hover:text-amber-300 transition-colors px-1.5 py-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Sample Data</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
