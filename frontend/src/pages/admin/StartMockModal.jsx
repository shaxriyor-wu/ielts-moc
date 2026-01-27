import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { CheckCircle, XCircle, Copy, Loader2 } from 'lucide-react';

const StartMockModal = ({ onClose }) => {
  const [step, setStep] = useState(1); // 1: stats, 2: strategy, 3: generating, 4: complete
  const [loading, setLoading] = useState(true);
  const [variantCounts, setVariantCounts] = useState(null);
  const [strategy, setStrategy] = useState('unique');
  const [createdTest, setCreatedTest] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadVariantCounts();
  }, []);

  const loadVariantCounts = async () => {
    try {
      const response = await adminApi.getAvailableVariants();
      setVariantCounts(response.data);
      setLoading(false);
    } catch (error) {
      showToast('Failed to load variant statistics', 'error');
      onClose();
    }
  };

  const handleCreateTest = async () => {
    setGenerating(true);
    setStep(3);

    try {
      const response = await adminApi.createMockTest({
        variant_strategy: strategy,
        duration_minutes: 180,
      });
      setCreatedTest(response.data);
      setStep(4);
      showToast('Mock test created successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to create test', 'error');
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  const copyTestId = () => {
    navigator.clipboard.writeText(createdTest.test_id);
    showToast('Test ID copied to clipboard!', 'success');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );
  }

  // Step 1: Show variant statistics
  if (step === 1) {
    const { counts, has_minimum, missing_sections } = variantCounts;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Test Materials
          </h3>

          {/* Listening */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Listening:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((num) => {
                const count = counts.listening[`section${num}`]?.count || 0;
                return (
                  <div
                    key={num}
                    className={`p-3 rounded-lg border ${
                      count > 0
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {count > 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium">Section {num}</span>
                    </div>
                    <p className="text-lg font-bold mt-1">{count} variants</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reading */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Reading:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => {
                const count = counts.reading[`passage${num}`]?.count || 0;
                return (
                  <div
                    key={num}
                    className={`p-3 rounded-lg border ${
                      count > 0
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {count > 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium">Passage {num}</span>
                    </div>
                    <p className="text-lg font-bold mt-1">{count} variants</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Writing */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Writing:</h4>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((num) => {
                const count = counts.writing[`task${num}`]?.count || 0;
                return (
                  <div
                    key={num}
                    className={`p-3 rounded-lg border ${
                      count > 0
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {count > 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium">Task {num}</span>
                    </div>
                    <p className="text-lg font-bold mt-1">{count} variants</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Speaking */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Speaking:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => {
                const count = counts.speaking[`part${num}`]?.count || 0;
                return (
                  <div
                    key={num}
                    className={`p-3 rounded-lg border ${
                      count > 0
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {count > 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium">Part {num}</span>
                    </div>
                    <p className="text-lg font-bold mt-1">{count} variants</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warning if missing sections */}
          {!has_minimum && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-300 font-medium">
                Cannot create test. Missing sections:
              </p>
              <ul className="list-disc list-inside mt-2 text-red-700 dark:text-red-400">
                {missing_sections.map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => setStep(2)}
            disabled={!has_minimum}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Select strategy
  if (step === 2) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Variant Distribution Strategy
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Choose how variants will be distributed to students
          </p>

          <div className="space-y-3">
            <label
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                strategy === 'same'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <input
                type="radio"
                name="strategy"
                value="same"
                checked={strategy === 'same'}
                onChange={(e) => setStrategy(e.target.value)}
                className="mt-1"
              />
              <div className="ml-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  Same variant for all students
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  All students with this test ID will receive identical test content
                </p>
              </div>
            </label>

            <label
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                strategy === 'unique'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <input
                type="radio"
                name="strategy"
                value="unique"
                checked={strategy === 'unique'}
                onChange={(e) => setStrategy(e.target.value)}
                className="mt-1"
              />
              <div className="ml-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  Unique variant for each student
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Each student receives a different randomized combination
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button variant="success" onClick={handleCreateTest}>
            Create Test
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Generating
  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          Preparing Mock Test...
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Generating test combinations and preparing materials
        </p>
      </div>
    );
  }

  // Step 4: Complete
  if (step === 4 && createdTest) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Test Ready!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Mock test has been successfully created
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Test ID
          </p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-mono font-bold text-blue-700 dark:text-blue-400">
              {createdTest.test_id}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={copyTestId}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Test Details:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Strategy:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {createdTest.variant_strategy === 'same'
                  ? 'Same for all students'
                  : 'Unique for each student'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {createdTest.duration_minutes} minutes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="font-medium text-green-600 dark:text-green-400">Active</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Share this Test ID with students</strong>
            <br />
            Students can join the test by entering this 6-digit code
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default StartMockModal;
