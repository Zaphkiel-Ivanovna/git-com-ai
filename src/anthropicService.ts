import * as vscode from 'vscode';
import Anthropic from '@anthropic-ai/sdk';
import { ICommitBodyItem, ICommitMessage } from './types';
import { loadCommitPrompt } from './promptLoader';
import { logger } from './logger';

export class AnthropicService extends Anthropic {
  constructor() {
    const apiKey = vscode.workspace
      .getConfiguration('gitcomai')
      .get<string>('anthropicApiKey');

    if (!apiKey) {
      vscode.window.showErrorMessage(
        'Anthropic API key not configured. Please set it in the extension settings.'
      );
      super({ apiKey: '' });
    } else {
      super({ apiKey });
    }
  }

  public reinitialize(): void {
    const apiKey = vscode.workspace
      .getConfiguration('gitcomai')
      .get<string>('anthropicApiKey');

    if (!apiKey) {
      vscode.window.showErrorMessage(
        'Anthropic API key not configured. Please set it in the extension settings.'
      );
      return;
    }

    this.apiKey = apiKey;
  }

  public async generateCommitMessage(
    diff: string,
    files: string[]
  ): Promise<ICommitMessage | null> {
    try {
      if (!this.apiKey) {
        this.reinitialize();
        if (!this.apiKey) {
          return null;
        }
      }

      const model =
        vscode.workspace.getConfiguration('gitcomai').get<string>('model') ||
        'claude-3-7-sonnet-latest';

      const prompts = await loadCommitPrompt(diff, files);

      // Définition du schéma pour les messages de commit
      const commitSchema: Anthropic.Messages.Tool.InputSchema = {
        type: 'object',
        properties: {
          emoji: {
            type: 'string',
            description: 'The emoji that represents the type of change',
            enum: [
              '✨',
              '🐛',
              '♻️',
              '⚡️',
              '🚑️',
              '🩹',
              '🎨',
              '🔥',
              '🔒️',
              '⚰️',
              '♿️',
              '🚀',
              '📝',
              '✅',
              '🚨',
              '🔖',
              '🚧',
              '💄',
              '🏗️',
              '👷',
              '💚',
              '🔐',
              '📈',
              '🔧',
              '🔨',
              '📌',
              '➕',
              '➖',
              '📦️',
              '👽️',
              '🚚',
              '📄',
              '💥',
              '🍱',
              '💡',
              '🗃️',
              '🔊',
              '🔇',
              '🚸',
              '📱',
              '⚗️',
              '🏷️',
              '🌱',
              '🚩',
              '🥅',
              '💫',
              '🗑️',
              '🛂',
              '🩺',
              '🧱',
              '🧑‍💻',
              '💸',
              '🧵',
              '🦺',
              '🎉',
              '✏️',
              '💩',
              '⏪️',
              '🔀',
              '📸',
              '🤡',
              '🥚',
              '🙈',
              '🧐',
              '🔍️',
              '👥',
              '🍻',
            ],
          },
          type: {
            type: 'string',
            description: 'The type of change',
            enum: [
              'feat',
              'fix',
              'docs',
              'style',
              'refactor',
              'perf',
              'test',
              'build',
              'ci',
              'chore',
              'revert',
              'hotfix',
              'minor-fix',
              'cleanup',
              'security',
              'pruning',
              'accessibility',
              'deployment',
              'testing',
              'lint',
              'versioning',
              'wip',
              'ui',
              'architecture',
              'ci-fix',
              'secrets',
              'analytics',
              'config',
              'dev-scripts',
              'dependency-pin',
              'dependency-add',
              'dependency-remove',
              'external-api',
              'resource-move',
              'license',
              'breaking',
              'assets',
              'comments',
              'database',
              'logging',
              'log-removal',
              'ux',
              'responsive',
              'experiment',
              'types',
              'seeding',
              'feature-flag',
              'error-handling',
              'animations',
              'deprecation',
              'auth',
              'healthcheck',
              'infrastructure',
              'dev-experience',
              'sponsorship',
              'concurrency',
              'validation',
              'init',
              'typo',
              'bad-code',
              'revert',
              'merge',
              'snapshot',
              'mock',
              'easter-egg',
              '.gitignore',
              'exploration',
              'seo',
              'contributor',
              'drunk',
            ],
          },
          scope: {
            type: 'string',
            description: 'The scope of the change (optional)',
            nullable: true,
          },
          description: {
            type: 'string',
            description:
              'A short description in imperative mood, not exceeding 74 characters',
          },
          body: {
            type: 'array',
            description: 'Optional additional details about the changes',
            items: {
              type: 'object',
              properties: {
                emoji: {
                  type: 'string',
                  description: 'The emoji for this change',
                },
                type: {
                  type: 'string',
                  description: 'The type of this change',
                },
                scope: {
                  type: 'string',
                  description: 'The scope of this change (optional)',
                  nullable: true,
                },
                description: {
                  type: 'string',
                  description: 'A short description of this change',
                },
              },
              required: ['emoji', 'type', 'description'],
            },
            nullable: true,
          },
        },
        required: ['emoji', 'type', 'description'],
      };

      const response = await this.messages.create({
        model,
        max_tokens: 1000,
        temperature: 0.2,
        system: prompts.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompts.userPrompt,
          },
        ],
        tools: [
          {
            name: 'commit_message_generator',
            description: 'Generate a structured git commit message',
            input_schema: commitSchema,
          },
        ],
        tool_choice: {
          type: 'tool',
          name: 'commit_message_generator',
        },
      });

