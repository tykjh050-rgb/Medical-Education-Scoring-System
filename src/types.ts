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
  options: QuestionOption[]; // 選項清單 (問答題可為空)
  correctAnswer: string;  // 正確答案 (選擇題為 "A" 或 "A,C"；問答題為標準文字答案)
  explanation: string;    // 解析說明
  type?: 'single' | 'multiple' | 'essay'; // 題型：單選題、複選題、問答題
  score?: number;         // 單題自訂配分 (選填)
}

export interface ExamConfig {
  title: string;
  totalScore: number;     // 老師自訂總分 (預設 100)
  choiceScore?: number;   // 選擇題總配分
  essayScore?: number;    // 問答題總配分
  shuffleQuestions: boolean; // 是否隨機打亂題目順序
  shuffleOptions: boolean;   // 是否隨機打亂選項順序
}

export interface ExamPaper {
  id: string;
  title: string;
  totalScore: number;
  choiceScore?: number;   // 選擇題總配分 (分開設定)
  essayScore?: number;    // 問答題總配分 (分開設定)
  questions: Question[];
  createdAt: string;
  updatedAt?: string;
  fileName?: string;
}

export interface StudentPerQuestionResult {
  questionId: string;
  originalQuestionNumber: number;
  prompt: string;
  options: QuestionOption[];
  selectedOption: string; // 學生選擇代號 (如 "A" 或 "A,C") 或問答題填寫文字
  correctAnswer: string;  // 正確答案 (選擇題為代號，問答題為標準答案文字)
  isCorrect: boolean;     // 是否完全一致 (選擇題或問答題完全相符)
  earnedScore: number;    // 該題獲得分數
  maxQuestionScore: number; // 該題配分 (選擇題或問答題獨立單題配分)
  explanation: string;    // 解析
  isMultiple?: boolean;   // 是否為複選題
  type?: 'single' | 'multiple' | 'essay'; // 題型
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
  finalScore: number;     // 總得分 (四捨五入至整數)
  configuredTotalScore: number; // 老師自訂總分
  // 選擇題與問答題分開配分與得分統計
  choiceScoreEarned?: number;
  choiceScoreTotal?: number;
  essayScoreEarned?: number;
  essayScoreTotal?: number;
  choiceCount?: number;
  essayCount?: number;
  choiceCorrectCount?: number;
  essayCorrectCount?: number;
  detailedResults: StudentPerQuestionResult[]; // 各題詳細答題對照
}
