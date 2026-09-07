import React, { useState } from 'react';
import { 
  Bug, 
  FlaskConical, 
  Layers, 
  FileText, 
  CheckSquare, 
  Activity as ActivityIcon, 
  Plus, 
  Search, 
  RefreshCw, 
  UserCheck, 
  FolderGit2, 
  BarChart3,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Project, TeamMember, ViewTab } from '../types';
import { INITIAL_TEAM_MEMBERS } from '../data/seedData';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  selectedProjectId: string; // 'all' or proj id
  onSelectProject: (projectId: string) => void;
  projects: Project[];
  currentUser: TeamMember;
  onSelectUser: (user: TeamMember) => void;
  onOpenNewBug: () => void;
  onOpenNewTestCase: () => void;
  onOpenNewProject: () => void;
  onResetDemo: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  pendingBugsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  selectedProjectId,
  onSelectProject,
  projects,
  currentUser,
  onSelectUser,
  onOpenNewBug,
  onOpenNewTestCase,
  onOpenNewProject,
  onResetDemo,
  searchQuery,
  onSearchChange,
  pendingBugsCount,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const navItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'bugs', label: 'Bugs & Issues', icon: Bug, badge: pendingBugsCount },
    { id: 'test_plans', label: 'Test Plans', icon: Layers },
    { id: 'test_cases', label: 'Test Cases', icon: CheckSquare },
    { id: 'test_runs', label: 'Test Runs & Reports', icon: FlaskConical },
    { id: 'activity', label: 'Team Sync Feed', icon: ActivityIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      {/* Top tier: Brand, Project Switcher, Global Actions, Team Persona */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Project Dropdown */}
          <div className="flex items-center gap-4">
            <div 
              onClick={() => onSelectTab('dashboard')} 
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-600/30 text-white font-bold group-hover:scale-105 transition-transform">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  QA Hub
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Pro
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 font-medium leading-none">Test & Bug Management</p>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Project Picker */}
            <div className="relative">
              <button
                id="project-selector-dropdown-btn"
                type="button"
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-sm font-medium text-slate-200 transition-colors"
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-700" 
                  style={{ backgroundColor: selectedProject ? selectedProject.color : '#6366f1' }}
                />
                <span className="max-w-[140px] sm:max-w-[180px] truncate">
                  {selectedProjectId === 'all' ? 'All Projects' : selectedProject?.name || 'Project'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showProjectMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(false)} />
                  <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
                      <span>Select Project</span>
                      <button 
                        onClick={() => { setShowProjectMenu(false); onOpenNewProject(); }}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Plus className="w-3 h-3" /> New
                      </button>
                    </div>
                    <button
                      onClick={() => { onSelectProject('all'); setShowProjectMenu(false); }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800/70 transition-colors ${
                        selectedProjectId === 'all' ? 'text-indigo-400 font-semibold bg-indigo-500/10' : 'text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-indigo-400" />
                        <span>All Projects Overview</span>
                      </div>
                      {selectedProjectId === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    {projects.map(proj => (
                      <button
                        key={proj.id}
                        onClick={() => { onSelectProject(proj.id); setShowProjectMenu(false); }}
                        className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-slate-800/70 transition-colors ${
                          selectedProjectId === proj.id ? 'text-indigo-400 font-semibold bg-indigo-500/10' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: proj.color }}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-200">{proj.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">[{proj.key}] • {proj.targetVersion || 'Active'}</p>
                          </div>
                        </div>
                        {selectedProjectId === proj.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Center Search Input */}
          <div className="hidden md:flex flex-1 max-w-md items-center">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search bugs, test cases, tags, or IDs..."
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action buttons: Quick Bug, Quick Case, Persona Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Quick Create Bug */}
            <button
              id="header-create-bug-btn"
              type="button"
              onClick={onOpenNewBug}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Bug className="w-4 h-4" />
              <span>Report Bug</span>
            </button>

            {/* Quick Create Test Case */}
            <button
              id="header-create-case-btn"
              type="button"
              onClick={onOpenNewTestCase}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Test Case</span>
            </button>

            {/* Team Member Persona Dropdown */}
            <div className="relative">
              <button
                id="user-persona-toggle-btn"
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs font-medium text-slate-200 transition-colors"
                title="Switch Team Member Identity"
              >
                <div className={`w-6 h-6 rounded-md ${currentUser.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-inner`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="font-semibold text-slate-200 leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-indigo-300 leading-tight">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                      <span>Collaborating as</span>
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="py-1">
                      {INITIAL_TEAM_MEMBERS.map(member => (
                        <button
                          key={member.id}
                          onClick={() => { onSelectUser(member); setShowUserMenu(false); }}
                          className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-800/80 transition-colors ${
                            currentUser.id === member.id ? 'bg-indigo-600/15 text-indigo-300 font-semibold' : 'text-slate-300'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-md ${member.avatarBg} text-white font-bold text-xs flex items-center justify-center`}>
                            {member.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-200 truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{member.role}</p>
                          </div>
                          {currentUser.id === member.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-800 px-3 py-2 bg-slate-950/60">
                      <button
                        onClick={() => { setShowUserMenu(false); onResetDemo(); }}
                        className="w-full text-left flex items-center gap-2 text-xs text-slate-400 hover:text-amber-300 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reset Sample QA Data</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Bottom tier: Main navigation tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-px border-t border-slate-800/60 pt-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
