import { useState } from 'react'
import { quizes } from './quizes.ts'
import { QuizView } from './QuizView.tsx'
import { loadQuizProgress } from './storage.ts'
import './App.css'

function MainPage({ onSelectQuiz }: { onSelectQuiz: (index: number) => void }) {
  return (
    <div className="app">
      <header className="header">
        <p className="header-eyebrow">Senior Software Engineer</p>
        <h1>Interview Quizzes</h1>
        <p className="header-subtitle">
          Ten questions per quiz. Pick up where you left off — progress is saved automatically.
        </p>
      </header>

      <main className="quiz-list">
        {quizes.map((quiz, index) => {
          const progress = loadQuizProgress(quiz.name)
          const questionsAnswered = progress?.questionsAnswered ?? 0
          const correctAnswers = progress?.correctAnswers ?? 0
          const total = quiz.questions.length
          const pct = total > 0 ? (questionsAnswered / total) * 100 : 0
          const completed = questionsAnswered >= total && total > 0

          return (
            <button key={quiz.name} className="quiz-card" onClick={() => onSelectQuiz(index)}>
              <div className="quiz-card-header">
                <span className="quiz-name">{quiz.name}</span>
                {completed && <span className="badge">Complete</span>}
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
        })}
      </main>
    </div>
  )
}

function App() {
  const [activeQuizIndex, setActiveQuizIndex] = useState<number | null>(null)

  if (activeQuizIndex !== null) {
    return (
      <QuizView quiz={quizes[activeQuizIndex]} onBack={() => setActiveQuizIndex(null)} />
    )
  }

  return <MainPage onSelectQuiz={setActiveQuizIndex} />
}

export default App
