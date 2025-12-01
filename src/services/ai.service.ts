import * as vscode from 'vscode';
import { streamObject, UnsupportedFunctionalityError } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import { logger } from '../utils/logger.util';
import { commitMessageSchema, ICommitMessage } from '../models/commit.schema';
import { loadCommitPrompt } from '../utils/prompt-loader.util';
import {
  IModelConfig,
  AIProvider,
  AnthropicModel,
  OpenAIModel,
} from '../@types/model.types';
import { calculateCost } from '../utils/cost.util';
import { formatCommitMessage } from '../utils/format.util';
import { Repository, InputBox } from '../@types/git';
import { ollamaService } from './ollama.service';

const MODELS_USING_MAX_OUTPUT_TOKENS = [
  OpenAIModel.GPT_5,
  OpenAIModel.GPT_5_MINI,
  OpenAIModel.GPT_5_NANO,
] as const;

// Type definitions for StreamObject parameters
interface StreamObjectUsage {
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  totalTokens: number | undefined;
  reasoningTokens?: number | undefined;
  cachedInputTokens?: number | undefined;
}

interface StreamObjectFinishResult {
  usage: StreamObjectUsage;
  object: ICommitMessage | undefined;
}

interface StreamObjectErrorEvent {
  error: unknown;
}

export class AIService {
  private apiKeys: Record<string, string | undefined> = {
    anthropic: undefined,
    openai: undefined,
    mistral: undefined,
    google: undefined,
  };

