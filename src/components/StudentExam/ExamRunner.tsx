import React, { useState, useEffect } from 'react';
import {
  Clock,
  Send,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Layers,
  LayoutList,
  HelpCircle,
  RotateCcw,
  CheckSquare,
  CircleDot,
} from 'lucide-react';
import { Question, StudentPerQuestionResult, StudentExamRecord } from '../../types';
import { calculateExamScore, resolveScoreAllocation, calculateDetailedExamScore } from '../../utils/scoring';
import {
  isMultipleChoiceQuestion,
  isEssayQuestion,
  normalizeAnswerString,
  isAnswerCorrect,
  formatAnswerDisplay,
} from '../../utils/answerHelper';

interface ExamRunnerProps {
  studentName: string;
  studentId: string;
  examTitle: string;
  totalScore: number;
  choiceScore?: number;
  essayScore?: number;
  shuffledQuestions: Question[];
  onFinishExam: (record: StudentExamRecord) => void;
  onExit: () => void;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  studentName,
  studentId,
  examTitle,
  totalScore,
  choiceScore,
  essayScore,
  shuffledQuestions,
  onFinishExam,
  onExit,
}) => {
  // 檢視模式：'single' (一次顯示一題 - 逐題模式) 或 'all' (單頁顯示全部打散後的題目 - 整卷模式)
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  // 當前題目索引 (一次顯示一題模式使用，0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0);

  // 學生選擇答案：key 為 questionId，value 為格式化選項字串（單選為 "A"，複選為 "A,C"，問答題為輸入文字）
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // 計算選擇題與問答題分開配分規格
  const allocation = resolveScoreAllocation(shuffledQuestions, totalScore, choiceScore, essayScore);

  // 計時器
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalQuestions = shuffledQuestions.length;
  // 已作答題目數量
  const answeredCount = Object.keys(answers).filter((k) => answers[k] && answers[k].trim() !== '').length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // 當前題目
  const currentQuestion = shuffledQuestions[currentIndex] || shuffledQuestions[0];

  /**
   * 處理問答題文字輸入
   */
  const handleEssayChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
    if (validationError) {
      setValidationError(null);
    }
  };

  /**
   * 處理選項點擊：支援單選與複選
   */
  const handleSelectOption = (question: Question, optionKey: string) => {
    const isMultiple = isMultipleChoiceQuestion(question);
    const existing = answers[question.id] || '';

    if (!isMultiple) {
      // 單選題 (Radio 按鈕邏輯)
      setAnswers((prev) => ({
        ...prev,
        [question.id]: optionKey,
      }));
    } else {
      // 複選題 (Checkbox 複選邏輯)
      const currentSelected = existing
        ? existing.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      let updated: string[];
      if (currentSelected.includes(optionKey)) {
        // 已選擇 -> 取消選取
        updated = currentSelected.filter((k) => k !== optionKey);
      } else {
        // 未選擇 -> 加入選取
        updated = [...currentSelected, optionKey];
      }

      // 依 A-Z 排序並以逗點連接
      updated.sort();
      const finalVal = updated.join(',');

      setAnswers((prev) => ({
        ...prev,
        [question.id]: finalVal,
      }));
    }

    if (validationError) {
      setValidationError(null);
    }
  };

  /**
   * 提交交卷與自動評分
   */
  const handleSubmitExam = () => {
    setAttemptedSubmit(true);

    const unansweredIndices: number[] = [];
    shuffledQuestions.forEach((q, index) => {
      const val = answers[q.id];
      if (!val || val.trim() === '') {
        unansweredIndices.push(index + 1);
      }
    });

    // 嚴格依題意：必須將附件所有題目考完（不重複、不遺漏）
    if (unansweredIndices.length > 0) {
      setValidationError(
        `您尚有 ${unansweredIndices.length} 題未作答（第 ${unansweredIndices.join(
          '、'
        )} 題）。依考試規則，必須將所有題目作答完畢才能交卷評改！`
      );

      // 自動導向第一題未作答處
      const firstUnansweredIndex = unansweredIndices[0] - 1;
      if (viewMode === 'single') {
        setCurrentIndex(firstUnansweredIndex);
      } else {
        const firstUnansweredId = shuffledQuestions[firstUnansweredIndex].id;
        const el = document.getElementById(`question-card-${firstUnansweredId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // 所有題目皆已作答，進行答案比對與計分
    let correctCount = 0;
    const detailedResults: StudentPerQuestionResult[] = shuffledQuestions.map((q) => {
      const selected = answers[q.id] || '';
      const isEssay = isEssayQuestion(q);
      const isMultiple = isMultipleChoiceQuestion(q);
      const questionType = isEssay ? 'essay' : isMultiple ? 'multiple' : 'single';

      // 依題意：問答題答案得完全一致；選擇題精確比對選項代號
      const isCorrect = isAnswerCorrect(selected, q.correctAnswer, questionType);
      if (isCorrect) {
        correctCount += 1;
      }

      const maxQuestionScore = isEssay ? allocation.perEssayScore : allocation.perChoiceScore;
      const earnedScore = isCorrect ? maxQuestionScore : 0;

      return {
        questionId: q.id,
        originalQuestionNumber: q.questionNumber,
        prompt: q.prompt,
        options: q.options || [],
        selectedOption: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        earnedScore,
        maxQuestionScore,
        explanation: q.explanation,
        isMultiple,
        type: questionType,
      };
    });

    // 依選擇題與問答題分開計算配分與得分
    const detailedScore = calculateDetailedExamScore(detailedResults, allocation);

    const record: StudentExamRecord = {
      id: `record-${Date.now()}`,
      studentName,
      studentId,
      examTitle,
      submittedAt: formatNow(),
      durationSeconds: elapsedSeconds,
      totalQuestions,
      correctCount,
      finalScore: detailedScore.finalScore,
      configuredTotalScore: allocation.totalScore,
      choiceScoreEarned: detailedScore.choiceEarnedScore,
      choiceScoreTotal: detailedScore.choiceTotalScore,
      essayScoreEarned: detailedScore.essayEarnedScore,
      essayScoreTotal: detailedScore.essayTotalScore,
      choiceCount: detailedScore.choiceCount,
      essayCount: detailedScore.essayCount,
      choiceCorrectCount: detailedScore.choiceCorrectCount,
      essayCorrectCount: detailedScore.essayCorrectCount,
      detailedResults,
    };

    onFinishExam(record);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * 渲染單一題目內容
   */
  const renderQuestionCard = (q: Question, displayIndex: number) => {
    const isEssay = isEssayQuestion(q);
    const isMultiple = !isEssay && isMultipleChoiceQuestion(q);
    const selectedAnswerStr = answers[q.id] || '';
    const selectedKeys = selectedAnswerStr
      ? selectedAnswerStr.split(',').map((s) => s.trim())
      : [];
    const isAnswered = isEssay
      ? selectedAnswerStr.trim().length > 0
      : selectedKeys.length > 0;
    const isMissing = attemptedSubmit && !isAnswered;

    return (
      <div
        key={q.id}
        id={`question-card-${q.id}`}
        className={`bg-white rounded-3xl border transition-all p-6 sm:p-8 shadow-sm ${
          isMissing
            ? 'border-rose-400 ring-4 ring-rose-100'
            : isAnswered
            ? isEssay
              ? 'border-purple-200 shadow-purple-50/50'
              : 'border-indigo-200 shadow-indigo-50/50'
            : 'border-slate-200'
        }`}
      >
        {/* 題目頂部標籤與題號 */}
        <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                isAnswered
                  ? isEssay
                    ? 'bg-purple-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : isMissing
                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {displayIndex + 1}
            </span>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isEssay
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : isMultiple
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                }`}
              >
                {isEssay ? '【問答題】' : isMultiple ? '【複選題】' : '【單選題】'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                題庫編號 #{q.questionNumber}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
              isEssay ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {isEssay
                ? `問答題配分 ${allocation.perEssayScore} 分`
                : `選擇題配分 ${allocation.perChoiceScore} 分`}
            </span>
          </div>
        </div>

        {/* 題目內文 */}
        <div className="mb-6">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {q.prompt}
          </h3>
          {isEssay ? (
            <p className="text-xs text-purple-700 mt-1.5 font-medium">
              ※ 本題為問答題，請在下方輸入完整文字答案（評改規則：答案得完全一致）。
            </p>
          ) : isMultiple ? (
            <p className="text-xs text-amber-700 mt-1 font-medium">
              ※ 本題為複選題，可同時勾選多個符合條件的選項。
            </p>
          ) : null}
        </div>

        {/* 作答區域：問答題 (Textarea) 或 選擇題 (選項列表) */}
        {isEssay ? (
          <div className="space-y-2">
            <textarea
              id={`essay-input-${q.id}`}
              rows={4}
              value={selectedAnswerStr}
              onChange={(e) => handleEssayChange(q.id, e.target.value)}
              placeholder="請在此輸入問答題完整文字答案..."
              className="w-full p-4 text-sm sm:text-base border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/20 text-slate-900 font-medium placeholder:text-slate-400 leading-relaxed transition"
            />
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>已輸入 {selectedAnswerStr.trim().length} 字</span>
              <span className="text-purple-700 font-medium">評改標準：答案得完全一致</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {q.options.map((opt) => {
              const isSelected = selectedKeys.includes(opt.key);

              return (
                <label
                  key={opt.key}
                  id={`opt-${q.id}-${opt.key}`}
                  onClick={() => handleSelectOption(q, opt.key)}
                  className={`flex items-start sm:items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? isMultiple
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-medium shadow-xs'
                        : 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
                  }`}
                >
                  {/* 選取指示圖示 */}
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors mt-0.5 sm:mt-0 ${
                      isSelected
                        ? isMultiple
                          ? 'border border-amber-600 bg-amber-600 text-white'
                          : 'border border-indigo-600 bg-indigo-600 text-white rounded-full'
                        : isMultiple
                        ? 'border border-slate-300 bg-white text-slate-600'
                        : 'border border-slate-300 bg-white text-slate-600 rounded-full'
                    }`}
                  >
                    {isSelected ? (isMultiple ? '✓' : opt.key) : opt.key}
                  </span>

                  <div className="flex-1 text-sm sm:text-base leading-relaxed">
                    <span className="font-semibold mr-2">{opt.key}.</span>
                    {opt.text}
                  </div>

                  {isSelected && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/80 text-slate-700 shrink-0 border border-slate-200">
                      已選取
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* 頂部固定狀態條 */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              考
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {studentName}
                </span>
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {studentId}
                </span>
              </div>
              <span className="text-xs text-indigo-600 font-medium truncate max-w-sm block">
                {examTitle} (滿分 {allocation.totalScore} 分 ｜ 選擇 {allocation.choiceCount} 題 · 問答 {allocation.essayCount} 題)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 模式切換按鈕：一次顯示一題 vs 整卷模式 */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                id="btn-mode-single"
                onClick={() => setViewMode('single')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition ${
                  viewMode === 'single'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>逐題進行 (一題)</span>
              </button>
              <button
                type="button"
                id="btn-mode-all"
                onClick={() => setViewMode('all')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition ${
                  viewMode === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>整卷檢視 (全部)</span>
              </button>
            </div>

            {/* 計時器 */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-700 text-xs font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            {/* 交卷按鈕 */}
            <button
              id="btn-submit-exam"
              onClick={handleSubmitExam}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>交卷評改</span>
            </button>
          </div>
        </div>

        {/* 進度條 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>
              作答進度：
              <strong className="text-indigo-600 font-bold">{answeredCount}</strong> / {totalQuestions} 題
            </span>
            <span className="font-semibold text-indigo-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 題號快速導覽網格 (Fisher-Yates 打散後序號) */}
        <div className="flex items-center gap-1.5 pt-3.5 overflow-x-auto">
          <span className="text-[11px] text-slate-400 shrink-0 mr-1">題號導航：</span>
          {shuffledQuestions.map((q, idx) => {
            const hasAns = !!answers[q.id] && answers[q.id].trim() !== '';
            const isMissing = attemptedSubmit && !hasAns;
            const isCurrent = viewMode === 'single' && currentIndex === idx;

            return (
              <button
                key={q.id}
                id={`nav-btn-${idx + 1}`}
                onClick={() => {
                  if (viewMode === 'single') {
                    setCurrentIndex(idx);
                  } else {
                    const el = document.getElementById(`question-card-${q.id}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition shrink-0 flex items-center justify-center ${
                  isMissing
                    ? 'bg-rose-100 text-rose-700 border-2 border-rose-400 animate-pulse'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-xs'
                    : hasAns
                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* 漏答警示橫幅 */}
      {validationError && (
        <div
          id="unanswered-warning-banner"
          className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl flex items-start gap-3 shadow-xs"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <strong className="font-bold block text-rose-900">未作答警示（必須全部考完才可交卷）</strong>
            <p className="leading-relaxed">{validationError}</p>
          </div>
        </div>
      )}

      {/* 題目主介面 */}
      {viewMode === 'single' ? (
        /* 模式 1：一次顯示一題 (逐題進行模式) */
        <div className="space-y-6">
          {renderQuestionCard(currentQuestion, currentIndex)}

          {/* 逐題切換按鈕條 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
            <button
              type="button"
              id="btn-prev-question"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                currentIndex === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一題</span>
            </button>

            <div className="text-xs font-semibold text-slate-500">
              第 <span className="text-indigo-600 font-bold">{currentIndex + 1}</span> / {totalQuestions} 題
            </div>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                id="btn-next-question"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
              >
                <span>下一題</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-last-submit-question"
                onClick={handleSubmitExam}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
              >
                <Send className="w-4 h-4" />
                <span>完成所有題目並交卷</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 模式 2：單頁顯示全部打散後的題目 (整卷模式) */
        <div className="space-y-6">
          {shuffledQuestions.map((q, index) => renderQuestionCard(q, index))}
        </div>
      )}

      {/* 底部全域交卷控制條 */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          已作答 <strong className="text-indigo-600 font-bold">{answeredCount}</strong> / {totalQuestions} 題
          {answeredCount === totalQuestions ? (
            <span className="ml-2 text-emerald-600 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              所有題目皆已作答完畢，可提交評改！
            </span>
          ) : (
            <span className="ml-2 text-slate-400">
              (需作答完所有題目後才可送出評分)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onExit}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            放棄考試並返回
          </button>
          <button
            id="btn-bottom-submit-exam"
            type="button"
            onClick={handleSubmitExam}
            className="flex-1 sm:flex-initial px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>立即交卷並自動評分</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
}
