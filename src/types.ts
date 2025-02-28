import { CommitBodyItem, CommitMessage } from './commitSchema';

export interface ICommitMessage extends CommitMessage {}

export interface ICommitBodyItem extends CommitBodyItem {}

export interface IPrompts {
  systemPrompt: string;
  userPrompt: string;
}

export interface IGitDiff {
  diff: string;
  workingDirectory: string;
}

/**
 * Types de fournisseurs d'IA supportés
 */
export type AIProvider = 'anthropic' | 'openai' | 'mistral' | 'ollama';

/**
 * Modèles disponibles pour Anthropic
 */
export type AnthropicModel =
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-7-sonnet-latest'
  | 'claude-3-5-haiku-latest'
  | 'claude-3-opus-latest'
  | 'claude-3-sonnet-latest'
  | 'claude-3-haiku-latest'
  | string;

/**
 * Modèles disponibles pour OpenAI
 */
export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'gpt-4'
  | string;

/**
 * Modèles disponibles pour Mistral
 */
export type MistralModel =
  | 'mistral-large-latest'
  | 'mistral-medium-latest'
  | 'mistral-small-latest'
  | string;

/**
 * Modèles disponibles pour Ollama
 * Ces modèles sont des exemples, vous pouvez ajouter vos propres modèles
 */
export type OllamaModel =
  | 'llama3'
  | 'llama3:8b'
  | 'llama3:70b'
  | 'mistral'
  | 'mixtral'
  | 'phi3'
  | 'gemma'
  | 'codellama'
  | string;

/**
 * Type d'union pour tous les modèles possibles
 */
export type AIModel = AnthropicModel | OpenAIModel | MistralModel | OllamaModel;

/**
 * Configuration du modèle d'IA
 */
export interface IModelConfig {
  /**
   * Le fournisseur d'IA à utiliser
   */
  provider: AIProvider;

  /**
   * Le modèle spécifique à utiliser
   */
  model: AIModel;
}
