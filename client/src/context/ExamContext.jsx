import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ExamContext = createContext(null);

export const ExamProvider = ({ children }) => {
  // Load initial state from sessionStorage if available
  const loadInitialState = () => {
    try {
      const savedState = sessionStorage.getItem('examState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        return {
          answers: parsed.answers || { reading: {}, listening: {}, writing: {} },
          highlights: parsed.highlights || [],
          listeningHighlights: parsed.listeningHighlights || [],
          timeRemaining: parsed.timeRemaining || 3600,
          currentSection: parsed.currentSection || 'listening',
          currentQuestion: parsed.currentQuestion || 0,
          markedQuestions: new Set(parsed.markedQuestions || [])
        };
      }
    } catch (error) {
      console.error('Failed to load exam state:', error);
    }
    return null;
  };

  const initialState = loadInitialState();

  const [examData, setExamData] = useState(null);
  const [currentSection, setCurrentSection] = useState(initialState?.currentSection || 'listening');
  const [currentQuestion, setCurrentQuestion] = useState(initialState?.currentQuestion || 0);
  const [answers, setAnswers] = useState(initialState?.answers || { reading: {}, listening: {}, writing: {} });
  const [highlights, setHighlights] = useState(initialState?.highlights || []);
  const [listeningHighlights, setListeningHighlights] = useState(initialState?.listeningHighlights || []);
  const [markedQuestions, setMarkedQuestions] = useState(initialState?.markedQuestions || new Set());
  const [timeRemaining, setTimeRemaining] = useState(initialState?.timeRemaining || 3600);
  const [studentName, setStudentName] = useState({ firstName: '', lastName: '' });
  const [audioResetKey, setAudioResetKey] = useState(0);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (examData) {
      try {
        const stateToSave = {
          answers,
          highlights,
          listeningHighlights,
          timeRemaining,
          currentSection,
          currentQuestion,
          markedQuestions: Array.from(markedQuestions)
        };
        sessionStorage.setItem('examState', JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Failed to save exam state:', error);
      }
    }
  }, [answers, highlights, listeningHighlights, timeRemaining, currentSection, currentQuestion, markedQuestions, examData]);

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
    // Clear sessionStorage
    try {
      sessionStorage.removeItem('examState');
    } catch (error) {
      console.error('Failed to clear exam state:', error);
    }
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
