'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | setup | in_progress | completed
  const [interviewConfig, setInterviewConfig] = useState({
    companyType: '',
    difficulty: '',
    role: '',
  });

  const startSession = useCallback((data) => {
    setSessionId(data.session_id);
    setQuestions(data.questions || []);
    setCurrentIndex(0);
    setAnswers([]);
    setStatus('in_progress');
  }, []);

  const addAnswer = useCallback((answer) => {
    setAnswers((prev) => [...prev, answer]);
  }, []);

  const nextQuestionIndex = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const endSession = useCallback(() => {
    setStatus('completed');
  }, []);

  const resetSession = useCallback(() => {
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setStatus('idle');
    setInterviewConfig({ companyType: '', difficulty: '', role: '' });
  }, []);

  return (
    <InterviewContext.Provider
      value={{
        sessionId,
        questions,
        currentIndex,
        answers,
        status,
        interviewConfig,
        setInterviewConfig,
        startSession,
        addAnswer,
        nextQuestionIndex,
        endSession,
        resetSession,
        setSessionId,
        setQuestions,
        setCurrentIndex,
        setStatus,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterviewContext() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterviewContext must be used within an InterviewProvider');
  }
  return context;
}

export default InterviewContext;
