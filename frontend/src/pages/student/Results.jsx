import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { Award, Calendar, ChevronDown, ChevronUp, Eye, TrendingUp, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import ReactMarkdown from 'react-markdown';

const Results = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showDetailedFeedback, setShowDetailedFeedback] = useState({});

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const attemptsResponse = await studentApi.getAttempts();
      const attemptsData = attemptsResponse.data || [];
      setAttempts(attemptsData);

      // Auto-expand the first attempt
      if (attemptsData.length > 0) {
        setExpandedAttemptId(attemptsData[0].id);
      }
    } catch (error) {
      showToast('Failed to load results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttempt = (attemptId) => {
    setExpandedAttemptId(expandedAttemptId === attemptId ? null : attemptId);
  };

  const toggleSection = (attemptId, section) => {
    const key = `${attemptId}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleDetailedFeedback = (attemptId, task) => {
    const key = `${attemptId}-${task}`;
    setShowDetailedFeedback(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-green-600 dark:text-green-400';
    if (score >= 5.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 7) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 5.5) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader fullScreen />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            No Test Results Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't taken any mock tests yet. Start your first test to see your results here.
          </p>
          <Button onClick={() => navigate('/student/tests')}>
            Browse Available Tests
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Test Results
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View all your mock test attempts and detailed feedback
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Tests</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {attempts.length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Overall</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(attempts.reduce((sum, a) => sum + (a.result?.overall_score || 0), 0) / attempts.length).toFixed(1)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Score</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.max(...attempts.map(a => a.result?.overall_score || 0)).toFixed(1)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Latest Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {attempts[0]?.result?.overall_score?.toFixed(1) || 'N/A'}
              </p>
            </div>
          </Card>
        </div>

        {/* Test Attempts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            All Attempts ({attempts.length})
          </h2>

          {attempts.map((attempt, index) => {
            const result = attempt.result || {};
            const isExpanded = expandedAttemptId === attempt.id;

            return (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  {/* Attempt Header */}
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleAttempt(attempt.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 ${getScoreBgColor(result.overall_score)} rounded-lg flex items-center justify-center`}>
                          <span className={`text-2xl font-bold ${getScoreColor(result.overall_score)}`}>
                            {result.overall_score?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {attempt.test_name || `Test Attempt ${attempts.length - index}`}
                            </h3>
                            {index === 0 && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(attempt.submission_time || attempt.start_time)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex gap-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Listening</p>
                            <p className={`text-lg font-bold ${getScoreColor(result.listening_score)}`}>
                              {result.listening_score?.toFixed(1) || '-'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Reading</p>
                            <p className={`text-lg font-bold ${getScoreColor(result.reading_score)}`}>
                              {result.reading_score?.toFixed(1) || '-'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Writing</p>
                            <p className={`text-lg font-bold ${getScoreColor(result.writing_score)}`}>
                              {result.writing_score?.toFixed(1) || '-'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Speaking</p>
                            <p className={`text-lg font-bold ${getScoreColor(result.speaking_score)}`}>
                              {result.speaking_score?.toFixed(1) || '-'}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                          {/* Listening Section */}
                          {result.listening_breakdown && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleSection(attempt.id, 'listening')}
                              >
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    Listening Details
                                  </h4>
                                  <span className={`text-sm font-medium ${getScoreColor(result.listening_score)}`}>
                                    Score: {result.listening_score?.toFixed(1)}
                                  </span>
                                </div>
                                {expandedSections[`${attempt.id}-listening`] ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                              {expandedSections[`${attempt.id}-listening`] && (
                                <div className="mt-4 space-y-2 text-sm">
                                  <p><strong>Correct:</strong> {result.listening_breakdown.correct_answers} / {result.listening_breakdown.total_questions}</p>
                                  <p><strong>Accuracy:</strong> {((result.listening_breakdown.correct_answers / result.listening_breakdown.total_questions) * 100).toFixed(1)}%</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Reading Section */}
                          {result.reading_breakdown && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleSection(attempt.id, 'reading')}
                              >
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    Reading Details
                                  </h4>
                                  <span className={`text-sm font-medium ${getScoreColor(result.reading_score)}`}>
                                    Score: {result.reading_score?.toFixed(1)}
                                  </span>
                                </div>
                                {expandedSections[`${attempt.id}-reading`] ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                              {expandedSections[`${attempt.id}-reading`] && (
                                <div className="mt-4 space-y-2 text-sm">
                                  <p><strong>Correct:</strong> {result.reading_breakdown.correct_answers} / {result.reading_breakdown.total_questions}</p>
                                  <p><strong>Accuracy:</strong> {((result.reading_breakdown.correct_answers / result.reading_breakdown.total_questions) * 100).toFixed(1)}%</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Writing Section */}
                          {result.writing_breakdown && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleSection(attempt.id, 'writing')}
                              >
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    Writing Details
                                  </h4>
                                  <span className={`text-sm font-medium ${getScoreColor(result.writing_score)}`}>
                                    Score: {result.writing_score?.toFixed(1)}
                                  </span>
                                </div>
                                {expandedSections[`${attempt.id}-writing`] ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                              {expandedSections[`${attempt.id}-writing`] && (
                                <div className="mt-4 space-y-4">
                                  {/* Task 1 */}
                                  {result.writing_breakdown.task1 && (
                                    <div className="border-l-4 border-blue-500 pl-4">
                                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Task 1</h5>
                                      <p className="text-sm mb-2">
                                        <strong>Score:</strong> {result.writing_breakdown.task1.score?.toFixed(1)}
                                      </p>
                                      {result.writing_breakdown.task1.feedback && (
                                        <div>
                                          <button
                                            onClick={() => toggleDetailedFeedback(attempt.id, 'task1')}
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mb-2"
                                          >
                                            <Eye className="w-4 h-4" />
                                            {showDetailedFeedback[`${attempt.id}-task1`] ? 'Hide' : 'Show'} Feedback
                                          </button>
                                          {showDetailedFeedback[`${attempt.id}-task1`] && (
                                            <div className="prose dark:prose-invert max-w-none text-sm">
                                              <ReactMarkdown>{result.writing_breakdown.task1.feedback}</ReactMarkdown>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Task 2 */}
                                  {result.writing_breakdown.task2 && (
                                    <div className="border-l-4 border-purple-500 pl-4">
                                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Task 2</h5>
                                      <p className="text-sm mb-2">
                                        <strong>Score:</strong> {result.writing_breakdown.task2.score?.toFixed(1)}
                                      </p>
                                      {result.writing_breakdown.task2.feedback && (
                                        <div>
                                          <button
                                            onClick={() => toggleDetailedFeedback(attempt.id, 'task2')}
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mb-2"
                                          >
                                            <Eye className="w-4 h-4" />
                                            {showDetailedFeedback[`${attempt.id}-task2`] ? 'Hide' : 'Show'} Feedback
                                          </button>
                                          {showDetailedFeedback[`${attempt.id}-task2`] && (
                                            <div className="prose dark:prose-invert max-w-none text-sm">
                                              <ReactMarkdown>{result.writing_breakdown.task2.feedback}</ReactMarkdown>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Speaking Section */}
                          {result.speaking_breakdown && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleSection(attempt.id, 'speaking')}
                              >
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    Speaking Details
                                  </h4>
                                  <span className={`text-sm font-medium ${getScoreColor(result.speaking_score)}`}>
                                    Score: {result.speaking_score?.toFixed(1)}
                                  </span>
                                </div>
                                {expandedSections[`${attempt.id}-speaking`] ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                              {expandedSections[`${attempt.id}-speaking`] && (
                                <div className="mt-4 space-y-4">
                                  {/* Part 1 */}
                                  {result.speaking_breakdown.part1 && (
                                    <div className="border-l-4 border-blue-500 pl-4">
                                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Part 1: Interview</h5>
                                      <p className="text-sm mb-2">
                                        <strong>Score:</strong> {result.speaking_breakdown.part1.overall_score?.toFixed(1)}
                                      </p>
                                      {result.speaking_breakdown.part1.breakdown && (
                                        <div className="text-sm space-y-1 mb-2">
                                          <p><strong>Fluency & Coherence:</strong> {result.speaking_breakdown.part1.breakdown.fluency_coherence?.toFixed(1)}</p>
                                          <p><strong>Lexical Resource:</strong> {result.speaking_breakdown.part1.breakdown.lexical_resource?.toFixed(1)}</p>
                                          <p><strong>Grammatical Range:</strong> {result.speaking_breakdown.part1.breakdown.grammatical_range?.toFixed(1)}</p>
                                          <p><strong>Pronunciation:</strong> {result.speaking_breakdown.part1.breakdown.pronunciation?.toFixed(1)}</p>
                                        </div>
                                      )}
                                      {result.speaking_breakdown.part1.detailed_feedback && (
                                        <div>
                                          <button
                                            onClick={() => toggleDetailedFeedback(attempt.id, 'speaking_part1')}
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mb-2"
                                          >
                                            <Eye className="w-4 h-4" />
                                            {showDetailedFeedback[`${attempt.id}-speaking_part1`] ? 'Hide' : 'Show'} Detailed Feedback
                                          </button>
                                          {showDetailedFeedback[`${attempt.id}-speaking_part1`] && (
                                            <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                                              {result.speaking_breakdown.part1.detailed_feedback}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Part 2 */}
                                  {result.speaking_breakdown.part2 && (
                                    <div className="border-l-4 border-purple-500 pl-4">
                                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Part 2: Long Turn</h5>
                                      <p className="text-sm mb-2">
                                        <strong>Score:</strong> {result.speaking_breakdown.part2.overall_score?.toFixed(1)}
                                      </p>
                                      {result.speaking_breakdown.part2.breakdown && (
                                        <div className="text-sm space-y-1 mb-2">
                                          <p><strong>Fluency & Coherence:</strong> {result.speaking_breakdown.part2.breakdown.fluency_coherence?.toFixed(1)}</p>
                                          <p><strong>Lexical Resource:</strong> {result.speaking_breakdown.part2.breakdown.lexical_resource?.toFixed(1)}</p>
                                          <p><strong>Grammatical Range:</strong> {result.speaking_breakdown.part2.breakdown.grammatical_range?.toFixed(1)}</p>
                                          <p><strong>Pronunciation:</strong> {result.speaking_breakdown.part2.breakdown.pronunciation?.toFixed(1)}</p>
                                        </div>
                                      )}
                                      {result.speaking_breakdown.part2.detailed_feedback && (
                                        <div>
                                          <button
                                            onClick={() => toggleDetailedFeedback(attempt.id, 'speaking_part2')}
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mb-2"
                                          >
                                            <Eye className="w-4 h-4" />
                                            {showDetailedFeedback[`${attempt.id}-speaking_part2`] ? 'Hide' : 'Show'} Detailed Feedback
                                          </button>
                                          {showDetailedFeedback[`${attempt.id}-speaking_part2`] && (
                                            <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                                              {result.speaking_breakdown.part2.detailed_feedback}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Part 3 */}
                                  {result.speaking_breakdown.part3 && (
                                    <div className="border-l-4 border-orange-500 pl-4">
                                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Part 3: Discussion</h5>
                                      <p className="text-sm mb-2">
                                        <strong>Score:</strong> {result.speaking_breakdown.part3.overall_score?.toFixed(1)}
                                      </p>
                                      {result.speaking_breakdown.part3.breakdown && (
                                        <div className="text-sm space-y-1 mb-2">
                                          <p><strong>Fluency & Coherence:</strong> {result.speaking_breakdown.part3.breakdown.fluency_coherence?.toFixed(1)}</p>
                                          <p><strong>Lexical Resource:</strong> {result.speaking_breakdown.part3.breakdown.lexical_resource?.toFixed(1)}</p>
                                          <p><strong>Grammatical Range:</strong> {result.speaking_breakdown.part3.breakdown.grammatical_range?.toFixed(1)}</p>
                                          <p><strong>Pronunciation:</strong> {result.speaking_breakdown.part3.breakdown.pronunciation?.toFixed(1)}</p>
                                        </div>
                                      )}
                                      {result.speaking_breakdown.part3.detailed_feedback && (
                                        <div>
                                          <button
                                            onClick={() => toggleDetailedFeedback(attempt.id, 'speaking_part3')}
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mb-2"
                                          >
                                            <Eye className="w-4 h-4" />
                                            {showDetailedFeedback[`${attempt.id}-speaking_part3`] ? 'Hide' : 'Show'} Detailed Feedback
                                          </button>
                                          {showDetailedFeedback[`${attempt.id}-speaking_part3`] && (
                                            <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                                              {result.speaking_breakdown.part3.detailed_feedback}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Results;
