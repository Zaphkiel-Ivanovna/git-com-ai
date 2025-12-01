export enum AIProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  MISTRAL = 'mistral',
  OLLAMA = 'ollama',
  GOOGLE = 'google',
}

export interface IModelConfig {
  provider: AIProvider;
  model: OpenAIModel | AnthropicModel | MistralModel | GoogleModel | string;
}

export enum OpenAIModel {
  GPT_5 = 'gpt-5',
  GPT_5_MINI = 'gpt-5-mini',
  GPT_5_NANO = 'gpt-5-nano',
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_41 = 'gpt-4.1',
  GPT_41_MINI = 'gpt-4.1-mini',
  GPT_41_NANO = 'gpt-4.1-nano',
  O1 = 'o1',
  O1_MINI = 'o1-mini',
  O3 = 'o3',
  O3_MINI = 'o3-mini',
  O4_MINI = 'o4-mini',
}

export enum AnthropicModel {
  CLAUDE_OPUS_4_1 = 'claude-opus-4-1',
  CLAUDE_OPUS_4 = 'claude-opus-4-0',
  CLAUDE_SONNET_4 = 'claude-sonnet-4-0',
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-latest',
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-latest',
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

export enum GoogleModel {
  GEMINI_2_5_PRO_EXPERIMENTAL = 'gemini-2.5-pro-exp-03-25',
  GEMINI_2_0_FLASH = 'gemini-2.0-flash',
  GEMINI_2_0_FLASH_LITE = 'gemini-2.0-flash-lite',
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
  GEMINI_1_5_FLASH = 'gemini-1.5-flash',
}

export interface IModelDetails {
  title: string;
  description: string;
  inputPrice: number; // Price per 1M tokens for input
  outputPrice: number; // Price per 1M tokens for output
}

export type AIModel = OpenAIModel | AnthropicModel | MistralModel | GoogleModel;

export const OPENAI_MODEL_DETAILS: Record<OpenAIModel, IModelDetails> = {
  [OpenAIModel.GPT_5]: {
    title: 'GPT-5',
    description:
      'The best model for coding and agentic tasks across industries',
    inputPrice: 1.25,
    outputPrice: 10.0,
  },
  [OpenAIModel.GPT_5_MINI]: {
    title: 'GPT-5 mini',
    description: 'A faster, cheaper version of GPT-5 for well-defined tasks',
    inputPrice: 0.25,
    outputPrice: 2.0,
  },
  [OpenAIModel.GPT_5_NANO]: {
    title: 'GPT-5 nano',
    description:
      'The fastest, cheapest version of GPT-5—great for summarization and classification tasks',
    inputPrice: 0.05,
    outputPrice: 0.4,
  },
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
    description: 'Previous full o-series reasoning model',
    inputPrice: 15.0,
    outputPrice: 60.0,
  },
  [OpenAIModel.O1_MINI]: {
    title: 'o1-mini',
    description: 'A small model alternative to o1',
    inputPrice: 1.1,
    outputPrice: 4.4,
  },
  [OpenAIModel.O3_MINI]: {
    title: 'o3-mini',
    description: 'A small model alternative to o3',
    inputPrice: 1.1,
    outputPrice: 4.4,
  },
  [OpenAIModel.O3]: {
    title: 'o3',
    description: 'Our most powerful reasoning model',
    inputPrice: 10.0,
    outputPrice: 40.0,
  },
  [OpenAIModel.GPT_41]: {
    title: 'gpt-4.1',
    description: 'Flagship GPT model for complex tasks',
    inputPrice: 2.0,
    outputPrice: 8.0,
  },
  [OpenAIModel.GPT_41_MINI]: {
    title: 'gpt-4.1-mini',
    description: 'Balanced for intelligence, speed, and cost',
    inputPrice: 0.4,
    outputPrice: 1.6,
  },
  [OpenAIModel.GPT_41_NANO]: {
    title: 'gpt-4.1-nano',
    description: 'Fastest, most cost-effective GPT-4.1 model',
    inputPrice: 0.1,
    outputPrice: 0.4,
  },
  [OpenAIModel.O4_MINI]: {
    title: 'o4-mini',
    description: 'Faster, more affordable reasoning model',
    inputPrice: 1.1,
    outputPrice: 4.4,
  },
};

