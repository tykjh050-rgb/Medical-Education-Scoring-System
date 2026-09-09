import React, { useState, useMemo } from 'react';
import {
  Eye,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Copy,
  FileSpreadsheet,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Search,
  BookOpen,
  Filter,
  Save,
  RotateCcw,
  Sliders,
  CheckSquare,
  Square,
  Printer,
} from 'lucide-react';
import { Question, QuestionOption } from '../../types';

interface ExamContentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onUpdateQuestions: (newQuestions: Question[]) => void;
  totalScore: number;
  examTitle: string;
  onUpdateExamTitle: (title: string) => void;
  onSwitchToStudentExam?: () => void;
}

interface EditQuestionFormState {
  id: string;
  questionNumber: number;
  prompt: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  type: 'single' | 'multiple';
}

const DEFAULT_NEW_QUESTION: EditQuestionFormState = {
  id: '',
  questionNumber: 1,
  prompt: '',
  options: [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' },
  ],
  correctAnswer: 'A',
  explanation: '',
  type: 'single',
};

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const ExamContentEditorModal: React.FC<ExamContentEditorModalProps> = ({
  isOpen,
  onClose,
  questions,
  onUpdateQuestions,
  totalScore,
  examTitle,
  onUpdateExamTitle,
  onSwitchToStudentExam,
}) => {
  // 關鍵字搜尋試題
  const [searchTerm, setSearchTerm] = useState('');
  // 篩選題型
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'multiple'>('all');
  
  // 正在編輯中的題目 (若為 null 則代表處於純檢視清單模式)
  const [editingQuestion, setEditingQuestion] = useState<EditQuestionFormState | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formError, setFormError] = useState('');

  // 刪除確認彈窗
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // 操作成功反饋訊息
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 批次選取刪除
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 顯示標準正解開關 (方便教師檢視模式)
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  /**
   * 搜尋與篩選試題
   */
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch =
        !searchTerm.trim() ||
        q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.options.some((opt) => opt.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(q.questionNumber).includes(searchTerm.trim());

      const matchType =
        typeFilter === 'all' ||
        (typeFilter === 'multiple' && (q.type === 'multiple' || q.correctAnswer.includes(','))) ||
        (typeFilter === 'single' && (q.type !== 'multiple' && !q.correctAnswer.includes(',')));

      return matchSearch && matchType;
    });
  }, [questions, searchTerm, typeFilter]);

  /**
   * 計算每題動態配分
   */
  const perQuestionScore = questions.length > 0 ? (totalScore / questions.length).toFixed(2) : '0';

  if (!isOpen) return null;

  // 1. 開啟「新增試題」表單
  const handleOpenCreateForm = () => {
    const nextNumber = questions.length + 1;
    setEditingQuestion({
      ...DEFAULT_NEW_QUESTION,
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      questionNumber: nextNumber,
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      correctAnswer: 'A',
      explanation: '',
      type: 'single',
    });
    setIsCreatingNew(true);
    setFormError('');
  };

  // 2. 開啟「修改試題」表單
  const handleOpenEditForm = (q: Question) => {
    const isMulti = q.type === 'multiple' || q.correctAnswer.includes(',');
    setEditingQuestion({
      id: q.id,
      questionNumber: q.questionNumber,
      prompt: q.prompt,
      options: q.options.map((opt) => ({ ...opt })),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      type: isMulti ? 'multiple' : 'single',
    });
    setIsCreatingNew(false);
    setFormError('');
  };

  // 3. 儲存新增或修改
  const handleSaveQuestion = (continueCreating = false) => {
    if (!editingQuestion) return;

    if (!editingQuestion.prompt.trim()) {
      setFormError('請輸入題目內文 (prompt)！');
      return;
    }

    // 檢查選項至少 2 個且文字不可全為空
    const validOptions = editingQuestion.options.filter((o) => o.text.trim().length > 0);
    if (validOptions.length < 2) {
      setFormError('試題至少需提供 2 個有效選項文字！');
      return;
    }

    if (!editingQuestion.correctAnswer.trim()) {
      setFormError('請指定此題目的正確答案選項！');
      return;
    }

    // 標準化選項 key（A, B, C, D...）
    const normalizedOptions: QuestionOption[] = validOptions.map((opt, idx) => ({
      key: OPTION_KEYS[idx] || String.fromCharCode(65 + idx),
      text: opt.text.trim(),
    }));

    // 確保正確答案包含在選項內
    const validKeys = normalizedOptions.map((o) => o.key.toUpperCase());
    const selectedKeys = editingQuestion.correctAnswer
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((k) => validKeys.includes(k));

    if (selectedKeys.length === 0) {
      setFormError(`指定之正確答案代號 (${editingQuestion.correctAnswer}) 不在現存選項列表中！`);
      return;
    }

    const finalCorrectAnswer = selectedKeys.join(',');
    const finalType = selectedKeys.length > 1 ? 'multiple' : editingQuestion.type;

    const savedQuestion: Question = {
      id: editingQuestion.id,
      questionNumber: editingQuestion.questionNumber,
      prompt: editingQuestion.prompt.trim(),
      options: normalizedOptions,
      correctAnswer: finalCorrectAnswer,
      explanation: editingQuestion.explanation.trim(),
      type: finalType,
    };

    let updatedQuestions: Question[] = [];

    if (isCreatingNew) {
      updatedQuestions = [...questions, savedQuestion].map((q, idx) => ({
        ...q,
        questionNumber: idx + 1,
      }));
      showToast(`已成功新增第 ${updatedQuestions.length} 題試題！`);
    } else {
      updatedQuestions = questions.map((q) => (q.id === savedQuestion.id ? savedQuestion : q));
      showToast(`已成功更新第 ${savedQuestion.questionNumber} 題試題內容！`);
    }

    onUpdateQuestions(updatedQuestions);

    if (continueCreating && isCreatingNew) {
      // 繼續新增下一題
      const nextNum = updatedQuestions.length + 1;
      setEditingQuestion({
        ...DEFAULT_NEW_QUESTION,
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        questionNumber: nextNum,
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ],
        correctAnswer: 'A',
        explanation: '',
        type: 'single',
      });
      setFormError('');
    } else {
      setEditingQuestion(null);
      setIsCreatingNew(false);
      setFormError('');
    }
  };

  // 4. 刪除題目
  const handleDeleteQuestion = (id: string) => {
    const targetQ = questions.find((q) => q.id === id);
    const updated = questions
      .filter((q) => q.id !== id)
      .map((q, idx) => ({
        ...q,
        questionNumber: idx + 1,
      }));
    onUpdateQuestions(updated);
    setDeleteConfirmId(null);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    showToast(`已刪除試題（原第 ${targetQ?.questionNumber || ''} 題），題號已自動重編排！`);
  };

  // 5. 批次刪除選取試題
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const updated = questions
      .filter((q) => !selectedIds.includes(q.id))
      .map((q, idx) => ({
        ...q,
        questionNumber: idx + 1,
      }));
    onUpdateQuestions(updated);
    setSelectedIds([]);
    showToast(`已批次刪除 ${count} 題試題，單題配分已自動重新計算！`);
  };

  // 6. 複製試題
  const handleDuplicateQuestion = (q: Question) => {
    const newId = 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const duplicated: Question = {
      ...q,
      id: newId,
      prompt: `${q.prompt} (複製)`,
      options: q.options.map((opt) => ({ ...opt })),
    };
    const updated = [...questions, duplicated].map((item, idx) => ({
      ...item,
      questionNumber: idx + 1,
    }));
    onUpdateQuestions(updated);
    showToast(`已複製第 ${q.questionNumber} 題並加入題庫末尾！`);
  };

  // 7. 題目上移/下移
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const nextQuestions = [...questions];
    const temp = nextQuestions[index];
    nextQuestions[index] = nextQuestions[targetIndex];
    nextQuestions[targetIndex] = temp;

    const renumbered = nextQuestions.map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    }));
    onUpdateQuestions(renumbered);
  };

  // 表單選項變更輔助函式
  const handleOptionTextChange = (idx: number, text: string) => {
    if (!editingQuestion) return;
    const newOptions = [...editingQuestion.options];
    newOptions[idx].text = text;
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleAddOptionField = () => {
    if (!editingQuestion || editingQuestion.options.length >= OPTION_KEYS.length) return;
    const nextKey = OPTION_KEYS[editingQuestion.options.length];
    setEditingQuestion({
      ...editingQuestion,
      options: [...editingQuestion.options, { key: nextKey, text: '' }],
    });
  };

  const handleRemoveOptionField = (idx: number) => {
    if (!editingQuestion || editingQuestion.options.length <= 2) return;
    const removedKey = editingQuestion.options[idx].key;
    const remaining = editingQuestion.options
      .filter((_, i) => i !== idx)
      .map((opt, i) => ({
        key: OPTION_KEYS[i],
        text: opt.text,
      }));

    // 若被刪除的選項是正確答案，需調整正確答案
    let newCorrect = editingQuestion.correctAnswer;
    if (editingQuestion.type === 'multiple') {
      const keys = newCorrect
        .split(',')
        .filter((k) => k !== removedKey)
        .map((k) => k.trim());
      newCorrect = keys.length > 0 ? keys.join(',') : remaining[0].key;
    } else {
      if (newCorrect === removedKey) {
        newCorrect = remaining[0].key;
      }
    }

    setEditingQuestion({
      ...editingQuestion,
      options: remaining,
      correctAnswer: newCorrect,
    });
  };

  const handleToggleOptionCorrect = (key: string) => {
    if (!editingQuestion) return;
    if (editingQuestion.type === 'multiple') {
      const currentKeys = editingQuestion.correctAnswer
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      let updatedKeys: string[] = [];
      if (currentKeys.includes(key)) {
        updatedKeys = currentKeys.filter((k) => k !== key);
      } else {
        updatedKeys = [...currentKeys, key].sort();
      }
      if (updatedKeys.length === 0) {
        updatedKeys = [key];
      }
      setEditingQuestion({
        ...editingQuestion,
        correctAnswer: updatedKeys.join(','),
      });
    } else {
      setEditingQuestion({
        ...editingQuestion,
        correctAnswer: key,
      });
    }
  };

  const handlePrintExam = () => {
    window.print();
  };

  return (
    <div
      id="exam-content-inspector-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 頂部 Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-indigo-900/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-300" />
                教師管理專用功能
              </span>
              <span className="text-xs text-slate-400">｜</span>
              <span className="text-xs text-slate-300">
                目前試卷題庫共 <strong className="text-white font-mono">{questions.length}</strong> 題
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>試卷內容檢視與線上題庫編修</span>
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>單元：</span>
              <strong className="text-indigo-200">{examTitle}</strong>
              <span>｜ 自訂總分：</span>
              <strong className="text-indigo-200">{totalScore} 分</strong>
              <span>｜ 單題配分約：</span>
              <strong className="text-indigo-200 font-mono">{perQuestionScore} 分/題</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-modal-add-question-top"
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>線上新增題目</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              title="關閉檢視視窗"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 檢視與編修主工作區 */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50">
          {/* 若處於「新增或編輯題目模式」 */}
          {editingQuestion ? (
            <div className="p-4 sm:p-6 bg-white space-y-5 flex-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {isCreatingNew ? '+' : editingQuestion.questionNumber}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isCreatingNew
                        ? `線上新增題目（預設第 ${editingQuestion.questionNumber} 題）`
                        : `線上修改第 ${editingQuestion.questionNumber} 題內容`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      填寫試題內容、選項及指定正確答案，儲存後即時生效並自動動態配分。
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsCreatingNew(false);
                    setFormError('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <X className="w-3.5 h-3.5" />
                  取消並返回清單
                </button>
              </div>

              {/* 錯誤反饋提示 */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* 題型選擇與題號 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      題型規範
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="question-type"
                          checked={editingQuestion.type === 'single'}
                          onChange={() =>
                            setEditingQuestion({
                              ...editingQuestion,
                              type: 'single',
                              correctAnswer: editingQuestion.correctAnswer.split(',')[0] || 'A',
                            })
                          }
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>單選題 (Single Choice)</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="question-type"
                          checked={editingQuestion.type === 'multiple'}
                          onChange={() =>
                            setEditingQuestion({
                              ...editingQuestion,
                              type: 'multiple',
                            })
                          }
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>複選題 (Multiple Choice)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      當前設定之正確答案 (correct_answer)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm bg-emerald-100 text-emerald-900 px-3 py-1 rounded-xl border border-emerald-300">
                        {editingQuestion.correctAnswer || '尚未指定'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        (可直接於下方選項點擊「設為正解」切換)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 題目內文 */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>
                      題目內文 (question_text) <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      支援文字與符號說明
                    </span>
                  </label>
                  <textarea
                    id="input-edit-prompt"
                    rows={3}
                    value={editingQuestion.prompt}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, prompt: e.target.value })
                    }
                    placeholder="請輸入題目內容，例如：植物進行光合作用時，最主要吸收太陽光中的哪些色光？"
                    className="w-full p-3 text-sm border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>

                {/* 選項清單 (Options) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>選項群組設定 (options)</span>
                      <span className="text-rose-500">*</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        （點選左側圓鈕或標籤即可指定為正確答案）
                      </span>
                    </label>

                    {editingQuestion.options.length < OPTION_KEYS.length && (
                      <button
                        type="button"
                        onClick={handleAddOptionField}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        增加選項 (如 {OPTION_KEYS[editingQuestion.options.length]})
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {editingQuestion.options.map((opt, idx) => {
                      const isCorrect =
                        editingQuestion.type === 'multiple'
                          ? editingQuestion.correctAnswer
                              .split(',')
                              .map((k) => k.trim().toUpperCase())
                              .includes(opt.key.toUpperCase())
                          : editingQuestion.correctAnswer.toUpperCase() === opt.key.toUpperCase();

                      return (
                        <div
                          key={opt.key}
                          className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                            isCorrect
                              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {/* 正解指定按鈕 */}
                          <button
                            type="button"
                            onClick={() => handleToggleOptionCorrect(opt.key)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="點擊設定為正確答案"
                          >
                            {opt.key}
                          </button>

                          {/* 選項文字輸入 */}
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                            placeholder={`選項 ${opt.key} 敘述內容...`}
                            className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400"
                          />

                          {/* 標記狀態指示 */}
                          <button
                            type="button"
                            onClick={() => handleToggleOptionCorrect(opt.key)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition flex items-center gap-1 cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>標準正解</span>
                              </>
                            ) : (
                              <span>設為正解</span>
                            )}
                          </button>

                          {/* 刪除選項 (至少保留 2 個) */}
                          {editingQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionField(idx)}
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition shrink-0"
                              title="移除此選項"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 題目解析 */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>題目解析說明 (explanation，選填)</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      供學生考完即時觀看檢討學習
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={editingQuestion.explanation}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                    }
                    placeholder="例如：光合作用中的葉綠素主要吸收紅光與藍紫光，對綠光幾乎不吸收而反射，故葉片呈綠色。"
                    className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* 表單操作按鈕列 */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsCreatingNew(false);
                    setFormError('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  放棄並取消
                </button>

                <div className="flex items-center gap-2">
                  {isCreatingNew && (
                    <button
                      type="button"
                      onClick={() => handleSaveQuestion(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      儲存並繼續新增下一題
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveQuestion(false)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    確認儲存試題
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 純檢視與管理試題清單模式 */
            <div className="p-4 sm:p-6 space-y-4">
              {/* 工具列：搜尋、題型過濾、正解開關、批次刪除 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* 關鍵字搜尋 */}
                  <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜尋試題關鍵字、選項或解析..."
                      className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 題型切換 */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => setTypeFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition ${
                        typeFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      全部 ({questions.length})
                    </button>
                    <button
                      onClick={() => setTypeFilter('single')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition ${
                        typeFilter === 'single'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      單選題
                    </button>
                    <button
                      onClick={() => setTypeFilter('multiple')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition ${
                        typeFilter === 'multiple'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      複選題
                    </button>
                  </div>
                </div>

                {/* 右側輔助控制按鈕 */}
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer px-2 py-1 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={showAnswerKey}
                      onChange={(e) => setShowAnswerKey(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">標示正解</span>
                  </label>

                  {selectedIds.length > 0 && (
                    <button
                      onClick={handleBatchDelete}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>刪除已選 ({selectedIds.length})</span>
                    </button>
                  )}

                  <button
                    id="btn-add-question-in-list"
                    onClick={handleOpenCreateForm}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增題目</span>
                  </button>
                </div>
              </div>

              {/* 試題清單本體 */}
              {filteredQuestions.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-base font-semibold text-slate-700">未找到符合條件的試題</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchTerm
                      ? `找不到包含「${searchTerm}」的題目，請嘗試其他關鍵字。`
                      : '目前題庫尚無題目，可點擊上方按鈕立即線上新增！'}
                  </p>
                  <button
                    onClick={handleOpenCreateForm}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    立即線上新增第 1 題
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((q, idx) => {
                    const isMulti = q.type === 'multiple' || q.correctAnswer.includes(',');
                    const isSelected = selectedIds.includes(q.id);

                    return (
                      <div
                        key={q.id}
                        className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            {/* 多選選取框 */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedIds((prev) => prev.filter((i) => i !== q.id));
                                } else {
                                  setSelectedIds((prev) => [...prev, q.id]);
                                }
                              }}
                              className="mt-1 text-slate-400 hover:text-indigo-600 transition"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            {/* 題號與題型徽章 */}
                            <div className="shrink-0 flex flex-col items-center gap-1">
                              <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-200/60 font-mono">
                                {q.questionNumber}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  isMulti
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isMulti ? '複選' : '單選'}
                              </span>
                            </div>

                            {/* 題目本體與選項 */}
                            <div className="space-y-3 flex-1">
                              <div>
                                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                                  {q.prompt}
                                </p>
                              </div>

                              {/* 選項列表 */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options.map((opt) => {
                                  const isCorrect =
                                    showAnswerKey &&
                                    (isMulti
                                      ? q.correctAnswer
                                          .split(',')
                                          .map((k) => k.trim().toUpperCase())
                                          .includes(opt.key.toUpperCase())
                                      : q.correctAnswer.toUpperCase() === opt.key.toUpperCase());

                                  return (
                                    <div
                                      key={opt.key}
                                      className={`p-2 rounded-xl text-xs border flex items-center gap-2 transition ${
                                        isCorrect
                                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-medium'
                                          : 'bg-slate-50/80 border-slate-200 text-slate-700'
                                      }`}
                                    >
                                      <span
                                        className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                          isCorrect
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-200 text-slate-600'
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

                              {/* 解析 */}
                              {q.explanation && (
                                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600 leading-relaxed">
                                  <strong className="text-slate-800">題目解析：</strong>{' '}
                                  {q.explanation}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 右側操作按鈕組 (修改、刪除、上移、下移、複製) */}
                          <div className="shrink-0 flex flex-col items-end gap-2 pl-2">
                            {/* 正確答案標記 */}
                            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                              正解: {q.correctAnswer}
                            </span>

                            <div className="flex items-center gap-1 pt-1">
                              {/* 上移 */}
                              <button
                                type="button"
                                disabled={q.questionNumber <= 1}
                                onClick={() => handleMoveQuestion(q.questionNumber - 1, 'up')}
                                className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition"
                                title="上移此題"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>

                              {/* 下移 */}
                              <button
                                type="button"
                                disabled={q.questionNumber >= questions.length}
                                onClick={() => handleMoveQuestion(q.questionNumber - 1, 'down')}
                                className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition"
                                title="下移此題"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* 複製 */}
                              <button
                                type="button"
                                onClick={() => handleDuplicateQuestion(q)}
                                className="w-7 h-7 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition"
                                title="複製此題"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* 線上修改 */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(q)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                                title="線上修改題目內容"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>修改</span>
                              </button>

                              {/* 刪除 */}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(q.id)}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                                title="刪除此題"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 刪除確認小條 */}
                        {deleteConfirmId === q.id && (
                          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-900 animate-in fade-in duration-150">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>
                                確定要刪除<strong>第 {q.questionNumber} 題</strong>嗎？刪除後將自動重新編排題號與單題配分。
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                              >
                                取消
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                              >
                                確定刪除
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部功能列 */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">即時配分統計：</span>
            <span>總分 {totalScore} 分</span>
            <span>/</span>
            <span>共 {questions.length} 題</span>
            <span>=</span>
            <span className="font-mono font-bold text-indigo-700">
              單題約 {perQuestionScore} 分
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrintExam}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>列印 / 預覽試卷</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition"
            >
              關閉視窗
            </button>

            {onSwitchToStudentExam && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToStudentExam();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>以當前題庫進行模擬考</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
