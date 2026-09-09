import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  HelpCircle,
  Check,
  TrendingUp,
  Filter,
  ShieldAlert,
  History,
} from 'lucide-react';
import { StudentExamRecord } from '../../types';
import { formatAnswerDisplay, normalizeAnswerString } from '../../utils/answerHelper';
import { checkExamAttemptLimit } from '../../utils/examLimiter';

interface ExamResultViewProps {
  record: StudentExamRecord;
  records: StudentExamRecord[];
  onRetakeExam: () => void;
  onGoToTeacherDashboard?: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  record,
  records,
  onRetakeExam,
  onGoToTeacherDashboard,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');

  // 計算同一位學生同 1 份測驗在 12 小時內的最新測驗限制狀態
  const limitStatus = useMemo(() => {
    return checkExamAttemptLimit(records, record.studentId, record.examTitle);
  }, [records, record.studentId, record.examTitle]);

  const isPass = record.finalScore >= record.configuredTotalScore * 0.6;
  const isPerfect = record.correctCount === record.totalQuestions;
  const accuracy = ((record.correctCount / (record.totalQuestions || 1)) * 100).toFixed(1);

  // 篩選題目
  const filteredResults = record.detailedResults.filter((item) => {
    if (filterMode === 'wrong') return !item.isCorrect;
    if (filterMode === 'correct') return item.isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* 頂部成績看板 (滿分為老師自訂總分) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div
          className={`p-6 sm:p-8 text-white ${
            isPerfect
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : isPass
              ? 'bg-gradient-to-r from-indigo-700 to-slate-900'
              : 'bg-gradient-to-r from-rose-700 to-slate-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
                <Award className="w-4 h-4" />
                線上測驗即時自動評改成果
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {record.studentName} 同學的成績單
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-mono">
                學號：{record.studentId} ｜ 測驗時間：{record.submittedAt}
              </p>
            </div>

            {/* 最終得分顯示：滿分為老師自訂總分 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:px-6 sm:py-4 border border-white/20 text-center shrink-0">
              <div className="text-xs text-white/80 font-medium">測驗最終得分</div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {record.finalScore}
                <span className="text-base font-normal text-white/70 ml-1.5">
                  / {record.configuredTotalScore} 分
                </span>
              </div>
              <div className="mt-1.5 text-[11px] font-semibold inline-block px-3 py-0.5 rounded-full bg-white/20">
                {isPerfect ? '完美滿分 🎉' : isPass ? '評量及格 👏' : '尚需加強 💪'}
              </div>
            </div>
          </div>
        </div>

        {/* 配分公式核算列 */}
        <div className="bg-slate-50 border-b border-slate-200/80 p-4 sm:px-8 text-xs text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-semibold text-slate-800">配分公式：</span>
              <span className="text-slate-600">學生總分 = Math.round((答對題數 / 題目總數) × 自訂總分)</span>
              <code className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-indigo-700 font-mono font-bold text-xs sm:text-sm">
                Math.round(({record.correctCount} / {record.totalQuestions}) × {record.configuredTotalScore}) = {record.finalScore} 分
              </code>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span>
                答對題數：
                <strong className="text-emerald-700 font-bold ml-0.5">{record.correctCount}</strong> / {record.totalQuestions}
              </span>
              <span>
                正確率：
                <strong className="text-indigo-700 font-bold ml-0.5">{accuracy}%</strong>
              </span>
              <span className="flex items-center gap-1 font-mono text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {Math.floor(record.durationSeconds / 60)}分{record.durationSeconds % 60}秒
              </span>
            </div>
          </div>
        </div>

        {/* 操作控制列 */}
        <div className="p-4 sm:px-8 bg-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>作答明細與評分數據已即時登錄至成績庫。</span>
              <span className="font-mono text-slate-400">｜</span>
              <span className="font-medium text-slate-600">
                12 小時內已作答：
                <strong className={!limitStatus.canAttempt ? 'text-rose-600 font-bold ml-1' : 'text-indigo-600 font-bold ml-1'}>
                  {limitStatus.attemptsInWindow} / {limitStatus.maxAttempts} 次
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!limitStatus.canAttempt ? (
                <button
                  id="btn-retake-exam"
                  disabled={true}
                  title={limitStatus.message}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-400 rounded-xl border border-slate-200 cursor-not-allowed"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>已達 12 小時上限 (2/2次)</span>
                </button>
              ) : (
                <button
                  id="btn-retake-exam"
                  onClick={onRetakeExam}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重新測驗 (剩餘 {limitStatus.remainingAttempts} 次機會)</span>
                </button>
              )}
            </div>
          </div>

          {/* 若已達到 12 小時內 2 次測驗上限，顯示提示橫幅 */}
          {!limitStatus.canAttempt && (
            <div
              id="retake-limit-warning"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-900"
            >
              <div className="flex items-start sm:items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>12 小時重複測驗上限提醒：</strong>
                  同 1 位學生同 1 份測驗題目在 12 小時內最多可重複測驗 2 次，您已達上限。
                  下次開放測驗時間為：
                  <strong className="font-mono text-rose-950 underline mx-1">
                    {limitStatus.formattedNextAllowedTime}
                  </strong>
                  （約需等待 {limitStatus.remainingTimeString}）。
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-md shrink-0 self-start sm:self-auto">
                已達 2/2 次上限
              </span>
            </div>
          )}

          {/* 若剛完成第 1 次，提示尚餘 1 次機會 */}
          {limitStatus.canAttempt && limitStatus.attemptsInWindow === 1 && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  您在 12 小時內已完成 1 次測驗，若點擊「重新測驗」進行第 2 次測驗後，將暫時達到作答上限並鎖定 12 小時。
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md shrink-0">
                尚餘 1 次
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 各題結果對照清單 (以醒目紅/綠色標示學生答案與正確答案) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              各題答題對照與解析詳情
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              以醒目顏色標示您的答案與正確答案，支援單選與複選對照。
            </p>
          </div>

          {/* 篩選標籤 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({record.detailedResults.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('wrong')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'wrong'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-rose-700 hover:text-rose-800'
              }`}
            >
              錯題 ({record.totalQuestions - record.correctCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'correct'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-800'
              }`}
            >
              答對 ({record.correctCount})
            </button>
          </div>
        </div>

        {/* 題目清單 */}
        <div className="space-y-6 divide-y divide-slate-100">
          {filteredResults.map((item, idx) => {
            const studentNorm = normalizeAnswerString(item.selectedOption);
            const correctNorm = normalizeAnswerString(item.correctAnswer);
            const studentSelectedKeys = studentNorm.split('');
            const correctKeys = correctNorm.split('');

            return (
              <div key={item.questionId || idx} className="pt-6 first:pt-0 space-y-4">
                {/* 題目標頭與正誤標籤 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        item.isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            item.isMultiple
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {item.isMultiple ? '複選題' : '單選題'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          (題庫編號 #{item.originalQuestionNumber})
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        {item.prompt}
                      </h4>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        答對 (+{item.earnedScore}分)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        答錯 (0分)
                      </span>
                    )}
                  </div>
                </div>

                {/* 醒目答案對照橫幅 (紅色標示學生錯答、綠色標示正確答案) */}
                <div className="pl-0 sm:pl-11">
                  <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
                    {/* 學生答案標記 */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">學生答案：</span>
                      <span
                        className={`font-bold px-3 py-1 rounded-xl text-xs sm:text-sm flex items-center gap-1 ${
                          item.isCorrect
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                        }`}
                      >
                        {item.isCorrect ? '✓' : '✗'}
                        {formatAnswerDisplay(item.selectedOption)}
                        <span className="text-[11px] font-normal opacity-90">
                          ({item.isCorrect ? '答對' : '答錯'})
                        </span>
                      </span>
                    </div>

                    <span className="text-slate-300">｜</span>

                    {/* 正確答案標記 (醒目翠綠色) */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">正確答案：</span>
                      <span className="font-bold px-3 py-1 rounded-xl text-xs sm:text-sm bg-emerald-100 text-emerald-900 border border-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        {formatAnswerDisplay(item.correctAnswer)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 選項列表清單（直觀標記學生選擇與標準解答） */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-0 sm:pl-11">
                  {item.options.map((opt) => {
                    const isStudentChoice = studentSelectedKeys.includes(opt.key);
                    const isCorrectOption = correctKeys.includes(opt.key);

                    let cardStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                    if (isCorrectOption && isStudentChoice) {
                      // 學生選對正解 -> 綠色
                      cardStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium shadow-xs';
                    } else if (isCorrectOption && !isStudentChoice) {
                      // 正解但學生沒選到 -> 綠色虛線提示
                      cardStyle = 'bg-emerald-50/60 border-emerald-300 text-emerald-900 font-medium';
                    } else if (isStudentChoice && !isCorrectOption) {
                      // 學生選錯的選項 -> 醒目紅色
                      cardStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-medium shadow-xs';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${cardStyle}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrectOption
                                ? 'bg-emerald-600 text-white'
                                : isStudentChoice
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="truncate">{opt.text}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isStudentChoice && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                isCorrectOption
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              學生答案
                            </span>
                          )}
                          {isCorrectOption && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              正解
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 詳解說明區塊 */}
                <div className="pl-0 sm:pl-11">
                  <div className="p-3.5 bg-slate-100/90 rounded-2xl text-xs sm:text-sm text-slate-700 border border-slate-200/80 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      題目詳解：
                    </div>
                    <p className="text-slate-600">{item.explanation || '本題無提供詳細解析。'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
