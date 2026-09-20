/**
 * 自動配分與成績核算邏輯
 * 
 * 支援選擇題與問答題配分欄分開配置：
 * - 選擇題配分：自訂選擇題總分，依選擇題題數均分單題配分
 * - 問答題配分：自訂問答題總分，依問答題題數均分單題配分
 * - 考卷總分 = 選擇題總分 + 問答題總分
 * - 學生實得分數 = 選擇題實得分數 + 問答題實得分數（答案得完全一致方可得分）
 */

import { Question } from '../types';
import { isEssayQuestion } from './answerHelper';

export interface ScoreAllocation {
  choiceCount: number;         // 選擇題總題數
  essayCount: number;          // 問答題總題數
  choiceTotalScore: number;    // 選擇題總配分
  essayTotalScore: number;     // 問答題總配分
  perChoiceScore: number;      // 選擇題單題配分
  perEssayScore: number;       // 問答題單題配分
  totalScore: number;          // 考卷總分
}

export interface ScoreCalculationResult {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracyRate: number;        // 正確率百分比 (0 - 100)
  perQuestionScore: number;    // 平均單題配分
  rawCalculatedScore: number;  // 未取整之精確分數
  finalScore: number;          // 四捨五入後總分
  formulaDisplay: string;      // 公式呈現字串
  // 選擇題與問答題分開計分結果
  choiceCount: number;
  choiceCorrectCount: number;
  choiceTotalScore: number;
  choiceEarnedScore: number;
  perChoiceScore: number;
  essayCount: number;
  essayCorrectCount: number;
  essayTotalScore: number;
  essayEarnedScore: number;
  perEssayScore: number;
}

/**
 * 解析並計算選擇題與問答題的分開配分欄設定
 */
export function resolveScoreAllocation(
  questions: Question[],
  totalScore = 100,
  savedChoiceScore?: number,
  savedEssayScore?: number
): ScoreAllocation {
  const choiceQuestions = questions.filter((q) => !isEssayQuestion(q));
  const essayQuestions = questions.filter((q) => isEssayQuestion(q));
  const choiceCount = choiceQuestions.length;
  const essayCount = essayQuestions.length;

  let choiceTotalScore = 0;
  let essayTotalScore = 0;

  if (choiceCount > 0 && essayCount === 0) {
    // 僅有選擇題
    choiceTotalScore = totalScore;
    essayTotalScore = 0;
  } else if (choiceCount === 0 && essayCount > 0) {
    // 僅有問答題
    choiceTotalScore = 0;
    essayTotalScore = totalScore;
  } else if (choiceCount === 0 && essayCount === 0) {
    choiceTotalScore = 0;
    essayTotalScore = 0;
  } else {
    // 兩者皆存在
    if (savedChoiceScore !== undefined && savedEssayScore !== undefined) {
      choiceTotalScore = savedChoiceScore;
      essayTotalScore = savedEssayScore;
    } else {
      // 依題數比例分配預設值
      const ratio = choiceCount / (choiceCount + essayCount);
      choiceTotalScore = Math.round(totalScore * ratio);
      essayTotalScore = Math.max(0, totalScore - choiceTotalScore);
    }
  }

  const perChoiceScore = choiceCount > 0 ? Number((choiceTotalScore / choiceCount).toFixed(2)) : 0;
  const perEssayScore = essayCount > 0 ? Number((essayTotalScore / essayCount).toFixed(2)) : 0;

  return {
    choiceCount,
    essayCount,
    choiceTotalScore,
    essayTotalScore,
    perChoiceScore,
    perEssayScore,
    totalScore: choiceTotalScore + essayTotalScore,
  };
}

/**
 * 依各題作答結果與分開配分設定核算總成績
 */
