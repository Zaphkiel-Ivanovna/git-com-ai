import * as vscode from 'vscode';
import { LanguageModelV1, streamObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { logger } from '../utils/logger.util';
import {
  commitMessageSchema,
  ICommitBodyItem,
  ICommitMessage,
} from '../models/commit.schema';
import { loadCommitPrompt } from '../utils/prompt-loader.util';
import {
  IModelConfig,
  AIProvider,
  AnthropicModel,
} from '../@types/model.types';
import { calculateCost } from '../utils/cost.util';
import { formatCommitMessage } from '../utils/format.util';
import { GitExtension, InputBox } from '../@types/git';
import { ollamaService } from './ollama.service';

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
          compatibility: 'strict',
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

  private getGitInputBox(): InputBox | null {
    try {
      const gitExtension =
        vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
      if (!gitExtension) {
        logger.warn('Git extension not found');
        return null;
      }

      const gitAPI = gitExtension.getAPI(1);
      const repositories = gitAPI.repositories;

      if (repositories.length === 0) {
        logger.warn('No Git repositories found');
        return null;
      }

      const repository = repositories[0];
      return repository.inputBox;
    } catch (error) {
      logger.error('Error getting Git input box', error);
      return null;
    }
  }

  public async generateCommitMessage(
    diff: string,
    files: string[],
    progress: vscode.Progress<{ message?: string; increment?: number }>,
    token: vscode.CancellationToken
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

        const gitInputBox = this.getGitInputBox();
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
            const modelInstance = provider(model, { structuredOutputs: true });
            const { partialObjectStream, warnings } = streamObject({
              model: modelInstance as LanguageModelV1,
              schema: commitMessageSchema,
              maxTokens: config.maxTokens,
              temperature: config.temperature,
              prompt: `${prompts.systemPrompt}\n\n${prompts.userPrompt}`,
              abortSignal: controller.signal,
              onError: (error) => {
                logger.error(
                  'Error generating commit message',
                  JSON.stringify(error)
                );
                reject(error);
              },
              onFinish: ({ usage, object }) => {
                logger.debug(`Usage: ${JSON.stringify(usage)}`);

                const cost = calculateCost(
                  modelConfig,
                  usage.promptTokens,
                  usage.completionTokens
                );

                if (cost) {
                  progress.report({
                    message: `Commit usage: ${usage.totalTokens} tokens (Cost: $${cost})`,
                    increment: 100,
                  });
                } else {
                  progress.report({
                    message: `Commit usage: ${usage.totalTokens} tokens`,
                    increment: 100,
                  });
                }

                if (object && gitInputBox) {
                  const finalFormattedMessage = formatCommitMessage(object);
                  gitInputBox.value = finalFormattedMessage;
                }

                logger.debug(
                  `Generated commit message: ${JSON.stringify(object)}`
                );

                logger.debug(`Cost: $${cost}`);

                resolve(object || null);
              },
            });

            logger.debug('Temperature: ' + config.temperature);
            logger.debug('Max tokens: ' + config.maxTokens);
            logger.debug('Model: ' + modelConfig.model);
            logger.debug('Provider: ' + modelConfig.provider);

            (async () => {
              try {
                for await (const chunk of partialObjectStream) {
                  if (chunk) {
                    commitMessage = {
                      emoji: chunk.emoji || commitMessage.emoji,
                      type: chunk.type || commitMessage.type,
                      scope: chunk.scope || commitMessage.scope,
                      description:
                        chunk.description || commitMessage.description,
                      body:
                        (chunk.body as ICommitBodyItem[] | undefined) ||
                        commitMessage.body,
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
