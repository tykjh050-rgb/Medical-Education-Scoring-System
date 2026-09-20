import React, { useState } from 'react';
import { Question, StudentExamRecord, ExamPaper } from '../../types';
import { fisherYatesShuffle } from '../../utils/shuffle';
import { checkExamAttemptLimit } from '../../utils/examLimiter';
import { StudentEntryCard } from './StudentEntryCard';
import { ExamRunner } from './ExamRunner';
import { ExamResultView } from './ExamResultView';

interface StudentExamProps {
  questions: Question[];
  totalScore: number;
  choiceScore?: number;
  essayScore?: number;
  examTitle: string;
  studentRecords: StudentExamRecord[];
  onRecordSubmitted: (record: StudentExamRecord) => void;
  onGoToTeacherDashboard: () => void;
  examPapers?: ExamPaper[];
  activeExamId?: string;
  onSelectExam?: (id: string) => void;
}

export const StudentExam: React.FC<StudentExamProps> = ({
  questions,
  totalScore,
  choiceScore,
  essayScore,
  examTitle,
  studentRecords,
  onRecordSubmitted,
  onGoToTeacherDashboard,
  examPapers,
  activeExamId,
  onSelectExam,
}) => {
  const [phase, setPhase] = useState<'entry' | 'taking' | 'result'>('entry');
  const [studentInfo, setStudentInfo] = useState<{ name: string; id: string }>({ name: '', id: '' });
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [activeResult, setActiveResult] = useState<StudentExamRecord | null>(null);

  const handleStartExam = (name: string, id: string) => {
    // 檢查 12 小時內重複測驗限制
    const limitStatus = checkExamAttemptLimit(studentRecords, id, examTitle);
    if (!limitStatus.canAttempt) {
      return;
    }

    setStudentInfo({ name, id });
    // 執行 Fisher-Yates 洗牌演算法進行「隨機不重複」排序列印
    const shuffled = fisherYatesShuffle(questions);
    setShuffledQuestions(shuffled);
    setPhase('taking');
  };

  const handleFinishExam = (record: StudentExamRecord) => {
    setActiveResult(record);
    onRecordSubmitted(record);
    setPhase('result');
  };

  const handleRetakeExam = () => {
    // 檢查同 1 位學生同 1 份測驗題目在 12 小時內是否已達 1 次上限
    const limitStatus = checkExamAttemptLimit(studentRecords, studentInfo.id, examTitle);
    if (!limitStatus.canAttempt) {
      return;
    }

    // 再次重新隨機洗牌
    const shuffled = fisherYatesShuffle(questions);
    setShuffledQuestions(shuffled);
    setPhase('taking');
  };

  const handleBackToEntry = () => {
    setPhase('entry');
    setActiveResult(null);
  };

  return (
    <div>
      {phase === 'entry' && (
        <StudentEntryCard
          examTitle={examTitle}
          questions={questions}
          totalScore={totalScore}
          choiceScore={choiceScore}
          essayScore={essayScore}
          records={studentRecords}
          onStartExam={handleStartExam}
          onOpenTeacherDashboard={onGoToTeacherDashboard}
          examPapers={examPapers}
          activeExamId={activeExamId}
          onSelectExam={onSelectExam}
        />
      )}

      {phase === 'taking' && (
        <ExamRunner
          studentName={studentInfo.name}
          studentId={studentInfo.id}
          examTitle={examTitle}
          totalScore={totalScore}
          choiceScore={choiceScore}
          essayScore={essayScore}
          shuffledQuestions={shuffledQuestions}
          onFinishExam={handleFinishExam}
          onExit={handleBackToEntry}
        />
      )}

      {phase === 'result' && activeResult && (
        <ExamResultView
          record={activeResult}
          records={studentRecords}
          onRetakeExam={handleRetakeExam}
          onGoToTeacherDashboard={onGoToTeacherDashboard}
        />
      )}
    </div>
  );
};
