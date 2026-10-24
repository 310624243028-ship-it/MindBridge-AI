import React, { useState } from 'react';
import { 
  Brain, 
  Activity, 
  UserCheck, 
  FlaskConical, 
  Database, 
  Sun, 
  Moon, 
  Eye, 
  Type, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { DatabaseStatus, Role, User } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  onSwitchRole: (role: Role) => void;
  dbStatus: DatabaseStatus | null;
  onOpenDbDiagnostics: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  textSize: 'standard' | 'large' | 'extra-large';
  onCycleTextSize: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onSwitchRole,
  dbStatus,
  onOpenDbDiagnostics,
  highContrast,
  onToggleHighContrast,
  textSize,
  onCycleTextSize,
  darkMode,
  onToggleDarkMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'Platform Overview', icon: Brain },
    { id: 'battery', label: 'Screening Battery', icon: Activity },
    { id: 'dashboard', label: 'Participant Trends', icon: Activity },
    { id: 'clinician', label: 'Clinician Portal', icon: UserCheck },
    { id: 'research', label: 'ML Research Lab', icon: FlaskConical },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm dark:border-slate-800 dark:bg-slate-900/95 transition-smooth">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => onSelectTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md group-hover:scale-105 transition-smooth">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  MindBridge<span className="text-sky-600 dark:text-sky-400">AI</span>
                </span>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  Research v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Cognitive Screening & Longitudinal Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-smooth ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-xs dark:bg-sky-950 dark:text-sky-300 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Toolbar: Exasol Badge, Role Switcher & Accessibility */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Database Status Pill */}
            <button
              onClick={onOpenDbDiagnostics}
              title="Click to view Exasol Personal connectivity & diagnostic details"
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-smooth ${
                dbStatus?.is_mock
                  ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {dbStatus?.is_mock ? 'Mock Exasol' : 'Exasol Personal'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.is_mock ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            </button>

            {/* Quick Demo Role Selector */}
            <div className="relative inline-flex items-center">
              <label htmlFor="role-select" className="sr-only">Active Demo Role</label>
              <select
                id="role-select"
                aria-label="Active Demo Role"
                value={currentUser?.role || 'participant'}
                onChange={(e) => onSwitchRole(e.target.value as Role)}
                className="appearance-none rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="participant">Role: Participant</option>
                <option value="clinician">Role: Clinician</option>
                <option value="researcher">Role: Researcher</option>
                <option value="admin">Role: Admin</option>
              </select>
            </div>

            {/* Accessibility Toolbar */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2 dark:border-slate-800">
              {/* Text Size Cycle */}
              <button
                onClick={onCycleTextSize}
                title={`Text size: ${textSize}. Click to cycle.`}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Adjust font size"
              >
                <Type className="w-4 h-4" />
              </button>

              {/* High Contrast Toggle */}
              <button
                onClick={onToggleHighContrast}
                title={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
                className={`rounded-lg p-1.5 transition-smooth ${
                  highContrast 
                    ? 'bg-yellow-400 text-black font-bold ring-2 ring-yellow-500' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
                aria-label="High contrast mode"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={onToggleDarkMode}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 px-4 py-3 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-sky-600" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                onOpenDbDiagnostics();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600" />
                Database Engine Status
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                {dbStatus?.is_mock ? 'Mock Adapter' : 'Exasol Personal'}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
