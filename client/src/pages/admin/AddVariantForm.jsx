import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FileUploader from '../../components/FileUploader';
import Progress from '../../components/Progress';
import { showToast } from '../../components/Toast';
import { ChevronLeft, ChevronRight, Upload, FileText, Music } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Reading' },
  { id: 3, name: 'Listening' },
  { id: 4, name: 'Writing' },
];

const AddVariantForm = ({ variant, onSuccess, onCancel }) => {
  // If editing, only allow basic info (step 1)
  const isEditing = !!variant;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({
    name: variant?.name || '',
    duration_minutes: variant?.duration_minutes || 180,
    reading: {
      file: null,
      answerMode: 'text', // 'text' or 'file'
      answersText: '',
      answerFile: null,
    },
    listening: {
      file: null,
      audioFile: null,
      answerMode: 'text',
      answersText: '',
      answerFile: null,
    },
    writing: {
      task1File: null,
      task2File: null,
    },
  });

  // Cleanup audio preview URL to prevent memory leak
  useEffect(() => {
    if (formData.listening.audioFile) {
      const url = URL.createObjectURL(formData.listening.audioFile);
      setAudioPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setAudioPreviewUrl(null);
      };
    } else {
      setAudioPreviewUrl(null);
    }
  }, [formData.listening.audioFile]);

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        showToast('Variant name is required', 'error');
        return false;
      }
      if (!formData.duration_minutes || formData.duration_minutes < 1) {
        showToast('Duration must be at least 1 minute', 'error');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.reading.file) {
        showToast('Reading file is required', 'error');
        return false;
      }
      if (formData.reading.answerMode === 'text' && !formData.reading.answersText.trim()) {
        showToast('Reading answers are required', 'error');
        return false;
      }
      if (formData.reading.answerMode === 'file' && !formData.reading.answerFile) {
        showToast('Reading answer file is required', 'error');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.listening.file) {
        showToast('Listening file is required', 'error');
        return false;
      }
      if (!formData.listening.audioFile) {
        showToast('Listening audio file is required', 'error');
        return false;
      }
      if (formData.listening.answerMode === 'text' && !formData.listening.answersText.trim()) {
        showToast('Listening answers are required', 'error');
        return false;
      }
      if (formData.listening.answerMode === 'file' && !formData.listening.answerFile) {
        showToast('Listening answer file is required', 'error');
        return false;
      }
    } else if (currentStep === 4) {
      if (!formData.writing.task1File) {
        showToast('Writing Task 1 file is required', 'error');
        return false;
      }
      if (!formData.writing.task2File) {
        showToast('Writing Task 2 file is required', 'error');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const parseAnswers = (answersText) => {
    // Parse comma-separated or line-by-line answers
    const lines = answersText.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      return answersText.split(',').map((a) => a.trim()).filter((a) => a);
    }
    return lines.map((line) => line.trim()).filter((line) => line);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      let variantId = variant?.id;

      // If editing, only update basic info (name)
      if (isEditing) {
        await adminApi.updateVariant(variantId, {
          name: formData.name,
          duration_minutes: formData.duration_minutes,
        });
        showToast('Variant updated successfully!', 'success');
        onSuccess();
        return;
      }

      // Step 1: Create variant
      const variantRes = await adminApi.createVariant({
        name: formData.name,
        duration_minutes: formData.duration_minutes,
      });
      variantId = variantRes.data.id;

      // Step 2: Upload Reading file and answers
      await adminApi.uploadTestFile(variantId, 'reading', formData.reading.file);

      if (formData.reading.answerMode === 'text') {
        const readingAnswers = parseAnswers(formData.reading.answersText);
        const answers = readingAnswers.map((answer, index) => ({
          section: 'reading',
          question_number: index + 1,
          correct_answer: answer,
        }));
        await adminApi.createAnswers(variantId, answers);
      } else if (formData.reading.answerFile) {
        // TODO: Parse answer file and create answers
        showToast('Answer file parsing not yet implemented. Please use text input.', 'warning');
      }

      // Step 3: Upload Listening file, audio, and answers
      await adminApi.uploadTestFile(
        variantId,
        'listening',
        formData.listening.file,
        formData.listening.audioFile
      );

      if (formData.listening.answerMode === 'text') {
        const listeningAnswers = parseAnswers(formData.listening.answersText);
        const answers = listeningAnswers.map((answer, index) => ({
          section: 'listening',
          question_number: index + 1,
          correct_answer: answer,
        }));
        await adminApi.createAnswers(variantId, answers);
      } else if (formData.listening.answerFile) {
        // TODO: Parse answer file and create answers
        showToast('Answer file parsing not yet implemented. Please use text input.', 'warning');
      }

      // Step 4: Upload Writing files
      await adminApi.uploadTestFile(variantId, 'writing', formData.writing.task1File, null, 1);
      await adminApi.uploadTestFile(variantId, 'writing', formData.writing.task2File, null, 2);

      showToast('Variant created successfully!', 'success');
      onSuccess();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to create variant', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stepsToShow = isEditing ? [STEPS[0]] : STEPS;
  const progress = isEditing ? 100 : (currentStep / STEPS.length) * 100;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="mb-6">
        {!isEditing && <Progress value={progress} showLabel />}
        <div className="flex justify-between mt-4">
          {stepsToShow.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                step.id <= currentStep
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  step.id < currentStep
                    ? 'bg-primary-600 text-white'
                    : step.id === currentStep
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-2 border-primary-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {step.id < currentStep ? '✓' : step.id}
              </div>
              <p className="text-xs font-medium">{step.name}</p>
            </div>
          ))}
        </div>
        {isEditing && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Only the variant name can be edited. Test content cannot be modified.
          </p>
        )}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Input
              label="Variant Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., IELTS Mock Test 2024 - Variant A"
              required
            />
            <Input
              type="number"
              label="Duration (minutes)"
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration_minutes: parseInt(e.target.value) || 180,
                })
              }
              min="1"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Default: 180 minutes (3 hours) - standard IELTS test duration
            </p>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reading File <span className="text-red-500">*</span>
              </label>
              <FileUploader
                accept=".pdf,.doc,.docx"
                maxSize={25}
                onFileSelect={(file) => {
                  setFormData({
                    ...formData,
                    reading: { ...formData.reading, file },
                  });
                }}
              />
              {formData.reading.file && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Selected: {formData.reading.file.name} (
                  {formatFileSize(formData.reading.file.size)})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Answer Input Method
              </label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="text"
                    checked={formData.reading.answerMode === 'text'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reading: {
                          ...formData.reading,
                          answerMode: e.target.value,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  Text Input
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="file"
                    checked={formData.reading.answerMode === 'file'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reading: {
                          ...formData.reading,
                          answerMode: e.target.value,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  File Upload
                </label>
              </div>

              {formData.reading.answerMode === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Answers (comma-separated or line-by-line)
                  </label>
                  <textarea
                    value={formData.reading.answersText}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reading: {
                          ...formData.reading,
                          answersText: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows="10"
                    placeholder="A, B, C, D, TRUE, FALSE, etc. (one per line or comma-separated)"
                  />
                </div>
              ) : (
                <FileUploader
                  accept=".txt,.csv,.xlsx,.xls"
                  onFileSelect={(file) =>
                    setFormData({
                      ...formData,
                      reading: {
                        ...formData.reading,
                        answerFile: file,
                      },
                    })
                  }
                />
              )}
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Listening Tasks File <span className="text-red-500">*</span>
              </label>
              <FileUploader
                accept=".pdf,.doc,.docx"
                maxSize={25}
                onFileSelect={(file) => {
                  setFormData({
                    ...formData,
                    listening: { ...formData.listening, file },
                  });
                }}
              />
              {formData.listening.file && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Selected: {formData.listening.file.name} (
                  {formatFileSize(formData.listening.file.size)})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Audio File <span className="text-red-500">*</span>
              </label>
              <FileUploader
                accept="audio/*"
                maxSize={100}
                onFileSelect={(file) => {
                  setFormData({
                    ...formData,
                    listening: {
                      ...formData.listening,
                      audioFile: file,
                    },
                  });
                }}
              />
              {formData.listening.audioFile && audioPreviewUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selected: {formData.listening.audioFile.name} (
                    {formatFileSize(formData.listening.audioFile.size)})
                  </p>
                  <audio
                    controls
                    src={audioPreviewUrl}
                    className="w-full mt-2"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Answer Input Method
              </label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="text"
                    checked={formData.listening.answerMode === 'text'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        listening: {
                          ...formData.listening,
                          answerMode: e.target.value,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  Text Input
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="file"
                    checked={formData.listening.answerMode === 'file'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        listening: {
                          ...formData.listening,
                          answerMode: e.target.value,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  File Upload
                </label>
              </div>

              {formData.listening.answerMode === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Answers (comma-separated or line-by-line)
                  </label>
                  <textarea
                    value={formData.listening.answersText}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        listening: {
                          ...formData.listening,
                          answersText: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows="10"
                    placeholder="A, B, C, D, TRUE, FALSE, etc. (one per line or comma-separated)"
                  />
                </div>
              ) : (
                <FileUploader
                  accept=".txt,.csv,.xlsx,.xls"
                  onFileSelect={(file) =>
                    setFormData({
                      ...formData,
                      listening: {
                        ...formData.listening,
                        answerFile: file,
                      },
                    })
                  }
                />
              )}
            </div>
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Writing Task 1 File <span className="text-red-500">*</span>
              </label>
              <FileUploader
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxSize={25}
                onFileSelect={(file) => {
                  setFormData({
                    ...formData,
                    writing: {
                      ...formData.writing,
                      task1File: file,
                    },
                  });
                }}
              />
              {formData.writing.task1File && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Selected: {formData.writing.task1File.name} (
                  {formatFileSize(formData.writing.task1File.size)})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Writing Task 2 File <span className="text-red-500">*</span>
              </label>
              <FileUploader
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxSize={25}
                onFileSelect={(file) => {
                  setFormData({
                    ...formData,
                    writing: {
                      ...formData.writing,
                      task2File: file,
                    },
                  });
                }}
              />
              {formData.writing.task2File && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Selected: {formData.writing.task2File.name} (
                  {formatFileSize(formData.writing.task2File.size)})
                </p>
              )}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                <strong>Note:</strong> Writing tasks will be graded using AI evaluation. No answer key is needed.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          {!isEditing && currentStep > 1 && (
            <Button variant="secondary" onClick={prevStep}>
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          {isEditing ? (
            <Button onClick={handleSubmit} loading={loading}>
              Update Name
            </Button>
          ) : currentStep < STEPS.length ? (
            <Button onClick={nextStep}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Create Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddVariantForm;

