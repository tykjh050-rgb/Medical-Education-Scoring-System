import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Calendar,
  User,
  Hash,
  Award,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Filter,
} from 'lucide-react';
import { StudentExamRecord } from '../../types';
import { exportScoresToExcel, exportScoresToCsv } from '../../utils/exportData';

interface ScoreReportTableProps {
  records: StudentExamRecord[];
  onClearRecords: () => void;
  onResetSampleRecords?: () => void;
}

type SortField = 'submittedAt' | 'studentId' | 'studentName' | 'correctCount' | 'finalScore';
type SortOrder = 'asc' | 'desc';

export const ScoreReportTable: React.FC<ScoreReportTableProps> = ({
  records,
  onClearRecords,
  onResetSampleRecords,
}) => {
  // 1. 搜尋與過濾狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'pass' | 'fail'>('all');

  // 2. 排序狀態
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 3. 匯出選項與反饋
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // 4. 個人作答明細彈窗
  const [selectedRecord, setSelectedRecord] = useState<StudentExamRecord | null>(null);

  /**
   * 計算每筆紀錄對應於「該學生在該測驗中的第幾次作答」
   */
  const attemptIndexMap = useMemo(() => {
    const map: Record<string, { attemptNumber: number; totalForStudent: number }> = {};
    const groups: Record<string, StudentExamRecord[]> = {};
    records.forEach((r) => {
      const key = `${(r.studentId || '').trim().toLowerCase()}__${(r.examTitle || '').trim().toLowerCase()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    Object.values(groups).forEach((group) => {
      const sorted = [...group].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
      sorted.forEach((r, idx) => {
        map[r.id] = {
          attemptNumber: idx + 1,
          totalForStudent: group.length,
        };
      });
    });
    return map;
  }, [records]);

  /**
   * 即時搜尋與篩選邏輯：
   * 支援依「學生姓名」或「學號」不分大小寫即時過濾，並可疊加日期與分數區間
   */
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 關鍵字搜尋：即時依「學生姓名」或「學號」過濾
      const term = searchTerm.trim().toLowerCase();
      const matchKeyword =
        !term ||
        rec.studentName.toLowerCase().includes(term) ||
        rec.studentId.toLowerCase().includes(term);

      // 日期篩選 (YYYY-MM-DD)
      const matchDate = !selectedDate || rec.submittedAt.startsWith(selectedDate);

      // 分數級距篩選
      let matchScore = true;
      if (scoreFilter === 'high') {
        matchScore = rec.finalScore >= 90;
      } else if (scoreFilter === 'pass') {
        matchScore = rec.finalScore >= 60 && rec.finalScore < 90;
      } else if (scoreFilter === 'fail') {
        matchScore = rec.finalScore < 60;
      }

      return matchKeyword && matchDate && matchScore;
    });
  }, [records, searchTerm, selectedDate, scoreFilter]);

  /**
   * 排序後資料
   */
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'submittedAt') {
        comparison = a.submittedAt.localeCompare(b.submittedAt);
      } else if (sortField === 'studentId') {
        comparison = a.studentId.localeCompare(b.studentId, undefined, { numeric: true });
      } else if (sortField === 'studentName') {
        comparison = a.studentName.localeCompare(b.studentName, 'zh-Hant');
      } else if (sortField === 'correctCount') {
        comparison = a.correctCount - b.correctCount;
      } else if (sortField === 'finalScore') {
        comparison = a.finalScore - b.finalScore;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredRecords, sortField, sortOrder]);

  /**
   * 總體統計指標計算
   */
  const stats = useMemo(() => {
    if (records.length === 0) {
      return { total: 0, average: 0, highest: 0, lowest: 0, passRate: 0 };
    }
    const scores = records.map((r) => r.finalScore);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Number((sum / records.length).toFixed(1));
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passCount = records.filter((r) => r.finalScore >= 60).length;
    const passRate = Number(((passCount / records.length) * 100).toFixed(1));

    return {
      total: records.length,
      average: avg,
      highest,
      lowest,
      passRate,
    };
  }, [records]);

  // 切換排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 觸發匯出報表 (Excel)
  const handleExportExcel = () => {
    const targetData = exportScope === 'filtered' ? sortedRecords : records;
    if (targetData.length === 0) return;

    exportScoresToExcel(targetData);
    setExportFeedback(`已成功匯出 ${targetData.length} 筆成績資料為 Excel (.xlsx) 檔案！`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  // 觸發匯出報表 (CSV)
  const handleExportCsv = () => {
    const targetData = exportScope === 'filtered' ? sortedRecords : records;
    if (targetData.length === 0) return;

    exportScoresToCsv(targetData);
    setExportFeedback(`已成功匯出 ${targetData.length} 筆成績資料為 CSV (.csv) 檔案！`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setScoreFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* 1. 成績總覽指標卡片 (Overview Analytics Bar) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">應試累計人次</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.total} 位</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">班級平均總分</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{stats.average} 分</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">及格率 (≥60分)</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{stats.passRate}%</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">最高分 / 最低分</div>
            <div className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5">
              {stats.highest} / {stats.lowest} 分
            </div>
          </div>
        </div>
      </div>

      {/* 2. 搜尋與篩選區塊 + 報表匯出功能列 (Search, Filter & Export) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* 搜尋與篩選控制項 */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* 關鍵字搜尋框：依「學生姓名」或「學號」即時過濾 */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-student"
                type="text"
                placeholder="搜尋學生姓名或學號（即時過濾）..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="清除搜尋關鍵字"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 日期過濾器 */}
            <div className="relative flex items-center">
              <input
                id="input-filter-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 bg-slate-50/50"
                title="依測驗日期篩選"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="ml-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  重設日期
                </button>
              )}
            </div>

            {/* 分數級距快速篩選鈕 */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                id="btn-filter-score-all"
                type="button"
                onClick={() => setScoreFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  scoreFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部
              </button>
              <button
                id="btn-filter-score-high"
                type="button"
                onClick={() => setScoreFilter('high')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  scoreFilter === 'high'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                高標 (≥90)
              </button>
              <button
                id="btn-filter-score-pass"
                type="button"
                onClick={() => setScoreFilter('pass')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  scoreFilter === 'pass'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                及格 (60-89)
              </button>
              <button
                id="btn-filter-score-fail"
                type="button"
                onClick={() => setScoreFilter('fail')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  scoreFilter === 'fail'
                    ? 'bg-white text-rose-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                待加強 (&lt;60)
              </button>
            </div>
          </div>

          {/* 3. 報表匯出功能組 (Export Report Action Area) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {/* 匯出範圍選擇 */}
            <div className="flex items-center text-xs bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  exportScope === 'filtered'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                篩選結果 ({sortedRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  exportScope === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                全部資料 ({records.length})
              </button>
            </div>

            {/* 匯出成績總表按鈕 (Excel) */}
            <button
              id="btn-export-excel"
              type="button"
              onClick={handleExportExcel}
              disabled={records.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title="將成績總表下載為 Excel .xlsx 檔案"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>匯出 Excel 檔</span>
            </button>

            {/* 匯出成績總表按鈕 (CSV) */}
            <button
              id="btn-export-csv"
              type="button"
              onClick={handleExportCsv}
              disabled={records.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title="將成績總表下載為 CSV 檔案"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>匯出 CSV 檔</span>
            </button>
          </div>
        </div>

        {/* 匯出成功提示 */}
        {exportFeedback && (
          <div
            id="export-feedback-toast"
            className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{exportFeedback}</span>
          </div>
        )}

        {/* 篩選條件標籤與結果筆數 */}
        {(searchTerm || selectedDate || scoreFilter !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              目前篩選：
            </span>
            {searchTerm && (
              <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                關鍵字：<strong>{searchTerm}</strong>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-indigo-950 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedDate && (
              <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                日期：<strong>{selectedDate}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="hover:text-slate-950 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {scoreFilter !== 'all' && (
              <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                分數區間：
                <strong>
                  {scoreFilter === 'high' ? '高標 (≥90)' : scoreFilter === 'pass' ? '及格 (60-89)' : '待加強 (<60)'}
                </strong>
                <button
                  type="button"
                  onClick={() => setScoreFilter('all')}
                  className="hover:text-slate-950 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <span className="text-slate-400">|</span>
            <span className="text-slate-700 font-medium">
              顯示 <strong>{sortedRecords.length}</strong> 筆（全班共 {records.length} 筆）
            </span>
            <button
              id="btn-clear-all-filters"
              type="button"
              onClick={handleClearFilters}
              className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 ml-auto"
            >
              清除所有篩選
            </button>
          </div>
        )}
      </div>

      {/* 3. 成績總表 (Score Report Table) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-score-report" className="w-full text-left text-sm">
            <thead className="bg-slate-50/90 text-xs font-bold text-slate-600 border-b border-slate-200 select-none">
              <tr>
                {/* 欄位 1：測驗時間 */}
                <th
                  onClick={() => handleSort('submittedAt')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  title="點擊依測驗時間排序"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>測驗時間</span>
                    {sortField === 'submittedAt' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* 欄位 2：學號/姓名 */}
                <th
                  onClick={() => handleSort('studentId')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  title="點擊依學號/姓名排序"
                >
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>學號 / 姓名</span>
                    {sortField === 'studentId' || sortField === 'studentName' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* 測驗單元 */}
                <th className="py-3.5 px-4 hidden md:table-cell">測驗單元</th>

                {/* 欄位 3：答對題數/總題數 */}
                <th
                  onClick={() => handleSort('correctCount')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  title="點擊依答對題數排序"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>答對題數 / 總題數</span>
                    {sortField === 'correctCount' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* 欄位 4：折算總分 */}
                <th
                  onClick={() => handleSort('finalScore')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                  title="點擊依折算總分排序"
                >
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>折算總分</span>
                    {sortField === 'finalScore' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* 耗時 */}
                <th className="py-3.5 px-4 hidden sm:table-cell">作答耗時</th>

                {/* 操作 */}
                <th className="py-3.5 px-4 text-center">作答明細對照</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-xs mx-auto space-y-2 text-slate-400">
                      <Search className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">
                        {records.length === 0
                          ? '目前尚無任何學生測驗紀錄'
                          : '查無符合搜尋關鍵字或條件的成績紀錄'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {records.length === 0
                          ? '學生完成測驗後將自動寫入成績總表，亦可點擊下方按鈕載入示範數據。'
                          : '請嘗試清除搜尋字串或重設篩選條件。'}
                      </p>

                      {records.length === 0 && onResetSampleRecords && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={onResetSampleRecords}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            載入示範成績數據 (3 筆)
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRecords.map((rec) => {
                  const pass = rec.finalScore >= 60;
                  const isHigh = rec.finalScore >= 90;
                  const accuracy = ((rec.correctCount / (rec.totalQuestions || 1)) * 100).toFixed(0);

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. 測驗時間 */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block">
                          {rec.submittedAt.split(' ')[0]}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {rec.submittedAt.split(' ')[1] || ''}
                        </span>
                      </td>

                      {/* 2. 學號/姓名 */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">
                              {rec.studentName}
                            </span>
                            {attemptIndexMap[rec.id] && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  attemptIndexMap[rec.id].attemptNumber > 1
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                                title={`此學生在「${rec.examTitle}」的第 ${attemptIndexMap[rec.id].attemptNumber} 次測驗（12小時內上限 2 次）`}
                              >
                                第 {attemptIndexMap[rec.id].attemptNumber} 次
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-indigo-600 font-medium">
                            {rec.studentId}
                          </span>
                        </div>
                      </td>

                      {/* 測驗單元 */}
                      <td className="py-4 px-4 text-xs text-slate-600 hidden md:table-cell max-w-[200px] truncate">
                        {rec.examTitle}
                      </td>

                      {/* 3. 答對題數/總題數 */}
                      <td className="py-4 px-4 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              {rec.correctCount}
                            </span>
                            <span className="text-slate-400 font-medium">
                              {' '}/ {rec.totalQuestions} 題
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              rec.correctCount === rec.totalQuestions
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {accuracy}%
                          </span>
                        </div>
                      </td>

                      {/* 4. 折算總分 */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold border ${
                            isHigh
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : pass
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <span className="text-sm font-black">{rec.finalScore}</span>
                          <span className="text-[10px] font-normal opacity-70">
                            / {rec.configuredTotalScore} 分
                          </span>
                        </span>
                      </td>

                      {/* 作答耗時 */}
                      <td className="py-4 px-4 text-xs text-slate-500 font-mono hidden sm:table-cell whitespace-nowrap">
                        {Math.floor(rec.durationSeconds / 60)}分{rec.durationSeconds % 60}秒
                      </td>

                      {/* 操作：作答明細 */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {rec.detailedResults && rec.detailedResults.length > 0 ? (
                          <button
                            id={`btn-view-detail-${rec.id}`}
                            type="button"
                            onClick={() => setSelectedRecord(rec)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            檢視作答明細
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">基本紀錄</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 表格底部資訊與清空紀錄控制列 */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              共 <strong>{sortedRecords.length}</strong> 筆測驗紀錄（全班累計 {records.length} 筆）
            </span>
          </div>

          <div className="flex items-center gap-4">
            {records.length === 0 && onResetSampleRecords && (
              <button
                type="button"
                onClick={onResetSampleRecords}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                載入示範資料
              </button>
            )}

            {records.length > 0 && (
              <button
                id="btn-clear-score-records"
                type="button"
                onClick={() => {
                  if (window.confirm('確定要清空所有學生作答紀錄嗎？清空後無法復原。')) {
                    onClearRecords();
                  }
                }}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空成績總表
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. 學生個人作答明細對照視窗 (Modal) */}
      {selectedRecord && (
        <div
          id="student-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal 頂部 Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                    學生測驗作答詳情
                  </span>
                  <span className="text-xs text-indigo-200">
                    交卷時間：{selectedRecord.submittedAt}
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  {selectedRecord.studentName}（學號：{selectedRecord.studentId}）
                </h3>
                <p className="text-xs text-indigo-100 mt-1">
                  測驗單元：{selectedRecord.examTitle} ｜ 作答耗時：
                  {Math.floor(selectedRecord.durationSeconds / 60)}分{selectedRecord.durationSeconds % 60}秒
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-indigo-200 font-medium">折算總分</div>
                  <div className="text-2xl font-black text-amber-300">
                    {selectedRecord.finalScore}
                    <span className="text-xs text-white/70 font-normal">
                      {' '}/ {selectedRecord.configuredTotalScore} 分
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 統計摘要條 */}
            <div className="bg-indigo-50/80 px-6 py-3 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
              <div className="flex items-center gap-4">
                <span>
                  <strong>答對題數：</strong> {selectedRecord.correctCount} / {selectedRecord.totalQuestions} 題
                </span>
                <span>
                  <strong>答對率：</strong> {((selectedRecord.correctCount / (selectedRecord.totalQuestions || 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  selectedRecord.finalScore >= 60
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {selectedRecord.finalScore >= 60 ? '測驗評定：及格' : '測驗評定：待加強'}
              </span>
            </div>

            {/* 逐題答題對照清單 */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
              {selectedRecord.detailedResults.map((item, idx) => (
                <div key={item.questionId || idx} className="pt-4 first:pt-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          item.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {item.prompt}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {item.isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          答對 (+{item.earnedScore}分)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          答錯 (0分)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 選項清單對照 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 text-xs">
                    {item.options.map((opt) => {
                      const isStudentChoice = opt.key.toUpperCase() === item.selectedOption.toUpperCase();
                      const isCorrectAnswer = item.correctAnswer.toUpperCase().includes(opt.key.toUpperCase());

                      let badgeStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                      if (isCorrectAnswer) {
                        badgeStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium';
                      } else if (isStudentChoice && !isCorrectAnswer) {
                        badgeStyle = 'bg-rose-50 border-rose-300 text-rose-950 line-through';
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${badgeStyle}`}
                        >
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isCorrectAnswer
                                ? 'bg-emerald-600 text-white'
                                : isStudentChoice
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="flex-1 truncate">{opt.text}</span>
                          {isStudentChoice && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-white font-normal shrink-0">
                              學生選答
                            </span>
                          )}
                          {isCorrectAnswer && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-700 text-white font-normal shrink-0">
                              正解
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 解析說明 */}
                  {item.explanation && (
                    <div className="ml-8 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                      <strong className="text-slate-800">題目解析：</strong>
                      {item.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
              >
                關閉明細
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
