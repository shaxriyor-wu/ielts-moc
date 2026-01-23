import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import IELTSHighlightableText from '../../components/IELTSHighlightableText';
import FileViewer from '../../components/FileViewer';
import Loader from '../../components/Loader';
import QuestionRenderer from '../../components/QuestionRenderer';
import { showToast } from '../../components/Toast';
import { Clock, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { useExam } from '../../context/ExamContext';
import { useDebounce } from '../../hooks/useDebounce';

const ReadingSection = () => {
  const navigate = useNavigate();
  const {
    answers,
    updateAnswer,
    highlights,
    addHighlight,
    timeRemaining,
    setTimeRemaining
  } = useExam();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [readingAnswers, setReadingAnswers] = useState({});
  const [activePassage, setActivePassage] = useState(0);
  const passageRef = useRef(null);

  useEffect(() => {
    loadTestData();
  }, []);

  useEffect(() => {
    if (answers.reading) {
      setReadingAnswers(answers.reading);
    }
  }, [answers.reading]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(readingAnswers).length > 0) {
        studentApi.saveReadingAnswers(readingAnswers).catch(console.error);
      }
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [readingAnswers]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []); // Empty dependency array to prevent re-creating interval on every tick, relying on functional update

  const loadTestData = async () => {
    try {
      const response = await studentApi.getTest();
      setTestData(response.data);
      if (response.data.responses) {
        // Only load backend answers if we don't have local answers (or merge them)
        // For now, let's trust backend if local is empty, or merge carefully
        const readingResponses = response.data.responses.filter(r => r.section === 'reading');
        const answersObj = {};
        readingResponses.forEach(r => {
          if (r.question_number) answersObj[r.question_number] = r.answer;
        });

        // If we have local answers, they take precedence (as they might be newer/unsaved)
        // But for initial load, if local is empty, populate from backend
        if (Object.keys(answers.reading || {}).length === 0) {
          setReadingAnswers(answersObj);
          Object.entries(answersObj).forEach(([qNum, answer]) => {
            updateAnswer('reading', qNum, answer);
          });
        } else {
          setReadingAnswers(answers.reading);
        }
      }
    } catch (error) {
      showToast('Failed to load test', 'error');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSave = useDebounce((answers) => {
    studentApi.saveReadingAnswers(answers).catch(console.error);
  }, 1000);

  const handleAnswerChange = (questionNum, value) => {
    const newAnswers = { ...readingAnswers, [questionNum]: value };
    setReadingAnswers(newAnswers);
    updateAnswer('reading', questionNum, value);
    debouncedSave(newAnswers);
  };



  const handleTimeout = async () => {
    try {
      if (Object.keys(readingAnswers).length > 0) {
        await studentApi.saveReadingAnswers(readingAnswers);
      }
    } catch (error) {
      console.error('Failed to save reading answers:', error);
      // Continue to navigate even if save fails
    }
    showToast('Time ended. Moving to Writing section...', 'info');
    setTimeout(() => navigate('../writing'), 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPassageContent = (text) => {
    // Simple renderer that preserves newlines
    // Replace **Text** with bold
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n')
      .map((line, i) => line ? `<p class="mb-4">${line}</p>` : '')
      .join('');
    return formatted;
  };

  if (loading) return <Loader fullScreen />;

  const readingFileUrl = testData?.files?.reading?.file_url;
  const passages = testData?.files?.reading?.questions_data?.passages || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-none z-50">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">READING SECTION</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {passages.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePassage(idx)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activePassage === idx
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  Passage {idx + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatTime(timeRemaining)}
              </span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('WARNING: Exiting to dashboard will RESET your progress for this test. Are you sure?')) {
                  navigate('/student/dashboard');
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
            >
              Exit to Dashboard
            </button>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to finish Reading and move to Writing? You cannot return.')) {
                  await studentApi.saveReadingAnswers(readingAnswers);
                  navigate('../writing');
                }
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-semibold shadow-md transition-all"
            >
              Next: Writing Section →
            </button>
          </div>
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Passage Text */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" ref={passageRef}>
          {passages.length > 0 ? (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 font-serif">
                {passages[activePassage]?.title}
              </h2>
              <IELTSHighlightableText
                content={renderPassageContent(passages[activePassage]?.text || '')}
                highlights={highlights || []}
                onHighlight={(newHighlights) => {
                  addHighlight(newHighlights);
                  if (studentApi.saveHighlights) studentApi.saveHighlights(newHighlights);
                }}
                className="prose dark:prose-invert max-w-none font-serif text-lg leading-relaxed select-text"
              />
            </div>
          ) : (
            /* Fallback to PDF if no passages layout */
            readingFileUrl && (
              <FileViewer fileUrl={readingFileUrl} fileType="pdf" className="h-full" />
            )
          )}
        </div>

        {/* Right Side: Questions */}
        <div className="w-1/2 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl mx-auto">
            {passages[activePassage]?.questions?.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-100 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Questions</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Answer the questions based on the passage.
                  </p>
                </div>
                {passages[activePassage].questions.filter(q => !q.is_hidden).map((q) => (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    answer={readingAnswers[q.id]}
                    allAnswers={readingAnswers}
                    onAnswerChange={handleAnswerChange}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No questions available for this passage.
              </div>
            )}

            {/* No Answer Sheet as per new strict requirements */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingSection;
