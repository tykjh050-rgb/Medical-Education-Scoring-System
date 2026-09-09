import { Question } from '../types';

export const DEFAULT_SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q-01',
    questionNumber: 1,
    prompt: '下列關於「光合作用」的敘述，何者正確？',
    options: [
      { key: 'A', text: '主要在植物細胞的粒線體中進行' },
      { key: 'B', text: '光反應階段需要光照，主要產物包含氧氣與能量物質 ATP/NADPH' },
      { key: 'C', text: '暗反應（卡爾文循環）只在夜晚無光環境下進行' },
      { key: 'D', text: '水分子在暗反應階段被分解並釋放二氧化碳' },
    ],
    correctAnswer: 'B',
    explanation: '光合作用在葉綠體進行。光反應需要光能，將水分子裂解產生氧氣並合成 ATP 與 NADPH；暗反應（碳反應）日夜皆可進行，利用光反應產生的能量固定二氧化碳。',
  },
  {
    id: 'q-02',
    questionNumber: 2,
    prompt: '在演算法中，關於「Fisher-Yates 洗牌演算法」的時間複雜度與特性，下列敘述何者最適當？',
    options: [
      { key: 'A', text: '時間複雜度為 O(n log n)，且具有排序偏誤' },
      { key: 'B', text: '時間複雜度為 O(n²)，需要依序遞迴兩次' },
      { key: 'C', text: '時間複雜度為 O(n)，能確保所有 n! 種排列皆具相等的隨機機率' },
      { key: 'D', text: '僅能對已排序的數值陣列進行隨機交換' },
    ],
    correctAnswer: 'C',
    explanation: 'Fisher-Yates (Knuth) 洗牌演算法透過自陣列末端向前逐一與隨機選取的未處理索引交換，僅需遍歷一次陣列即完成，時間複雜度為 O(n)，且能保證嚴格均勻無偏誤。',
  },
  {
    id: 'q-03',
    questionNumber: 3,
    prompt: '若有一份測驗總共 25 題，教師自訂總分為 100 分。某位學生答對了 21 題，依據動態配分公式（得分 = 正確題數 / 總題數 * 自訂總分），該學生應得幾分？',
    options: [
      { key: 'A', text: '80 分' },
      { key: 'B', text: '84 分' },
      { key: 'C', text: '88 分' },
      { key: 'D', text: '92 分' },
    ],
    correctAnswer: 'B',
    explanation: '計算方式為：(21 / 25) × 100 = 0.84 × 100 = 84 分。單題配分為 100 / 25 = 4 分，21 × 4 = 84 分。',
  },
  {
    id: 'q-04',
    questionNumber: 4,
    prompt: '下列何者是 JavaScript / TypeScript 中用來處理異步事件與避免回呼地獄（Callback Hell）的現代標準機制？',
    options: [
      { key: 'A', text: 'Promise 與 async/await 語法' },
      { key: 'B', text: 'XMLHttpRequest 同步阻塞' },
      { key: 'C', text: 'goto 跳轉指令' },
      { key: 'D', text: 'setTimeout 無限輪詢迴圈' },
    ],
    correctAnswer: 'A',
    explanation: 'ES6 引入 Promise，ES2017 引入 async/await，提供直觀、扁平且類似同步風格的異步控制流程，有效解決深層巢狀 callback 問題。',
  },
  {
    id: 'q-05',
    questionNumber: 5,
    prompt: '在資料庫正規化（Normalization）理論中，符合「第一正規化（1NF）」的最核心要求為何？',
    options: [
      { key: 'A', text: '消除所有非主鍵屬性對主鍵的傳遞相依性' },
      { key: 'B', text: '資料表中每一個欄位的值必須是不可分割的單一原子值（Atomic Value）' },
      { key: 'C', text: '必須強制建立外部索引鍵與外鍵約束' },
      { key: 'D', text: '資料表內不可包含超過十個關聯欄位' },
    ],
    correctAnswer: 'B',
    explanation: '第一正規化 (1NF) 要求表格的每一列為單一記錄，每一屬性欄位均為原子值（不可再分解的單元），且無重複的屬性群組。',
    type: 'single',
  },
  {
    id: 'q-06',
    questionNumber: 6,
    prompt: '【複選題】下列哪些屬於常見且主流的關聯式資料庫管理系統（RDBMS）？（請選出所有正確選項）',
    options: [
      { key: 'A', text: 'PostgreSQL' },
      { key: 'B', text: 'MongoDB (文件導向資料庫)' },
      { key: 'C', text: 'MySQL' },
      { key: 'D', text: 'Redis (記憶體鍵值資料庫)' },
    ],
    correctAnswer: 'A,C',
    explanation: 'PostgreSQL 與 MySQL 為標準的 SQL 關聯式資料庫管理系統；MongoDB 屬於 NoSQL 文件型資料庫，Redis 屬於 In-Memory Key-Value 快取/資料庫。',
    type: 'multiple',
  },
];
