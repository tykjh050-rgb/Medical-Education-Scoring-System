import { StudentExamRecord } from '../types';

export const MAX_EXAM_ATTEMPTS_PER_WINDOW = 1; // 12 小時內最多 1 次
export const EXAM_TIME_WINDOW_HOURS = 12;      // 時間窗口 12 小時
export const EXAM_TIME_WINDOW_MS = EXAM_TIME_WINDOW_HOURS * 60 * 60 * 1000;

export interface ExamAttemptLimitStatus {
  /** 是否允許再次進行測驗 */
  canAttempt: boolean;
  /** 12 小時內已測驗次數 */
  attemptsInWindow: number;
  /** 12 小時內最高可測驗次數 (固定為 1 次) */
  maxAttempts: number;
  /** 時間窗口小時數 (12 小時) */
  timeWindowHours: number;
  /** 12 小時內剩餘可測驗次數 */
  remainingAttempts: number;
  /** 12 小時內的相關測驗紀錄清單 (由舊至新) */
  recordsInWindow: StudentExamRecord[];
  /** 最早一次測驗紀錄在 12 小時後的解禁時間 */
  nextAllowedDate: Date | null;
  /** 格式化解禁時間字串 (如 2026-09-09 14:30) */
  formattedNextAllowedTime: string | null;
  /** 距離解禁剩餘時間字串 (如 11 小時 45 分鐘) */
  remainingTimeString: string | null;
  /** 限制說明文字 */
  message: string;
}

/**
 * 將 submittedAt 字串安全解析為毫秒時間戳記
 */
export function parseDateStringToTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const t = new Date(normalized).getTime();
    if (!isNaN(t) && t > 0) return t;

    // 備用手動解析 YYYY-MM-DD HH:mm:ss
    const parts = dateStr.split(/[- :]/).map(Number);
    if (parts.length >= 6) {
      return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]).getTime();
    }
  } catch (e) {
    console.error('Error parsing date string:', dateStr, e);
  }
  return 0;
}

/**
 * 檢查同一位學生在同一份測驗題目中，12 小時內的測驗次數限制狀態
 *
 * @param records 全體或歷史學生測驗紀錄陣列
 * @param studentId 學生學號
 * @param examTitle 測驗題目單元名稱
 * @param currentTime 當前時間戳記 (預設為 Date.now())
 */
export function checkExamAttemptLimit(
  records: StudentExamRecord[],
  studentId: string,
  examTitle: string,
  currentTime = Date.now()
): ExamAttemptLimitStatus {
  const normStudentId = (studentId || '').trim().toLowerCase();
  const normExamTitle = (examTitle || '').trim().toLowerCase();

  // 若學號尚未輸入，預設允許但剩餘 2 次
  if (!normStudentId) {
    return {
      canAttempt: true,
      attemptsInWindow: 0,
      maxAttempts: MAX_EXAM_ATTEMPTS_PER_WINDOW,
      timeWindowHours: EXAM_TIME_WINDOW_HOURS,
      remainingAttempts: MAX_EXAM_ATTEMPTS_PER_WINDOW,
      recordsInWindow: [],
      nextAllowedDate: null,
      formattedNextAllowedTime: null,
      remainingTimeString: null,
      message: `同 1 位學生同 1 份測驗題目 ${EXAM_TIME_WINDOW_HOURS} 小時內最多可測驗 ${MAX_EXAM_ATTEMPTS_PER_WINDOW} 次。`,
    };
  }

  // 1. 篩選符合「同一位學生 (學號)」且「同一份測驗題目 (examTitle)」的紀錄
  const studentExamRecords = records.filter((rec) => {
    const rId = (rec.studentId || '').trim().toLowerCase();
    const rTitle = (rec.examTitle || '').trim().toLowerCase();
    return rId === normStudentId && (!normExamTitle || rTitle === normExamTitle);
  });

  // 2. 篩選在過去 12 小時內提交的紀錄
  const recordsInWindow = studentExamRecords
    .map((rec) => ({
      record: rec,
      timestamp: parseDateStringToTimestamp(rec.submittedAt),
    }))
    .filter(({ timestamp }) => {
      if (timestamp <= 0) return false;
      const diff = currentTime - timestamp;
      // 在 12 小時之內 (允許輕微系統時間偏差，未來 10 分鐘內也視為當前窗口)
      return diff >= -10 * 60 * 1000 && diff < EXAM_TIME_WINDOW_MS;
    })
    .sort((a, b) => a.timestamp - b.timestamp) // 由舊到新排序
    .map((item) => item.record);

  const attemptsInWindow = recordsInWindow.length;
  const canAttempt = attemptsInWindow < MAX_EXAM_ATTEMPTS_PER_WINDOW;
  const remainingAttempts = Math.max(0, MAX_EXAM_ATTEMPTS_PER_WINDOW - attemptsInWindow);

  let nextAllowedDate: Date | null = null;
  let formattedNextAllowedTime: string | null = null;
  let remainingTimeString: string | null = null;
  let message = '';

  if (!canAttempt) {
    // 達到上限 (已測驗 1 次或以上)，計算最早一筆紀錄何時過期解除限制
    // 取在窗口內最早的那一筆 (第 1 筆)
    const earliestRecord = recordsInWindow[0];
    const earliestTimestamp = parseDateStringToTimestamp(earliestRecord.submittedAt);
    const unlockTimestamp = earliestTimestamp + EXAM_TIME_WINDOW_MS;
    nextAllowedDate = new Date(unlockTimestamp);

    formattedNextAllowedTime = formatDateTime(nextAllowedDate);

    const msRemaining = Math.max(0, unlockTimestamp - currentTime);
    const totalMinutes = Math.ceil(msRemaining / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      remainingTimeString = `${hours} 小時 ${minutes} 分鐘`;
    } else {
      remainingTimeString = `${minutes} 分鐘`;
    }

    message = `此學號於 ${EXAM_TIME_WINDOW_HOURS} 小時內已完成測驗（已達最高上限 ${MAX_EXAM_ATTEMPTS_PER_WINDOW} 次）。依規定暫時無法重複測驗，預計解禁時間為 ${formattedNextAllowedTime}（約需等待 ${remainingTimeString}）。`;
  } else {
    message = `您在 ${EXAM_TIME_WINDOW_HOURS} 小時內尚未進行本測驗，共可進行 ${MAX_EXAM_ATTEMPTS_PER_WINDOW} 次測驗（交卷後鎖定 ${EXAM_TIME_WINDOW_HOURS} 小時）。`;
  }

  return {
    canAttempt,
    attemptsInWindow,
    maxAttempts: MAX_EXAM_ATTEMPTS_PER_WINDOW,
    timeWindowHours: EXAM_TIME_WINDOW_HOURS,
    remainingAttempts,
    recordsInWindow,
    nextAllowedDate,
    formattedNextAllowedTime,
    remainingTimeString,
    message,
  };
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}`;
}
