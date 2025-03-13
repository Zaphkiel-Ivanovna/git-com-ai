import { ALL_MODEL_PRICING, IModelConfig } from '../@types/model.types';

export function calculateCost(
  modelConfig: IModelConfig,
  inputTokens: number,
  outputTokens: number
): number | undefined {
  if (modelConfig.provider === 'ollama') {
    return undefined;
  }

  const pricing = ALL_MODEL_PRICING[modelConfig.model];

  if (!pricing) {
    throw new Error(`Unknown model: ${modelConfig.model}`);
  }

  const inputCost = (pricing.input / 1_000_000) * inputTokens;
  const outputCost = (pricing.output / 1_000_000) * outputTokens;

  const result = inputCost + outputCost;

  return Number(result.toFixed(2));
}
