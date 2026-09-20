/**
 * 線上自動化出題與評改系統
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Question, StudentExamRecord, ExamPaper } from './types';
import { DEFAULT_SAMPLE_QUESTIONS } from './data/sampleQuestions';
import { INITIAL_STUDENT_RECORDS } from './data/initialRecords';
import { Navbar, AppViewMode } from './components/Navbar';
import { StudentExam } from './components/StudentExam';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherLoginCard } from './components/TeacherDashboard/TeacherLoginCard';
import { ArchitectureDocs } from './components/ArchitectureDocs';

const INITIAL_EXAM_PAPERS: ExamPaper[] = [
  {
    id: 'exam_default_1',
    title: '疾病分類測驗',
    totalScore: 100,
    choiceScore: 70,
    essayScore: 30,
    questions: DEFAULT_SAMPLE_QUESTIONS,
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState<AppViewMode>('student-exam');

  // 多試卷題庫清單 (支援下拉式選單管理、上傳自動新增、刪除)
  const [examPapers, setExamPapers] = useState<ExamPaper[]>(() => {
    try {
      const savedPapers = localStorage.getItem('edugrade_exam_papers');
      if (savedPapers) {
        const parsed = JSON.parse(savedPapers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 支援將舊有「癌登能力測驗」或「第一次學科綜合能力測驗」自動遷移更新為「疾病分類測驗」
          return parsed.map((p) => {
            if (p.title === '癌登能力測驗' || p.title === '第一次學科綜合能力測驗') {
              return { ...p, title: '疾病分類測驗' };
            }
            return p;
          });
        }
      }
      // 向下相容檢查：若曾有舊版本 localStorage 的單一題庫紀錄
      const savedQuestions = localStorage.getItem('edugrade_questions');
      const savedTitle = localStorage.getItem('edugrade_exam_title');
      const savedTotalScore = localStorage.getItem('edugrade_total_score');
      if (savedQuestions) {
        const parsedQ = JSON.parse(savedQuestions);
        if (Array.isArray(parsedQ) && parsedQ.length > 0) {
          const cleanTitle =
            savedTitle === '癌登能力測驗' || savedTitle === '第一次學科綜合能力測驗'
              ? '疾病分類測驗'
              : (savedTitle || '疾病分類測驗');
          return [
            {
              id: 'exam_legacy_1',
              title: cleanTitle,
              totalScore: Number(savedTotalScore) || 100,
              questions: parsedQ,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_EXAM_PAPERS;
  });

  // 當前選定的試卷 ID
  const [activeExamId, setActiveExamId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('edugrade_active_exam_id');
      if (savedId) return savedId;
    } catch {}
    return 'exam_default_1';
  });

  // 取得當前作用中的試卷
  const activeExam: ExamPaper = useMemo(() => {
    const found = examPapers.find((p) => p.id === activeExamId);
    return found || examPapers[0] || INITIAL_EXAM_PAPERS[0];
  }, [examPapers, activeExamId]);

  const questions = activeExam.questions;
  const totalScore = activeExam.totalScore;
  const examTitle = activeExam.title;

  // 學生考試成績紀錄總表 (優先自 localStorage 載入)
  const [studentRecords, setStudentRecords] = useState<StudentExamRecord[]>(() => {
    try {
      const saved = localStorage.getItem('edugrade_student_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((r) => {
            if (
              r.examTitle === '癌登能力測驗' ||
              r.examTitle === '第一次學科綜合能力測驗' ||
              r.examTitle === '第一次定期評量 - 綜合能力測驗'
            ) {
              return { ...r, examTitle: '疾病分類測驗' };
            }
            return r;
          });
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_STUDENT_RECORDS;
  });

  // 教師後台登入管理密碼 (預設 6415)
  const [teacherPassword, setTeacherPassword] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('edugrade_teacher_password');
      if (saved) return saved;
    } catch {
      // fallback
    }
    return '6415';
  });

  // 教師當前 session 是否已驗證登入
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('edugrade_teacher_auth') === 'true';
    } catch {
      return false;
    }
  });

  // 持久化多試卷題庫
  useEffect(() => {
    try {
      localStorage.setItem('edugrade_exam_papers', JSON.stringify(examPapers));
      if (activeExam) {
        localStorage.setItem('edugrade_questions', JSON.stringify(activeExam.questions));
        localStorage.setItem('edugrade_total_score', String(activeExam.totalScore));
        localStorage.setItem('edugrade_exam_title', activeExam.title);
      }
    } catch {
      // ignore
    }
  }, [examPapers, activeExam]);

  // 持久化當前作用中試卷 ID
  useEffect(() => {
    try {
      localStorage.setItem('edugrade_active_exam_id', activeExamId);
    } catch {
      // ignore
    }
  }, [activeExamId]);

  // 持久化成績紀錄
  useEffect(() => {
    try {
      localStorage.setItem('edugrade_student_records', JSON.stringify(studentRecords));
    } catch {
      // ignore
    }
  }, [studentRecords]);

  // 持久化教師管理密碼
  useEffect(() => {
    try {
      localStorage.setItem('edugrade_teacher_password', teacherPassword);
    } catch {
      // ignore
    }
  }, [teacherPassword]);

  // 更新當前試卷題目
  const handleUpdateQuestions = (newQuestions: Question[]) => {
    setExamPapers((prev) =>
      prev.map((p) =>
        p.id === activeExam.id
          ? { ...p, questions: newQuestions, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  // 更新當前試卷總分
  const handleUpdateTotalScore = (newScore: number) => {
    setExamPapers((prev) =>
      prev.map((p) =>
        p.id === activeExam.id
          ? { ...p, totalScore: newScore, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  // 分開配分更新：更新選擇題總配分
  const handleUpdateChoiceScore = (newChoiceScore: number) => {
    setExamPapers((prev) =>
      prev.map((p) => {
        if (p.id === activeExam.id) {
          const essay = p.essayScore !== undefined ? p.essayScore : 0;
          return {
            ...p,
            choiceScore: newChoiceScore,
            totalScore: newChoiceScore + essay,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  // 分開配分更新：更新問答題總配分
  const handleUpdateEssayScore = (newEssayScore: number) => {
    setExamPapers((prev) =>
      prev.map((p) => {
        if (p.id === activeExam.id) {
          const choice = p.choiceScore !== undefined ? p.choiceScore : 0;
          return {
            ...p,
            essayScore: newEssayScore,
            totalScore: choice + newEssayScore,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  // 更新當前試卷標題
  const handleUpdateExamTitle = (newTitle: string) => {
    setExamPapers((prev) =>
      prev.map((p) =>
        p.id === activeExam.id
          ? { ...p, title: newTitle, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  // 切換選取的試卷
  const handleSelectExam = (id: string) => {
    setActiveExamId(id);
  };

  // 刪除試卷 (選單內刪除鈕)
  const handleDeleteExam = (idToDelete: string) => {
    if (examPapers.length <= 1) {
      alert('系統中至少需保留一份試卷題庫，無法刪除最後一份試卷。');
      return;
    }
    const targetPaper = examPapers.find((p) => p.id === idToDelete);
    const confirmDelete = window.confirm(
      `確定要刪除試卷題庫「${targetPaper?.title || idToDelete}」嗎？此操作無法復原。`
    );
    if (!confirmDelete) return;

    const remaining = examPapers.filter((p) => p.id !== idToDelete);
    setExamPapers(remaining);
    if (activeExamId === idToDelete) {
      setActiveExamId(remaining[0].id);
    }
  };

  // 新增空白試卷
  const handleAddNewExam = () => {
    const newId = 'exam_' + Date.now();
    const count = examPapers.length + 1;
    const newPaper: ExamPaper = {
      id: newId,
      title: `新自訂試卷題庫 #${count}`,
      totalScore: 100,
      questions: [],
      createdAt: new Date().toISOString(),
    };
    setExamPapers((prev) => [newPaper, ...prev]);
    setActiveExamId(newId);
  };

  // 上傳解析成功後自動新增至選單內並自動選取
  const handleAddNewExamWithQuestions = (newExamPaper: ExamPaper) => {
    setExamPapers((prev) => [newExamPaper, ...prev]);
    setActiveExamId(newExamPaper.id);
  };

  // 教師登入驗證處理
  const handleTeacherLogin = (inputPassword: string): boolean => {
    if (inputPassword === teacherPassword) {
      setIsTeacherAuthenticated(true);
      try {
        sessionStorage.setItem('edugrade_teacher_auth', 'true');
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  };

  // 教師登出鎖定
  const handleTeacherLogout = () => {
    setIsTeacherAuthenticated(false);
    try {
      sessionStorage.removeItem('edugrade_teacher_auth');
    } catch {
      // ignore
    }
    setCurrentView('student-exam');
  };

  // 更新教師管理密碼
  const handleUpdateTeacherPassword = (newPassword: string) => {
    setTeacherPassword(newPassword);
  };

  // 當學生完成考卷提交時，自動寫入成績總表
  const handleRecordSubmitted = (newRecord: StudentExamRecord) => {
    setStudentRecords((prev) => [newRecord, ...prev]);
  };

  // 清空學生紀錄
  const handleClearRecords = () => {
    setStudentRecords([]);
  };

  // 重設為預設示範學生紀錄
  const handleResetSampleRecords = () => {
    setStudentRecords(INITIAL_STUDENT_RECORDS);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        questionCount={questions.length}
        totalScore={totalScore}
        isTeacherAuthenticated={isTeacherAuthenticated}
        examTitle={examTitle}
        examPaperCount={examPapers.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'student-exam' && (
          <StudentExam
            questions={questions}
            totalScore={totalScore}
            choiceScore={activeExam.choiceScore}
            essayScore={activeExam.essayScore}
            examTitle={examTitle}
            studentRecords={studentRecords}
            onRecordSubmitted={handleRecordSubmitted}
            onGoToTeacherDashboard={() => setCurrentView('teacher-dashboard')}
            examPapers={examPapers}
            activeExamId={activeExamId}
            onSelectExam={handleSelectExam}
          />
        )}

        {currentView === 'teacher-dashboard' && (
          isTeacherAuthenticated ? (
            <TeacherDashboard
              questions={questions}
              onUpdateQuestions={handleUpdateQuestions}
              totalScore={totalScore}
              onUpdateTotalScore={handleUpdateTotalScore}
              choiceScore={activeExam.choiceScore}
              essayScore={activeExam.essayScore}
              onUpdateChoiceScore={handleUpdateChoiceScore}
              onUpdateEssayScore={handleUpdateEssayScore}
              examTitle={examTitle}
              onUpdateExamTitle={handleUpdateExamTitle}
              studentRecords={studentRecords}
              onClearRecords={handleClearRecords}
              onResetSampleRecords={handleResetSampleRecords}
              onSwitchToStudentExam={() => setCurrentView('student-exam')}
              teacherPassword={teacherPassword}
              onUpdateTeacherPassword={handleUpdateTeacherPassword}
              onLogout={handleTeacherLogout}
              examPapers={examPapers}
              activeExamId={activeExamId}
              onSelectExam={handleSelectExam}
              onDeleteExam={handleDeleteExam}
              onAddNewExam={handleAddNewExam}
              onAddNewExamWithQuestions={handleAddNewExamWithQuestions}
            />
          ) : (
            <TeacherLoginCard
              onLogin={handleTeacherLogin}
              onCancel={() => setCurrentView('student-exam')}
              defaultPasswordHint={teacherPassword}
            />
          )
        )}

        {currentView === 'architecture-docs' && <ArchitectureDocs />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            線上自動化出題與評改系統 © {new Date().getFullYear()} • 專為教學評量與即時回饋設計
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Fisher-Yates 隨機洗牌</span>
            <span>•</span>
            <span>動態配分公式核算</span>
            <span>•</span>
            <span>多試卷題庫下拉管理</span>
            <span>•</span>
            <span>Excel/CSV/JSON 支援</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
