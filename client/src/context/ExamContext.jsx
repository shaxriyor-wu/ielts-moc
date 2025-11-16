import { createContext, useContext, useState } from 'react';

const ExamContext = createContext(null);

export const ExamProvider = ({ children }) => {
  const [examData, setExamData] = useState(null);
  const [currentSection, setCurrentSection] = useState('reading');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({
    reading: {},
    listening: {},
    writing: {},
  });
  const [highlights, setHighlights] = useState([]);
  const [markedQuestions, setMarkedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);

  const updateAnswer = (section, questionId, value) => {
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
  };

  const addHighlight = (highlight) => {
    // If highlight is an array, replace all highlights
    if (Array.isArray(highlight)) {
      setHighlights(highlight);
    } else {
      setHighlights(prev => [...prev, highlight]);
    }
  };

  const removeHighlight = (index) => {
    setHighlights(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMarkQuestion = (questionId) => {
    setMarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  return (
    <ExamContext.Provider value={{
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
      markedQuestions,
      toggleMarkQuestion,
      timeRemaining,
      setTimeRemaining,
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

