import { useEffect, useState } from 'react'

export type FetchState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

/**
 * Runs `load` whenever `key` changes and tracks its loading/success/error state.
 * In-flight requests are aborted when the key changes or the component unmounts.
 */
export function useFetch<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
): FetchState<T> & { retry: () => void } {
  const [state, setState] = useState<{ key: string; attempt: number; result: FetchState<T> }>({
    key,
    attempt: 0,
    result: { status: 'loading' },
  })
  const [attempt, setAttempt] = useState(0)

  // Reset to loading synchronously when the key or attempt changes, so stale data is never shown.
  if (state.key !== key || state.attempt !== attempt) {
    setState({ key, attempt, result: { status: 'loading' } })
  }

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(
      (data) => setState({ key, attempt, result: { status: 'success', data } }),
      (error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          key,
          attempt,
          result: { status: 'error', error: error instanceof Error ? error : new Error(String(error)) },
        })
      },
    )
    return () => controller.abort()
    // `load` is intentionally excluded: callers pass inline functions keyed by `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const result = state.key === key && state.attempt === attempt ? state.result : { status: 'loading' as const }
  return { ...result, retry: () => setAttempt((a) => a + 1) }
}
