import {
  AnthropicModel,
  MistralModel,
  OllamaModel,
  OpenAIModel,
} from '../@types/types';

export interface IModelOption {
  label: string;
  value: string;
  description?: string;
}

export const modelOptions: Record<string, IModelOption[]> = {
  anthropic: [
    {
      label: 'Claude 3.5 Sonnet',
      value: AnthropicModel.CLAUDE_3_5_SONNET,
      description: 'Balanced model for most tasks',
    },
    {
      label: 'Claude 3.7 Sonnet',
      value: AnthropicModel.CLAUDE_3_7_SONNET,
      description: 'Latest Sonnet model with improved capabilities',
    },
    {
      label: 'Claude 3.5 Haiku',
      value: AnthropicModel.CLAUDE_3_5_HAIKU,
      description: 'Fast and cost-effective model',
    },
    {
      label: 'Claude 3 Opus',
      value: AnthropicModel.CLAUDE_3_OPUS,
      description: 'Most powerful model for complex tasks',
    },
  ],
  openai: [
    {
      label: 'GPT-4o',
      value: OpenAIModel.GPT_4O,
      description: 'Latest multimodal model',
    },
    {
      label: 'GPT-4 Turbo',
      value: OpenAIModel.GPT_4_TURBO,
      description: 'Powerful model with good balance',
    },
    {
      label: 'GPT-3.5 Turbo',
      value: OpenAIModel.GPT_3_5_TURBO,
      description: 'Fast and cost-effective model',
    },
    {
      label: 'O3 Mini',
      value: OpenAIModel.O3_MINI,
      description: 'Fast, flexible, intelligent reasoning model',
    },
  ],
  mistral: [
    {
      label: 'Mistral Large',
      value: MistralModel.MISTRAL_LARGE,
      description: 'Most capable Mistral model',
    },
    {
      label: 'Mistral Medium',
      value: MistralModel.MISTRAL_MEDIUM,
      description: 'Balanced performance and cost',
    },
    {
      label: 'Mistral Small',
      value: MistralModel.MISTRAL_SMALL,
      description: 'Fast and efficient model',
    },
  ],
  ollama: [
    {
      label: 'Llama 3',
      value: OllamaModel.LLAMA3,
      description: 'Meta Llama 3 (default size)',
    },
    {
      label: 'Llama 3 (8B)',
      value: OllamaModel.LLAMA3_8B,
      description: 'Meta Llama 3 8B - Smaller, faster model',
    },
    {
      label: 'Llama 3 (70B)',
      value: OllamaModel.LLAMA3_70B,
      description: 'Meta Llama 3 70B - Larger, more capable model',
    },
    {
      label: 'Mistral',
      value: OllamaModel.MISTRAL,
      description: 'Mistral 7B open model',
    },
    {
      label: 'Mixtral',
      value: OllamaModel.MIXTRAL,
      description: 'Mixtral 8x7B MoE model',
    },
    {
      label: 'Phi-3',
      value: OllamaModel.PHI3,
      description: 'Microsoft Phi-3 model',
    },
    {
      label: 'Gemma',
      value: OllamaModel.GEMMA,
      description: 'Google Gemma model',
    },
    {
      label: 'CodeLlama',
      value: OllamaModel.CODELLAMA,
      description: 'Meta CodeLlama for code generation',
    },
  ],
};
