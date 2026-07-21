import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModelLoadProgress, TextAnalysis, WorkerRequest, WorkerResponse } from '../lib/textDetection/types'

export type AnalysisStatus = 'idle' | 'loading-model' | 'analyzing' | 'done' | 'error'

export function useTextAnalysis() {
  const workerRef = useRef<Worker | null>(null)
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [progress, setProgress] = useState<ModelLoadProgress | null>(null)
  const [result, setResult] = useState<TextAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('../workers/inference.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      switch (msg.type) {
        case 'status':
          setStatus(msg.stage)
          break
        case 'model-progress':
          setProgress(msg.info)
          break
        case 'result':
          setResult(msg.result)
          setStatus('done')
          break
        case 'error':
          setError(msg.message)
          setStatus('error')
          break
      }
    }
    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  const analyze = useCallback((text: string) => {
    setError(null)
    setResult(null)
    setProgress(null)
    setStatus('loading-model')
    const req: WorkerRequest = { type: 'analyze', text }
    workerRef.current?.postMessage(req)
  }, [])

  return { status, progress, result, error, analyze }
}