export function calculateDetailedExamScore(
  items: { isCorrect: boolean; isEssay?: boolean; earnedScore?: number }[],
  allocation: ScoreAllocation
): ScoreCalculationResult {
  let choiceCorrectCount = 0;
  let essayCorrectCount = 0;

  items.forEach((item) => {
    if (item.isEssay) {
      if (item.isCorrect) essayCorrectCount += 1;
    } else {
      if (item.isCorrect) choiceCorrectCount += 1;
    }
  });

  const choiceEarnedScore =
    allocation.choiceCount > 0
      ? Math.round((choiceCorrectCount / allocation.choiceCount) * allocation.choiceTotalScore * 10) / 10
      : 0;

  const essayEarnedScore =
    allocation.essayCount > 0
      ? Math.round((essayCorrectCount / allocation.essayCount) * allocation.essayTotalScore * 10) / 10
      : 0;

  const totalQuestions = allocation.choiceCount + allocation.essayCount;
  const correctCount = choiceCorrectCount + essayCorrectCount;
  const incorrectCount = Math.max(0, totalQuestions - correctCount);
  const accuracyRate = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0;
  
  const rawCalculatedScore = choiceEarnedScore + essayEarnedScore;
  const finalScore = Math.min(allocation.totalScore, Math.round(rawCalculatedScore));
  const perQuestionScore = totalQuestions > 0 ? Number((allocation.totalScore / totalQuestions).toFixed(2)) : 0;

  let formulaDisplay = '';
  if (allocation.choiceCount > 0 && allocation.essayCount > 0) {
    formulaDisplay = `選擇題 (${choiceCorrectCount}/${allocation.choiceCount} 題，得 ${choiceEarnedScore}/${allocation.choiceTotalScore} 分) + 問答題 (${essayCorrectCount}/${allocation.essayCount} 題，得 ${essayEarnedScore}/${allocation.essayTotalScore} 分) = 總得分 ${finalScore} 分`;
  } else if (allocation.essayCount > 0) {
    formulaDisplay = `問答題 (${essayCorrectCount}/${allocation.essayCount} 題，得 ${essayEarnedScore}/${allocation.essayTotalScore} 分) = 總得分 ${finalScore} 分`;
  } else {
    formulaDisplay = `選擇題 (${choiceCorrectCount}/${allocation.choiceCount} 題，得 ${choiceEarnedScore}/${allocation.choiceTotalScore} 分) = 總得分 ${finalScore} 分`;
  }

  return {
    totalQuestions,
    correctCount,
    incorrectCount,
    accuracyRate,
    perQuestionScore,
    rawCalculatedScore,
    finalScore,
    formulaDisplay,
    choiceCount: allocation.choiceCount,
    choiceCorrectCount,
    choiceTotalScore: allocation.choiceTotalScore,
    choiceEarnedScore,
    perChoiceScore: allocation.perChoiceScore,
    essayCount: allocation.essayCount,
    essayCorrectCount,
    essayTotalScore: allocation.essayTotalScore,
    essayEarnedScore,
    perEssayScore: allocation.perEssayScore,
  };
}

/**
 * 傳統純題數核算（保持向後相容）
 */
export function calculateExamScore(
  correctCount: number,
  totalQuestions: number,
  configuredTotalScore: number
): ScoreCalculationResult {
  if (totalQuestions <= 0) {
    return {
      totalQuestions: 0,
      correctCount: 0,
      incorrectCount: 0,
      accuracyRate: 0,
      perQuestionScore: 0,
      rawCalculatedScore: 0,
      finalScore: 0,
      formulaDisplay: '0 / 0 * 0 = 0',
      choiceCount: 0,
      choiceCorrectCount: 0,
      choiceTotalScore: 0,
      choiceEarnedScore: 0,
      perChoiceScore: 0,
      essayCount: 0,
      essayCorrectCount: 0,
      essayTotalScore: 0,
      essayEarnedScore: 0,
      perEssayScore: 0,
    };
  }

  const incorrectCount = Math.max(0, totalQuestions - correctCount);
  const accuracyRate = Number(((correctCount / totalQuestions) * 100).toFixed(1));
  const perQuestionScore = Number((configuredTotalScore / totalQuestions).toFixed(2));
  
  const rawCalculatedScore = (correctCount / totalQuestions) * configuredTotalScore;
  const finalScore = Math.round((correctCount / totalQuestions) * configuredTotalScore);
  const formulaDisplay = `Math.round((${correctCount} / ${totalQuestions}) × ${configuredTotalScore}) = ${finalScore}`;

  return {
    totalQuestions,
    correctCount,
    incorrectCount,
    accuracyRate,
    perQuestionScore,
    rawCalculatedScore,
    finalScore,
    formulaDisplay,
    choiceCount: totalQuestions,
    choiceCorrectCount: correctCount,
    choiceTotalScore: configuredTotalScore,
    choiceEarnedScore: finalScore,
    perChoiceScore: perQuestionScore,
    essayCount: 0,
    essayCorrectCount: 0,
    essayTotalScore: 0,
    essayEarnedScore: 0,
    perEssayScore: 0,
  };
}

