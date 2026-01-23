import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { Mic, MessageSquare, CheckCircle } from 'lucide-react';

const SpeakingSection = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [testData, setTestData] = useState(null);
    const [isFinishing, setIsFinishing] = useState(false);

    useEffect(() => {
        loadTestData();
    }, []);

    const loadTestData = async () => {
        try {
            const response = await studentApi.getTest();
            setTestData(response.data);
        } catch (error) {
            showToast('Failed to load test data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFinishTest = async () => {
        setIsFinishing(true);
        try {
            // In a real scenario, we might save speaking audio or notes here
            showToast('Test completed successfully!', 'success');
            navigate('/student/results');
        } catch (error) {
            showToast('Failed to finish test', 'error');
        } finally {
            setIsFinishing(false);
        }
    };

    if (loading) return <Loader fullScreen />;

    const speakingPrompts = testData?.files?.speaking?.questions_data?.parts || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Mic className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase">Speaking Section</h1>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm('WARNING: Exiting will RESET your progress. Are you sure?')) {
                                navigate('/student/dashboard');
                            }
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        Exit to Dashboard
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-8">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex gap-4">
                        <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                            <h2 className="font-semibold text-blue-900 dark:text-blue-300">INSTRUCTIONS</h2>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                The Speaking section is usually a face-to-face interview.
                                Below are the prompts for your practice. In a real test, your session would be recorded.
                            </p>
                        </div>
                    </div>
                </Card>

                {speakingPrompts.length > 0 ? (
                    speakingPrompts.map((part, idx) => (
                        <Card key={idx} className="overflow-hidden border-l-4 border-l-primary-500">
                            <h3 className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-4 uppercase tracking-wider">
                                Part {idx + 1}: {part.title || 'Introduction'}
                            </h3>
                            <div className="space-y-4 text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                                {part.description && <p className="font-medium mb-4 italic text-gray-600 dark:text-gray-400">{part.description}</p>}
                                <ul className="space-y-3">
                                    {part.questions?.map((q, qIdx) => (
                                        <li key={qIdx} className="flex gap-3">
                                            <span className="text-primary-500 font-bold">•</span>
                                            <span>{q.text || q}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card className="text-center py-12">
                        <Mic className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No speaking prompts available for this test variant.</p>
                    </Card>
                )}

                <div className="flex justify-center pt-8">
                    <button
                        onClick={handleFinishTest}
                        disabled={isFinishing}
                        className="flex items-center gap-2 px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        {isFinishing ? <Loader size="sm" /> : <CheckCircle className="w-6 h-6" />}
                        FINISH FULL MOCK TEST
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpeakingSection;
