import { useEffect, useState } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import Timer from '../../components/Timer';
import Progress from '../../components/Progress';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const ExamPage = () => {
  const { key } = useParams();
  const { user } = useAuth();
  const { setExamData, setTimeRemaining, timeRemaining } = useExam();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sectionProgress, setSectionProgress] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/exam-access');
      return;
    }
    loadTest();
  }, []);

  const loadTest = async () => {
    try {
      const response = await studentApi.getTest();
      setTest(response.data);
      setExamData(response.data);
      const duration = response.data.duration * 60;
      setTimeRemaining(duration);
    } catch (error) {
      showToast('Failed to load test', 'error');
      navigate('/exam-access');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = async () => {
    try {
      await studentApi.submitTest();
      showToast('Test auto-submitted', 'info');
      navigate(`/exam/${key}/finish`);
    } catch (error) {
      showToast('Failed to submit test', 'error');
    }
  };

  useEffect(() => {
    const handleAutoSubmit = async () => {
      await handleTimeout();
    };
    window.addEventListener('autoSubmit', handleAutoSubmit);
    return () => window.removeEventListener('autoSubmit', handleAutoSubmit);
  }, []);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{test?.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">IELTS Exam</p>
          </div>
          <div className="flex items-center gap-4">
            <Timer initialSeconds={timeRemaining} onTimeout={handleTimeout} autoSubmit={true} />
          </div>
        </div>
        <div className="mt-3">
          <Progress value={sectionProgress} max={100} />
        </div>
      </div>
      <Outlet context={{ setSectionProgress }} />
    </div>
  );
};

export default ExamPage;
