import * as XLSX from 'xlsx';
import { Question, QuestionOption } from '../types';

export interface ParseResult {
  success: boolean;
  questions: Question[];
  error?: string;
  count: number;
}

/**
 * 解析試題檔案 (支援 .xlsx, .xls, .csv, .json)
 */
export async function parseQuestionFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    if (extension === 'json') {
      const text = await file.text();
      return parseJsonContent(text);
    } else if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
      const buffer = await file.arrayBuffer();
      return parseSpreadsheetBuffer(buffer);
    } else {
      // 嘗試判斷文字或表格
      try {
        const text = await file.text();
        const jsonRes = parseJsonContent(text);
        if (jsonRes.success) return jsonRes;
      } catch {
        // continue
      }
      return {
        success: false,
        questions: [],
        count: 0,
        error: '不支援的檔案格式，請上傳 Excel (.xlsx / .xls)、CSV (.csv) 或 JSON (.json) 檔案。',
      };
    }
  } catch (err) {
    return {
      success: false,
      questions: [],
      count: 0,
      error: `檔案解析失敗：${(err as Error).message}`,
    };
  }
}

/**
 * 解析 JSON 格式試題
 */
export function parseJsonContent(jsonString: string): ParseResult {
  try {
    const data = JSON.parse(jsonString);
    const rawList = Array.isArray(data) ? data : data.questions || [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return {
        success: false,
        questions: [],
        count: 0,
        error: 'JSON 檔案中找不到有效的題目陣列（請確認為陣列格式或包含 "questions" 屬性）。',
      };
    }

    const parsedQuestions: Question[] = rawList.map((item: any, index: number) => {
      // 支援 options 為物件或陣列
      let options: QuestionOption[] = [];
      if (Array.isArray(item.options)) {
        options = item.options.map((opt: any, optIdx: number) => {
          if (typeof opt === 'string') {
            const letter = String.fromCharCode(65 + optIdx);
            return { key: letter, text: opt };
          }
          return { key: String(opt.key || String.fromCharCode(65 + optIdx)).toUpperCase(), text: String(opt.text || opt.value || '') };
        });
      } else if (item.options && typeof item.options === 'object') {
        options = Object.entries(item.options).map(([k, v]) => ({
          key: k.toUpperCase(),
          text: String(v),
        }));
      } else {
        // 檢查是否有 option_a, option_b 或 optionA, optionB 等
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        letters.forEach((l) => {
          const val =
            item[`option_${l.toLowerCase()}`] ||
            item[`option_${l}`] ||
            item[`option${l}`] ||
            item[`選項${l}`] ||
            item[`選項_${l}`];
          if (val) {
            options.push({ key: l, text: String(val) });
          }
        });
      }

      const rawType = String(
        item.type || item.question_type || item.題型 || item.類型 || ''
      ).trim().toLowerCase();
      const isEssay =
        rawType.includes('essay') ||
        rawType.includes('問答') ||
        rawType.includes('簡答') ||
        rawType.includes('qa') ||
        rawType.includes('text') ||
        (options.length === 0 && Boolean(item.correct_answer || item.correctAnswer || item.answer || item.正確答案));

      const prompt =
        item.question_text ||
        item.prompt ||
        item.question ||
        item.題目 ||
        item.title ||
        `第 ${index + 1} 題`;

      const rawAns =
        item.correct_answer ||
        item.correctAnswer ||
        item.answer ||
        item.正確答案 ||
        (isEssay ? '' : 'A');

      // 問答題保留原字串（去除首尾空白），選擇題轉大寫
      const correctAnswer = isEssay
        ? String(rawAns).trim()
        : String(rawAns).trim().toUpperCase();

      const explanation =
        item.explanation ||
        item.analysis ||
        item.解析 ||
        item.說明 ||
        '暫無解析';

      let finalType: 'single' | 'multiple' | 'essay' = 'single';
      if (isEssay) {
        finalType = 'essay';
      } else if (rawType.includes('multi') || rawType.includes('複選') || rawType.includes('多選') || correctAnswer.includes(',')) {
        finalType = 'multiple';
      }

      return {
        id: item.id ? String(item.id) : `imported-${Date.now()}-${index + 1}`,
        questionNumber: typeof item.questionNumber === 'number' ? item.questionNumber : (item.question_number || index + 1),
        prompt: String(prompt),
        options: isEssay ? [] : options,
        correctAnswer,
        explanation: String(explanation),
        type: finalType,
      };
    });

    return {
      success: true,
      questions: parsedQuestions,
      count: parsedQuestions.length,
    };
  } catch (err) {
    return {
      success: false,
      questions: [],
      count: 0,
      error: `JSON 格式錯誤：${(err as Error).message}`,
    };
  }
}

