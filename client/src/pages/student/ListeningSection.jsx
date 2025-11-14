import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useExam } from '../../context/ExamContext';
import QuestionCard from '../../components/QuestionCard';
import AudioPlayer from '../../components/AudioPlayer';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import Card from '../../components/Card';

const ListeningSection = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const { examData, answers, updateAnswer, markedQuestions, toggleMarkQuestion } = useExam();
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleAnswerChange = (questionId, value) => {
    updateAnswer('listening', questionId, value);
    studentApi.saveListeningAnswers({ ...answers.listening, [questionId]: value }).catch(console.error);
  };

  if (loading) return <Loader fullScreen />;

  const questions = examData?.listening?.questions || [];
  const audioUrl = examData?.listening?.audioUrl || examData?.listening?.audio;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {audioUrl && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Listening Audio</h3>
              <AudioPlayer src={audioUrl} noRewind={true} />
            </Card>
          )}
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id || idx}
                question={q.question || q.text}
                questionNumber={idx + 1}
                answer={answers.listening[q.id || idx]}
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
                      : answers.listening[q.id || idx]
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Q{idx + 1} {markedQuestions.has(q.id || idx) && '🚩'}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => navigate(`/exam/${key}/reading`)}>
                Previous: Reading
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/exam/${key}/listening-answer-sheet`)}>
                Go to Answer Sheet
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ListeningSection;