export const ANTHROPIC_MODEL_DETAILS: Record<AnthropicModel, IModelDetails> = {
  [AnthropicModel.CLAUDE_OPUS_4_1]: {
    title: 'Claude Opus 4.1',
    description: 'Our most capable model',
    inputPrice: 15.0,
    outputPrice: 75.0,
  },
  [AnthropicModel.CLAUDE_OPUS_4]: {
    title: 'Claude Opus 4',
    description: 'Our previous flagship model',
    inputPrice: 15.0,
    outputPrice: 75.0,
  },
  [AnthropicModel.CLAUDE_SONNET_4]: {
    title: 'Claude Sonnet 4',
    description: 'High-performance model',
    inputPrice: 3.0,
    outputPrice: 15.0,
  },
  [AnthropicModel.CLAUDE_3_7_SONNET]: {
    title: 'Claude Sonnet 3.7',
    description: 'High-performance model with early extended thinking',
    inputPrice: 3.0,
    outputPrice: 15.0,
  },
  [AnthropicModel.CLAUDE_3_5_SONNET]: {
    title: 'Claude Sonnet 3.5',
    description: 'Our previous intelligent model',
    inputPrice: 3.0,
    outputPrice: 15.0,
  },
  [AnthropicModel.CLAUDE_3_5_HAIKU]: {
    title: 'Claude Haiku 3.5',
    description: 'Our fastest model',
    inputPrice: 0.8,
    outputPrice: 4.0,
  },
  [AnthropicModel.CLAUDE_3_OPUS]: {
    title: 'Claude Opus 3',
    description: "Anthropic's most powerful model for complex reasoning",
    inputPrice: 15.0,
    outputPrice: 75.0,
  },
  [AnthropicModel.CLAUDE_3_SONNET]: {
    title: 'Claude 3 Sonnet',
    description: 'Versatile model for a wide range of tasks',
    inputPrice: 3.0,
    outputPrice: 15.0,
  },
  [AnthropicModel.CLAUDE_3_HAIKU]: {
    title: 'Claude Haiku 3',
    description: 'Fast and compact model for near-instant responsiveness',
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

export const GOOGLE_MODEL_DETAILS: Record<GoogleModel, IModelDetails> = {
  [GoogleModel.GEMINI_2_5_PRO_EXPERIMENTAL]: {
    title: 'Gemini 2.5 Pro Experimental',
    description: 'High-end model for advanced tasks, coding, and reasoning.',
    inputPrice: 2.5,
    outputPrice: 15.0,
  },
  [GoogleModel.GEMINI_2_0_FLASH]: {
    title: 'Gemini 2.0 Flash',
    description: 'Fast, multimodal model designed for efficient execution.',
    inputPrice: 0.1,
    outputPrice: 0.4,
  },
  [GoogleModel.GEMINI_2_0_FLASH_LITE]: {
    title: 'Gemini 2.0 Flash Lite',
    description: 'Ultra-lightweight model for large-scale deployments.',
    inputPrice: 0.075,
    outputPrice: 0.3,
  },
  [GoogleModel.GEMINI_1_5_PRO]: {
    title: 'Gemini 1.5 Pro',
    description: 'Advanced generation model with long context support.',
    inputPrice: 1.0,
    outputPrice: 5.0,
  },
  [GoogleModel.GEMINI_1_5_FLASH]: {
    title: 'Gemini 1.5 Flash',
    description: 'Performance-optimized model for low-latency use cases.',
    inputPrice: 0.35,
    outputPrice: 1.4,
  },
};

export const ALL_MODEL_DETAILS: Record<string, IModelDetails> = {
  ...OPENAI_MODEL_DETAILS,
  ...ANTHROPIC_MODEL_DETAILS,
  ...MISTRAL_MODEL_DETAILS,
  ...GOOGLE_MODEL_DETAILS,
};
