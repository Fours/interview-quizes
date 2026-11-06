export type QuizAnswer = {
  originalAnswerIndex: number
  isCorrect: boolean
}

export type StoredQuizProgress = {
  questionsAnswered: number
  correctAnswers: number
  /** Number of questions in the quiz when progress was saved. Missing in progress saved by older versions. */
  totalQuestions?: number
  answers: Record<number, QuizAnswer>
}

const STORAGE_KEY = 'quizProgress'

function loadAll(): Record<string, StoredQuizProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, StoredQuizProgress>) : {}
  } catch {
    return {}
  }
}

export function loadQuizProgress(quizId: string): StoredQuizProgress | undefined {
  return loadAll()[quizId]
}

export function saveQuizProgress(quizId: string, progress: StoredQuizProgress): void {
  const all = loadAll()
  all[quizId] = progress
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function clearQuizProgress(quizId: string): void {
  const all = loadAll()
  delete all[quizId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
