import { useMemo, useState } from 'react'
import type { Quiz } from './quizData.ts'
import { Markdown } from './Markdown.tsx'
import { clearQuizProgress, loadQuizProgress, saveQuizProgress } from './storage.ts'
import type { QuizAnswer } from './storage.ts'
import { Logo } from './Logo.tsx'
import { Triangle } from './Triangle.tsx'
import { ResetIcon } from './ResetIcon.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { trackEvent } from './analytics.ts'

function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

type Props = {
  quiz: Quiz
  onBack: () => void
}

export function QuizView({ quiz, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  // Per-question pending selection: maps question index → shuffled answer index
  const [pendingSelections, setPendingSelections] = useState<Record<number, number>>({})

  const shuffledOrders = useMemo(
    () => quiz.questions.map((q) => shuffleIndices(q.answers.length)),
    [quiz],
  )

  const [sessionAnswers, setSessionAnswers] = useState<Record<number, QuizAnswer>>(() => {
    const progress = loadQuizProgress(quiz.id)
    return (progress?.answers as Record<number, QuizAnswer>) ?? {}
  })

  const [confirmingClear, setConfirmingClear] = useState(false)
  const hasProgress = Object.keys(sessionAnswers).length > 0

  function handleClearProgress() {
    clearQuizProgress(quiz.id)
    trackEvent('quiz_progress_cleared', {
      quiz_id: quiz.id,
      questions_answered: Object.keys(sessionAnswers).length,
    })
    setSessionAnswers({})
    setPendingSelections({})
    setCurrentIndex(0)
    setConfirmingClear(false)
  }

  const question = quiz.questions[currentIndex]
  const shuffledOrder = shuffledOrders[currentIndex]
  const correctOriginalIndex = question.answers.findIndex((a) => a.isCorrect)

  const currentAnswer = sessionAnswers[currentIndex]
  const isAnswered = currentAnswer !== undefined

  const pendingSelectedIndex = pendingSelections[currentIndex] ?? null

  const effectiveSelectedIndex = isAnswered
    ? shuffledOrder.indexOf(currentAnswer.originalAnswerIndex)
    : pendingSelectedIndex

  function handleSubmit() {
    if (pendingSelectedIndex === null) return
    const originalAnswerIndex = shuffledOrder[pendingSelectedIndex]
    const isCorrect = question.answers[originalAnswerIndex].isCorrect

    const newSessionAnswers = {
      ...sessionAnswers,
      [currentIndex]: { originalAnswerIndex, isCorrect } satisfies QuizAnswer,
    }
    setSessionAnswers(newSessionAnswers)

    saveQuizProgress(quiz.id, {
      questionsAnswered: Object.keys(newSessionAnswers).length,
      correctAnswers: Object.values(newSessionAnswers).filter((a) => a.isCorrect).length,
      totalQuestions: quiz.questions.length,
      answers: newSessionAnswers,
    })
  }

  return (
    <div className="quiz-view">
      {/* ── Logo ── */}
      <div className="quiz-logo-bar">
        <Logo heading={false} />
      </div>

      {/* ── Header ── */}
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>
          <Triangle direction="left" /> Back
        </button>
        <span className="quiz-title">{quiz.name}</span>
        <div className="quiz-header-actions">
          <button
            className="icon-btn"
            onClick={() => setConfirmingClear(true)}
            disabled={!hasProgress}
            aria-label="Clear progress for this quiz"
            title="Clear progress"
          >
            <ResetIcon />
          </button>
          <span className="question-counter">
            {currentIndex + 1} / {quiz.questions.length}
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingClear}
        title="Clear progress?"
        message={`This will erase all of your answers and your score for ${quiz.name}. This can't be undone.`}
        confirmLabel="Clear progress"
        onConfirm={handleClearProgress}
        onCancel={() => setConfirmingClear(false)}
      />

      {/* ── Question ── */}
      <div className="question-card">
        <Markdown>{question.question}</Markdown>
      </div>

      {/* ── Answers ── */}
      <div className="answers-list">
        {shuffledOrder.map((originalIndex, shuffledIdx) => {
          const answer = question.answers[originalIndex]
          const isSelected = effectiveSelectedIndex === shuffledIdx
          const isCorrect = originalIndex === correctOriginalIndex

          let cardClass = 'answer-card'
          if (isAnswered) {
            if (isSelected && isCorrect) cardClass += ' answer-card--correct'
            else if (isSelected && !isCorrect) cardClass += ' answer-card--incorrect'
            else if (!isSelected && isCorrect) cardClass += ' answer-card--correct-reveal'
          } else if (isSelected) {
            cardClass += ' answer-card--selected'
          }

          return (
            <button
              key={originalIndex}
              className={cardClass}
              onClick={() =>
                !isAnswered &&
                setPendingSelections((prev) => ({ ...prev, [currentIndex]: shuffledIdx }))
              }
              disabled={isAnswered}
            >
              <span className="answer-label">{String.fromCharCode(65 + shuffledIdx)}</span>
              <div className="answer-text">
                <Markdown>{answer.answer}</Markdown>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Submit ── */}
      {!isAnswered && pendingSelectedIndex !== null && (
        <button className="submit-btn" onClick={handleSubmit}>
          Submit Answer
        </button>
      )}

      {/* ── Explanation ── */}
      {isAnswered && (
        <div
          className={`explanation ${currentAnswer.isCorrect ? 'explanation--correct' : 'explanation--incorrect'}`}
        >
          <div className="explanation-badge">
            {currentAnswer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </div>
          <div className="explanation-body">
            <Markdown>{question.explanation}</Markdown>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="quiz-nav">
        <button
          className="nav-btn"
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={currentIndex === 0}
        >
          <Triangle direction="left" /> Previous
        </button>

        <div className="question-dots">
          {quiz.questions.map((_, i) => {
            const ans = sessionAnswers[i]
            let dotClass = 'dot'
            if (i === currentIndex) dotClass += ' dot--active'
            if (ans !== undefined) dotClass += ans.isCorrect ? ' dot--correct' : ' dot--incorrect'
            return <button key={i} className={dotClass} onClick={() => setCurrentIndex(i)} />
          })}
        </div>

        <button
          className="nav-btn"
          onClick={() => setCurrentIndex((i) => i + 1)}
          disabled={currentIndex === quiz.questions.length - 1}
        >
          Next <Triangle direction="right" />
        </button>
      </div>
    </div>
  )
}
