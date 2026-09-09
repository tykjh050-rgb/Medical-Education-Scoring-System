import React, { useState } from 'react';
import {
  Layers,
  Database,
  FileCode,
  Shuffle,
  Calculator,
  CheckCircle,
  Copy,
  Check,
  Server,
  Cpu,
  ShieldAlert,
  Clock,
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const jsonQuestionSchema = `[
  {
    "id": "q-101",
    "questionNumber": 1,
    "prompt": "下列關於植物光合作用的敘述，何者正確？",
    "options": [
      { "key": "A", "text": "光反應在粒線體進行" },
      { "key": "B", "text": "光反應產生氧氣與 ATP/NADPH" },
      { "key": "C", "text": "暗反應僅能在夜間進行" },
      { "key": "D", "text": "水在暗反應階段被裂解" }
    ],
    "correctAnswer": "B",
    "explanation": "光反應於葉綠體類囊體膜進行，裂解水分子釋放氧氣並產生高能化合物 ATP 與 NADPH。"
  }
]`;

  const jsonStudentResultSchema = `{
  "id": "rec-20260908-001",
  "studentName": "陳冠宇",
  "studentId": "S112001",
  "examTitle": "第一次定期評量 - 自然學科測驗",
  "submittedAt": "2026-09-08 14:20:15",
  "durationSeconds": 340,
  "totalQuestions": 25,
  "correctCount": 21,
  "configuredTotalScore": 100,
  "finalScore": 84,
  "accuracyRate": 84.0,
  "detailedResults": [
    {
      "questionId": "q-101",
      "originalQuestionNumber": 1,
      "prompt": "下列關於植物光合作用的敘述，何者正確？",
      "selectedOption": "B",
      "correctAnswer": "B",
      "isCorrect": true,
      "earnedScore": 4,
      "maxQuestionScore": 4,
      "explanation": "光反應於葉綠體類囊體膜進行..."
    }
  ]
}`;

  const sqlSchema = `-- ========================================================
-- 線上自動化出題與評改系統 - 關聯式資料庫 Schema (PostgreSQL / MySQL)
-- ========================================================

-- 1. 試卷設定與題庫主表 (Exams)
CREATE TABLE exams (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    configured_total_score NUMERIC(6, 2) NOT NULL DEFAULT 100.00, -- 老師自訂總分
    shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 試題資料表 (Questions)
CREATE TABLE questions (
    id VARCHAR(36) PRIMARY KEY,
    exam_id VARCHAR(36) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_number INT NOT NULL,                        -- 原始題號
    prompt TEXT NOT NULL,                                -- 題目內文
    options JSONB NOT NULL,                              -- 選項陣列 [{"key":"A","text":"..."}, ...]
    correct_answer VARCHAR(10) NOT NULL,                 -- 正確答案 (如 "B")
    explanation TEXT,                                    -- 解析說明
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 學生測驗成績主表 (Exam Submissions)
CREATE TABLE exam_submissions (
    id VARCHAR(36) PRIMARY KEY,
    exam_id VARCHAR(36) NOT NULL REFERENCES exams(id),
    student_name VARCHAR(100) NOT NULL,                  -- 學生姓名
    student_id VARCHAR(50) NOT NULL,                    -- 學生學號
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 考試時間
    duration_seconds INT NOT NULL,                       -- 作答時間 (秒)
    total_questions INT NOT NULL,                        -- 總題數
    correct_count INT NOT NULL,                          -- 答對題數
    configured_total_score NUMERIC(6, 2) NOT NULL,       -- 老師自訂總分
    final_score NUMERIC(6, 2) NOT NULL                   -- 動態計算總得分
);

-- 4. 學生每題答題明細記錄 (Submission Details)
CREATE TABLE submission_answers (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
    question_id VARCHAR(36) NOT NULL REFERENCES questions(id),
    selected_option VARCHAR(10) NOT NULL,                -- 學生選擇選項
    correct_answer VARCHAR(10) NOT NULL,                 -- 標準正確答案
    is_correct BOOLEAN NOT NULL,                         -- 是否正確
    earned_score NUMERIC(5, 2) NOT NULL                  -- 該題得分
);

-- 索引優化：支援依學號、姓名、提交時間快速檢索
CREATE INDEX idx_submissions_student_id ON exam_submissions(student_id);
CREATE INDEX idx_submissions_student_name ON exam_submissions(student_name);
CREATE INDEX idx_submissions_submitted_at ON exam_submissions(submitted_at);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);`;

  const shuffleCode = `/**
 * Fisher-Yates (Knuth) 洗牌演算法實作
 * 時間複雜度：O(n) | 空間複雜度：O(n)
 * 保證所有排列組合具均等出現機率 (1 / n!)
 */
function fisherYatesShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          系統規劃藍圖與規格白皮書
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          線上自動化出題與評改系統 — 技術架構與 Schema 設計
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          針對學校教學與評量需求，本系統提供完整的輕量單頁（SPA）、全端標準（React + Node.js）及雲端資料庫設計規劃，滿足試題解析、隨機洗牌、自動動態配分與成績匯出等核心功能。
        </p>
      </div>

      {/* 1. 技術架構方案比較推薦 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">
            一、前後端技術架構選型與建議分析
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Option A */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2 relative">
            <div className="inline-block px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px]">
              推薦首選 ★★★
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              React + TypeScript + Tailwind (SPA 或 全端)
            </h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>優勢：</strong>目前本系統採用的架構。元件化設計清晰（題目卡、導航盤、計時器），反應靈敏無延遲；透過 XLSX 函式庫可直接在瀏覽器端極速處理 Excel / CSV / JSON 解析，無須依賴伺服器轉檔。
            </p>
            <p className="text-slate-500 text-[11px]">
              <strong>適用場景：</strong>校園課堂隨堂測驗、電腦教室即時測驗、輕量級考照練習。
            </p>
          </div>

          {/* Option B */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="inline-block px-2 py-0.5 rounded bg-slate-800 text-white font-bold text-[10px]">
              全校級架構 ★★
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              React / Vue + Node.js (Express) + PostgreSQL
            </h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>優勢：</strong>適合全校性大型會考。後端負責安全試卷存放與防作弊防看答案機制（前端僅拿無答案的題目，交卷時後端評分）；PostgreSQL 提供 ACID 安全儲存與歷史查詢。
            </p>
            <p className="text-slate-500 text-[11px]">
              <strong>適用場景：</strong>全學年定期段考、多班級大會考、校務資料庫對接。
            </p>
          </div>

          {/* Option C */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="inline-block px-2 py-0.5 rounded bg-slate-600 text-white font-bold text-[10px]">
              極簡離線版 ★
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              單一 HTML + JS + SheetJS 檔案
            </h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>優勢：</strong>零伺服器環境要求。老師只要將單一 HTML 檔案發給學生（或放在 USB / Google Drive），學生用任何瀏覽器點開即可測驗，成績直接以 CSV 檔案下載寄回給老師。
            </p>
            <p className="text-slate-500 text-[11px]">
              <strong>缺點：</strong>若學生具備開發者工具知識，可在原始碼檢視正解。
            </p>
          </div>
        </div>
      </div>

      {/* 2. 核心演算法與配分公式 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calculator className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">
            二、核心邏輯：隨機洗牌演算法與動態配分公式
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Dynamic Score Formula */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-600" />
              動態配分公式 (Dynamic Scoring Formula)
            </h4>
            <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-indigo-800 font-semibold">
              得分 = (正確題數 / 總題數) × 老師自訂總分
            </div>
            <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
              <p>• <strong>單題配分權重：</strong>老師自訂總分 / 總題數</p>
              <p>• <strong>範例情境：</strong>總共有 25 題，老師自訂總分為 100 分。學生答對 21 題，得分 = (21 / 25) × 100 = 84 分。</p>
              <p>• <strong>非整除處理：</strong>支援保留至小數點後 1 位或整數四捨五入。</p>
            </div>
          </div>

          {/* Fisher-Yates Shuffle */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Shuffle className="w-4 h-4 text-indigo-600" />
              Fisher-Yates 隨機不重複排序列印演算法
            </h4>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto">
              {shuffleCode}
            </pre>
            <p className="text-xs text-slate-600 leading-relaxed">
              時間複雜度嚴格為 O(n)，無偏差，保證所有附件試題不重複、不遺漏，且每一題在任何位置出現機率均等。
            </p>
          </div>
        </div>

        {/* 12-Hour 2-Attempt Rate Limiting Rule */}
        <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl space-y-2 text-xs text-slate-700">
          <div className="font-bold text-indigo-950 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-700" />
            <span>重複測驗次數防護規範：同 1 位學生同 1 份測驗題目 12 小時內最多重複測驗 2 次</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1">
              <strong className="text-indigo-900 block font-semibold">1. 身分與考卷雙維度鎖定</strong>
              <p className="text-slate-600 text-[11px]">
                以學生唯一「學號 (Student ID)」與「測驗題目 (Exam Title)」為聯合鍵進行滑動時間窗口檢核。
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1">
              <strong className="text-indigo-900 block font-semibold">2. 12 小時滑動時間窗口</strong>
              <p className="text-slate-600 text-[11px]">
                自第一次測驗交卷起算 12 小時窗口，滿 2 次後自動鎖定，直到最早一次紀錄滿 12 小時方自動解除 1 次額度。
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1">
              <strong className="text-indigo-900 block font-semibold">3. 雙端即時防護與解禁預報</strong>
              <p className="text-slate-600 text-[11px]">
                在應試入口卡與考完結果頁均提供即時狀態徽章、剩餘次數提示、鎖定狀態與精確解禁時間倒數。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. JSON 格式規範 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCode className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">
            三、試題與學生作答紀錄標準 JSON 結構
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Question JSON Schema */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                1. 試題資料結構 (Question JSON)
              </span>
              <button
                onClick={() => copyToClipboard(jsonQuestionSchema, 'q-json')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {copiedKey === 'q-json' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                複製 JSON
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-indigo-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72">
              {jsonQuestionSchema}
            </pre>
          </div>

          {/* Student Result JSON Schema */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                2. 學生答題與成績紀錄 (Student Exam Record JSON)
              </span>
              <button
                onClick={() => copyToClipboard(jsonStudentResultSchema, 'res-json')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {copiedKey === 'res-json' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                複製 JSON
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72">
              {jsonStudentResultSchema}
            </pre>
          </div>
        </div>
      </div>

      {/* 4. SQL 關聯資料庫 Schema */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              四、關聯式資料庫 Schema (PostgreSQL / MySQL DDL 完整定義)
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(sqlSchema, 'sql')}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
          >
            {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            複製 SQL 腳本
          </button>
        </div>

        <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed">
          {sqlSchema}
        </pre>
      </div>
    </div>
  );
};