  constructor() {
    this.loadApiKeys();

    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('gitcomai')) {
        logger.debug('Configuration changed, reloading AI service');
        this.reinitialize();
      }
    });
  }

  private loadApiKeys(): void {
    const config = vscode.workspace.getConfiguration('gitcomai');
    this.apiKeys = {
      anthropic: config.get<string>('anthropicApiKey'),
      openai: config.get<string>('openaiApiKey'),
      mistral: config.get<string>('mistralApiKey'),
      google: config.get<string>('googleApiKey'),
    };
    logger.debug('API keys loaded');
  }

  public reinitialize(): void {
    logger.debug('Reinitializing AI service');
    this.loadApiKeys();
  }

  private getModelInstance(modelConfig: IModelConfig) {
    const { provider, model } = modelConfig;
    logger.debug(`Getting model instance for ${provider}/${model}`);

    switch (provider) {
      case AIProvider.ANTHROPIC: {
        if (!this.apiKeys.anthropic) {
          throw new Error('Anthropic API key not configured');
        }
        const anthropic = createAnthropic({ apiKey: this.apiKeys.anthropic });
        return { model, provider: anthropic };
      }

      case AIProvider.OPENAI: {
        if (!this.apiKeys.openai) {
          throw new Error('OpenAI API key not configured');
        }
        const openai = createOpenAI({
          apiKey: this.apiKeys.openai,
        });
        return { model, provider: openai };
      }

      case AIProvider.MISTRAL: {
        if (!this.apiKeys.mistral) {
          throw new Error('Mistral API key not configured');
        }
        const mistral = createMistral({ apiKey: this.apiKeys.mistral });
        return { model, provider: mistral };
      }

      case AIProvider.GOOGLE: {
        if (!this.apiKeys.google) {
          throw new Error('Google API key not configured');
        }
        const google = createGoogleGenerativeAI({
          apiKey: this.apiKeys.google,
        });
        return { model, provider: google };
      }

      case AIProvider.OLLAMA: {
        const ollama = ollamaService.getProvider();
        return { model, provider: ollama };
      }

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private getGitInputBox(repository?: Repository): InputBox | null {
    try {
      if (repository) {
        return repository.inputBox;
      }
      return null;
    } catch (error) {
      logger.error('Error getting Git input box', error);
      return null;
    }
  }

  public async generateCommitMessage(
    diff: string,
    files: string[],
    progress: vscode.Progress<{ message?: string; increment?: number }>,
    token: vscode.CancellationToken,
    repository?: Repository
  ): Promise<ICommitMessage | null> {
    try {
      this.reinitialize();

      const config = vscode.workspace.getConfiguration('gitcomai');
      const modelConfig: IModelConfig = config.get('selectedModel') || {
        provider: AIProvider.ANTHROPIC,
        model: AnthropicModel.CLAUDE_3_7_SONNET,
      };

      const prompts = await loadCommitPrompt(diff, files);

      try {
        logger.debug('Generating commit message with AI SDK using stream');

        const { model, provider } = this.getModelInstance(modelConfig);

        const gitInputBox = this.getGitInputBox(repository);
        let commitMessage: ICommitMessage = {
          emoji: '' as never,
          type: '' as never,
          scope: '',
          description: '',
          body: [],
        };

        const controller = new AbortController();
        token.onCancellationRequested(() => {
          controller.abort();
          logger.debug('Commit generation cancelled by user');
        });

        try {
          return new Promise<ICommitMessage | null>((resolve, reject) => {
            const modelInstance = provider(model);

            const usesMaxOutputTokens =
              modelConfig.provider === AIProvider.OPENAI &&
              MODELS_USING_MAX_OUTPUT_TOKENS.includes(
                model as (typeof MODELS_USING_MAX_OUTPUT_TOKENS)[number]
              );

            const onErrorHandler = ({ error }: StreamObjectErrorEvent) => {
              if (UnsupportedFunctionalityError.isInstance(error)) {
                logger.error(
                  'Unsupported functionality error',
                  JSON.stringify(error)
                );
                reject(
                  error instanceof Error ? error : new Error(String(error))
                );
              }

              logger.error(
                'Error generating commit message',
                JSON.stringify(error)
              );
              reject(error instanceof Error ? error : new Error(String(error)));
            };

            const onFinishHandler = ({
              usage,
              object,
            }: StreamObjectFinishResult) => {
              logger.debug(`Usage: ${JSON.stringify(usage)}`);

              const cost = calculateCost(
                modelConfig,
                usage.inputTokens || 0,
                usage.outputTokens || 0
              );

              const totalTokens =
                usage.totalTokens ||
                (usage.inputTokens || 0) + (usage.outputTokens || 0);

              if (cost) {
                progress.report({
                  message: `Commit usage: ${totalTokens} tokens (Cost: $${cost})`,
                  increment: 100,
                });
              } else {
                progress.report({
                  message: `Commit usage: ${totalTokens} tokens`,
                  increment: 100,
                });
              }

              // Use the object from the stream if available, otherwise use the accumulated commitMessage
              const finalMessage = object || commitMessage;

              if (finalMessage && gitInputBox) {
                const finalFormattedMessage = formatCommitMessage(finalMessage);
                gitInputBox.value = finalFormattedMessage;
              }

              logger.debug(
                `Generated commit message: ${JSON.stringify(finalMessage)}`
              );

              logger.debug(`Cost: $${cost}`);

              resolve(finalMessage || null);
            };

            // TODO: Fix this type error when the AI SDK is updated
            const { partialObjectStream, warnings } = streamObject({
              model: modelInstance,
              schema: commitMessageSchema,
              temperature: config.temperature,
              prompt: `${prompts.systemPrompt}\n\n${prompts.userPrompt}`,
              abortSignal: controller.signal,
              onError: onErrorHandler,
              onFinish: onFinishHandler,
              reasoningEffort: 'minimal',
              ...(usesMaxOutputTokens
                ? { maxOutputTokens: config.maxTokens }
                : { maxTokens: config.maxTokens }),
            } as never);

            logger.debug('Temperature: ' + config.temperature);
            logger.debug('Max tokens: ' + config.maxTokens);
            logger.debug('Model: ' + modelConfig.model);
            logger.debug('Provider: ' + modelConfig.provider);

            (async () => {
              try {
                for await (const chunk of partialObjectStream) {
                  logger.debug(JSON.stringify(chunk));
                  if (chunk && typeof chunk === 'object' && chunk !== null) {
                    const typedChunk = chunk as Partial<ICommitMessage>;
                    commitMessage = {
                      emoji: typedChunk.emoji || commitMessage.emoji,
                      type: typedChunk.type || commitMessage.type,
                      scope: typedChunk.scope || commitMessage.scope,
                      description:
                        typedChunk.description || commitMessage.description,
                      body: typedChunk.body || commitMessage.body,
                    };

                    const formattedMessage =
                      this.formatPartialCommitMessage(commitMessage);

                    if (gitInputBox) {
                      gitInputBox.value = formattedMessage;
                    }

                    progress.report({
                      message: formattedMessage,
                      increment: 1,
                    });

                    logger.debug(
                      `Stream chunk received: ${JSON.stringify(chunk)}`
                    );
                  }
                }

                const generationWarnings = await warnings;
                if (generationWarnings) {
                  logger.warn(
                    `Warnings: ${JSON.stringify(generationWarnings)}`
                  );
                }
              } catch (error) {
                if (controller.signal.aborted) {
                  logger.debug('Stream was aborted');
                  resolve(null);
                } else {
                  reject(error);
                }
              }
            })();
          });
        } catch (error) {
          if (controller.signal.aborted) {
            logger.debug('Stream was aborted');
            return null;
          }
          throw error;
        }
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

  private formatPartialCommitMessage(message: ICommitMessage): string {
    let result = '';

    if (message.emoji) {
      result += message.emoji;
    }

    if (message.type) {
      result += ` ${message.type}`;
    }

    if (message.scope) {
      result += `(${message.scope})`;
    }

    if (message.description) {
      result += `: ${message.description}`;
    }

    if (message.body && message.body.length > 0) {
      result += '\n';

      for (const item of message.body) {
        let bodyLine = '* ';

        if (item.emoji) {
          bodyLine += item.emoji + ' ';
        }

        if (item.type) {
          bodyLine += item.type;
        }

        if (item.scope) {
          bodyLine += `(${item.scope})`;
        }

        if (item.description) {
          bodyLine += `: ${item.description}`;
        }

        result += bodyLine + '\n';
      }
    }

    return result;
  }
}
