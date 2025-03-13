export enum AIProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  MISTRAL = 'mistral',
  OLLAMA = 'ollama',
}

export interface IModelConfig {
  provider: AIProvider;
  model: OpenAIModel | AnthropicModel | MistralModel | string;
}

export enum OpenAIModel {
  GPT_45_PREVIEW = 'gpt-4.5-preview',
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  O1 = 'o1',
  O3_MINI = 'o3-mini',
  O1_MINI = 'o1-mini',
}

export enum AnthropicModel {
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-latest',
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-latest',
  CLAUDE_3_5_HAIKU = 'claude-3-5-haiku-latest',
  CLAUDE_3_OPUS = 'claude-3-opus-latest',
  CLAUDE_3_SONNET = 'claude-3-sonnet-latest',
  CLAUDE_3_HAIKU = 'claude-3-haiku-latest',
}

export enum MistralModel {
  MISTRAL_LARGE = 'mistral-large-latest',
  MISTRAL_SMALL = 'mistral-small-latest',
  CODESTRAL = 'codestral-latest',
  MINISTRAL_8B = 'ministral-8b-latest',
  MINISTRAL_3B = 'ministral-3b-latest',
}

export interface IModelPricing {
  input: number;
  output: number;
}

export type AIModel = OpenAIModel | AnthropicModel | MistralModel;

export const OPENAI_PRICING: Record<OpenAIModel, IModelPricing> = {
  [OpenAIModel.GPT_45_PREVIEW]: {
    input: 75.0,
    output: 150.0,
  },
  [OpenAIModel.GPT_4O]: {
    input: 2.5,
    output: 10.0,
  },
  [OpenAIModel.GPT_4O_MINI]: {
    input: 0.15,
    output: 0.6,
  },
  [OpenAIModel.O1]: {
    input: 15.0,
    output: 60.0,
  },
  [OpenAIModel.O3_MINI]: {
    input: 1.1,
    output: 4.4,
  },
  [OpenAIModel.O1_MINI]: {
    input: 1.1,
    output: 4.4,
  },
};

export const ANTHROPIC_PRICING: Record<AnthropicModel, IModelPricing> = {
  [AnthropicModel.CLAUDE_3_7_SONNET]: {
    input: 3.0,
    output: 15.0,
  },
  [AnthropicModel.CLAUDE_3_5_HAIKU]: {
    input: 0.8,
    output: 4.0,
  },
  [AnthropicModel.CLAUDE_3_OPUS]: {
    input: 15.0,
    output: 75.0,
  },
  [AnthropicModel.CLAUDE_3_5_SONNET]: {
    input: 3.0,
    output: 15.0,
  },
  [AnthropicModel.CLAUDE_3_SONNET]: {
    input: 3.0,
    output: 15.0,
  },
  [AnthropicModel.CLAUDE_3_HAIKU]: {
    input: 0.25,
    output: 1.25,
  },
};

export const MISTRAL_PRICING: Record<MistralModel, IModelPricing> = {
  [MistralModel.MISTRAL_LARGE]: {
    input: 2.0,
    output: 6.0,
  },
  [MistralModel.MISTRAL_SMALL]: {
    input: 0.1,
    output: 0.3,
  },
  [MistralModel.CODESTRAL]: {
    input: 0.3,
    output: 0.9,
  },
  [MistralModel.MINISTRAL_8B]: {
    input: 0.1,
    output: 0.1,
  },
  [MistralModel.MINISTRAL_3B]: {
    input: 0.04,
    output: 0.04,
  },
};

export const ALL_MODEL_PRICING: Record<string, IModelPricing> = {
  ...OPENAI_PRICING,
  ...ANTHROPIC_PRICING,
  ...MISTRAL_PRICING,
};
