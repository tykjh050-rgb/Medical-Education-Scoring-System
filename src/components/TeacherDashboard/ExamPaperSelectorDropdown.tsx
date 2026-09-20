import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  ChevronDown,
  Trash2,
  Plus,
  Check,
  Upload,
  Calendar,
  Layers,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { ExamPaper } from '../../types';

interface ExamPaperSelectorDropdownProps {
  examPapers: ExamPaper[];
  activeExamId: string;
  onSelectExam: (id: string) => void;
  onDeleteExam: (id: string) => void;
  onAddNewExam: () => void;
  onRequestUpload?: () => void;
}

export const ExamPaperSelectorDropdown: React.FC<ExamPaperSelectorDropdownProps> = ({
  examPapers,
  activeExamId,
  onSelectExam,
  onDeleteExam,
  onAddNewExam,
  onRequestUpload,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeExam =
    examPapers.find((p) => p.id === activeExamId) || examPapers[0] || null;

  // 點選外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setDeleteConfirmId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (examPapers.length <= 1) {
      alert('系統中至少需保留一份試卷題庫，無法刪除最後一份考卷。');
      return;
    }
    setDeleteConfirmId(id);
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteExam(id);
    setDeleteConfirmId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor="exam-paper-select-btn"
          className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>試卷題庫管理選單</span>
          <span className="text-[11px] font-normal text-slate-500">
            (共 {examPapers.length} 份考卷)
          </span>
        </label>
        <button
          id="btn-create-new-exam-paper-top"
          type="button"
          onClick={() => {
            onAddNewExam();
            setIsOpen(false);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded-lg transition"
          title="建立一份新空白試卷"
        >
          <Plus className="w-3 h-3" />
          <span>新增空白試卷</span>
        </button>
      </div>

      {/* 主下拉按鈕 */}
      <div className="flex items-center gap-2">
        <button
          id="exam-paper-select-btn"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="flex-1 flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-left shadow-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 truncate block">
                  {activeExam ? activeExam.title : '請選擇試卷題庫'}
                </span>
                {activeExam?.fileName && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-600" />
                    {activeExam.fileName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span className="font-semibold text-indigo-600">
                  {activeExam?.questions?.length || 0} 題
                </span>
                <span>•</span>
                <span>自訂滿分 {activeExam?.totalScore || 100} 分</span>
              </div>
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {/* 快速刪除當前選定考卷按鈕 */}
        {examPapers.length > 1 && activeExam && (
          <button
            id="btn-delete-active-exam-quick"
            type="button"
            onClick={(e) => handleDeleteClick(e, activeExam.id)}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition shadow-xs shrink-0"
            title={`刪除「${activeExam.title}」`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 下拉式選單主體 */}
      {isOpen && (
        <div
          id="exam-papers-dropdown-menu"
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* 頂部說明列 */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">
              選擇或管理試卷題庫
            </span>
            <span className="text-[11px] text-slate-400">
              點擊切換，右側按鈕可刪除
            </span>
          </div>

          {/* 考卷列表清單 */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {examPapers.map((exam) => {
              const isSelected = exam.id === activeExamId;
              const isDeletingThis = deleteConfirmId === exam.id;

              return (
                <div
                  key={exam.id}
                  id={`exam-paper-item-${exam.id}`}
                  onClick={() => {
                    onSelectExam(exam.id);
                    setIsOpen(false);
                  }}
                  className={`group flex items-center justify-between p-3.5 cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50/70 hover:bg-indigo-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            isSelected ? 'text-indigo-950' : 'text-slate-800'
                          }`}
                        >
                          {exam.title}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-600 text-white shrink-0">
                            當前使用
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">
                          {exam.questions.length} 題試題
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                          總分 {exam.totalScore} 分
                        </span>
                        {exam.fileName && (
                          <span className="text-slate-400 truncate max-w-[150px]">
                            {exam.fileName}
                          </span>
                        )}
                        {exam.createdAt && (
                          <span className="hidden sm:inline text-slate-400 flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(exam.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 考卷刪除按鈕 (選單內刪除鈕) */}
                  <div className="shrink-0 flex items-center gap-1">
                    {isDeletingThis ? (
                      <div
                        className="flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[11px] font-bold text-rose-700 pl-1">
                          確定刪除？
                        </span>
                        <button
                          id={`btn-confirm-delete-exam-${exam.id}`}
                          type="button"
                          onClick={(e) => confirmDelete(e, exam.id)}
                          className="px-2 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded shadow-xs"
                        >
                          確認
                        </button>
                        <button
                          type="button"
                          onClick={cancelDelete}
                          className="px-1.5 py-1 text-[10px] text-slate-600 hover:bg-slate-200 rounded"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-delete-exam-${exam.id}`}
                        type="button"
                        onClick={(e) => handleDeleteClick(e, exam.id)}
                        disabled={examPapers.length <= 1}
                        className={`p-2 rounded-lg transition ${
                          examPapers.length <= 1
                            ? 'text-slate-300 cursor-not-allowed opacity-50'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={
                          examPapers.length <= 1
                            ? '至少需保留一份試卷，不可刪除'
                            : `刪除試卷「${exam.title}」`
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 下拉底部操作列 */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              id="btn-dropdown-add-new-exam"
              type="button"
              onClick={() => {
                onAddNewExam();
                setIsOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增空白試卷</span>
            </button>

            {onRequestUpload && (
              <button
                id="btn-dropdown-upload-new-exam"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onRequestUpload();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>上傳檔案新增考卷</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 單獨保留一份考卷提示 */}
      {deleteConfirmId && (
        <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>請在選單項目右側確認是否刪除該試卷。</span>
        </div>
      )}
    </div>
  );
};
