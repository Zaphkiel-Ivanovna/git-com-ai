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
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  O1 = 'o1',
  O3_MINI = 'o3-mini',
  O1_MINI = 'o1-mini',
  GPT_45_PREVIEW = 'gpt-4.5-preview',
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

export interface IModelDetails {
  title: string;
  description: string;
  inputPrice: number; // Price per 1M tokens for input
  outputPrice: number; // Price per 1M tokens for output
}

export type AIModel = OpenAIModel | AnthropicModel | MistralModel;

export const OPENAI_MODEL_DETAILS: Record<OpenAIModel, IModelDetails> = {
  [OpenAIModel.GPT_4O]: {
    title: 'GPT-4o',
    description: 'Multimodal model with strong reasoning and coding abilities',
    inputPrice: 2.5,
    outputPrice: 10.0,
  },
  [OpenAIModel.GPT_4O_MINI]: {
    title: 'GPT-4o Mini',
    description: 'Smaller, faster version of GPT-4o with good performance',
    inputPrice: 0.15,
    outputPrice: 0.6,
  },
  [OpenAIModel.O1]: {
    title: 'o1',
    description: "OpenAI's most powerful reasoning model",
    inputPrice: 15.0,
    outputPrice: 60.0,
  },
  [OpenAIModel.O3_MINI]: {
    title: 'o3-mini',
    description: 'Compact multimodal model with good performance',
    inputPrice: 1.1,
    outputPrice: 4.4,
  },
  [OpenAIModel.O1_MINI]: {
    title: 'o1-mini',
    description: 'Smaller version of o1 with efficient reasoning capabilities',
    inputPrice: 1.1,
    outputPrice: 4.4,
  },
  [OpenAIModel.GPT_45_PREVIEW]: {
    title: 'GPT-4.5 Preview',
    description:
      "OpenAI's most advanced model with enhanced reasoning capabilities",
    inputPrice: 75.0,
    outputPrice: 150.0,
  },
};

export const ANTHROPIC_MODEL_DETAILS: Record<AnthropicModel, IModelDetails> = {
  [AnthropicModel.CLAUDE_3_7_SONNET]: {
    title: 'Claude 3.7 Sonnet',
    description:
      'Latest Sonnet model with enhanced reasoning and coding abilities',
    inputPrice: 3.0,
    outputPrice: 15.0,
  },
  [AnthropicModel.CLAUDE_3_5_HAIKU]: {
    title: 'Claude 3.5 Haiku',
    description: 'Fast and efficient model for everyday tasks',
    inputPrice: 0.8,
    outputPrice: 4.0,
  },
  [AnthropicModel.CLAUDE_3_OPUS]: {
    title: 'Claude 3 Opus',
    description: "Anthropic's most powerful model for complex reasoning",
    inputPrice: 15.0,
    outputPrice: 75.0,
  },
  [AnthropicModel.CLAUDE_3_5_SONNET]: {
    title: 'Claude 3.5 Sonnet',
    description: 'Balanced model with strong reasoning capabilities',
    inputPrice: 3.0,
    outputPrice: 15.0,
  },
  [AnthropicModel.CLAUDE_3_SONNET]: {
    title: 'Claude 3 Sonnet',
    description: 'Versatile model for a wide range of tasks',
    inputPrice: 3.0,
    outputPrice: 15.0,
  },
  [AnthropicModel.CLAUDE_3_HAIKU]: {
    title: 'Claude 3 Haiku',
    description: 'Fast and cost-effective model for simpler tasks',
    inputPrice: 0.25,
    outputPrice: 1.25,
  },
};

export const MISTRAL_MODEL_DETAILS: Record<MistralModel, IModelDetails> = {
  [MistralModel.MISTRAL_LARGE]: {
    title: 'Mistral Large',
    description: "Mistral's most powerful model for complex tasks",
    inputPrice: 2.0,
    outputPrice: 6.0,
  },
  [MistralModel.MISTRAL_SMALL]: {
    title: 'Mistral Small',
    description: 'Efficient model for everyday tasks',
    inputPrice: 0.1,
    outputPrice: 0.3,
  },
  [MistralModel.CODESTRAL]: {
    title: 'Codestral',
    description: 'Specialized model for code generation and understanding',
    inputPrice: 0.3,
    outputPrice: 0.9,
  },
  [MistralModel.MINISTRAL_8B]: {
    title: 'Ministral 8B',
    description: 'Compact 8B parameter model with good performance',
    inputPrice: 0.1,
    outputPrice: 0.1,
  },
  [MistralModel.MINISTRAL_3B]: {
    title: 'Ministral 3B',
    description: 'Lightweight 3B parameter model for simple tasks',
    inputPrice: 0.04,
    outputPrice: 0.04,
  },
};

export const ALL_MODEL_DETAILS: Record<string, IModelDetails> = {
  ...OPENAI_MODEL_DETAILS,
  ...ANTHROPIC_MODEL_DETAILS,
  ...MISTRAL_MODEL_DETAILS,
};
