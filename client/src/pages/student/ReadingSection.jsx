import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useExam } from '../../context/ExamContext';
import QuestionCard from '../../components/QuestionCard';
import HighlightableText from '../../components/HighlightableText';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import Card from '../../components/Card';

const ReadingSection = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const { examData, answers, updateAnswer, highlights, addHighlight, markedQuestions, toggleMarkQuestion } = useExam();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    loadData();
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [testRes, attemptRes] = await Promise.all([
        studentApi.getTest(),
        studentApi.getAttempt(),
      ]);
      setAttempt(attemptRes.data);
      if (attemptRes.data.answers?.reading) {
        Object.entries(attemptRes.data.answers.reading).forEach(([qId, answer]) => {
          updateAnswer('reading', qId, answer);
        });
      }
    } catch (error) {
      showToast('Failed to load test', 'error');
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async () => {
    try {
      await studentApi.saveReadingAnswers(answers.reading);
      await studentApi.saveHighlights(highlights);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    updateAnswer('reading', questionId, value);
    studentApi.saveReadingAnswers({ ...answers.reading, [questionId]: value }).catch(console.error);
  };

  const handleHighlight = (highlight) => {
    addHighlight(highlight);
    studentApi.saveHighlights([...highlights, highlight]).catch(console.error);
  };

  if (loading) return <Loader fullScreen />;

  const questions = examData?.reading?.questions || [];
  const content = examData?.reading?.content || examData?.reading?.passage || '';

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Reading Passage</h3>
            <HighlightableText 
              content={content} 
              highlights={highlights} 
              onHighlight={handleHighlight} 
            />
          </Card>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id || idx}
                question={q.question || q.text}
                questionNumber={idx + 1}
                answer={answers.reading[q.id || idx]}
                onChange={(value) => handleAnswerChange(q.id || idx, value)}
                isMarked={markedQuestions.has(q.id || idx)}
                onMark={() => toggleMarkQuestion(q.id || idx)}
                options={q.options || []}
                type={q.options?.length > 0 ? 'multiple-choice' : 'text'}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Navigation</h3>
            <div className="space-y-2 mb-4">
              {questions.map((q, idx) => (
                <button
                  key={q.id || idx}
                  onClick={() => {
                    setCurrentQuestion(idx);
                    document.getElementById(`question-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    currentQuestion === idx
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : answers.reading[q.id || idx]
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Q{idx + 1} {markedQuestions.has(q.id || idx) && '🚩'}
                </button>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate(`/exam/${key}/reading-answer-sheet`)}
            >
              Go to Answer Sheet
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReadingSection;
