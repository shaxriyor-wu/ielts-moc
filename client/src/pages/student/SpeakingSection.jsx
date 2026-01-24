import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import AudioRecorder from '../../components/AudioRecorder';
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { Mic, MessageSquare, CheckCircle, ChevronRight, Clock, AlertCircle } from 'lucide-react';

// Sample speaking questions based on Cambridge IELTS format
const SAMPLE_SPEAKING_QUESTIONS = {
    part1: {
        topic: 'Neighbours',
        questions: [
            'How well do you know the people who live next door to you?',
            'How often do you see them? Why/Why not?',
            'What kinds of problems do people sometimes have with their neighbours?',
            'How do you think neighbours can help each other?'
        ]
    },
    part2: {
        prompt: 'Describe a time when you were asked to give your opinion in a questionnaire or survey',
        points: [
            'what the questionnaire/survey was about',
            'why you were asked to give your opinions',
            'what opinions you gave'
        ],
        final: 'and explain how you felt about giving your opinions in this questionnaire/survey.'
    },
    part3: {
        topics: [
            {
                title: 'Asking questions',
                questions: [
                    'What kinds of organisations want to find out about people\'s opinions?',
                    'Do you think that questionnaires or surveys are good ways of finding out people\'s opinions?',
                    'What reasons might people have for not wanting to give their opinions?'
                ]
            },
            {
                title: 'Questionnaires in school',
                questions: [
                    'Do you think it would be a good idea for schools to ask students their opinions about lessons?',
                    'What would the advantages for schools be if they asked students their opinions?',
                    'Would there be any disadvantages in asking students\' opinions?'
                ]
            }
        ]
    }
};

