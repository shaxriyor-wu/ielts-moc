import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import FileViewer from '../../components/FileViewer';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { Clock, FileText, Edit } from 'lucide-react';
import { useExam } from '../../context/ExamContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

const WritingSection = () => {
  const navigate = useNavigate();
  const { answers, updateAnswer } = useExam();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [task1Content, setTask1Content] = useState('');
  const [task2Content, setTask2Content] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBreakPhase, setIsBreakPhase] = useState(false);
  const [breakTime, setBreakTime] = useState(120); // 2 minutes break
  const [activeTask, setActiveTask] = useState(1); // Track active task (1 or 2)

  // Use refs for timeout cleanup
  const task1TimeoutRef = useRef(null);
  const task2TimeoutRef = useRef(null);

  useEffect(() => {
    loadTestData();
  }, []);

  useEffect(() => {
    // Initialize content from context
    if (answers.writing?.task1) {
      setTask1Content(answers.writing.task1);
    }
    if (answers.writing?.task2) {
      setTask2Content(answers.writing.task2);
    }
  }, [answers.writing]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (task1TimeoutRef.current) clearTimeout(task1TimeoutRef.current);
      if (task2TimeoutRef.current) clearTimeout(task2TimeoutRef.current);
    };
  }, []);

  // Create ref for saveWriting function
  const saveWritingRef = useRef(null);

  useEffect(() => {
    // Auto-save every 30 seconds - use ref to avoid recreating interval
    const autoSaveInterval = setInterval(() => {
      if ((task1Content || task2Content) && saveWritingRef.current) {
        saveWritingRef.current();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [task1Content, task2Content]); // Empty dependency array - interval created only once

  useEffect(() => {
    // Break time countdown
    if (isBreakPhase && breakTime > 0) {
      const timer = setInterval(() => {
        setBreakTime((prev) => {
          if (prev <= 1) {
            handleBreakTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isBreakPhase, breakTime]);

  useEffect(() => {
    // Writing time countdown
    if (!isBreakPhase && timeRemaining > 0) {
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
  }, [timeRemaining, isBreakPhase]);

  const loadTestData = async () => {
    try {
      const response = await studentApi.getTest();
      setTestData(response.data);

      // Load existing writing responses
      if (response.data.responses) {
        const writingResponses = response.data.responses.filter(r => r.section === 'writing');
        writingResponses.forEach(r => {
          if (r.question_number === 1) {
            setTask1Content(r.answer);
            updateAnswer('writing', 'task1', r.answer);
          } else if (r.question_number === 2) {
            setTask2Content(r.answer);
            updateAnswer('writing', 'task2', r.answer);
          }
        });
      }
    } catch (error) {
      showToast('Failed to load test', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveWriting = async () => {
    try {
      // Save Task 1
      if (task1Content) {
        await studentApi.saveWritingTask(1, task1Content);
      }
      // Save Task 2
      if (task2Content) {
        await studentApi.saveWritingTask(2, task2Content);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Update ref to point to saveWriting function
  saveWritingRef.current = saveWriting;

  const handleTask1Change = (value) => {
    setTask1Content(value);
    updateAnswer('writing', 'task1', value);
    // Debounced save using ref
    if (task1TimeoutRef.current) clearTimeout(task1TimeoutRef.current);
    task1TimeoutRef.current = setTimeout(() => {
      studentApi.saveWritingTask(1, value).catch(console.error);
    }, 2000);
  };

  const handleTask2Change = (value) => {
    setTask2Content(value);
    updateAnswer('writing', 'task2', value);
    // Debounced save using ref
    if (task2TimeoutRef.current) clearTimeout(task2TimeoutRef.current);
    task2TimeoutRef.current = setTimeout(() => {
      studentApi.saveWritingTask(2, value).catch(console.error);
    }, 2000);
  };

  const countWords = (text) => {
    if (!text) return 0;
    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, ' ').trim();
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleTimeout = async () => {
    if (isSubmitting || isBreakPhase) return;

    setIsSubmitting(true);
    await saveWriting();

    try {
      await studentApi.submitTest();
      showToast('Writing time ended. You have a 2-minute break before Speaking.', 'info');
      setIsSubmitting(false);
      setIsBreakPhase(true);
    } catch (error) {
      showToast('Failed to submit test', 'error');
      setIsSubmitting(false);
    }
  };

  const handleBreakTimeout = () => {
    showToast('Break ended. Moving to Speaking section...', 'info');
    navigate('../speaking');
  };

  const handleSubmitEarly = async () => {
    if (window.confirm('Are you sure you want to finish Writing? You cannot return.')) {
      setIsSubmitting(true);
      await saveWriting();
      try {
        await studentApi.submitTest();
        showToast('Writing submitted. You have a 2-minute break before Speaking.', 'info');
        setIsSubmitting(false);
        setIsBreakPhase(true);
      } catch (error) {
        showToast('Failed to submit Writing', 'error');
        setIsSubmitting(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <Loader fullScreen />;

  const task1FileUrl = testData?.files?.writing?.task1_url;
  const task2FileUrl = testData?.files?.writing?.task2_url;
  const task1FileType = task1FileUrl?.split('.').pop()?.toLowerCase() || 'pdf';
  const task2FileType = task2FileUrl?.split('.').pop()?.toLowerCase() || 'pdf';

  const task1WordCount = countWords(task1Content);
  const task2WordCount = countWords(task2Content);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col h-screen overflow-hidden">
      {/* Header with Timer */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-none z-50">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              WRITING SECTION
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Task Switcher */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTask(1)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTask === 1
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Task 1
              </button>
              <button
                onClick={() => setActiveTask(2)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTask === 2
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Task 2
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* DEV MODE: Quick submit and view results */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={async () => {
                  await saveWriting();
                  try {
                    await studentApi.submitTest();
                    showToast('Test submitted! Redirecting to results...', 'success');
                    setTimeout(() => navigate('../finish'), 1000);
                  } catch (error) {
                    showToast('Failed to submit', 'error');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                🚀 DEV: Submit & View Results
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
            <button
              onClick={handleSubmitEarly}
              disabled={isSubmitting || isBreakPhase}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-semibold shadow-md disabled:opacity-50"
            >
              Finish Writing →
            </button>
          </div>
        </div>
      </div>

      {/* Break Phase Overlay */}
      {isBreakPhase && (
        <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center p-8 border-2 border-orange-500 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-orange-600 dark:text-orange-400 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Break Time</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Take a short breath. The Speaking section will start automatically in:
            </p>
            <div className="text-6xl font-black text-orange-600 dark:text-orange-400 font-mono mb-8 tracking-tighter">
              {formatTime(breakTime)}
            </div>
            <div className="space-y-4">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(breakTime / 120) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
                Get ready for your Speaking interview
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Split Screen Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Question/Image */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">INSTRUCTIONS</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>You have 60 minutes to complete both writing tasks</li>
                <li>Task 1: Write at least 150 words (recommended)</li>
                <li>Task 2: Write at least 250 words (recommended)</li>
                <li>Your responses will be automatically saved</li>
              </ul>
            </div>

            {/* Task Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Writing Task {activeTask}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeTask === 1
                  ? 'Spend about 20 minutes on this task (minimum 150 words recommended)'
                  : 'Spend about 40 minutes on this task (minimum 250 words recommended)'}
              </p>
            </div>

            {/* Task 1 Content */}
            {activeTask === 1 && (
              <>
                {testData?.files?.writing?.task1_data?.prompt && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-800 dark:text-gray-200 text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(testData.files.writing.task1_data.prompt) }}
                  />
                )}

                {testData?.files?.writing?.task1_data?.image_url && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white p-4">
                    <img
                      src={testData.files.writing.task1_data.image_url}
                      alt="Writing Task 1"
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                  </div>
                )}

                {!testData?.files?.writing?.task1_data && task1FileUrl && (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <FileViewer
                      fileUrl={task1FileUrl}
                      fileType={task1FileType}
                      className="min-h-[400px]"
                    />
                  </div>
                )}
              </>
            )}

            {/* Task 2 Content */}
            {activeTask === 2 && (
              <>
                {testData?.files?.writing?.task2_data?.prompt && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-800 dark:text-gray-200 text-lg leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(testData.files.writing.task2_data.prompt) }}
                  />
                )}

                {!testData?.files?.writing?.task2_data && task2FileUrl && (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <FileViewer
                      fileUrl={task2FileUrl}
                      fileType={task2FileType}
                      className="min-h-[400px]"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Side: Writing Area */}
        <div className="w-1/2 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Task 1 Editor */}
            {activeTask === 1 && (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden flex-1 flex flex-col">
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Response - Task 1
                  </span>
                  <span className={`text-sm font-semibold ${
                    task1WordCount >= 150
                      ? 'text-green-600 dark:text-green-400'
                      : task1WordCount >= 100
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {task1WordCount} words {task1WordCount < 150 && '(minimum 150 recommended)'}
                  </span>
                </div>
                <div className="flex-1">
                  <ReactQuill
                    theme="snow"
                    value={task1Content}
                    onChange={handleTask1Change}
                    style={{ height: 'calc(100vh - 280px)' }}
                    className="bg-white dark:bg-gray-800 h-full"
                    readOnly={isSubmitting || timeRemaining === 0}
                  />
                </div>
              </div>
            )}

            {/* Task 2 Editor */}
            {activeTask === 2 && (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden flex-1 flex flex-col">
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Response - Task 2
                  </span>
                  <span className={`text-sm font-semibold ${
                    task2WordCount >= 250
                      ? 'text-green-600 dark:text-green-400'
                      : task2WordCount >= 200
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {task2WordCount} words {task2WordCount < 250 && '(minimum 250 recommended)'}
                  </span>
                </div>
                <div className="flex-1">
                  <ReactQuill
                    theme="snow"
                    value={task2Content}
                    onChange={handleTask2Change}
                    style={{ height: 'calc(100vh - 280px)' }}
                    className="bg-white dark:bg-gray-800 h-full"
                    readOnly={isSubmitting || timeRemaining === 0}
                  />
                </div>
              </div>
            )}

            {/* Submission Notice */}
            {isSubmitting && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-300">
                    Grading in Progress...
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-2">
                    Please wait while your test is being graded.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingSection;
