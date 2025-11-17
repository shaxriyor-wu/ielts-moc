import { useEffect, useState } from 'react';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import { BookOpen, CheckCircle, Clock, TrendingUp, Play, User } from 'lucide-react';
import EnterTestModal from './EnterTestModal';
import WaitingRoom from './WaitingRoom';

// Helper function to convert raw score (X/40) to IELTS band score
const convertToBandScore = (rawScore, totalQuestions = 40) => {
  if (!rawScore && rawScore !== 0) return null;
  const percentage = (rawScore / totalQuestions) * 100;
  
  // IELTS band score conversion (approximate)
  if (percentage >= 95) return 9.0;
  if (percentage >= 90) return 8.5;
  if (percentage >= 85) return 8.0;
  if (percentage >= 80) return 7.5;
  if (percentage >= 75) return 7.0;
  if (percentage >= 70) return 6.5;
  if (percentage >= 65) return 6.0;
  if (percentage >= 60) return 5.5;
  if (percentage >= 55) return 5.0;
  if (percentage >= 50) return 4.5;
  if (percentage >= 45) return 4.0;
  if (percentage >= 40) return 3.5;
  if (percentage >= 35) return 3.0;
  return 2.5;
};

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnterTestModal, setShowEnterTestModal] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);

  useEffect(() => {
    loadData();
    checkQueueStatus();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, attemptsRes] = await Promise.all([
        studentApi.getStats(),
        studentApi.getAttempts(),
      ]);
      setStats(statsRes.data);
      setAttempts(attemptsRes.data);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkQueueStatus = async () => {
    try {
      const response = await studentApi.checkQueueStatus();
      const status = response.data.status;
      
      if (status === 'waiting' || status === 'assigned' || status === 'preparation') {
        setQueueStatus(response.data);
        setShowWaitingRoom(true);
      } else if (status === 'started') {
        // Test already started, redirect to test
        window.location.href = '/student/listening';
      } else if (status === 'timeout') {
        // Timeout occurred, show message
        showToast('Test did not start within 10 minutes', 'error');
        setQueueStatus(null);
        setShowWaitingRoom(false);
      } else {
        setQueueStatus(null);
        setShowWaitingRoom(false);
      }
    } catch (error) {
      // No active queue entry
      setQueueStatus(null);
      setShowWaitingRoom(false);
    }
  };

  const handleEnterTest = async (testCode) => {
    try {
      const response = await studentApi.enterTestCode(testCode);
      setShowEnterTestModal(false);
      
      if (response.data.status === 'waiting' || response.data.status === 'assigned' || response.data.status === 'preparation') {
        setQueueStatus(response.data);
        setShowWaitingRoom(true);
        showToast('Test Starting Soon - Please Wait', 'info');
      } else if (response.data.status === 'started') {
        // Test already started, redirect to test
        window.location.href = '/student/listening';
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Invalid Test Code - Please Try Again', 'error');
    }
  };

  if (loading) return <Loader fullScreen />;

  // Show waiting room if student is in queue
  if (showWaitingRoom && queueStatus) {
    return (
      <WaitingRoom
        queueStatus={queueStatus}
        onStatusUpdate={setQueueStatus}
        onStartTest={() => {
          setShowWaitingRoom(false);
          // Redirect to listening section
          window.location.href = '/student/listening';
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests Taken</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stats?.total_tests_taken || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats?.completed_tests || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats?.average_score ? `${stats.average_score.toFixed(1)}` : '-'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Previous Test Results */}
      {attempts.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Previous Test Results
          </h2>
          <div className="space-y-4">
            {attempts.map((attempt) => {
              const result = attempt.result;
              const variant = attempt.variant;
              
              return (
                <div
                  key={attempt.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {variant?.name || 'Test'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(attempt.start_time).toLocaleDateString()}
                      </p>
                    </div>
                    {result?.overall_score && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Overall</p>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {result.overall_score.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>

                  {result && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {result.listening_breakdown && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Listening</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {result.listening_breakdown.correct || 0}/40 = Band {result.listening_score?.toFixed(1) || '-'}
                          </p>
                        </div>
                      )}
                      {result.reading_breakdown && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Reading</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {result.reading_breakdown.correct || 0}/40 = Band {result.reading_score?.toFixed(1) || '-'}
                          </p>
                        </div>
                      )}
                      {result.writing_task1_score && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Writing Task 1</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            Band {result.writing_task1_score.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {result.writing_task2_score && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Writing Task 2</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            Band {result.writing_task2_score.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {result.writing_score && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Overall Writing</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            Band {result.writing_score.toFixed(1)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!result && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {attempt.status === 'submitted' ? 'Grading in progress...' : 'Test in progress'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Enter Test Section */}
      <Card>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Take a Test?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Enter your 6-digit test code to begin
          </p>
          <Button
            size="lg"
            onClick={() => setShowEnterTestModal(true)}
            className="flex items-center gap-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            ENTER THE TEST
          </Button>
        </div>
      </Card>

      {/* Enter Test Modal */}
      <EnterTestModal
        isOpen={showEnterTestModal}
        onClose={() => setShowEnterTestModal(false)}
        onSubmit={handleEnterTest}
      />
    </div>
  );
};

export default StudentDashboard;
