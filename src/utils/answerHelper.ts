/**
 * 試題答案標準化與題型比對輔助函式
 */

import { Question } from '../types';

/**
 * 判斷是否為問答題
 * 判斷準則：
 * 1. 顯式設定 type === 'essay'
 * 2. 沒有選項清單或 options 長度為 0
 * 3. 題目包含【問答題】或【簡答題】且無選項
 */
export function isEssayQuestion(question: Question): boolean {
  if (question.type === 'essay') return true;
  if (!question.options || question.options.length === 0) return true;
  return false;
}

/**
 * 判斷是否為複選題
 * 判斷準則：
 * 1. 非問答題
 * 2. 顯式設定 type === 'multiple'
 * 3. 正確答案包含逗號、頓號或長度大於1個選項英文字母
 * 4. 題目內文包含「複選」或「多選」
 */
export function isMultipleChoiceQuestion(question: Question): boolean {
  if (isEssayQuestion(question)) return false;
  if (question.type === 'multiple') return true;
  if (question.type === 'single') return false;

  const normalized = (question.correctAnswer || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (normalized.length > 1) return true;

  if (question.prompt.includes('複選') || question.prompt.includes('多選')) {
    return true;
  }

  return false;
}

/**
 * 將選擇題答案字串或陣列標準化為排序後的字母字串
 * 例如："A, C" -> "AC", "B" -> "B", ["C", "A"] -> "AC"
 */
export function normalizeAnswerString(answer: string | string[]): string {
  if (!answer) return '';
  const raw = Array.isArray(answer) ? answer.join('') : answer;
  return raw
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .filter((char, index, self) => self.indexOf(char) === index) // 去除重複
    .sort()
    .join('');
}

/**
 * 問答題自動評改規則：答案得完全一致
 * 嚴格比對學生作答文字與標準答案（去除首尾多餘空格）
 */
export function isEssayAnswerCorrect(studentAnswer?: string, correctAnswer?: string): boolean {
  const student = (studentAnswer ?? '').trim();
  const correct = (correctAnswer ?? '').trim();
  return student !== '' && student === correct;
}

/**
 * 比對學生答案與標準答案是否正確
 * - 選擇題：比對選項代號字母集合是否一致
 * - 問答題：答案得完全一致 (Strict exact match)
 */
export function isAnswerCorrect(
  studentAnswer: string | string[],
  correctAnswer: string,
  questionType?: 'single' | 'multiple' | 'essay'
): boolean {
  // 問答題直接使用完全一致比對
  if (questionType === 'essay') {
    const rawStudent = Array.isArray(studentAnswer) ? studentAnswer.join('') : studentAnswer;
    return isEssayAnswerCorrect(rawStudent, correctAnswer);
  }

  // 若標準答案含有中文或非選項英文字母（例如為問答題標準答案），進行完全一致核算
  const normCorrect = normalizeAnswerString(correctAnswer);
  if (normCorrect === '') {
    const rawStudent = Array.isArray(studentAnswer) ? studentAnswer.join('') : studentAnswer;
    return isEssayAnswerCorrect(rawStudent, correctAnswer);
  }

  const normStudent = normalizeAnswerString(studentAnswer);
  return normStudent !== '' && normStudent === normCorrect;
}

/**
 * 將答案格式化為易讀字串
 * - 選擇題："AC" -> "A, C"
 * - 問答題：原文字呈現
 */
export function formatAnswerDisplay(answer: string, isEssay = false): string {
  if (!answer || answer.trim() === '') return '未作答';
  if (isEssay) {
    return answer.trim();
  }
  const norm = normalizeAnswerString(answer);
  if (!norm) return answer.trim() || '未作答';
  return norm.split('').join(', ');
}
