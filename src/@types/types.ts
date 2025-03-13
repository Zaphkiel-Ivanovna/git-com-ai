export enum AIProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  MISTRAL = 'mistral',
  OLLAMA = 'ollama',
}

export enum AnthropicModel {
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-latest',
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-latest',
  CLAUDE_3_5_HAIKU = 'claude-3-5-haiku-latest',
  CLAUDE_3_OPUS = 'claude-3-opus-latest',
  CLAUDE_3_SONNET = 'claude-3-sonnet-latest',
  CLAUDE_3_HAIKU = 'claude-3-haiku-latest',
}

export interface IModelConfig {
  provider: AIProvider;
  model: string;
}

export interface IGitDiff {
  diff: string;
  workingDirectory: string;
}

export interface IOllamaModelDetails {
  format: string;
  family: string;
  families: string[] | null;
  parameter_size: string;
  quantization_level: string;
}

export interface IOllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: IOllamaModelDetails;
}

export interface IOllamaTagsResponse {
  models: IOllamaModel[];
}
