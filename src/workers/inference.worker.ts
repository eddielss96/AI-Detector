/// <reference lib="webworker" />
import { analyzeText } from '../lib/textDetection/analyze'
import type { WorkerRequest, WorkerResponse } from '../lib/textDetection/types'

const post = (msg: WorkerResponse) => (self as unknown as Worker).postMessage(msg)

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { data } = event
  if (data.type !== 'analyze') return

  try {
    const result = await analyzeText(data.text, {
      onStatus: (stage) => post({ type: 'status', stage }),
      onModelProgress: (info) => post({ type: 'model-progress', info }),
    })
    post({ type: 'result', result })
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
