import React, { useState, useMemo } from 'react';
import {
  User,
  Hash,
  Clock,
  Shuffle,
  CheckCircle,
  ArrowRight,
  BookOpen,
  AlertCircle,
  ShieldAlert,
  History,
  Timer,
  Info,
} from 'lucide-react';
import { Question, StudentExamRecord } from '../../types';
import { checkExamAttemptLimit } from '../../utils/examLimiter';

interface StudentEntryCardProps {
  examTitle: string;
  questions: Question[];
  totalScore: number;
  records: StudentExamRecord[];
  onStartExam: (studentName: string, studentId: string) => void;
  onOpenTeacherDashboard: () => void;
}

export const StudentEntryCard: React.FC<StudentEntryCardProps> = ({
  examTitle,
  questions,
  totalScore,
  records,
  onStartExam,
  onOpenTeacherDashboard,
}) => {
  const [studentName, setStudentName] = useState('王小明');
  const [studentId, setStudentId] = useState('S112105');
  const [errorMsg, setErrorMsg] = useState('');

  // 即時計算同 1 位學生同 1 份測驗在 12 小時內的測驗限制狀態
  const limitStatus = useMemo(() => {
    return checkExamAttemptLimit(records, studentId, examTitle);
  }, [records, studentId, examTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMsg('請輸入學生姓名');
      return;
    }
    if (!studentId.trim()) {
      setErrorMsg('請輸入學生學號');
      return;
    }
    if (questions.length === 0) {
      setErrorMsg('目前題庫尚未上傳任何試題，請先至教師後台載入或上傳題目。');
      return;
    }

    // 核心規則防護：同 1 位學生同 1 份測驗題目 12 小時內最多只能重複測驗 2 次
    if (!limitStatus.canAttempt) {
      setErrorMsg(
        `【作答上限防護】${limitStatus.message}`
      );
      return;
    }

    setErrorMsg('');
    onStartExam(studentName.trim(), studentId.trim());
  };

  return (
    <div className="max-w-2xl mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-2">
            <BookOpen className="w-4 h-4" />
            線上隨機評量系統
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {examTitle || '線上學科綜合能力測驗'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            請輸入個人應試資訊以開始測驗。進入試卷後，題目將採用 Fisher-Yates 隨機不重複洗牌排列。
          </p>
        </div>

        {/* Exam Specifications */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 border-b border-slate-100 py-3 text-center text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">試卷題數</span>
            <strong className="text-slate-800 text-sm font-bold">{questions.length} 題</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">總分設定</span>
            <strong className="text-emerald-700 text-sm font-bold">{totalScore} 分</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">單題配分</span>
            <strong className="text-indigo-700 text-sm font-bold">
              {questions.length > 0 ? (totalScore / questions.length).toFixed(2) : 0} 分
            </strong>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="student-name-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                學生姓名 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="student-name-input"
                  type="text"
                  required
                  placeholder="請輸入您的真實姓名（例：王小明）"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="student-id-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                學生學號 / 准考證號 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="student-id-input"
                  type="text"
                  required
                  placeholder="請輸入學號（例：S112105）"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 font-mono"
                />
              </div>
            </div>

            {/* 12 小時重複測驗限制狀態指示卡 (12-hour limit status indicator) */}
            <div
              id="exam-attempt-limit-card"
              className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                !limitStatus.canAttempt
                  ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-xs'
                  : limitStatus.attemptsInWindow === 1
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                  {!limitStatus.canAttempt ? (
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : limitStatus.attemptsInWindow === 1 ? (
                    <History className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>12 小時測驗次數限制檢核</span>
                </div>

                {/* 次數徽章 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                      !limitStatus.canAttempt
                        ? 'bg-rose-600 text-white'
                        : limitStatus.attemptsInWindow === 1
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    已測驗 {limitStatus.attemptsInWindow} / {limitStatus.maxAttempts} 次
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    (12 小時窗口)
                  </span>
                </div>
              </div>

              {/* 詳細說明或鎖定警告 */}
              {!limitStatus.canAttempt ? (
                <div className="space-y-2 pt-1 border-t border-rose-200 text-rose-900 leading-relaxed">
                  <p className="font-semibold text-rose-700">
                    ⚠️ 此學號 ({studentId}) 於 12 小時內已重複測驗滿 2 次，已達系統作答上限！
                  </p>
                  <p className="text-[11px] text-rose-800">
                    依規定暫時無法再次進入測驗。最早一次測驗於 12 小時後解禁，預計開放作答時間為：
                    <strong className="font-mono text-rose-950 ml-1">
                      {limitStatus.formattedNextAllowedTime}
                    </strong>
                    （約需等待 {limitStatus.remainingTimeString}）。
                  </p>
                  {limitStatus.recordsInWindow.length > 0 && (
                    <div className="bg-white/80 p-2 rounded-xl border border-rose-200 text-[11px] space-y-1">
                      <span className="font-semibold text-slate-700 block">最近 12 小時內作答紀錄：</span>
                      {limitStatus.recordsInWindow.map((r, i) => (
                        <div key={r.id} className="flex items-center justify-between text-slate-600 font-mono">
                          <span>第 {i + 1} 次測驗：{r.submittedAt}</span>
                          <span className="font-bold text-indigo-700">{r.finalScore} 分</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 italic">
                    ※ 如有重考特殊需求，請洽任課教師於後台管理區調整或清空作答總表。
                  </p>
                </div>
              ) : limitStatus.attemptsInWindow === 1 ? (
                <div className="text-[11px] text-amber-900 leading-relaxed pt-1 border-t border-amber-200">
                  <span>
                    您於 12 小時內已測驗過 1 次，本次將是您於此 12 小時週期內的
                    <strong className="font-bold text-amber-800 underline underline-offset-2 mx-1">
                      最後 1 次測驗機會
                    </strong>
                    ，提交後將鎖定 12 小時！請把握作答時間。
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-800 leading-relaxed pt-1 border-t border-emerald-200">
                  <span>
                    同 1 位學生同 1 份測驗題目在 12 小時內最多可重複測驗 2 次。您目前尚餘 <strong>2 次</strong> 機會。
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Test Regulations Notice */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-2 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-amber-700" />
              應試注意事項說明：
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 leading-relaxed">
              <li>
                <strong>次數限制規則：</strong>
                同 1 位學生同 1 份測驗題目，<strong>12 小時內最多只能重複測驗 2 次</strong>（依學號與試卷自動鎖定）。
              </li>
              <li>
                <strong>隨機不重複出題：</strong>
                系統會在您點擊開始時，使用 Fisher-Yates 洗牌演算法將附件中所有題目重新排序。
              </li>
              <li>
                <strong>強制完成規則：</strong>
                依系統規範，必須將試卷中的<strong>所有題目作答完畢</strong>方可送出評改。
              </li>
              <li>
                <strong>動態即時評分：</strong>
                交卷後系統將立即自動閱卷，並即時計算總分（公式：
                <code className="bg-white/80 px-1 py-0.5 rounded font-mono">
                  答對題數 / {questions.length} × {totalScore}
                </code>
                ）且提供詳細對照解析。
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              id="btn-start-exam-submit"
              type="submit"
              disabled={questions.length === 0 || !limitStatus.canAttempt}
              className={`w-full sm:flex-1 py-3 px-5 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm ${
                !limitStatus.canAttempt
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg cursor-pointer'
              }`}
            >
              {!limitStatus.canAttempt ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                  <span>已達 12 小時測驗上限 (2/2次)</span>
                </>
              ) : limitStatus.attemptsInWindow === 1 ? (
                <>
                  <span>進入隨機排列並開始作答 (剩餘最後 1 次機會)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>進入隨機排序列印並開始作答</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {questions.length === 0 && (
              <button
                type="button"
                onClick={onOpenTeacherDashboard}
                className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                前往教師區載入試題
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
