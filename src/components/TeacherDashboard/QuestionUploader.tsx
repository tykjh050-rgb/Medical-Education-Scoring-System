import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  FileText,
  HelpCircle,
  Check,
  Eye,
  Code2,
  Copy,
  Sparkles,
  Layers,
  ArrowRight,
  X,
  Database,
} from 'lucide-react';
import { Question, ExamPaper } from '../../types';
import { parseQuestionFile, downloadQuestionTemplate } from '../../utils/fileParser';
import { DEFAULT_SAMPLE_QUESTIONS } from '../../data/sampleQuestions';
import { resolveScoreAllocation } from '../../utils/scoring';
import { ExamContentEditorModal } from './ExamContentEditorModal';
import { ExamPaperSelectorDropdown } from './ExamPaperSelectorDropdown';
import { Edit3 } from 'lucide-react';

interface QuestionUploaderProps {
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
  onSwitchToStudentExam?: () => void;
  onOpenExamInspector?: () => void;
  examPapers: ExamPaper[];
  activeExamId: string;
  onSelectExam: (id: string) => void;
  onDeleteExam: (id: string) => void;
  onAddNewExam: () => void;
  onAddNewExamWithQuestions: (newExam: ExamPaper) => void;
}

interface ImportPreviewData {
  fileName: string;
  fileSize: number;
  fileType: string;
  count: number;
  questions: Question[];
}