/**
 * 解析 Excel / CSV 表格資料
 * 支援欄位：
 * 1. 題目：question_text, prompt, question, 題目, 題幹
 * 2. 選項：
 *    - 單一欄位 options (JSON 或以換行/分號/豎線分隔的 A. B. C. D.)
 *    - 獨立欄位 option_a, option_b, option_c, option_d (或 optionA, optionB, 選項A, 選項B 等)
 * 3. 正確答案：correct_answer, correctAnswer, answer, 正確答案, 答案
 * 4. 解析：explanation, analysis, 解析, 說明, 詳解
 */
export function parseSpreadsheetBuffer(buffer: ArrayBuffer): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 轉為物件陣列
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (rawRows.length === 0) {
      return {
        success: false,
        questions: [],
        count: 0,
        error: '表格中無任何資料行，請確認試題表格非空。',
      };
    }

    const questions: Question[] = [];

    rawRows.forEach((row, index) => {
      // 1. 題目欄位 (優先匹配 question_text)
      const prompt = findValue(row, [
        'question_text',
        'questiontext',
        'question_prompt',
        'prompt',
        'question',
        '題目',
        '題目內容',
        '題幹',
      ]);
      if (!prompt || String(prompt).trim() === '') return; // 略過無題目的空行

      const rawNumber = findValue(row, ['題號', 'questionNumber', 'question_number', 'id', '序號', '編號']);
      const questionNumber = Number(rawNumber) || (index + 1);

      // 2. 選項欄位解析 (支援 options 單一欄位 或 option_a ~ option_d 獨立欄位)
      let options: QuestionOption[] = [];
      const singleOptionsVal = findValue(row, ['options', '選項清單', '選項群組', 'choices']);

      if (singleOptionsVal) {
        options = parseSingleOptionsField(singleOptionsVal);
      }

      // 檢測題型欄位 (支援 type, question_type, 題型, 類型)
      const rawType = String(
        findValue(row, ['type', 'question_type', 'questiontype', '題型', '類型', '題型分類']) || ''
      ).trim().toLowerCase();

      const isExplicitEssay =
        rawType.includes('essay') ||
        rawType.includes('問答') ||
        rawType.includes('簡答') ||
        rawType.includes('qa') ||
        rawType.includes('text') ||
        String(prompt).includes('【問答題】') ||
        String(prompt).includes('【簡答題】');

      // 若 options 單一欄位未解析出選項，嘗試獨立欄位 (option_a, option_b, etc.)
      if (options.length === 0 && !isExplicitEssay) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        letters.forEach((l) => {
          const optVal = findValue(row, [
            `option_${l.toLowerCase()}`,
            `option_${l}`,
            `option${l}`,
            `option ${l}`,
            `選項${l}`,
            `選項_${l}`,
            `選項 ${l}`,
            l,
          ]);
          if (optVal !== undefined && String(optVal).trim() !== '') {
            options.push({ key: l, text: String(optVal).trim() });
          }
        });
      }

      // 判斷是否為問答題
      const isEssay = isExplicitEssay || options.length === 0;

      // 3. 正確答案欄位 (優先匹配 correct_answer)
      const rawAns = findValue(row, [
        'correct_answer',
        'correctanswer',
        'correct_option',
        'correctAnswer',
        '正確答案',
        '答案',
        'answer',
        '正解',
      ]) || (isEssay ? '' : 'A');

      // 問答題保留原字串（去除首尾空白），選擇題轉大寫
      const correctAnswer = isEssay
        ? String(rawAns).trim()
        : String(rawAns).trim().toUpperCase();

      // 如果是選擇題且完全無選項，給予預設佔位
      if (!isEssay && options.length === 0) {
        options = [
          { key: 'A', text: '選項 A' },
          { key: 'B', text: '選項 B' },
          { key: 'C', text: '選項 C' },
          { key: 'D', text: '選項 D' },
        ];
      }

      // 4. 解析說明欄位
      const rawExp = findValue(row, [
        'explanation',
        'explain',
        'analysis',
        '解析',
        '說明',
        '詳解',
      ]) || '無解析說明';
      const explanation = String(rawExp).trim();

      let finalType: 'single' | 'multiple' | 'essay' = 'single';
      if (isEssay) {
        finalType = 'essay';
      } else if (rawType.includes('multi') || rawType.includes('複選') || rawType.includes('多選') || correctAnswer.includes(',')) {
        finalType = 'multiple';
      }

      questions.push({
        id: `q-${Date.now()}-${index + 1}`,
        questionNumber,
        prompt: String(prompt).trim(),
        options: isEssay ? [] : options,
        correctAnswer,
        explanation,
        type: finalType,
      });
    });

    if (questions.length === 0) {
      return {
        success: false,
        questions: [],
        count: 0,
        error: '未能識別試題欄位，請確認表格含有「question_text」(或「題目」)、「options」(或「option_a」~「option_d」)、「correct_answer」(或「正確答案」)等欄位。',
      };
    }

    return {
      success: true,
      questions,
      count: questions.length,
    };
  } catch (err) {
    return {
      success: false,
      questions: [],
      count: 0,
      error: `試題表格解析失敗：${(err as Error).message}`,
    };
  }
}

