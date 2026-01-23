import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { CheckCircle, XCircle, Award, TrendingUp, Eye, EyeOff, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import ReactMarkdown from 'react-markdown';

const Results = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [testData, setTestData] = useState(null);
  const [expandedListening, setExpandedListening] = useState(false);
  const [expandedReading, setExpandedReading] = useState(false);
  const [expandedWriting, setExpandedWriting] = useState(false);
  const [showTask1DetailedFeedback, setShowTask1DetailedFeedback] = useState(false);
  const [showTask2DetailedFeedback, setShowTask2DetailedFeedback] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      // Get the latest test result
      const attemptsResponse = await studentApi.getAttempts();
      const attempts = attemptsResponse.data || [];

      if (attempts.length > 0) {
        const latestAttempt = attempts[0];
        setResults(latestAttempt.result);
        setTestData(latestAttempt);
      } else {
        // Try to get from submit response if just submitted
        const testResponse = await studentApi.getTest();
        if (testResponse.data && testResponse.data.result) {
          setResults(testResponse.data.result);
        }
      }
    } catch (error) {
      showToast('Failed to load results', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader fullScreen />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Results Not Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your test results are being processed. Please check back later.
          </p>
          <Button onClick={() => navigate('/student/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const listeningScore = results.listening_score || 0;
  const readingScore = results.reading_score || 0;
  const writingScore = results.writing_score || 0;
  const overallScore = results.overall_score || 0;

  const listeningBreakdown = results.listening_breakdown || {};
  const readingBreakdown = results.reading_breakdown || {};
  const writingBreakdown = results.writing_breakdown || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Test Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {testData?.variant_name || 'IELTS Mock Test'}
          </p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium mb-2 opacity-90">Overall Band Score</p>
              <p className="text-6xl font-bold mb-2">{overallScore.toFixed(1)}</p>
              <p className="text-sm opacity-90">
                Listening: {listeningScore.toFixed(1)} | Reading: {readingScore.toFixed(1)} | Writing: {writingScore.toFixed(1)}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Section Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Listening Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Listening
                </h3>
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {listeningScore.toFixed(1)}
                </div>
                {listeningBreakdown.correct !== undefined && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {listeningBreakdown.correct} / {listeningBreakdown.total} correct
                  </p>
                )}
              </div>
              {listeningBreakdown.question_results && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Breakdown:
                  </p>
                  <div className="grid grid-cols-5 gap-1 text-xs">
                    {Object.entries(listeningBreakdown.question_results).map(([qNum, result]) => (
                      <div
                        key={qNum}
                        className={`p-1 rounded text-center ${result.correct
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                          }`}
                        title={`Q${qNum}: ${result.correct ? 'Correct' : 'Incorrect'} (Your: ${result.student_answer || 'N/A'}, Correct: ${result.correct_answer})`}
                      >
                        {qNum}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Reading Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Reading
                </h3>
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {readingScore.toFixed(1)}
                </div>
                {readingBreakdown.correct !== undefined && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {readingBreakdown.correct} / {readingBreakdown.total} correct
                  </p>
                )}
              </div>
              {readingBreakdown.question_results && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Breakdown:
                  </p>
                  <div className="grid grid-cols-5 gap-1 text-xs">
                    {Object.entries(readingBreakdown.question_results).map(([qNum, result]) => (
                      <div
                        key={qNum}
                        className={`p-1 rounded text-center ${result.correct
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                          }`}
                        title={`Q${qNum}: ${result.correct ? 'Correct' : 'Incorrect'} (Your: ${result.student_answer || 'N/A'}, Correct: ${result.correct_answer})`}
                      >
                        {qNum}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Writing Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Writing
                </h3>
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {writingScore.toFixed(1)}
                </div>
                {writingBreakdown.task1 && writingBreakdown.task2 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Task 1: {results.writing_task1_score?.toFixed(1) || 'N/A'}</p>
                    <p>Task 2: {results.writing_task2_score?.toFixed(1) || 'N/A'}</p>
                  </div>
                )}
              </div>
              {writingBreakdown.task1 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Task 1 Breakdown:
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Task Achievement:</span>
                      <span className="font-semibold">{writingBreakdown.task1.task_achievement?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coherence & Cohesion:</span>
                      <span className="font-semibold">{writingBreakdown.task1.coherence_cohesion?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lexical Resource:</span>
                      <span className="font-semibold">{writingBreakdown.task1.lexical_resource?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grammar:</span>
                      <span className="font-semibold">{writingBreakdown.task1.grammatical_range?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
              {writingBreakdown.task2 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Task 2 Breakdown:
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Task Response:</span>
                      <span className="font-semibold">{writingBreakdown.task2.task_achievement?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coherence & Cohesion:</span>
                      <span className="font-semibold">{writingBreakdown.task2.coherence_cohesion?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lexical Resource:</span>
                      <span className="font-semibold">{writingBreakdown.task2.lexical_resource?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grammar:</span>
                      <span className="font-semibold">{writingBreakdown.task2.grammatical_range?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Detailed Writing Feedback Section */}
        {(writingBreakdown.task1_detailed_feedback || writingBreakdown.task2_detailed_feedback) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 space-y-4"
          >
            {/* Task 1 Detailed Feedback */}
            {writingBreakdown.task1_detailed_feedback && (
              <Card>
                <button
                  onClick={() => setShowTask1DetailedFeedback(!showTask1DetailedFeedback)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Task 1 - Detailed Examiner Feedback
                    </h3>
                  </div>
                  {showTask1DetailedFeedback ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <AnimatePresence>
                  {showTask1DetailedFeedback && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{writingBreakdown.task1_detailed_feedback}</ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}

            {/* Task 2 Detailed Feedback */}
            {writingBreakdown.task2_detailed_feedback && (
              <Card>
                <button
                  onClick={() => setShowTask2DetailedFeedback(!showTask2DetailedFeedback)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Task 2 - Detailed Examiner Feedback
                    </h3>
                  </div>
                  {showTask2DetailedFeedback ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <AnimatePresence>
                  {showTask2DetailedFeedback && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{writingBreakdown.task2_detailed_feedback}</ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}
          </motion.div>
        )}

        {/* Short feedback fallback (when no detailed feedback) */}
        {!writingBreakdown.task1_detailed_feedback && writingBreakdown.task1_feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Writing Feedback
              </h3>
              {writingBreakdown.task1_feedback && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task 1:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{writingBreakdown.task1_feedback}</p>
                </div>
              )}
              {writingBreakdown.task2_feedback && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task 2:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{writingBreakdown.task2_feedback}</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-4"
        >
          <Button onClick={() => navigate('/student/dashboard')}>
            View All Results
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;


