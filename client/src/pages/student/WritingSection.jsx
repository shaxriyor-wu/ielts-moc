import { useEffect, useState } from 'react';
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

const WritingSection = () => {
  const navigate = useNavigate();
  const { answers, updateAnswer } = useExam();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [task1Content, setTask1Content] = useState('');
  const [task2Content, setTask2Content] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    // Auto-save every 30 seconds
    const autoSaveInterval = setInterval(() => {
      if (task1Content || task2Content) {
        saveWriting();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [task1Content, task2Content]);

  useEffect(() => {
    // Writing time countdown
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

  const handleTask1Change = (value) => {
    setTask1Content(value);
    updateAnswer('writing', 'task1', value);
    // Debounced save
    clearTimeout(window.task1SaveTimeout);
    window.task1SaveTimeout = setTimeout(() => {
      studentApi.saveWritingTask(1, value).catch(console.error);
    }, 2000);
  };

  const handleTask2Change = (value) => {
    setTask2Content(value);
    updateAnswer('writing', 'task2', value);
    // Debounced save
    clearTimeout(window.task2SaveTimeout);
    window.task2SaveTimeout = setTimeout(() => {
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
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Save all writing content
    await saveWriting();
    
    // Submit test for grading
    try {
      await studentApi.submitTest();
      showToast('Writing time ended. Grading in progress...', 'info');
      
      // Redirect to grading/results page
      setTimeout(() => {
        navigate('/student/results');
      }, 1000);
    } catch (error) {
      showToast('Failed to submit test', 'error');
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Timer */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              WRITING SECTION
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
              <li>You have 60 minutes to complete both writing tasks</li>
              <li>Task 1: Write at least 150 words (recommended)</li>
              <li>Task 2: Write at least 250 words (recommended)</li>
              <li>Your responses will be automatically saved</li>
              <li>The test will be submitted automatically when time expires</li>
            </ul>
          </div>
        </Card>

        {/* Writing Task 1 */}
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Writing Task 1
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Spend about 20 minutes on this task
            </p>
          </div>

          {/* Task 1 Question Display */}
          {task1FileUrl && (
            <div className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <FileViewer
                fileUrl={task1FileUrl}
                fileType={task1FileType}
                className="min-h-[300px]"
              />
            </div>
          )}

          {/* Task 1 Editor */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Response
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
            <ReactQuill
              theme="snow"
              value={task1Content}
              onChange={handleTask1Change}
              style={{ minHeight: '300px' }}
              className="bg-white dark:bg-gray-800"
              readOnly={isSubmitting || timeRemaining === 0}
            />
          </div>
        </Card>

        {/* Writing Task 2 */}
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Writing Task 2
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Spend about 40 minutes on this task
            </p>
          </div>

          {/* Task 2 Question Display */}
          {task2FileUrl && (
            <div className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <FileViewer
                fileUrl={task2FileUrl}
                fileType={task2FileType}
                className="min-h-[300px]"
              />
            </div>
          )}

          {/* Task 2 Editor */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Response
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
            <ReactQuill
              theme="snow"
              value={task2Content}
              onChange={handleTask2Change}
              style={{ minHeight: '400px' }}
              className="bg-white dark:bg-gray-800"
              readOnly={isSubmitting || timeRemaining === 0}
            />
          </div>
        </Card>

        {/* Submission Notice */}
        {isSubmitting && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-300">
                Grading in Progress...
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-2">
                Please wait while your test is being graded. This may take 10-30 seconds.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WritingSection;