const SpeakingSection = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [questionsData, setQuestionsData] = useState(null);
    const [studentTestId, setStudentTestId] = useState(null);
    const [currentPart, setCurrentPart] = useState(1);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [recordings, setRecordings] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [prepTime, setPrepTime] = useState(60);
    const [isPreparing, setIsPreparing] = useState(false);

    useEffect(() => {
        loadSpeakingQuestions();
    }, []);

    useEffect(() => {
        let timer;
        if (isPreparing && prepTime > 0) {
            timer = setInterval(() => {
                setPrepTime(prev => {
                    if (prev <= 1) {
                        setIsPreparing(false);
                        showToast('Preparation time is over. You can start speaking now.', 'info');
                        return 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPreparing, prepTime]);

    const loadSpeakingQuestions = async () => {
        try {
            const response = await studentApi.getSpeakingQuestions();
            const data = response.data.questions_data;
            // Use API data if available, otherwise use sample questions
            if (data && Object.keys(data).length > 0) {
                setQuestionsData(data);
            } else {
                setQuestionsData(SAMPLE_SPEAKING_QUESTIONS);
            }
            setStudentTestId(response.data.student_test_id);
        } catch (error) {
            // Use sample questions as fallback when API fails
            console.log('Using sample speaking questions');
            setQuestionsData(SAMPLE_SPEAKING_QUESTIONS);
        } finally {
            setLoading(false);
        }
    };

    const handleRecordingComplete = async (audioBlob, partNumber, questionNumber) => {
        const key = `part${partNumber}_q${questionNumber || 0}`;

        // Save recording locally
        setRecordings(prev => ({
            ...prev,
            [key]: audioBlob
        }));

        // Upload to server
        try {
            await studentApi.uploadSpeakingAudio(partNumber, questionNumber, audioBlob);
            showToast('Recording uploaded successfully', 'success');
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to upload recording';
            showToast(errorMessage, 'error');
            console.error('Error uploading recording:', error.response?.data || error.message);
        }
    };

    const handleNextQuestion = () => {
        if (currentPart === 1) {
            const part1Questions = questionsData?.part1?.questions || [];
            if (currentQuestion < part1Questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                setCurrentPart(2);
                setCurrentQuestion(0);
            }
        } else if (currentPart === 3) {
            const part3Topics = questionsData?.part3?.topics || [];
            let totalQuestions = 0;
            part3Topics.forEach(topic => {
                totalQuestions += topic.questions.length;
            });

            if (currentQuestion < totalQuestions - 1) {
                setCurrentQuestion(currentQuestion + 1);
            }
        }
    };

    const handleStartPart2 = () => {
        setIsPreparing(true);
        setPrepTime(60);
    };

    const handleNextPart = () => {
        if (currentPart === 1) {
            setCurrentPart(2);
            setCurrentQuestion(0);
        } else if (currentPart === 2) {
            setCurrentPart(3);
            setCurrentQuestion(0);
        }
    };

    const handleFinishSpeaking = async () => {
        if (window.confirm('Are you sure you want to finish the Speaking section? Your recordings will be transcribed and graded.')) {
            setIsSubmitting(true);
            try {
                const response = await studentApi.transcribeAndGradeSpeaking();
                showToast('Speaking section completed successfully!', 'success');
                navigate('/student/results');
            } catch (error) {
                showToast('Failed to process speaking section', 'error');
                console.error('Error processing speaking:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const renderPart1 = () => {
        const part1 = questionsData?.part1;
        if (!part1) return null;

        const questions = part1.questions || [];
        const question = questions[currentQuestion];

        return (
            <div className="space-y-6">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex gap-4">
                        <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                            <h2 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Part 1: Interview</h2>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Topic: <span className="font-semibold">{part1.topic}</span>
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                Answer the questions briefly (2-4 sentences each).
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Question {currentQuestion + 1} of {questions.length}
                        </h3>
                        <span className="text-sm text-gray-500">Part 1</span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6">
                        <p className="text-lg text-gray-800 dark:text-gray-200">{question}</p>
                    </div>

                    <AudioRecorder
                        key={`part1_q${currentQuestion + 1}`}
                        onRecordingComplete={handleRecordingComplete}
                        maxDuration={60}
                        autoStop={false}
                        partNumber={1}
                        questionNumber={currentQuestion + 1}
                    />

                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        {currentQuestion < questions.length - 1 ? (
                            <button
                                onClick={handleNextQuestion}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                Next Question
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleNextPart}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                Continue to Part 2
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </Card>
            </div>
        );
    };

    const renderPart2 = () => {
        const part2 = questionsData?.part2;
        if (!part2) return null;

        return (
            <div className="space-y-6">
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex gap-4">
                        <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0" />
                        <div>
                            <h2 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Part 2: Individual Long Turn</h2>
                            <p className="text-sm text-purple-800 dark:text-purple-200">
                                You have 1 minute to prepare and make notes. Then speak for 1-2 minutes.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {part2.prompt}
                    </h3>

                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6">
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-3">You should say:</p>
                        <ul className="space-y-2 ml-4">
                            {part2.points?.map((point, idx) => (
                                <li key={idx} className="flex gap-2 text-gray-700 dark:text-gray-300">
                                    <span className="text-purple-500">•</span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                        {part2.final && (
                            <p className="mt-3 text-gray-700 dark:text-gray-300">{part2.final}</p>
                        )}
                    </div>

                    {isPreparing && (
                        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                <div>
                                    <p className="font-semibold text-yellow-900 dark:text-yellow-300">
                                        Preparation Time: {prepTime} seconds remaining
                                    </p>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        Make notes and organize your thoughts
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPreparing(false)}
                                className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Skip Preparation & Start Recording
                            </button>
                        </div>
                    )}

                    {!isPreparing && (
                        <>
                            {!recordings['part2_q0'] && (
                                <button
                                    onClick={handleStartPart2}
                                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors mb-4"
                                >
                                    Start 1-Minute Preparation Timer
                                </button>
                            )}

                            <AudioRecorder
                                onRecordingComplete={handleRecordingComplete}
                                maxDuration={120}
                                autoStop={true}
                                partNumber={2}
                                questionNumber={null}
                            />

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleNextPart}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    Continue to Part 3
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        );
    };

    const renderPart3 = () => {
        const part3 = questionsData?.part3;
        if (!part3) return null;

        const topics = part3.topics || [];
        let allQuestions = [];
        topics.forEach(topic => {
            topic.questions.forEach(q => {
                allQuestions.push({ topic: topic.title, question: q });
            });
        });

        const currentQ = allQuestions[currentQuestion];

        return (
            <div className="space-y-6">
                <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                    <div className="flex gap-4">
                        <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400 shrink-0" />
                        <div>
                            <h2 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Part 3: Discussion</h2>
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                                Give detailed answers with explanations and examples.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Question {currentQuestion + 1} of {allQuestions.length}
                        </h3>
                        <span className="text-sm text-gray-500">Part 3: {currentQ?.topic}</span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6">
                        <p className="text-lg text-gray-800 dark:text-gray-200">{currentQ?.question}</p>
                    </div>

                    <AudioRecorder
                        key={`part3_q${currentQuestion + 1}`}
                        onRecordingComplete={handleRecordingComplete}
                        maxDuration={120}
                        autoStop={false}
                        partNumber={3}
                        questionNumber={currentQuestion + 1}
                    />

                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        {currentQuestion < allQuestions.length - 1 ? (
                            <button
                                onClick={handleNextQuestion}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                Next Question
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinishSpeaking}
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader size="sm" /> : <CheckCircle className="w-5 h-5" />}
                                Finish Speaking Test
                            </button>
                        )}
                    </div>
                </Card>
            </div>
        );
    };

    if (loading) return <Loader fullScreen />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Mic className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase">Speaking Section</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Part {currentPart} of 3
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm('WARNING: Exiting will lose your progress. Are you sure?')) {
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

            <div className="max-w-4xl mx-auto p-6">
                {currentPart === 1 && renderPart1()}
                {currentPart === 2 && renderPart2()}
                {currentPart === 3 && renderPart3()}
            </div>
        </div>
    );
};

export default SpeakingSection;
