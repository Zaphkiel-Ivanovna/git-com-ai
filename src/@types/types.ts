/**
 * Enum pour les fournisseurs d'IA supportés
 */
export enum AIProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  MISTRAL = 'mistral',
  OLLAMA = 'ollama',
}

/**
 * Enum pour les modèles Anthropic
 */
export enum AnthropicModel {
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-latest',
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-latest',
  CLAUDE_3_5_HAIKU = 'claude-3-5-haiku-latest',
  CLAUDE_3_OPUS = 'claude-3-opus-latest',
  CLAUDE_3_SONNET = 'claude-3-sonnet-latest',
  CLAUDE_3_HAIKU = 'claude-3-haiku-latest',
}

/**
 * Enum pour les modèles OpenAI
 */
export enum OpenAIModel {
  GPT_4O = 'gpt-4o',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_4 = 'gpt-4',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  O3_MINI = 'o3-mini',
}

/**
 * Enum pour les modèles Mistral
 */
export enum MistralModel {
  MISTRAL_LARGE = 'mistral-large-latest',
  MISTRAL_MEDIUM = 'mistral-medium-latest',
  MISTRAL_SMALL = 'mistral-small-latest',
}

/**
 * Enum pour les modèles Ollama
 */
export enum OllamaModel {
  LLAMA3 = 'llama3',
  LLAMA3_8B = 'llama3:8b',
  LLAMA3_70B = 'llama3:70b',
  MISTRAL = 'mistral',
  MIXTRAL = 'mixtral',
  PHI3 = 'phi3',
  GEMMA = 'gemma',
  CODELLAMA = 'codellama',
}

/**
 * Interface pour la configuration du modèle
 */
export interface IModelConfig {
  provider: AIProvider;
  model: string;
}

export interface IGitDiff {
  diff: string;
  workingDirectory: string;
}
