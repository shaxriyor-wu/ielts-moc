import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useExam } from '../../context/ExamContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const AnswerSheet = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const { examData, answers } = useExam();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit? You cannot return after submission.')) {
      return;
    }

    try {
      await studentApi.submitTest();
      showToast('Test submitted successfully', 'success');
      navigate(`/exam/${key}/finish`);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to submit test', 'error');
    }
  };

  if (loading) return <Loader fullScreen />;

  const readingAnswers = answers.reading || {};
  const listeningAnswers = answers.listening || {};
  const writingContent = answers.writing?.content || '';

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Answer Sheet</h2>

      <div className="space-y-6 mb-6">
        <Card title="Reading Answers">
          <div className="space-y-2">
            {Object.entries(readingAnswers).map(([qId, answer]) => (
              <div key={qId} className="flex items-center gap-4 p-2 border rounded dark:border-gray-700">
                <span className="font-medium text-gray-900 dark:text-white">Q{qId}:</span>
                <span className="text-gray-700 dark:text-gray-300">{answer || 'Not answered'}</span>
              </div>
            ))}
            {Object.keys(readingAnswers).length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">No answers yet</p>
            )}
          </div>
        </Card>

        <Card title="Listening Answers">
          <div className="space-y-2">
            {Object.entries(listeningAnswers).map(([qId, answer]) => (
              <div key={qId} className="flex items-center gap-4 p-2 border rounded dark:border-gray-700">
                <span className="font-medium text-gray-900 dark:text-white">Q{qId}:</span>
                <span className="text-gray-700 dark:text-gray-300">{answer || 'Not answered'}</span>
              </div>
            ))}
            {Object.keys(listeningAnswers).length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">No answers yet</p>
            )}
          </div>
        </Card>

        <Card title="Writing">
          <div 
            className="prose max-w-none dark:prose-invert" 
            dangerouslySetInnerHTML={{ __html: writingContent || '<p class="text-gray-500 dark:text-gray-400">No answer yet</p>' }} 
          />
        </Card>
      </div>

      <div className="flex gap-4 justify-end">
        <Button variant="secondary" onClick={() => navigate(`/exam/${key}/writing`)}>
          Back to Writing
        </Button>
        <Button variant="danger" onClick={handleSubmit}>
          Submit Test
        </Button>
      </div>
    </div>
  );
};

export default AnswerSheet;
