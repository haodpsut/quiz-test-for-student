import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QuizQuestion, QuizStatus } from './types';
import { generateQuizQuestions } from './services/geminiService';

// --- Helper Functions & UI Components ---

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
  <pre className="bg-gray-800 p-4 rounded-md mt-2">
    <code className="font-mono text-sm text-cyan-300">{code}</code>
  </pre>
);

const Loader: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center text-center p-8">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mb-4"></div>
    <p className="text-lg font-semibold text-indigo-300">{message}</p>
    <p className="text-gray-400 mt-1">This may take a few moments...</p>
  </div>
);

interface TopicSelectorProps {
  topic: string;
  setTopic: (topic: string) => void;
  onStart: () => void;
  isLoading: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ topic, setTopic, onStart, isLoading }) => (
  <div className="w-full max-w-lg text-center">
    <h1 className="text-5xl font-bold text-white mb-2">CodeMaster Quiz</h1>
    <p className="text-lg text-gray-300 mb-8">Test your programming knowledge with AI-generated quizzes.</p>
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter a topic, e.g., 'Class and Object in C++'"
        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={isLoading}
      />
      <button
        onClick={onStart}
        disabled={!topic.trim() || isLoading}
        className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? 'Generating...' : 'Start Quiz'}
      </button>
    </div>
  </div>
);

interface QuizAreaProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  userAnswer: string | null;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
  time: number;
}

const QuizArea: React.FC<QuizAreaProps> = ({ question, questionNumber, totalQuestions, onAnswer, userAnswer, onNext, onBack, onFinish, time }) => {
    const { questionText, answerOptions, correctAnswer, explanationText } = question;
    const isAnswered = userAnswer !== null;

    const [mainText, codeSnippet] = useMemo(() => {
        const codeBlockRegex = /```[\s\S]*?```/g;
        const match = questionText.match(codeBlockRegex);
        if (match) {
            const code = match[0].replace(/```(cpp|javascript|python|java)?\n/,'').replace(/```/,'').trim();
            const text = questionText.replace(match[0], '').trim();
            return [text, code];
        }
        return [questionText, null];
    }, [questionText]);

    const handleAnswerClick = (answer: string) => {
        if (!isAnswered) {
            onAnswer(answer);
        }
    };
    
    const getButtonClass = (option: string) => {
        if (!isAnswered) {
            return "bg-gray-700 hover:bg-gray-600";
        }
        if (option === correctAnswer) {
            return "bg-green-600 text-white";
        }
        if (option === userAnswer && option !== correctAnswer) {
            return "bg-red-600 text-white";
        }
        return "bg-gray-800 text-gray-400 cursor-not-allowed opacity-70";
    };

    return (
        <div className="w-full max-w-3xl p-8 bg-gray-800 rounded-xl shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <p className="text-indigo-400 font-semibold">Question {questionNumber} / {totalQuestions}</p>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-indigo-300 font-mono text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{formatTime(time)}</span>
                </div>
            </div>
            <div>
                <p className="text-xl text-white leading-relaxed">{mainText}</p>
                {codeSnippet && <CodeBlock code={codeSnippet} />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {answerOptions.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswerClick(option)}
                        disabled={isAnswered}
                        className={`p-4 rounded-lg text-left font-medium transition-all duration-300 ${getButtonClass(option)}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {isAnswered && (
                 <div className="mt-6 p-4 rounded-lg bg-gray-900 animate-fade-in-slow">
                    <h3 className={`text-lg font-bold ${userAnswer === correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
                        {userAnswer === correctAnswer ? 'Correct!' : `Incorrect. The correct answer is: ${correctAnswer}`}
                    </h3>
                    <p className="mt-2 text-gray-300">{explanationText}</p>
                </div>
            )}
            <div className="flex justify-between mt-8">
                <button 
                    onClick={onBack}
                    disabled={questionNumber === 1}
                    className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    Back
                </button>
                {questionNumber < totalQuestions ? (
                    <button 
                        onClick={onNext}
                        disabled={!isAnswered}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                ) : (
                    <button 
                        onClick={onFinish}
                        disabled={!isAnswered}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 disabled:bg-green-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Finish Quiz
                    </button>
                )}
            </div>
        </div>
    );
};


interface ScoreDisplayProps {
  score: number;
  totalQuestions: number;
  onRestart: () => void;
  isLoading: boolean;
  time: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, totalQuestions, onRestart, isLoading, time }) => (
    <div className="w-full max-w-md text-center p-8 bg-gray-800 rounded-xl shadow-2xl animate-fade-in">
        <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
        <p className="text-lg text-gray-300 mb-6">Your final score is:</p>
        <p className="text-6xl font-bold text-indigo-400">{score} / {totalQuestions}</p>
        <p className="text-md text-gray-400 mt-4 mb-8">Total time: <span className="font-semibold text-indigo-300">{formatTime(time)}</span></p>
        <button
            onClick={onRestart}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
            {isLoading ? 'Generating New Questions...' : 'Restart Quiz with New Questions'}
        </button>
    </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [quizStatus, setQuizStatus] = useState<QuizStatus>(QuizStatus.NOT_STARTED);
  const [topic, setTopic] = useState<string>('Class and Object in C++');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [time, setTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timerId: number | undefined;
    if (quizStatus === QuizStatus.IN_PROGRESS) {
      timerId = window.setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [quizStatus]);

  const fetchQuestions = useCallback(async () => {
    if (!topic.trim()) return;

    setQuizStatus(QuizStatus.LOADING);
    setError(null);
    try {
      const newQuestions = await generateQuizQuestions(topic);
      if (newQuestions.length < 10) {
        throw new Error("The AI generated fewer than 10 questions. Please try again with a clearer topic.");
      }
      setQuestions(newQuestions);
      setUserAnswers(new Array(newQuestions.length).fill(null));
      setCurrentQuestionIndex(0);
      setScore(0);
      setTime(0);
      setQuizStatus(QuizStatus.IN_PROGRESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setQuizStatus(QuizStatus.NOT_STARTED);
    }
  }, [topic]);

  const handleStartQuiz = () => fetchQuestions();
  const handleRestartQuiz = () => fetchQuestions();

  const handleAnswer = (selectedAnswer: string) => {
    if (userAnswers[currentQuestionIndex] !== null) return; // Prevent changing answer

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    if (questions[currentQuestionIndex].correctAnswer === selectedAnswer) {
      setScore(prevScore => prevScore + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleFinish = () => {
    setQuizStatus(QuizStatus.FINISHED);
  };

  const renderContent = () => {
    switch (quizStatus) {
      case QuizStatus.LOADING:
        return <Loader message={`Generating a fresh quiz on "${topic}"...`} />;
      case QuizStatus.IN_PROGRESS:
        return (
          <QuizArea
            question={questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            userAnswer={userAnswers[currentQuestionIndex]}
            onNext={handleNext}
            onBack={handleBack}
            onFinish={handleFinish}
            time={time}
          />
        );
      case QuizStatus.FINISHED:
        return (
          <ScoreDisplay
            score={score}
            totalQuestions={questions.length}
            onRestart={handleRestartQuiz}
            isLoading={quizStatus === QuizStatus.LOADING}
            time={time}
          />
        );
      case QuizStatus.NOT_STARTED:
      default:
        return (
          <TopicSelector
            topic={topic}
            setTopic={setTopic}
            onStart={handleStartQuiz}
            isLoading={quizStatus === QuizStatus.LOADING}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        {error && quizStatus === QuizStatus.NOT_STARTED && (
            <div className="w-full max-w-lg bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        {renderContent()}
    </div>
  );
};

export default App;
