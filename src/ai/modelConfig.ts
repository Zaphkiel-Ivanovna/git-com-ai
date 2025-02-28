export interface IModelOption {
  label: string;
  value: string;
  description?: string;
}

export const modelOptions: Record<string, IModelOption[]> = {
  anthropic: [
    {
      label: 'Claude 3.5 Sonnet',
      value: 'claude-3-5-sonnet-latest',
      description: 'Balanced model for most tasks',
    },
    {
      label: 'Claude 3.7 Sonnet',
      value: 'claude-3-7-sonnet-latest',
      description: 'Latest Sonnet model with improved capabilities',
    },
    {
      label: 'Claude 3.5 Haiku',
      value: 'claude-3-5-haiku-latest',
      description: 'Fast and cost-effective model',
    },
    {
      label: 'Claude 3 Opus',
      value: 'claude-3-opus-latest',
      description: 'Most powerful model for complex tasks',
    },
  ],
  openai: [
    {
      label: 'GPT-4o',
      value: 'gpt-4o',
      description: 'Latest multimodal model',
    },
    {
      label: 'GPT-4 Turbo',
      value: 'gpt-4-turbo',
      description: 'Powerful model with good balance',
    },
    {
      label: 'GPT-3.5 Turbo',
      value: 'gpt-3.5-turbo',
      description: 'Fast and cost-effective model',
    },
  ],
  mistral: [
    {
      label: 'Mistral Large',
      value: 'mistral-large-latest',
      description: 'Most capable Mistral model',
    },
    {
      label: 'Mistral Medium',
      value: 'mistral-medium-latest',
      description: 'Balanced performance and cost',
    },
    {
      label: 'Mistral Small',
      value: 'mistral-small-latest',
      description: 'Fast and efficient model',
    },
  ],
  ollama: [
    {
      label: 'Llama 3',
      value: 'llama3',
      description: 'Meta Llama 3 (default size)',
    },
    {
      label: 'Llama 3 (8B)',
      value: 'llama3:8b',
      description: 'Meta Llama 3 8B - Smaller, faster model',
    },
    {
      label: 'Llama 3 (70B)',
      value: 'llama3:70b',
      description: 'Meta Llama 3 70B - Larger, more capable model',
    },
    {
      label: 'Mistral',
      value: 'mistral',
      description: 'Mistral 7B open model',
    },
    {
      label: 'Mixtral',
      value: 'mixtral',
      description: 'Mixtral 8x7B MoE model',
    },
    {
      label: 'Phi-3',
      value: 'phi3',
      description: 'Microsoft Phi-3 model',
    },
    {
      label: 'Gemma',
      value: 'gemma',
      description: 'Google Gemma model',
    },
    {
      label: 'CodeLlama',
      value: 'codellama',
      description: 'Meta CodeLlama for code generation',
    },
  ],
};
