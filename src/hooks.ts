import { useEffect, useRef, useState } from 'react'
import { FeedError } from './data'
import { POLL_MS } from './config'

export interface PollState<T> {
  data: T | null
  error: boolean
  loading: boolean
  updatedAt: number | null
}

export function usePoll<T>(reader: (signal: AbortSignal) => Promise<T>, paused: boolean, revision: number) {
  const [state, setState] = useState<PollState<T>>({ data: null, error: false, loading: true, updatedAt: null })
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined
    let stopped = false
    let failures = 0
    async function run() {
      if (stopped || paused || document.hidden) return
      const currentController = new AbortController()
      controller = currentController
      let delay = POLL_MS
      try {
        const data = await reader(currentController.signal)
        if (stopped || currentController.signal.aborted) return
        failures = 0
        setState({ data, error: false, loading: false, updatedAt: Date.now() })
      } catch (error) {
        if (stopped || currentController.signal.aborted) return
        failures++
        delay = Math.max(POLL_MS * Math.min(2 ** (failures - 1), 15), error instanceof FeedError ? error.retryAfterMs : 0)
        setState(previous => ({ ...previous, error: true, loading: false }))
      }
      if (!stopped) timer = setTimeout(run, delay)
    }
    function visibility() {
      clearTimeout(timer)
      controller?.abort()
      if (!document.hidden) void run()
    }
    document.addEventListener('visibilitychange', visibility)
    void run()
    return () => {
      stopped = true
      clearTimeout(timer)
      controller?.abort()
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [reader, paused, revision])
  return state
}

export interface Sample { time: number; rpm: number | null }
export function useHistory(rpm: number | null, updatedAt: number | null, available: boolean) {
  const [samples, setSamples] = useState<Sample[]>([])
  const previousTime = useRef<number | null>(null)
  useEffect(() => {
    if (!updatedAt || updatedAt === previousTime.current) return
    previousTime.current = updatedAt
    setSamples(current => [...current, { time: updatedAt, rpm: available ? rpm : null }].slice(-1_800))
  }, [rpm, updatedAt, available])
  return samples
}
