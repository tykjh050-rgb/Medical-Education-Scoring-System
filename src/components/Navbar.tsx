import React from 'react';
import {
  GraduationCap,
  Settings,
  FileSpreadsheet,
  Code2,
  BookOpen,
  Lock,
} from 'lucide-react';

export type AppViewMode = 'student-exam' | 'teacher-dashboard' | 'architecture-docs';

interface NavbarProps {
  currentView: AppViewMode;
  onSelectView: (view: AppViewMode) => void;
  questionCount: number;
  totalScore: number;
  isTeacherAuthenticated?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  questionCount,
  totalScore,
  isTeacherAuthenticated = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  線上自動化出題與評改系統
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  EduGrade Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                動態換算配分 • 隨機洗牌不重複 • Excel/CSV/JSON 匯入匯出
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-student-exam-btn"
              onClick={() => onSelectView('student-exam')}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'student-exam'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>學生測驗區</span>
            </button>

            <button
              id="nav-teacher-dashboard-btn"
              onClick={() => onSelectView('teacher-dashboard')}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'teacher-dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>教師管理區</span>
              {isTeacherAuthenticated ? (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500 text-white shadow-xs">
                  已驗證
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] opacity-75" title="需輸入密碼 6415">
                  <Lock className="w-3 h-3" />
                </span>
              )}
            </button>

            <button
              id="nav-architecture-docs-btn"
              onClick={() => onSelectView('architecture-docs')}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'architecture-docs'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">技術架構與 Schema</span>
              <span className="md:hidden">架構</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Sub-bar Info */}
      <div className="bg-slate-50 border-t border-slate-200/70 px-4 sm:px-6 lg:px-8 py-2 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              目前考題庫：
              <span className="text-indigo-600 font-bold">{questionCount} 題</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              總分設定：
              <span className="text-emerald-700 font-bold">{totalScore} 分</span>
              <span className="text-slate-400 text-[11px]">
                (每題均分 {questionCount > 0 ? (totalScore / questionCount).toFixed(2) : 0} 分)
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="hidden sm:inline">動態計分公式：</span>
            <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700 font-mono">
              得分 = (答對題數 / {questionCount || 'N'}) × {totalScore}
            </code>
          </div>
        </div>
      </div>
    </header>
  );
};
