import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import AutoPlayAudio from '../../components/AutoPlayAudio';
import IELTSHighlightableText from '../../components/IELTSHighlightableText';
import FileViewer from '../../components/FileViewer';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { Clock, Headphones, Eraser } from 'lucide-react';
import { useExam } from '../../context/ExamContext';
import QuestionRenderer from '../../components/QuestionRenderer';
import { useDebounce } from '../../hooks/useDebounce';

const ListeningSection = () => {
  const navigate = useNavigate();
  const {
    answers,
    updateAnswer,
    listeningHighlights,
    addListeningHighlight,
    clearListeningHighlights,
    audioResetKey
  } = useExam();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [listeningAnswers, setListeningAnswers] = useState({});
  const [audioEnded, setAudioEnded] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [reviewTime, setReviewTime] = useState(120); // 2 minutes review
  const [isReviewPhase, setIsReviewPhase] = useState(false);
  const audioEndedRef = useRef(false);

  // Reset audio-related state when component mounts (for fresh start on re-entry)
  useEffect(() => {
    setAudioEnded(false);
    setAudioStarted(false);
    setIsReviewPhase(false);
    setReviewTime(120);
    audioEndedRef.current = false;
  }, [audioResetKey]);

  const handleAudioStarted = useCallback(() => {
    setAudioStarted(true);
  }, []);

  useEffect(() => {
    loadTestData();
  }, []);

  useEffect(() => {
    // Initialize answers from context
    if (answers.listening) {
      setListeningAnswers(answers.listening);
    }
  }, [answers.listening]);

  useEffect(() => {
    // Auto-save answers every 30 seconds
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(listeningAnswers).length > 0) {
        studentApi.saveListeningAnswers(listeningAnswers).catch(console.error);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [listeningAnswers]);

  useEffect(() => {
    // Review time countdown
    if (isReviewPhase && reviewTime > 0) {
      const timer = setInterval(() => {
        setReviewTime((prev) => {
          if (prev <= 1) {
            handleReviewTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isReviewPhase, reviewTime]);

  const loadTestData = async () => {
    try {
      const response = await studentApi.getTest();
      setTestData(response.data);

      // Load existing answers
      if (response.data.responses) {
        const listeningResponses = response.data.responses.filter(r => r.section === 'listening');
        const answersObj = {};
        listeningResponses.forEach(r => {
          if (r.question_number) {
            answersObj[r.question_number] = r.answer;
          }
        });
        setListeningAnswers(answersObj);
        // Bulk update answers
        Object.entries(answersObj).forEach(([qNum, answer]) => {
          updateAnswer('listening', qNum, answer);
        });
      }
    } catch (error) {
      if (!testData) { // Only show error if we don't have data yet
        showToast('Failed to load test. Please refresh.', 'error');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioEnded = useCallback(() => {
    if (!audioEndedRef.current) {
      audioEndedRef.current = true;
      setAudioEnded(true);
      setIsReviewPhase(true);
      showToast('Audio finished. You have 2 minutes to review your answers.', 'info');
    }
  }, []);

  const debouncedSave = useDebounce((answers) => {
    studentApi.saveListeningAnswers(answers).catch(console.error);
  }, 1000);

  const handleAnswerChange = useCallback((questionNum, value) => {
    setListeningAnswers(prev => {
      const newAnswers = { ...prev, [questionNum]: value };
      debouncedSave(newAnswers);
      return newAnswers;
    });
    updateAnswer('listening', questionNum, value);
  }, [updateAnswer, debouncedSave]);



  const handleReviewTimeout = async () => {
    // Save all answers one last time
    try {
      if (Object.keys(listeningAnswers).length > 0) {
        await studentApi.saveListeningAnswers(listeningAnswers);
      }
    } catch (error) {
      console.error('Failed to save listening answers:', error);
      // Continue to navigate even if save fails
    }

    showToast('Review time ended. Moving to Reading section...', 'info');

    // Navigate to Reading section
    setTimeout(() => {
      navigate('../reading');
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <Loader fullScreen />;

  const listeningFileUrl = testData?.files?.listening?.file_url;
  const audioUrl = testData?.files?.listening?.audio_url;
  const fileType = listeningFileUrl?.split('.').pop()?.toLowerCase() || 'pdf';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Timer */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Headphones className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              LISTENING SECTION
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {isReviewPhase && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  Review Time: {formatTime(reviewTime)}
                </span>
              </div>
            )}

            {/* Clear Highlights Button */}
            {listeningHighlights.length > 0 && (
              <button
                onClick={() => {
                  clearListeningHighlights();
                  showToast('All highlights cleared', 'info');
                }}
                className="px-3 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg transition-colors flex items-center gap-2"
                title="Clear all highlights"
              >
                <Eraser className="w-4 h-4" />
                Clear Highlights
              </button>
            )}

            {/* DEV MODE: Skip to next section */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={async () => {
                  if (Object.keys(listeningAnswers).length > 0) {
                    await studentApi.saveListeningAnswers(listeningAnswers);
                  }
                  navigate('../reading');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                🚀 DEV: Skip to Reading
              </button>
            )}

            <button
              onClick={() => {
                if (window.confirm('WARNING: Exiting to dashboard will RESET your progress for this test. Are you sure?')) {
                  navigate('/student/dashboard');
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Exit to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Audio Player Section */}
      {audioUrl && !audioEnded && (
        <div className="max-w-7xl mx-auto px-6 pb-4">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Headphones className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-300">
                    Listening Audio
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Audio will play automatically. You can only listen once.
                  </p>
                </div>
              </div>
              <div className="w-full md:max-w-md overflow-hidden rounded-lg">
                {(audioUrl.includes('youtube') || audioUrl.includes('youtu.be')) ? (
                  <div className="aspect-video w-full bg-black rounded-lg overflow-hidden relative shadow-lg">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${audioUrl.includes('v=')
                        ? audioUrl.split('v=')[1].split('&')[0]
                        : audioUrl.split('/').pop().split('?')[0]
                        }?autoplay=1&controls=0&disablekb=1&modestbranding=1&rel=0&enablejsapi=1`}
                      title="Listening Audio"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      className="pointer-events-none"
                    ></iframe>
                    <div className="absolute inset-0 bg-transparent z-10" title="Manual control is disabled for this test" />
                  </div>
                ) : (
                  <AutoPlayAudio
                    key="listening-audio-player"
                    src={audioUrl}
                    onStarted={handleAudioStarted}
                    onEnded={handleAudioEnded}
                    resetKey={audioResetKey}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {
        !audioUrl && testData && (
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <Headphones className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">
                    Audio File Not Available
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    The listening audio file has not been uploaded yet. Please contact your administrator.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )
      }

      {
        audioEnded && (
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-300">
                    Audio Finished - Review Phase
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    You have 2 minutes to check your answers on the screen. The test will automatically move to Reading section.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )
      }

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <h2 className="font-semibold text-blue-900 dark:text-blue-300">INSTRUCTIONS</h2>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>You will hear a recording ONCE only</li>
              <li>While you listen, write your answers in the input fields</li>
              <li>You will have 2 minutes at the end to review your answers</li>
              <li>Write your answers clearly</li>
              <li><strong>TIP:</strong> You can highlight important text by selecting it</li>
            </ul>
          </div>
        </Card>

        {/* Listening Questions - Render from JSON */}
        {testData?.files?.listening?.questions_data && (
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                LISTENING TASKS
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Read the questions and instructions carefully while listening to the audio.
              </p>
            </div>

            {/* Render sections from questions_data */}
            {testData.files.listening.questions_data.sections?.map((section, idx) => (
              <div key={idx} className="mb-8">
                <div className="mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-md font-bold text-primary-600 dark:text-primary-400">
                    {section.title || `Section ${section.section_number}`}
                  </h3>
                  {section.context && (
                    <IELTSHighlightableText
                      content={`<p class="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">${section.context}</p>`}
                      highlights={listeningHighlights}
                      onHighlight={(newHighlights) => {
                        addListeningHighlight(newHighlights);
                      }}
                    />
                  )}
                </div>

                <div className="space-y-3">
                  {section.questions?.map((q) => (
                    <QuestionRenderer
                      key={q.id}
                      question={q}
                      answer={listeningAnswers[q.id]}
                      onAnswerChange={handleAnswerChange}
                      disabled={false}
                      highlights={listeningHighlights}
                      onHighlight={addListeningHighlight}
                    />
                  ))}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Fallback to PDF viewer if questions_data not available */}
        {!testData?.files?.listening?.questions_data && listeningFileUrl && (
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                LISTENING TASKS
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Read the questions and instructions carefully. You can highlight important information.
              </p>
            </div>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              {fileType === 'pdf' ? (
                <FileViewer
                  fileUrl={listeningFileUrl}
                  fileType={fileType}
                  className="min-h-[600px]"
                />
              ) : (
                <div className="p-6">
                  <IELTSHighlightableText
                    content={`<p>Listening tasks file loaded. Please refer to the audio for questions.</p>`}
                    highlights={listeningHighlights}
                    onHighlight={(newHighlights) => {
                      addListeningHighlight(newHighlights);
                    }}
                    className="min-h-[400px]"
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* No Answer Sheet as per new strict requirements */}
      </div>
    </div>
  );
};

export default ListeningSection;
