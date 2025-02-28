import * as vscode from 'vscode';
import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { createOllama } from 'ollama-ai-provider';
import { ICommitBodyItem, ICommitMessage, IModelConfig } from '../types';
import { loadCommitPrompt } from './promptLoader';
import { logger } from '../logger';
import { commitMessageSchema } from '../commitSchema';

export class AIService {
  private apiKeys: Record<string, string | undefined> = {
    anthropic: undefined,
    openai: undefined,
    mistral: undefined,
  };

  private ollamaBaseURL: string | undefined;

  constructor() {
    this.loadApiKeys();
    this.loadOllamaConfig();
  }

  private loadApiKeys(): void {
    const config = vscode.workspace.getConfiguration('gitcomai');
    this.apiKeys = {
      anthropic: config.get<string>('anthropicApiKey'),
      openai: config.get<string>('openaiApiKey'),
      mistral: config.get<string>('mistralApiKey'),
    };
    logger.debug('API keys loaded');
  }

  private loadOllamaConfig(): void {
    const config = vscode.workspace.getConfiguration('gitcomai');
    this.ollamaBaseURL = config.get<string>('ollamaBaseURL');
    logger.debug(
      `Ollama base URL: ${
        this.ollamaBaseURL || 'default (http://localhost:11434/api)'
      }`
    );
  }

  public reinitialize(): void {
    logger.debug('Reinitializing AI service');
    this.loadApiKeys();
    this.loadOllamaConfig();
  }

  private getModelInstance(modelConfig: IModelConfig) {
    const { provider, model } = modelConfig;
    logger.debug(`Getting model instance for ${provider}/${model}`);

    switch (provider) {
      case 'anthropic': {
        if (!this.apiKeys.anthropic) {
          throw new Error('Anthropic API key not configured');
        }
        const anthropic = createAnthropic({ apiKey: this.apiKeys.anthropic });
        return { model, provider: anthropic };
      }

      case 'openai': {
        if (!this.apiKeys.openai) {
          throw new Error('OpenAI API key not configured');
        }
        const openai = createOpenAI({ apiKey: this.apiKeys.openai });
        return { model, provider: openai };
      }

      case 'mistral': {
        if (!this.apiKeys.mistral) {
          throw new Error('Mistral API key not configured');
        }
        const mistral = createMistral({ apiKey: this.apiKeys.mistral });
        return { model, provider: mistral };
      }

      case 'ollama': {
        const options = this.ollamaBaseURL
          ? { baseURL: this.ollamaBaseURL }
          : undefined;

        const ollama = createOllama(options);
        return { model, provider: ollama };
      }

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  public async generateCommitMessage(
    diff: string,
    files: string[]
  ): Promise<ICommitMessage | null> {
    try {
      this.reinitialize();

      const config = vscode.workspace.getConfiguration('gitcomai');
      const modelConfig: IModelConfig = config.get('selectedModel') || {
        provider: 'anthropic',
        model: 'claude-3-7-sonnet-latest',
      };

      const prompts = await loadCommitPrompt(diff, files);

      try {
        logger.debug('Generating commit message with AI SDK');

        const { model, provider } = this.getModelInstance(modelConfig);

        const result = await generateObject({
          model: provider(model, { structuredOutputs: true }),
          schema: commitMessageSchema,
          prompt: `${prompts.systemPrompt}\n\n${prompts.userPrompt}`,
        });

        logger.debug(
          `Generated commit message: ${JSON.stringify(result.object)}`
        );

        const commitMessage: ICommitMessage = {
          emoji: result.object.emoji,
          type: result.object.type,
          scope: result.object.scope,
          description: result.object.description,
          body: result.object.body as ICommitBodyItem[] | undefined,
        };

        return commitMessage;
      } catch (error) {
        logger.error('Error generating commit message with AI SDK', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error generating commit message', error);
      vscode.window.showErrorMessage(
        `Error generating commit message: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }
}
