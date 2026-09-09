/**
 * 自動配分與成績核算邏輯
 * 
 * 核心公式：
 * 得分 (Final Score) = (正確題數 / 總題數) * 老師自訂總分
 * 單題配分 (Score Per Question) = 老師自訂總分 / 總題數
 */

export interface ScoreCalculationResult {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracyRate: number;        // 正確率百分比 (0 - 100)
  perQuestionScore: number;    // 單題配分 (保留至小數點後兩位)
  rawCalculatedScore: number;  // 未取整之精確分數
  finalScore: number;          // 四捨五入後總分 (若有小數保留一位，若整數則無小數)
  formulaDisplay: string;      // 公式呈現字串 (例如：8 / 10 * 100 = 80)
}

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
    };
  }

  const incorrectCount = Math.max(0, totalQuestions - correctCount);
  const accuracyRate = Number(((correctCount / totalQuestions) * 100).toFixed(1));
  const perQuestionScore = Number((configuredTotalScore / totalQuestions).toFixed(2));
  
  // 核心配分公式：學生總分 = Math.round((答對題數 / 題目總數) * 老師自訂總分)
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
  };
}