/**
 * 解析單一欄位 options（支援 JSON、換行或標點分隔的多選項）
 */
function parseSingleOptionsField(raw: any): QuestionOption[] {
  if (Array.isArray(raw)) {
    return raw.map((item, idx) => ({
      key: String.fromCharCode(65 + idx),
      text: typeof item === 'object' ? item.text || item.value || JSON.stringify(item) : String(item),
    }));
  }

  const str = String(raw).trim();
  if (!str) return [];

  // 嘗試以 JSON 解析
  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          if (typeof item === 'object' && item !== null) {
            const key = item.key || String.fromCharCode(65 + idx);
            const text = item.text || item.value || '';
            return { key: String(key).toUpperCase(), text: String(text) };
          }
          return { key: String.fromCharCode(65 + idx), text: String(item) };
        });
      } else if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed).map(([k, v]) => ({
          key: k.toUpperCase(),
          text: String(v),
        }));
      }
    } catch {
      // 不是合法的 JSON，繼續走字串格式解析
    }
  }

  // 支援格式：以換行、分號或 | 分隔，並嘗試匹配 A. 或 A: 或 (A) 開頭
  const parts = str.split(/[\n\r;|\t]+/).map((s) => s.trim()).filter(Boolean);
  const options: QuestionOption[] = [];

  parts.forEach((part, idx) => {
    // 匹配例如 "A. 選項內容"、"A: 選項內容"、"(A) 選項內容"、"A、選項內容"
    const match = part.match(/^[\(\[\{]?([A-Fa-f0-9])[\)\]\}]?[\.\:、\s\-]+(.+)$/);
    if (match) {
      options.push({
        key: match[1].toUpperCase(),
        text: match[2].trim(),
      });
    } else {
      options.push({
        key: String.fromCharCode(65 + idx),
        text: part,
      });
    }
  });

  return options;
}

function findValue(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);
  for (const pKey of possibleKeys) {
    // 嚴格比對或不區分大小寫比對
    const matchedKey = rowKeys.find(
      (k) => k.trim().toLowerCase() === pKey.trim().toLowerCase()
    );
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
      return row[matchedKey];
    }
  }
  return undefined;
}

/**
 * 下載試題 Excel / CSV / JSON 範本
 * 提供符合規範的欄位：question_text, option_a, option_b, option_c, option_d, correct_answer, explanation
 */
