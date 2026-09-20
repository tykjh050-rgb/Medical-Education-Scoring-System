import React, { useState } from 'react';
import { UploadCloud, Users, Sparkles, Eye, Key, LogOut } from 'lucide-react';
import { Question, StudentExamRecord, ExamPaper } from '../../types';
import { QuestionUploader } from './QuestionUploader';
import { ScoreReportTable } from './ScoreReportTable';
import { ExamContentEditorModal } from './ExamContentEditorModal';
import { TeacherPasswordModal } from './TeacherPasswordModal';

interface TeacherDashboardProps {
  questions: Question[];
  onUpdateQuestions: (newQuestions: Question[]) => void;
  totalScore: number;
  onUpdateTotalScore: (score: number) => void;
  choiceScore?: number;
  essayScore?: number;
  onUpdateChoiceScore?: (score: number) => void;
  onUpdateEssayScore?: (score: number) => void;
  examTitle: string;
  onUpdateExamTitle: (title: string) => void;
  studentRecords: StudentExamRecord[];
  onClearRecords: () => void;
  onResetSampleRecords?: () => void;
  onSwitchToStudentExam: () => void;
  teacherPassword?: string;
  onUpdateTeacherPassword?: (newPassword: string) => void;
  onLogout?: () => void;
  examPapers: ExamPaper[];
  activeExamId: string;
  onSelectExam: (id: string) => void;
  onDeleteExam: (id: string) => void;
  onAddNewExam: () => void;
  onAddNewExamWithQuestions: (newExam: ExamPaper) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  questions,
  onUpdateQuestions,
  totalScore,
  onUpdateTotalScore,
  choiceScore,
  essayScore,
  onUpdateChoiceScore,
  onUpdateEssayScore,
  examTitle,
  onUpdateExamTitle,
  studentRecords,
  onClearRecords,
  onResetSampleRecords,
  onSwitchToStudentExam,
  teacherPassword = '6415',
  onUpdateTeacherPassword,
  onLogout,
  examPapers,
  activeExamId,
  onSelectExam,
  onDeleteExam,
  onAddNewExam,
  onAddNewExamWithQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'scores'>('questions');
  const [showExamInspectorModal, setShowExamInspectorModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              教師教學管理後台
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              已登入管理身分
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            上傳試卷題庫（Excel/CSV/JSON）、線上檢視與增刪修改試題、調整總分動態配分，並即時查閱與匯出學生成績總表。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 密碼管理功能鈕 */}
          <button
            id="btn-teacher-password-management"
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 shadow-xs transition"
            title="查看或修改教師後台登入管理密碼 (預設: 6415)"
          >
            <Key className="w-3.5 h-3.5 text-indigo-600" />
            <span>密碼管理</span>
          </button>

          {/* 檢視觀看試卷內容功能鈕 (線上增刪修) */}
          <button
            id="btn-top-inspect-exam"
            onClick={() => setShowExamInspectorModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            title="檢視試卷內容，並可進行線上新增、刪除、修改題目"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>檢視試卷內容 (線上增刪修)</span>
          </button>

          {/* Sub-tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              id="tab-teacher-questions-btn"
              onClick={() => setActiveTab('questions')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'questions'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>試卷題庫管理 ({questions.length})</span>
            </button>

            <button
              id="tab-teacher-scores-btn"
              onClick={() => setActiveTab('scores')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'scores'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>學生成績總表 ({studentRecords.length})</span>
            </button>
          </div>

          <button
            id="btn-quick-preview-exam"
            onClick={onSwitchToStudentExam}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            以學生身分模擬
          </button>

          {/* 登出鎖定按鈕 */}
          {onLogout && (
            <button
              id="btn-teacher-logout"
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-3 py-2 text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl text-xs font-bold transition"
              title="登出教師身分並鎖定後台"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>登出鎖定</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'questions' ? (
        <QuestionUploader
          questions={questions}
          onUpdateQuestions={onUpdateQuestions}
          totalScore={totalScore}
          onUpdateTotalScore={onUpdateTotalScore}
          choiceScore={choiceScore}
          essayScore={essayScore}
          onUpdateChoiceScore={onUpdateChoiceScore}
          onUpdateEssayScore={onUpdateEssayScore}
          examTitle={examTitle}
          onUpdateExamTitle={onUpdateExamTitle}
          onSwitchToStudentExam={onSwitchToStudentExam}
          onOpenExamInspector={() => setShowExamInspectorModal(true)}
          examPapers={examPapers}
          activeExamId={activeExamId}
          onSelectExam={onSelectExam}
          onDeleteExam={onDeleteExam}
          onAddNewExam={onAddNewExam}
          onAddNewExamWithQuestions={onAddNewExamWithQuestions}
        />
      ) : (
        <ScoreReportTable
          records={studentRecords}
          onClearRecords={onClearRecords}
          onResetSampleRecords={onResetSampleRecords}
        />
      )}

      {/* 教師檢視試卷內容與線上增刪修改彈窗 */}
      <ExamContentEditorModal
        isOpen={showExamInspectorModal}
        onClose={() => setShowExamInspectorModal(false)}
        questions={questions}
        onUpdateQuestions={onUpdateQuestions}
        totalScore={totalScore}
        onUpdateTotalScore={onUpdateTotalScore}
        choiceScore={choiceScore}
        essayScore={essayScore}
        onUpdateChoiceScore={onUpdateChoiceScore}
        onUpdateEssayScore={onUpdateEssayScore}
        examTitle={examTitle}
        onUpdateExamTitle={onUpdateExamTitle}
        onSwitchToStudentExam={onSwitchToStudentExam}
      />

      {/* 教師管理密碼管理彈窗 */}
      <TeacherPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        currentPassword={teacherPassword}
        onUpdatePassword={(newPw) => {
          if (onUpdateTeacherPassword) {
            onUpdateTeacherPassword(newPw);
          }
        }}
      />
    </div>
  );
};
