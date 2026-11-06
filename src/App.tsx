import { useState } from 'react'
import type { CSSProperties } from 'react'
import { fetchQuiz, fetchQuizIndex, iconUrl, QUESTIONS_PER_QUIZ } from './quizData.ts'
import type { QuizSummary } from './quizData.ts'
import { Logo } from './Logo.tsx'
import { Triangle } from './Triangle.tsx'
import { QuizView } from './QuizView.tsx'
import { trackEvent } from './analytics.ts'
import { loadQuizProgress } from './storage.ts'
import { useFetch } from './useFetch.ts'
import './App.css'

function StatusMessage({
  message,
  onRetry,
  onBack,
}: {
  message: string
  onRetry?: () => void
  onBack?: () => void
}) {
  return (
    <div className="status-message" role={onRetry ? 'alert' : 'status'}>
      <p>{message}</p>
      {(onRetry || onBack) && (
        <div className="status-actions">
          {onBack && (
            <button className="nav-btn" onClick={onBack}>
              <Triangle direction="left" /> Back
            </button>
          )}
          {onRetry && (
            <button className="nav-btn" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function QuizCard({ quiz, onSelect }: { quiz: QuizSummary; onSelect: () => void }) {
  const progress = loadQuizProgress(quiz.id)
  const questionsAnswered = progress?.questionsAnswered ?? 0
  const correctAnswers = progress?.correctAnswers ?? 0
  const total = progress?.totalQuestions ?? QUESTIONS_PER_QUIZ
  const pct = total > 0 ? Math.min(100, (questionsAnswered / total) * 100) : 0
  const completed = questionsAnswered >= total && total > 0

  return (
    <button className="quiz-card" onClick={onSelect}>
      <div className="quiz-card-header">
        <div className="quiz-card-title">
          <span className="quiz-name">{quiz.name}</span>
          {completed && <span className="badge">Complete</span>}
        </div>
        {quiz.icon && (
          <span
            className="quiz-icon"
            aria-hidden="true"
            // The SVG is applied as a mask so CSS controls its colour (brand logos and outline icons alike).
            style={{ '--icon-url': `url("${iconUrl(quiz.icon)}")` } as CSSProperties}
          />
        )}
      </div>
      <div className="quiz-stats">
        <div className="stat">
          <span className="stat-label">Progress</span>
          <span className="stat-value">
            {questionsAnswered} / {total}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Score</span>
          <span className="stat-value">{correctAnswers} correct</span>
        </div>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </button>
  )
}

function MainPage({ onSelectQuiz }: { onSelectQuiz: (id: string) => void }) {
  const index = useFetch('index', fetchQuizIndex)

  return (
    <div className="app">
      <header className="header">
        <Logo />
        <p className="header-subtitle">
          Ten questions per quiz. Pick up where you left off - progress is saved automatically.
        </p>
      </header>

      <main className="quiz-list">
        {index.status === 'loading' && <StatusMessage message="Loading quizzes…" />}
        {index.status === 'error' && (
          <StatusMessage message="Couldn't load the quiz list." onRetry={index.retry} />
        )}
        {index.status === 'success' &&
          index.data.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onSelect={() => {
                const progress = loadQuizProgress(quiz.id)
                trackEvent('quiz_opened', {
                  quiz_id: quiz.id,
                  quiz_name: quiz.name,
                  questions_answered: progress?.questionsAnswered ?? 0,
                })
                onSelectQuiz(quiz.id)
              }}
            />
          ))}
      </main>
    </div>
  )
}

function QuizPage({ quizId, onBack }: { quizId: string; onBack: () => void }) {
  const quiz = useFetch(quizId, (signal) => fetchQuiz(quizId, signal))

  if (quiz.status === 'success') {
    return <QuizView key={quiz.data.id} quiz={quiz.data} onBack={onBack} />
  }

  return (
    <div className="quiz-view">
      <div className="quiz-logo-bar">
        <Logo heading={false} />
      </div>
      {quiz.status === 'loading' ? (
        <StatusMessage message="Loading quiz…" />
      ) : (
        <StatusMessage message="Couldn't load this quiz." onRetry={quiz.retry} onBack={onBack} />
      )}
    </div>
  )
}

function App() {
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)

  if (activeQuizId !== null) {
    return <QuizPage quizId={activeQuizId} onBack={() => setActiveQuizId(null)} />
  }

  return <MainPage onSelectQuiz={setActiveQuizId} />
}

export default App