export function downloadQuestionTemplate(format: 'xlsx' | 'csv' | 'json') {
  const standardFieldsData = [
    {
      question_number: 1,
      question_text: '下列關於地球水循環的敘述，何者正確？',
      option_a: '植物的蒸散作用不是水循環的一部分',
      option_b: '水蒸氣遇冷凝結成水滴是降水的前提',
      option_c: '海洋是地球上唯一的蒸發來源',
      option_d: '地下水不會參與水循環',
      correct_answer: 'B',
      explanation: '大氣中的水蒸氣遇冷凝結為雲滴，聚合增大後形成降水。植物蒸散作用也是陸地水循環重要一環。',
    },
    {
      question_number: 2,
      question_text: '計算機科學中，何種資料結構符合「後進先出（LIFO）」原則？',
      option_a: '佇列 (Queue)',
      option_b: '堆疊 (Stack)',
      option_c: '鏈結串列 (Linked List)',
      option_d: '二元樹 (Binary Tree)',
      correct_answer: 'B',
      explanation: '堆疊 (Stack) 遵循 Last-In, First-Out (LIFO) 原則；佇列 (Queue) 則為 First-In, First-Out (FIFO)。',
    },
    {
      question_number: 3,
      question_text: '若一份測驗有 20 題，老師自訂滿分為 100 分，學生答對 17 題的得分為何？',
      option_a: '80 分',
      option_b: '85 分',
      option_c: '88 分',
      option_d: '90 分',
      correct_answer: 'B',
      explanation: '依配分公式：Math.round((17 / 20) * 100) = 85 分。',
    },
    {
      question_number: 4,
      question_type: '複選題',
      question_text: '【複選題】下列哪些屬於常見的主流關聯式資料庫管理系統（RDBMS）？',
      option_a: 'PostgreSQL',
      option_b: 'MongoDB',
      option_c: 'MySQL',
      option_d: 'Redis',
      correct_answer: 'A,C',
      explanation: 'PostgreSQL 與 MySQL 屬於標準 SQL 關聯式資料庫；MongoDB 屬於文件型 NoSQL，Redis 為快取/鍵值資料庫。',
    },
    {
      question_number: 5,
      question_type: '問答題',
      question_text: '【問答題】請寫出在計算機網路中負責解析主機域名對應 IP 位址之協定名稱英文簡稱（3 個英文字母大寫）。',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'DNS',
      explanation: 'Domain Name System（網域名稱系統，簡稱 DNS）。問答題評改規則：答案得完全一致。',
    },
    {
      question_number: 6,
      question_type: '問答題',
      question_text: '【問答題】綠色植物進行光合作用吸收光能之最主要天然色素名稱為何？',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: '葉綠素',
      explanation: '葉綠素為植物進行光合作用吸收藍紫與紅光之最主要色素分子。問答題評改規則：答案得完全一致。',
    },
  ];

  if (format === 'json') {
    const jsonFormatted = standardFieldsData.map((d) => ({
      question_number: d.question_number,
      type: d.question_type === '問答題' ? 'essay' : d.question_type === '複選題' ? 'multiple' : 'single',
      question_text: d.question_text,
      options: d.question_type === '問答題' ? [] : [
        { key: 'A', text: d.option_a },
        { key: 'B', text: d.option_b },
        { key: 'C', text: d.option_c },
        { key: 'D', text: d.option_d },
      ],
      correct_answer: d.correct_answer,
      explanation: d.explanation,
    }));
    const blob = new Blob([JSON.stringify(jsonFormatted, null, 2)], { type: 'application/json' });
    triggerDownload(blob, '試題匯入範本_含問答題_question_template.json');
    return;
  }

  const ws = XLSX.utils.json_to_sheet(standardFieldsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '試題表_標準欄位');

  // 也提供傳統中文欄位的工作表供教師對照
  const chineseFieldsData = standardFieldsData.map((d) => ({
    題號: d.question_number,
    題型: d.question_type,
    題目: d.question_text,
    選項A: d.option_a,
    選項B: d.option_b,
    選項C: d.option_c,
    選項D: d.option_d,
    正確答案: d.correct_answer,
    解析: d.explanation,
  }));
  const wsChinese = XLSX.utils.json_to_sheet(chineseFieldsData);
  XLSX.utils.book_append_sheet(wb, wsChinese, '試題表_中文欄位');

  if (format === 'csv') {
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    // 加入 UTF-8 BOM 避免 Excel 開啟 CSV 中文亂碼
    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, '試題匯入範本_含問答題_question_template.csv');
  } else {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    triggerDownload(blob, '試題匯入範本_含問答題_question_template.xlsx');
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
