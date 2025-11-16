import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import IELTSHighlightableText from '../../components/IELTSHighlightableText';
import IELTSAnswerSheet from '../../components/IELTSAnswerSheet';
import FileViewer from '../../components/FileViewer';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { Clock, BookOpen } from 'lucide-react';
import { useExam } from '../../context/ExamContext';

const ReadingSection = () => {
  const navigate = useNavigate();
  const { answers, updateAnswer, highlights, addHighlight } = useExam();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [readingAnswers, setReadingAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds
  const [highlightsList, setHighlightsList] = useState([]);

  useEffect(() => {
    loadTestData();
  }, []);

  useEffect(() => {
    // Initialize answers from context
    if (answers.reading) {
      setReadingAnswers(answers.reading);
    }
    if (highlights) {
      setHighlightsList(highlights);
    }
  }, [answers.reading, highlights]);

  useEffect(() => {
    // Auto-save answers and highlights every 30 seconds
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(readingAnswers).length > 0) {
        studentApi.saveReadingAnswers(readingAnswers).catch(console.error);
      }
      if (highlightsList.length > 0) {
        studentApi.saveHighlights(highlightsList).catch(console.error);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [readingAnswers, highlightsList]);

  useEffect(() => {
    // Reading time countdown
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
  }, [timeRemaining]);

  const loadTestData = async () => {
    try {
      const response = await studentApi.getTest();
      setTestData(response.data);
      
      // Load existing answers
      if (response.data.responses) {
        const readingResponses = response.data.responses.filter(r => r.section === 'reading');
        const answersObj = {};
        readingResponses.forEach(r => {
          if (r.question_number) {
            answersObj[r.question_number] = r.answer;
          }
        });
        setReadingAnswers(answersObj);
        // Bulk update answers
        Object.entries(answersObj).forEach(([qNum, answer]) => {
          updateAnswer('reading', qNum, answer);
        });
      }
    } catch (error) {
      showToast('Failed to load test', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionNum, value) => {
    const newAnswers = { ...readingAnswers, [questionNum]: value };
    setReadingAnswers(newAnswers);
    updateAnswer('reading', questionNum, value);
    studentApi.saveReadingAnswers(newAnswers).catch(console.error);
  };

  const handleAnswerSheetChange = (newAnswers) => {
    setReadingAnswers(newAnswers);
    // Bulk update answers
    Object.entries(newAnswers).forEach(([qNum, answer]) => {
      updateAnswer('reading', qNum, answer);
    });
    studentApi.saveReadingAnswers(newAnswers).catch(console.error);
  };

  const handleHighlight = (newHighlights) => {
    setHighlightsList(newHighlights);
    addHighlight(newHighlights);
    // Save highlights if endpoint exists
    if (studentApi.saveHighlights) {
      studentApi.saveHighlights(newHighlights).catch(console.error);
    }
  };

  const handleTimeout = async () => {
    // Save all answers
    await studentApi.saveReadingAnswers(readingAnswers);
    showToast('Time ended. Moving to Writing section...', 'info');
    
    // Navigate to Writing section
    setTimeout(() => {
      navigate('/student/writing');
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <Loader fullScreen />;

  const readingFileUrl = testData?.files?.reading?.file_url;
  const fileType = readingFileUrl?.split('.').pop()?.toLowerCase() || 'pdf';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Timer */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              READING SECTION
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-lg font-bold text-red-600 dark:text-red-400">
              Time Remaining: {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <h2 className="font-semibold text-blue-900 dark:text-blue-300">INSTRUCTIONS</h2>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Read the passages and answer all questions</li>
              <li>You have 60 minutes to complete this section</li>
              <li>Write your answers clearly on the answer sheet</li>
              <li>You can highlight text to help you find information</li>
            </ul>
          </div>
        </Card>

        {/* Reading File Display with Highlighting */}
        {readingFileUrl && (
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                READING PASSAGES
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Read the passages carefully and answer the questions
              </p>
            </div>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-800">
              {fileType === 'pdf' ? (
                <FileViewer
                  fileUrl={readingFileUrl}
                  fileType={fileType}
                  className="min-h-[600px]"
                />
              ) : (
                <IELTSHighlightableText
                  content={`<p>Loading reading content...</p>`}
                  highlights={highlightsList}
                  onHighlight={handleHighlight}
                  className="min-h-[600px]"
                />
              )}
            </div>
          </Card>
        )}

        {/* Answer Sheet - Always visible at bottom */}
        <Card>
          <IELTSAnswerSheet
            section="reading"
            answers={readingAnswers}
            onAnswerChange={handleAnswerSheetChange}
          />
        </Card>
      </div>
    </div>
  );
};

export default ReadingSection;
