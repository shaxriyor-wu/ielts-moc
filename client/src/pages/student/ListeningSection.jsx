import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import AutoPlayAudio from '../../components/AutoPlayAudio';
import IELTSHighlightableText from '../../components/IELTSHighlightableText';
import IELTSAnswerSheet from '../../components/IELTSAnswerSheet';
import FileViewer from '../../components/FileViewer';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { Clock, Headphones } from 'lucide-react';
import { useExam } from '../../context/ExamContext';

const ListeningSection = () => {
  const navigate = useNavigate();
  const { answers, updateAnswer, highlights, addHighlight } = useExam();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [listeningAnswers, setListeningAnswers] = useState({});
  const [audioEnded, setAudioEnded] = useState(false);
  const [transferTime, setTransferTime] = useState(600); // 10 minutes in seconds
  const [isTransferPhase, setIsTransferPhase] = useState(false);
  const audioEndedRef = useRef(false);

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
    // Transfer time countdown
    if (isTransferPhase && transferTime > 0) {
      const timer = setInterval(() => {
        setTransferTime((prev) => {
          if (prev <= 1) {
            handleTransferTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isTransferPhase, transferTime]);

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
      showToast('Failed to load test', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioEnded = () => {
    if (!audioEndedRef.current) {
      audioEndedRef.current = true;
      setAudioEnded(true);
      setIsTransferPhase(true);
      showToast('Audio finished. You have 10 minutes to transfer your answers.', 'info');
    }
  };

  const handleAnswerChange = (questionNum, value) => {
    const newAnswers = { ...listeningAnswers, [questionNum]: value };
    setListeningAnswers(newAnswers);
    updateAnswer('listening', questionNum, value);
    studentApi.saveListeningAnswers(newAnswers).catch(console.error);
  };

  const handleAnswerSheetChange = (newAnswers) => {
    setListeningAnswers(newAnswers);
    // Bulk update answers
    Object.entries(newAnswers).forEach(([qNum, answer]) => {
      updateAnswer('listening', qNum, answer);
    });
    studentApi.saveListeningAnswers(newAnswers).catch(console.error);
  };

  const handleTransferTimeout = async () => {
    // Save all answers
    await studentApi.saveListeningAnswers(listeningAnswers);
    showToast('Transfer time ended. Moving to Reading section...', 'info');
    
    // Navigate to Reading section
    setTimeout(() => {
      navigate('/student/reading');
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
          {isTransferPhase && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                Answer Transfer Time: {formatTime(transferTime)}
              </span>
            </div>
          )}
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
              <audio
                controls
                src={audioUrl}
                onEnded={handleAudioEnded}
                className="w-full md:max-w-md"
                preload="auto"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('Audio error:', e);
                  showToast('Failed to load audio. Please refresh the page.', 'error');
                }}
                onPlay={() => {
                  // When user manually plays, ensure autoplay doesn't interfere
                  audioEndedRef.current = false;
                }}
              />
            </div>
          </Card>
          {/* Hidden autoplay component - tries to autoplay, but visible player takes precedence */}
          <AutoPlayAudio src={audioUrl} onEnded={handleAudioEnded} />
        </div>
      )}
      
      {audioEnded && (
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-300">
                Audio Finished
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                You now have 10 minutes to transfer your answers to the answer sheet.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <h2 className="font-semibold text-blue-900 dark:text-blue-300">INSTRUCTIONS</h2>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>You will hear a recording ONCE only</li>
              <li>While you listen, write your answers on the question paper</li>
              <li>You will have 10 minutes at the end to transfer your answers to the answer sheet</li>
              <li>Write your answers clearly</li>
            </ul>
          </div>
        </Card>

        {/* Listening File Display */}
        {listeningFileUrl && (
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
                    highlights={highlights || []}
                    onHighlight={(newHighlights) => {
                      addHighlight(newHighlights);
                      if (studentApi.saveHighlights) {
                        studentApi.saveHighlights(newHighlights).catch(console.error);
                      }
                    }}
                    className="min-h-[400px]"
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Answer Sheet - Always visible at bottom */}
        <Card>
          <IELTSAnswerSheet
            section="listening"
            answers={listeningAnswers}
            onAnswerChange={handleAnswerSheetChange}
          />
        </Card>
      </div>
    </div>
  );
};

export default ListeningSection;
