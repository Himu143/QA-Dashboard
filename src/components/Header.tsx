import React from 'react';
import { 
  Search, 
  Plus, 
  Menu, 
  Bug, 
  FolderGit2, 
  CheckCircle2, 
  Sparkles,
  ChevronDown,
  Edit3,
  Trash2
} from 'lucide-react';
import { Project, ViewTab } from '../types';

interface HeaderProps {
  currentTab: ViewTab;
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenNewBug: () => void;
  onOpenNewProject: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenNewBug,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  searchQuery,
  onSearchChange,
  onToggleMobileMenu,
}) => {
  const getTabTitle = (tab: ViewTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Organization Overview';
      case 'bugs':
        return 'Defect Tracker & Backlog';
      case 'test_plans':
        return 'Test Plans Repository';
      case 'test_cases':
        return 'Test Cases & Execution';
      case 'test_reports':
        return 'Test Runs & QA Reports';
      case 'activity':
        return 'Team Testing Audit Log';
      default:
        return 'QA Dashboard Central';
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm flex-shrink-0 z-20">
      {/* Left: Mobile hamburger + Title + Project dropdown */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate">
          {getTabTitle(currentTab)}
        </h1>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Project Selector Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5">
          <select
            id="header-project-select"
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="bg-slate-100 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map(proj => (
              <option key={proj.id} value={proj.id}>
                {proj.name} ({proj.key})
              </option>
            ))}
          </select>

          {selectedProject && onEditProject && (
            <button
              type="button"
              id="header-edit-project-btn"
              onClick={() => onEditProject(selectedProject)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200/70"
              title={`Edit Project Settings (${selectedProject.name})`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Search box + "+ Create New Bug" Primary Button */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Search input */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search defects, tags..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* "+ Create New Bug" Button matching theme */}
        <button
          id="header-create-bug-btn"
          type="button"
          onClick={onOpenNewBug}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Bug</span>
        </button>
      </div>
    </header>
  );
};
