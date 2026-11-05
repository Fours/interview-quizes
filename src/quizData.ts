export type Answer = {
  answer: string
  isCorrect: boolean
}

export type Question = {
  question: string
  explanation: string
  answers: Answer[]
}

export type Quiz = {
  /** Stable unique identifier used as the local storage key and JSON filename. Never change it once published. */
  id: string
  name: string
  questions: Question[]
}

/** An entry in `public/data/index.json`. */
export type QuizSummary = Pick<Quiz, 'id' | 'name'>

/** Every quiz has 10 questions; used on the main page before a quiz's full data has been loaded. */
export const QUESTIONS_PER_QUIZ = 10

const DATA_URL = `${import.meta.env.BASE_URL}data`

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`)
  return (await res.json()) as T
}

export function fetchQuizIndex(signal?: AbortSignal): Promise<QuizSummary[]> {
  return fetchJson<QuizSummary[]>(`${DATA_URL}/index.json`, signal)
}

export function fetchQuiz(id: string, signal?: AbortSignal): Promise<Quiz> {
  return fetchJson<Quiz>(`${DATA_URL}/${encodeURIComponent(id)}.json`, signal)
}
