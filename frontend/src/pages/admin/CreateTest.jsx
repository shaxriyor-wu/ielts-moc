import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../api/adminApi';
import { parseJSON, parseXLSX, parseCSV, parseTextFile } from '../../utils/fileParser';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Form from '../../components/Form';
import FileUploader from '../../components/FileUploader';
import Progress from '../../components/Progress';
import { showToast } from '../../components/Toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ChevronLeft, ChevronRight, Save, Upload, FileText, X } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Reading' },
  { id: 3, name: 'Listening' },
  { id: 4, name: 'Writing' },
  { id: 5, name: 'Answer Key' },
  { id: 6, name: 'Preview' },
];

const CreateTest = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testKey, setTestKey] = useState(null);
  const [testId, setTestId] = useState(null);
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: 180,
    reading: {
      file: null,
      content: '',
      paragraphs: [],
      questions: [],
    },
    listening: {
      scriptFile: null,
      audioFile: null,
      content: '',
      questions: [],
    },
    writing: {
      tasks: [],
    },
    answerKey: {
      reading: {},
      listening: {},
      writing: {},
    },
  });
  const [readingAnswerMode, setReadingAnswerMode] = useState('file'); // 'file' or 'text'
  const [listeningAnswerMode, setListeningAnswerMode] = useState('file'); // 'file' or 'text'
  const [readingAnswersText, setReadingAnswersText] = useState('');
  const [listeningAnswersText, setListeningAnswersText] = useState('');

  const handleFileUpload = async (file, section, type) => {
    try {
      let parsedData;
      
      if (type === 'test') {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'json') {
          parsedData = await parseJSON(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedData = await parseXLSX(file);
        } else if (ext === 'csv') {
          parsedData = await parseCSV(file);
        } else {
          showToast('Unsupported file format', 'error');
          return;
        }

        if (parsedData.questions) {
          setTestData(prev => ({
            ...prev,
            [section]: {
              ...prev[section],
              questions: parsedData.questions,
            },
            answerKey: {
              ...prev.answerKey,
              [section]: parsedData.questions.reduce((acc, q, idx) => {
                acc[q.id || idx + 1] = q.answer;
                return acc;
              }, {}),
            },
          }));
          showToast('Test file parsed successfully', 'success');
        }
      } else if (type === 'text') {
        parsedData = await parseTextFile(file);
        setTestData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            content: parsedData.text,
            paragraphs: parsedData.paragraphs,
            file: file,
          },
        }));
        showToast('File uploaded and parsed', 'success');
      } else {
        setTestData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [type === 'audio' ? 'audioFile' : 'scriptFile']: file,
          },
        }));
        showToast('File uploaded', 'success');
      }
    } catch (error) {
      showToast(error.message || 'Failed to parse file', 'error');
    }
  };

  const addQuestion = (section) => {
    const newQuestion = {
      id: Date.now(),
      question: '',
      options: ['', '', '', ''],
      answer: 0,
    };
    setTestData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        questions: [...prev[section].questions, newQuestion],
      },
    }));
  };

  const updateQuestion = (section, questionId, field, value) => {
    setTestData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        questions: prev[section].questions.map(q =>
          q.id === questionId ? { ...q, [field]: value } : q
        ),
      },
    }));
  };

  const removeQuestion = (section, questionId) => {
    setTestData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        questions: prev[section].questions.filter(q => q.id !== questionId),
      },
      answerKey: {
        ...prev.answerKey,
        [section]: Object.fromEntries(
          Object.entries(prev.answerKey[section]).filter(([key]) => key !== String(questionId))
        ),
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await adminApi.createTest(testData);
      if (response.data.testKey) {
        setTestKey(response.data.testKey);
        setTestId(response.data.testId);
        showToast('Test created successfully! Test key generated.', 'success');
      } else {
        showToast('Test created successfully', 'success');
        navigate('/admin/tests');
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to create test', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      await adminApi.publishTest(testId);
      showToast('Test published successfully', 'success');
      navigate('/admin/tests');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to publish test', 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Test</h2>
        <Button variant="secondary" onClick={() => navigate('/admin/tests')}>
          Cancel
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <Progress value={progress} showLabel />
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  step.id <= currentStep ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  step.id < currentStep
                    ? 'bg-primary-600 text-white'
                    : step.id === currentStep
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-2 border-primary-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                <p className="text-xs font-medium">{step.name}</p>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                <div className="space-y-4">
                  <Input
                    label="Test Title"
                    value={testData.title}
                    onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                    required
                  />
                  <Input
                    label="Description"
                    value={testData.description}
                    onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                  />
                  <Input
                    type="number"
                    label="Duration (minutes)"
                    value={testData.duration}
                    onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </Form>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-6">
                <FileUploader
                  label="Upload Reading File (PDF, TXT, DOCX)"
                  accept=".pdf,.txt,.doc,.docx"
                  onFileSelect={(file) => handleFileUpload(file, 'reading', 'text')}
                />
                
                {testData.reading.content && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reading Content
                    </label>
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 max-h-96 overflow-y-auto">
                      <ReactQuill
                        theme="snow"
                        value={testData.reading.content}
                        onChange={(value) => setTestData(prev => ({
                          ...prev,
                          reading: { ...prev.reading, content: value }
                        }))}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Questions</h3>
                    <Button size="sm" onClick={() => addQuestion('reading')}>
                      Add Question
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {testData.reading.questions.map((q, idx) => (
                      <Card key={q.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium">Question {idx + 1}</span>
                          <Button size="sm" variant="danger" onClick={() => removeQuestion('reading', q.id)}>
                            Remove
                          </Button>
                        </div>
                        <Input
                          label="Question Text"
                          value={q.question}
                          onChange={(e) => updateQuestion('reading', q.id, 'question', e.target.value)}
                          className="mb-3"
                        />
                        <div className="space-y-2 mb-3">
                          {q.options.map((opt, optIdx) => (
                            <Input
                              key={optIdx}
                              label={`Option ${String.fromCharCode(65 + optIdx)}`}
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...q.options];
                                newOptions[optIdx] = e.target.value;
                                updateQuestion('reading', q.id, 'options', newOptions);
                              }}
                            />
                          ))}
                        </div>
                        <Input
                          type="number"
                          label="Correct Answer (0-3)"
                          value={q.answer}
                          onChange={(e) => updateQuestion('reading', q.id, 'answer', parseInt(e.target.value))}
                        />
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-6">
                <FileUploader
                  label="Upload Listening Script File"
                  accept=".pdf,.txt,.doc,.docx"
                  onFileSelect={(file) => handleFileUpload(file, 'listening', 'text')}
                />
                <FileUploader
                  label="Upload Listening Audio File"
                  accept="audio/*"
                  onFileSelect={(file) => handleFileUpload(file, 'listening', 'audio')}
                />

                {testData.listening.audioFile && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Audio Preview
                    </label>
                    <audio controls src={URL.createObjectURL(testData.listening.audioFile)} className="w-full" />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Questions</h3>
                    <Button size="sm" onClick={() => addQuestion('listening')}>
                      Add Question
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {testData.listening.questions.map((q, idx) => (
                      <Card key={q.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium">Question {idx + 1}</span>
                          <Button size="sm" variant="danger" onClick={() => removeQuestion('listening', q.id)}>
                            Remove
                          </Button>
                        </div>
                        <Input
                          label="Question Text"
                          value={q.question}
                          onChange={(e) => updateQuestion('listening', q.id, 'question', e.target.value)}
                          className="mb-3"
                        />
                        <div className="space-y-2 mb-3">
                          {q.options.map((opt, optIdx) => (
                            <Input
                              key={optIdx}
                              label={`Option ${String.fromCharCode(65 + optIdx)}`}
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...q.options];
                                newOptions[optIdx] = e.target.value;
                                updateQuestion('listening', q.id, 'options', newOptions);
                              }}
                            />
                          ))}
                        </div>
                        <Input
                          type="number"
                          label="Correct Answer (0-3)"
                          value={q.answer}
                          onChange={(e) => updateQuestion('listening', q.id, 'answer', parseInt(e.target.value))}
                        />
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Writing Tasks</h3>
                  <Button size="sm" onClick={() => {
                    setTestData(prev => ({
                      ...prev,
                      writing: {
                        tasks: [...prev.writing.tasks, { id: Date.now(), title: '', content: '' }]
                      }
                    }));
                  }}>
                    Add Task
                  </Button>
                </div>
                {testData.writing.tasks.map((task, idx) => (
                  <Card key={task.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-medium">Task {idx + 1}</span>
                      <Button size="sm" variant="danger" onClick={() => {
                        setTestData(prev => ({
                          ...prev,
                          writing: {
                            tasks: prev.writing.tasks.filter(t => t.id !== task.id)
                          }
                        }));
                      }}>
                        Remove
                      </Button>
                    </div>
                    <Input
                      label="Task Title"
                      value={task.title}
                      onChange={(e) => {
                        const newTasks = [...testData.writing.tasks];
                        newTasks[idx].title = e.target.value;
                        setTestData(prev => ({ ...prev, writing: { tasks: newTasks } }));
                      }}
                      className="mb-3"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Task Content
                      </label>
                      <ReactQuill
                        theme="snow"
                        value={task.content}
                        onChange={(value) => {
                          const newTasks = [...testData.writing.tasks];
                          newTasks[idx].content = value;
                          setTestData(prev => ({ ...prev, writing: { tasks: newTasks } }));
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-6">
                <Card title="Reading Answer Key">
                  <div className="space-y-2">
                    {testData.reading.questions.map((q, idx) => (
                      <div key={q.id} className="flex items-center gap-4">
                        <span className="w-24 font-medium">Q{idx + 1}:</span>
                        <Input
                          type="text"
                          value={testData.answerKey.reading[q.id] || ''}
                          onChange={(e) => setTestData(prev => ({
                            ...prev,
                            answerKey: {
                              ...prev.answerKey,
                              reading: { ...prev.answerKey.reading, [q.id]: e.target.value }
                            }
                          }))}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Listening Answer Key">
                  <div className="space-y-2">
                    {testData.listening.questions.map((q, idx) => (
                      <div key={q.id} className="flex items-center gap-4">
                        <span className="w-24 font-medium">Q{idx + 1}:</span>
                        <Input
                          type="text"
                          value={testData.answerKey.listening[q.id] || ''}
                          onChange={(e) => setTestData(prev => ({
                            ...prev,
                            answerKey: {
                              ...prev.answerKey,
                              listening: { ...prev.answerKey.listening, [q.id]: e.target.value }
                            }
                          }))}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {currentStep === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-6">
                <Card>
                  <h3 className="text-lg font-semibold mb-4">Test Preview</h3>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Basic Information</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Title: {testData.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Description: {testData.description || 'No description'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Duration: {testData.duration} minutes
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Reading Section</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testData.reading.questions.length} questions
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Listening Section</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testData.listening.questions.length} questions
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Writing Section</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testData.writing.tasks.length} tasks
                      </p>
                    </div>
                  </div>
                </Card>

                {testKey && (
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-300">
                      Test Key Generated
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                          Test Key
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={testKey}
                            readOnly
                            className="font-mono text-lg font-bold"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(testKey);
                              showToast('Test key copied!', 'success');
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                          Share this key with students to access the test
                        </p>
                      </div>
                      <Button onClick={handlePublish} className="w-full" loading={loading}>
                        Publish Test
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={nextStep}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : testKey ? (
            <Button onClick={() => navigate('/admin/tests')}>
              Go to Tests
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              <Save className="w-4 h-4" /> Create Test
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateTest;
