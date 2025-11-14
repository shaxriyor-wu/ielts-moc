import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useExam } from '../../context/ExamContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Timer from '../../components/Timer';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const ReadingAnswerSheet = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const { answers, updateAnswer } = useExam();
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(600);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleAnswerChange = (questionId, value) => {
    updateAnswer('reading', questionId, value.toUpperCase());
    studentApi.saveReadingAnswers({ ...answers.reading, [questionId]: value.toUpperCase() }).catch(console.error);
  };

  const handleTimeout = () => {
    navigate(`/exam/${key}/listening`);
  };

  if (loading) return <Loader fullScreen />;

  const questions = Array.from({ length: 40 }, (_, i) => i + 1);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between mb-6 rounded-lg shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reading Answer Sheet</h1>
        <Timer initialSeconds={timeRemaining} onTimeout={handleTimeout} />
      </div>

      <Card title="Transfer your answers here">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {questions.map((qNum) => (
            <div key={qNum} className="flex items-center gap-2">
              <span className="font-medium w-8 text-gray-900 dark:text-white">{qNum}.</span>
              <input
                type="text"
                value={answers.reading[qNum] || ''}
                onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase dark:bg-gray-800 dark:text-white"
                maxLength="1"
                placeholder="A"
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end mt-6">
        <Button onClick={() => navigate(`/exam/${key}/listening`)}>
          Continue to Listening
        </Button>
      </div>
    </div>
  );
};

export default ReadingAnswerSheet;
