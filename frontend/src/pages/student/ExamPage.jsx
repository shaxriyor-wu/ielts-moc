import { useEffect, useState } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import Timer from '../../components/Timer';
import Progress from '../../components/Progress';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Maximize, ShieldAlert } from 'lucide-react';
import { useAntiCheat } from '../../hooks/useAntiCheat';

const ExamPage = () => {
  const { key } = useParams();
  const { user } = useAuth();
  const { setExamData, setTimeRemaining, timeRemaining } = useExam();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sectionProgress, setSectionProgress] = useState(0);

  // Anti-cheating hook
  const { isFullScreen, enterFullscreen, hasLeftWindow } = useAntiCheat(true);

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
      // Ensure duration is a valid number, default to 60 if missing/invalid
      const durationVal = parseInt(response.data.duration);
      const duration = (isNaN(durationVal) ? 60 : durationVal) * 60;
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
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => { });
      }
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

  const isBlocked = !isFullScreen || hasLeftWindow;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 no-context-menu">
      {/* Fullscreen / Anti-Cheat Enforcement Modal */}
      <Modal
        isOpen={isBlocked}
        onClose={() => { }} // Prevent closing by clicking outside
        title={hasLeftWindow ? "Exam Interference Detected" : "Fullscreen Required"}
        showCloseButton={false}
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {hasLeftWindow ? "Please Return to the Exam" : "Security Check"}
          </h4>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm mx-auto">
            {hasLeftWindow
              ? "Navigating away from the exam window is not allowed. Please click below to resume your exam."
              : "To ensure academic integrity, this exam must be taken in fullscreen mode. Please enable fullscreen to continue."
            }
          </p>
          <Button
            onClick={enterFullscreen}
            size="lg"
            className="w-full max-w-xs mx-auto"
          >
            <Maximize className="w-5 h-5 mr-2" />
            {hasLeftWindow ? "Resume Exam" : "Enter Fullscreen Mode"}
          </Button>
        </div>
      </Modal>

      <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-10 shadow-sm ${isBlocked ? 'filter blur-sm pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{test?.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">CD IELTS EMPIRE</p>
          </div>
          <div className="flex items-center gap-4">
            <Timer initialSeconds={timeRemaining} onTimeout={handleTimeout} autoSubmit={true} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to exit? Your progress will be saved but the test will not be marked as complete.')) {
                  if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
                  navigate('/student/dashboard'); // Or appropriate exit route
                }
              }}
            >
              Exit
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={sectionProgress} max={100} />
        </div>
      </div>
      <div className={!isFullScreen ? 'filter blur-sm pointer-events-none' : ''}>
        <Outlet context={{ setSectionProgress }} />
      </div>
    </div>
  );
};

export default ExamPage;
