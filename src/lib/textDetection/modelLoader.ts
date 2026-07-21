import { AutoModelForCausalLM, AutoTokenizer } from '@huggingface/transformers'
import type { ModelLoadProgress } from './types'

export const MODEL_ID = 'onnx-community/Qwen2.5-0.5B'
/**
 * 'q4f16' fails to initialize in onnxruntime (missing node reference during
 * LayerNorm fusion) and 'int8' produces much noisier perplexity than 'q4' in
 * manual testing, so 'q4' is used despite being the larger download.
 */
export const MODEL_DTYPE = 'q4'
/** Approximate one-time download size for the chosen dtype, shown to the user before loading. */
export const MODEL_APPROX_SIZE_MB = 750

interface LoadedModel {
  model: Awaited<ReturnType<typeof AutoModelForCausalLM.from_pretrained>>
  tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>
}

let loadPromise: Promise<LoadedModel> | null = null

export function loadModel(onProgress?: (info: ModelLoadProgress) => void): Promise<LoadedModel> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const progress_callback = onProgress
        ? (info: ModelLoadProgress) => onProgress(info)
        : undefined

      const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, {
        progress_callback,
      })
      const model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
        dtype: MODEL_DTYPE,
        progress_callback,
      })
      return { model, tokenizer }
    })().catch((err) => {
      loadPromise = null
      throw err
    })
  }
  return loadPromise
}
