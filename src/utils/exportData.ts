import * as XLSX from 'xlsx';
import { StudentExamRecord } from '../types';

/**
 * 格式化當前時間戳記用於檔名
 */
function getTimestampString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${hh}${mm}`;
}

/**
 * 匯出學生成績總表為 Excel (.xlsx)
 */
export function exportScoresToExcel(
  records: StudentExamRecord[],
  customFilename?: string
) {
  if (records.length === 0) return;

  const filename = customFilename || `學生考試成績總表_${getTimestampString()}.xlsx`;

  const dataRows = records.map((rec) => {
    return {
      測驗時間: rec.submittedAt,
      學號: rec.studentId,
      姓名: rec.studentName,
      '答對題數/總題數': `${rec.correctCount} / ${rec.totalQuestions}`,
      答對題數: rec.correctCount,
      總題數: rec.totalQuestions,
      折算總分: rec.finalScore,
      自訂滿分: rec.configuredTotalScore,
      答對率: `${((rec.correctCount / (rec.totalQuestions || 1)) * 100).toFixed(1)}%`,
      作答耗時: `${Math.floor(rec.durationSeconds / 60)}分${rec.durationSeconds % 60}秒`,
      測驗單元名稱: rec.examTitle,
    };
  });

  const ws = XLSX.utils.json_to_sheet(dataRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '學生成績總表');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerFileDownload(blob, filename);
}

/**
 * 匯出學生成績總表為 CSV 檔 (含 UTF-8 BOM，防止 Excel 開啟亂碼)
 */
export function exportScoresToCsv(
  records: StudentExamRecord[],
  customFilename?: string
) {
  if (records.length === 0) return;

  const filename = customFilename || `學生考試成績總表_${getTimestampString()}.csv`;

  const headers = [
    '測驗時間',
    '學號',
    '姓名',
    '答對題數/總題數',
    '答對題數',
    '總題數',
    '折算總分',
    '自訂滿分',
    '答對率',
    '作答耗時',
    '測驗單元名稱',
  ];

  const rows = records.map((rec) => [
    escapeCsv(rec.submittedAt),
    escapeCsv(rec.studentId),
    escapeCsv(rec.studentName),
    escapeCsv(`${rec.correctCount}/${rec.totalQuestions}`),
    rec.correctCount,
    rec.totalQuestions,
    rec.finalScore,
    rec.configuredTotalScore,
    `${((rec.correctCount / (rec.totalQuestions || 1)) * 100).toFixed(1)}%`,
    escapeCsv(`${Math.floor(rec.durationSeconds / 60)}分${rec.durationSeconds % 60}秒`),
    escapeCsv(rec.examTitle),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, filename);
}

function escapeCsv(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
