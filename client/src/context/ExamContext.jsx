import { createContext, useContext, useState, useCallback } from 'react';

const ExamContext = createContext(null);

export const ExamProvider = ({ children }) => {
  // All state is initialized with default values - NO localStorage
  const [examData, setExamData] = useState(null);
  const [currentSection, setCurrentSection] = useState('listening');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({ reading: {}, listening: {}, writing: {} });
  const [highlights, setHighlights] = useState([]);
  const [listeningHighlights, setListeningHighlights] = useState([]);
  const [markedQuestions, setMarkedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(3600); // Default 1 hour
  const [studentName, setStudentName] = useState({ firstName: '', lastName: '' });
  const [audioResetKey, setAudioResetKey] = useState(0);

  const updateAnswer = useCallback((section, questionId, value) => {
    setAnswers(prev => {
      // If questionId is an object, treat it as bulk update
      if (typeof questionId === 'object' && questionId !== null) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            ...questionId,
          },
        };
      }
      // Otherwise, single answer update
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [questionId]: value,
        },
      };
    });
  }, []);

  const addHighlight = useCallback((highlight) => {
    // If highlight is an array, replace all highlights
    if (Array.isArray(highlight)) {
      setHighlights(highlight);
    } else {
      setHighlights(prev => [...prev, highlight]);
    }
  }, []);

  const removeHighlight = useCallback((index) => {
    setHighlights(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlights([]);
  }, []);

  // Listening-specific highlights
  const addListeningHighlight = useCallback((highlight) => {
    if (Array.isArray(highlight)) {
      setListeningHighlights(highlight);
    } else {
      setListeningHighlights(prev => [...prev, highlight]);
    }
  }, []);

  const removeListeningHighlight = useCallback((index) => {
    setListeningHighlights(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearListeningHighlights = useCallback(() => {
    setListeningHighlights([]);
  }, []);

  const toggleMarkQuestion = useCallback((questionId) => {
    setMarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  // Complete reset for new test entry
  const clearExam = useCallback(() => {
    setExamData(null);
    setCurrentSection('listening');
    setCurrentQuestion(0);
    setAnswers({ reading: {}, listening: {}, writing: {} });
    setHighlights([]);
    setListeningHighlights([]);
    setMarkedQuestions(new Set());
    setTimeRemaining(3600);
    setStudentName({ firstName: '', lastName: '' });
    // Increment audio reset key to force audio component remount
    setAudioResetKey(prev => prev + 1);
  }, []);

  // Reset for re-entering a test (same as clearExam but can be called explicitly)
  const resetForNewTest = useCallback(() => {
    clearExam();
  }, [clearExam]);

  return (
    <ExamContext.Provider value={{
      // State
      examData,
      setExamData,
      currentSection,
      setCurrentSection,
      currentQuestion,
      setCurrentQuestion,
      answers,
      updateAnswer,
      highlights,
      addHighlight,
      removeHighlight,
      clearHighlights,
      listeningHighlights,
      addListeningHighlight,
      removeListeningHighlight,
      clearListeningHighlights,
      markedQuestions,
      toggleMarkQuestion,
      timeRemaining,
      setTimeRemaining,
      studentName,
      setStudentName,
      audioResetKey,
      // Actions
      clearExam,
      resetForNewTest,
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within ExamProvider');
  }
  return context;
};
