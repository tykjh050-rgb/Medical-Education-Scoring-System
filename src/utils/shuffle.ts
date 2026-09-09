/**
 * Fisher-Yates (Knuth) 洗牌演算法
 * 
 * 原理：
 * 從陣列最後一個元素開始向前巡訪，每一次隨機選出一個介於 0 到當前索引 i 之間的索引 j，
 * 並將兩者位置上的元素互換。
 * 
 * 數學特性：
 * 1. 時間複雜度：O(n) 線性時間，效率最高。
 * 2. 空間複雜度：O(1) 原地置換，或 O(n) 複本置換（不汙染原始陣列）。
 * 3. 隨機公平性：保證 n! 種排列組合皆有完全均等的機率（1 / n!），達成真正「不重複且無偏誤」的均勻隨機分佈。
 */

export function fisherYatesShuffle<T>(array: readonly T[]): T[] {
  // 建立陣列複本，確保 Pure Function 不產生副作用
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    // 隨機選取 0 到 i 之間（含兩端）的整數索引
    const j = Math.floor(Math.random() * (i + 1));
    
    // 交換位置 i 與 j 的元素
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