      if (
        response.content[0].type === 'tool_use' &&
        response.content[0].name === 'commit_message_generator'
      ) {
        const toolUse = response.content[0];
        let commitMessage: ICommitMessage;

        try {
          if (typeof toolUse.input === 'string') {
            commitMessage = JSON.parse(toolUse.input) as ICommitMessage;
          } else if (
            typeof toolUse.input === 'object' &&
            toolUse.input !== null
          ) {
            commitMessage = toolUse.input as unknown as ICommitMessage;
          } else {
            throw new Error('Invalid input format from API');
          }

          return commitMessage;
        } catch (parseError) {
          vscode.window.showErrorMessage(
            `Error parsing commit message: ${
              parseError instanceof Error
                ? parseError.message
                : String(parseError)
            }`
          );
          return null;
        }
      } else {
        vscode.window.showWarningMessage(
          'Unexpected response format from AI. Using default formatting.'
        );
        if (response.content[0].type === 'text') {
          return this.parseCommitMessage(response.content[0].text);
        }
        return null;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Error generating commit message: ${errorMessage}`
      );
      return null;
    }
  }

  private parseCommitMessage(messageText: string): ICommitMessage {
    // Regex pour extraire l'emoji, le type, le scope et la description
    const titleRegex = /^([\p{Emoji}]) ([a-z]+)(?:\(([^)]+)\))?: (.+)$/u;
    const titleMatch = messageText.match(titleRegex);

    if (!titleMatch) {
      logger.warn(`Failed to parse commit message: ${messageText}`);
      return {
        emoji: '📝',
        type: 'docs',
        description: messageText.trim(),
      };
    }

    const [, emoji, type, scope, description] = titleMatch;

    // Vérifier s'il y a un corps de message
    const bodyItems: ICommitBodyItem[] = [];
    const bodyStart = messageText.indexOf('\n');

    if (bodyStart !== -1) {
      const bodyText = messageText.slice(bodyStart + 1).trim();
      const bodyLines = bodyText
        .split('\n')
        .filter((line) => line.trim().startsWith('*'));

      for (const line of bodyLines) {
        // Regex pour extraire l'emoji, le type, le scope et la description dans les lignes du corps
        const bodyItemRegex =
          /^\* ([\p{Emoji}]) ([a-z]+)(?:\(([^)]+)\))?: (.+)$/u;
        const bodyItemMatch = line.match(bodyItemRegex);

        if (bodyItemMatch) {
          const [, itemEmoji, itemType, itemScope, itemDescription] =
            bodyItemMatch;
          bodyItems.push({
            emoji: itemEmoji,
            type: itemType,
            scope: itemScope || undefined,
            description: itemDescription.trim(),
          });
        }
      }
    }

    return {
      emoji,
      type,
      scope: scope || undefined,
      description: description.trim(),
      body: bodyItems.length > 0 ? bodyItems : undefined,
    };
  }
}
