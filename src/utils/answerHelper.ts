/**
 * 試題答案標準化與題型比對輔助函式
 */

import { Question } from '../types';

/**
 * 判斷是否為複選題
 * 判斷準則：
 * 1. 顯式設定 type === 'multiple'
 * 2. 正確答案包含逗號、頓號或長度大於1個選項英文字母
 * 3. 題目內文包含「複選」或「多選」
 */
export function isMultipleChoiceQuestion(question: Question): boolean {
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
 * 將答案字串或陣列標準化為排序後的字母字串
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
 * 比對學生答案與標準答案是否一致
 */
export function isAnswerCorrect(studentAnswer: string | string[], correctAnswer: string): boolean {
  const normStudent = normalizeAnswerString(studentAnswer);
  const normCorrect = normalizeAnswerString(correctAnswer);
  return normStudent !== '' && normStudent === normCorrect;
}

/**
 * 將正規化後的答案格式化為易讀字串，例如 "AC" -> "A, C"
 */
export function formatAnswerDisplay(answer: string): string {
  const norm = normalizeAnswerString(answer);
  if (!norm) return '未作答';
  return norm.split('').join(', ');
}
