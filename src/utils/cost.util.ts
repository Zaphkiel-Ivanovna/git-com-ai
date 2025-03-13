import { ALL_MODEL_DETAILS, IModelConfig } from '../@types/model.types';

export function calculateCost(
  modelConfig: IModelConfig,
  inputTokens: number,
  outputTokens: number
): number | undefined {
  if (modelConfig.provider === 'ollama') {
    return undefined;
  }

  const { inputPrice, outputPrice } = ALL_MODEL_DETAILS[modelConfig.model];

  if (!inputPrice || !outputPrice) {
    throw new Error(`Unknown model: ${modelConfig.model}`);
  }

  const inputCost = (inputPrice / 1_000_000) * inputTokens;
  const outputCost = (outputPrice / 1_000_000) * outputTokens;

  const result = inputCost + outputCost;

  return Number(result.toFixed(2));
}
