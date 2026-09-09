/**
 * 線上自動化出題與評改系統
 */

import React, { useState, useEffect } from 'react';
import { Question, StudentExamRecord } from './types';
import { DEFAULT_SAMPLE_QUESTIONS } from './data/sampleQuestions';
import { INITIAL_STUDENT_RECORDS } from './data/initialRecords';
import { Navbar, AppViewMode } from './components/Navbar';
import { StudentExam } from './components/StudentExam';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherLoginCard } from './components/TeacherDashboard/TeacherLoginCard';
import { ArchitectureDocs } from './components/ArchitectureDocs';

export default function App() {
  const [currentView, setCurrentView] = useState<AppViewMode>('student-exam');
  
  // 試卷題目庫 (優先自 localStorage 載入，否則使用預設 5 題示範題目)
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('edugrade_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SAMPLE_QUESTIONS;
  });

  // 老師自訂總分 (預設 100 分)
  const [totalScore, setTotalScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('edugrade_total_score');
      if (saved) return Number(saved) || 100;
    } catch {
      // fallback
    }
    return 100;
  });

  // 測驗標題
  const [examTitle, setExamTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('edugrade_exam_title');
      if (saved) return saved;
    } catch {
      // fallback
    }
    return '第一次學科綜合能力測驗';
  });

  // 學生考試成績紀錄總表 (優先自 localStorage 載入)
  const [studentRecords, setStudentRecords] = useState<StudentExamRecord[]>(() => {
    try {
      const saved = localStorage.getItem('edugrade_student_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
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

  // 持久化題目
  useEffect(() => {
    try {
      localStorage.setItem('edugrade_questions', JSON.stringify(questions));
    } catch {
      // ignore
    }
  }, [questions]);

  // 持久化自訂總分
  useEffect(() => {
    try {
      localStorage.setItem('edugrade_total_score', String(totalScore));
    } catch {
      // ignore
    }
  }, [totalScore]);

  // 持久化試卷名稱
  useEffect(() => {
    try {
      localStorage.setItem('edugrade_exam_title', examTitle);
    } catch {
      // ignore
    }
  }, [examTitle]);

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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'student-exam' && (
          <StudentExam
            questions={questions}
            totalScore={totalScore}
            examTitle={examTitle}
            studentRecords={studentRecords}
            onRecordSubmitted={handleRecordSubmitted}
            onGoToTeacherDashboard={() => setCurrentView('teacher-dashboard')}
          />
        )}

        {currentView === 'teacher-dashboard' && (
          isTeacherAuthenticated ? (
            <TeacherDashboard
              questions={questions}
              onUpdateQuestions={setQuestions}
              totalScore={totalScore}
              onUpdateTotalScore={setTotalScore}
              examTitle={examTitle}
              onUpdateExamTitle={setExamTitle}
              studentRecords={studentRecords}
              onClearRecords={handleClearRecords}
              onResetSampleRecords={handleResetSampleRecords}
              onSwitchToStudentExam={() => setCurrentView('student-exam')}
              teacherPassword={teacherPassword}
              onUpdateTeacherPassword={handleUpdateTeacherPassword}
              onLogout={handleTeacherLogout}
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
            <span>Excel/CSV/JSON 支援</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