export const QuestionUploader: React.FC<QuestionUploaderProps> = ({
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
  onSwitchToStudentExam,
  onOpenExamInspector,
  examPapers,
  activeExamId,
  onSelectExam,
  onDeleteExam,
  onAddNewExam,
  onAddNewExamWithQuestions,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // 預覽視窗狀態
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  // 是否展開檢視 JSON
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  // 檢視與線上增刪修改試題視窗狀態
  const [showExamInspectorModal, setShowExamInspectorModal] = useState(false);

  const allocation = resolveScoreAllocation(questions, totalScore, choiceScore, essayScore);

  const handleOpenInspector = onOpenExamInspector || (() => setShowExamInspectorModal(true));

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 處理檔案上傳與自動解析 (上傳考卷檔案後自動新增在選單內)
   */
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setFeedback(null);

    const result = await parseQuestionFile(file);
    setIsProcessing(false);

    if (result.success && result.questions.length > 0) {
      // 取得自檔名產生的試卷標題 (去除副檔名)
      const rawName = file.name.replace(/\.[^/.]+$/, '').trim();
      const cleanTitle = rawName || '匯入試卷題庫';

      const newExamPaper: ExamPaper = {
        id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: cleanTitle,
        totalScore: 100,
        questions: result.questions,
        createdAt: new Date().toISOString(),
        fileName: file.name,
      };

      // 1. 設定預覽資料
      setPreviewData({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.name.split('.').pop()?.toUpperCase() || 'EXCEL',
        count: result.count,
        questions: result.questions,
      });

      // 2. 自動新增至試卷選單內並自動選取此試卷
      onAddNewExamWithQuestions(newExamPaper);

      setFeedback({
        type: 'success',
        message: `成功解析並匯入 ${result.count} 題試題！已自動為您在下拉選單中建立新試卷「${cleanTitle}」，並設為當前試卷。`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: result.error || '解析檔案失敗，請檢查檔案格式與欄位名稱（需包含 question_text、options、correct_answer）。',
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetSample = () => {
    onUpdateQuestions(DEFAULT_SAMPLE_QUESTIONS);
    setFeedback({
      type: 'success',
      message: '已重新載入系統預設示範題庫 (5 題)！',
    });
  };

  const handleCopyJson = (dataToCopy: Question[]) => {
    const jsonStr = JSON.stringify(dataToCopy, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 頂部兩欄：測驗參數設定 與 檔案上傳區 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 左側：測驗總分與參數 */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">試卷題庫與參數管理</h3>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              多卷下拉管理
            </span>
          </div>

          {/* 可管理的下拉式選單 (選單內有刪除鈕、新增空白試卷與切換) */}
          <ExamPaperSelectorDropdown
            examPapers={examPapers}
            activeExamId={activeExamId}
            onSelectExam={onSelectExam}
            onDeleteExam={onDeleteExam}
            onAddNewExam={onAddNewExam}
            onRequestUpload={() => fileInputRef.current?.click()}
          />

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                編輯當前試卷名稱
              </label>
              <input
                id="input-exam-title"
                type="text"
                value={examTitle}
                onChange={(e) => onUpdateExamTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 font-semibold text-slate-800"
                placeholder="例如：第一次定期評量 - 自然與科技"
              />
            </div>

          {/* 配分欄與選擇題分開 */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>試卷配分欄（選擇題與問答題分開）</span>
              </label>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                滿分 {allocation.totalScore} 分
              </span>
            </div>

            {/* 選擇題配分區 */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  選擇題總配分（共 {allocation.choiceCount} 題）
                </span>
                <span className="text-[11px] font-semibold text-indigo-700">
                  每題 {allocation.perChoiceScore} 分
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="input-choice-score"
                  type="number"
                  min="0"
                  max="1000"
                  step="5"
                  value={allocation.choiceTotalScore}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    if (onUpdateChoiceScore) {
                      onUpdateChoiceScore(val);
                    } else {
                      onUpdateTotalScore(val + (essayScore || 0));
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 bg-white"
                />
                <span className="text-xs text-slate-500 font-medium shrink-0">分</span>
              </div>
            </div>

            {/* 問答題配分區 */}
            <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  問答題總配分（共 {allocation.essayCount} 題）
                </span>
                <span className="text-[11px] font-semibold text-purple-700">
                  每題 {allocation.perEssayScore} 分
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="input-essay-score"
                  type="number"
                  min="0"
                  max="1000"
                  step="5"
                  value={allocation.essayTotalScore}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    if (onUpdateEssayScore) {
                      onUpdateEssayScore(val);
                    } else {
                      onUpdateTotalScore((choiceScore || 0) + val);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-800 bg-white"
                />
                <span className="text-xs text-slate-500 font-medium shrink-0">分</span>
              </div>
              <div className="text-[11px] text-purple-800 font-semibold flex items-center gap-1 pt-0.5">
                <span>※ 問答題評分規則：答案得完全一致</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-1 space-y-2">
            <button
              id="btn-inspect-exam-modal-left"
              type="button"
              onClick={handleOpenInspector}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              <Eye className="w-4 h-4" />
              <span>檢視試卷內容與線上增刪修</span>
            </button>

            <button
              id="btn-reload-sample-questions"
              type="button"
              onClick={handleResetSample}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              載入系統預設示範題庫 (5 題)
            </button>
            <button
              id="btn-view-current-json"
              type="button"
              onClick={() => setShowJsonModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
            >
              <Code2 className="w-3.5 h-3.5" />
              檢視當前題庫 JSON 結構
            </button>
          </div>
        </div>

        {/* 右側：Excel (.xlsx) / CSV 試題檔案上傳區 */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                試題檔案上傳與自動解析模組
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              支援 Excel (.xlsx) / CSV (.csv)
            </div>
          </div>

          {/* 拖曳與點擊上傳卡片 */}
          <div
            id="question-file-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  {isProcessing ? '正在透過 SheetJS 自動解析試題檔案...' : '點擊選取或拖曳試題檔案至此處'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  支援 Microsoft Excel (.xlsx / .xls) 或 CSV 純文字逗號分隔檔
                </p>
              </div>
              <button
                type="button"
                className="mt-1 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition"
              >
                瀏覽電腦檔案上傳 (.xlsx / .csv)
              </button>
            </div>
          </div>

          {/* 欄位規格說明指示條 */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              試題檔案必要欄位規格說明：
            </div>
            <p className="leading-relaxed">
              • <strong className="text-slate-900">question_text</strong>（題目內容）：試題問題本體。<br />
              • <strong className="text-slate-900">options</strong>（選項群組）：可為獨立欄位 <code className="bg-white px-1 py-0.5 rounded border text-indigo-700 font-mono">option_a, option_b, option_c, option_d</code> 或單一 <code className="bg-white px-1 py-0.5 rounded border text-indigo-700 font-mono">options</code> 欄位。<br />
              • <strong className="text-slate-900">correct_answer</strong>（正確答案）：如 <code className="bg-white px-1 py-0.5 rounded border text-emerald-700 font-mono">A</code>、<code className="bg-white px-1 py-0.5 rounded border text-emerald-700 font-mono">B</code> 或複選 <code className="bg-white px-1 py-0.5 rounded border text-amber-700 font-mono">A,C</code>。<br />
              • <strong className="text-slate-900">explanation</strong>（題目解析，選填）：交卷後供學生對照學習之解答說明。
            </p>
          </div>

          {/* 上傳反饋狀態訊息 */}
          {feedback && (
            <div
              id="upload-feedback-alert"
              className={`p-3.5 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{feedback.message}</div>
            </div>
          )}

          {/* 範本下載按鈕組 */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-slate-500" />
              下載標準試題空白範本：
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-download-xlsx-template"
                type="button"
                onClick={() => downloadQuestionTemplate('xlsx')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-300 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Excel 範本 (.xlsx)
              </button>
              <button
                id="btn-download-csv-template"
                type="button"
                onClick={() => downloadQuestionTemplate('csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-300 transition"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                CSV 範本 (.csv)
              </button>
              <button
                id="btn-download-json-template"
                type="button"
                onClick={() => downloadQuestionTemplate('json')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-300 transition"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-600" />
                JSON 範本 (.json)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 解析成功預覽視窗 (Preview Modal) */}
      {previewData && (
        <div
          id="import-preview-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* 預覽視窗頂部 */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-indigo-200 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  SheetJS 試題檔案解析完成
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  成功匯入 {previewData.count} 題試題！
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">
                  來源檔案：{previewData.fileName}（{previewData.fileType} 格式）
                </p>
              </div>

              <button
                onClick={() => setPreviewData(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 預覽視窗狀態摘要 */}
            <div className="bg-indigo-50/70 p-4 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-950">
              <div className="flex items-center gap-4">
                <span>
                  <strong>總題數：</strong> {previewData.count} 題
                </span>
                <span>
                  <strong>目前自訂總分：</strong> {totalScore} 分
                </span>
                <span>
                  <strong>預估單題得分：</strong> {(totalScore / previewData.count).toFixed(2)} 分/題
                </span>
              </div>
              <span className="font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                已自動儲存為當次考試題庫
              </span>
            </div>

            {/* 預覽試題清單捲軸 */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 divide-y divide-slate-100 flex-1">
              {previewData.questions.map((q, idx) => (
                <div key={q.id || idx} className="pt-4 first:pt-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mr-2">
                          question_text
                        </span>
                        <span className="text-sm font-semibold text-slate-900 leading-relaxed">
                          {q.prompt}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                        correct_answer: {q.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* 選項清單 (options) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                    {q.options.map((opt) => {
                      const isCorrect = opt.key.toUpperCase() === q.correctAnswer.toUpperCase();
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="truncate">{opt.text}</span>
                          {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="pl-8 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <strong className="text-slate-700">解析 (explanation)：</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 預覽視窗底部動作列 */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopyJson(previewData.questions)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? '已複製 JSON 結構' : '複製試題 JSON'}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition"
                >
                  關閉預覽
                </button>
                {onSwitchToStudentExam && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewData(null);
                      onSwitchToStudentExam();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>立即前往學生端進行測驗</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON 結構檢視彈窗 (Modal) */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  當前考試題庫 JSON 規格資料 ({questions.length} 題)
                </h3>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-y-auto flex-1 leading-relaxed">
              <pre>{JSON.stringify(questions, null, 2)}</pre>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                符合系統規範之標準 JSON 陣列結構
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyJson(questions)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? '已複製' : '一鍵複製 JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowJsonModal(false)}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                >
                  確定關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 目前已載入試題清單 (當次考試題庫) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              當次考試正式題庫清單 ({questions.length} 題)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              學生進行測驗時，系統將完全載入以下題庫，並使用 Fisher-Yates 洗牌演算法隨機打散出題。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-3 py-1 bg-white text-slate-700 font-bold rounded-xl border border-slate-200">
              總題數：{questions.length}
            </span>
            <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200">
              單題均分：{questions.length > 0 ? (totalScore / questions.length).toFixed(2) : 0} 分
            </span>
            <button
              id="btn-inspect-exam-modal-header"
              type="button"
              onClick={handleOpenInspector}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>檢視試卷內容與線上編修</span>
            </button>
            {onSwitchToStudentExam && (
              <button
                id="btn-test-exam-now"
                type="button"
                onClick={onSwitchToStudentExam}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                測驗題庫
              </button>
            )}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">目前題庫尚無任何題目</p>
            <p className="text-xs mt-1">請由上方上傳 Excel/CSV 試題檔，或點擊下方按鈕線上新增試題。</p>
            <button
              type="button"
              onClick={handleOpenInspector}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>線上新增與編修試題</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-200/50 font-mono">
                      {idx + 1}
                    </span>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {q.prompt}
                      </p>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => {
                          const isCorrect = opt.key.toUpperCase() === q.correctAnswer.toUpperCase();
                          return (
                            <div
                              key={opt.key}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-medium'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="truncate">{opt.text}</span>
                              {isCorrect && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-2 text-xs bg-slate-100/80 text-slate-600 px-3 py-2 rounded-xl border border-slate-200/60 leading-relaxed">
                          <span className="font-semibold text-slate-700">解析 (explanation)：</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                      正解：{q.correctAnswer}
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenInspector}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded-md hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition"
                      title="檢視試卷內容與線上修改此題"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>線上修改</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 試卷內容檢視與線上題庫增刪修彈窗 */}
      {!onOpenExamInspector && (
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
      )}
    </div>
  );
};
