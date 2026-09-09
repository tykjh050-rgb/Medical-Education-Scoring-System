/**
 * 線上自動化出題與評改系統 - 核心型別定義
 */

export interface QuestionOption {
  key: string; // e.g. "A", "B", "C", "D"
  text: string;
}

export interface Question {
  id: string;
  questionNumber: number; // 原始題號
  prompt: string;         // 題目內文
  options: QuestionOption[]; // 選項清單
  correctAnswer: string;  // 正確選項代號 (如 "A", "B" 或複選 "A,C")
  explanation: string;    // 解析說明
  type?: 'single' | 'multiple'; // 題型：單選題或複選題
}

export interface ExamConfig {
  title: string;
  totalScore: number;     // 老師自訂總分 (預設 100)
  shuffleQuestions: boolean; // 是否隨機打亂題目順序
  shuffleOptions: boolean;   // 是否隨機打亂選項順序
}

export interface StudentPerQuestionResult {
  questionId: string;
  originalQuestionNumber: number;
  prompt: string;
  options: QuestionOption[];
  selectedOption: string; // 學生選擇代號 (如 "A" 或 "A,C")
  correctAnswer: string;  // 正確答案
  isCorrect: boolean;     // 是否正確
  earnedScore: number;    // 該題獲得分數
  maxQuestionScore: number; // 該題配分 (總分 / 總題數)
  explanation: string;    // 解析
  isMultiple?: boolean;   // 是否為複選題
}

export interface StudentExamRecord {
  id: string;
  studentName: string;    // 學生姓名
  studentId: string;      // 學號
  examTitle: string;      // 測驗名稱
  submittedAt: string;    // 考試提交時間 (YYYY-MM-DD HH:mm:ss)
  durationSeconds: number;// 作答花費秒數
  totalQuestions: number; // 總題數
  correctCount: number;   // 正確題數
  finalScore: number;     // 總得分 (四捨五入至小數一位或整數)
  configuredTotalScore: number; // 老師自訂總分
  detailedResults: StudentPerQuestionResult[]; // 各題詳細答題對照
}
