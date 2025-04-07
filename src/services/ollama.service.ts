import * as vscode from 'vscode';
import { Ollama, ModelResponse } from 'ollama';
import { logger } from '../utils/logger.util';
import { formatSize } from '../utils/format.util';
import { createOllama } from 'ollama-ai-provider';

interface IProgressData {
  progressPercent: number;
  progressMessage: string;
  status: string;
  downloadedSize?: number;
  totalSize?: number;
}

export class OllamaService {
  private baseURL: string | undefined;
  private client!: Ollama;

  constructor() {
    const config = vscode.workspace.getConfiguration('gitcomai');
    this.baseURL = config.get<string>('ollamaBaseURL');

    this.client = new Ollama({
      host: this.baseURL || 'http://localhost:11434',
    });

    logger.debug(
      `Ollama base URL: ${this.baseURL || 'default (http://localhost:11434)'}`
    );

    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('gitcomai.ollamaBaseURL')) {
        logger.debug('Ollama configuration changed, reloading');
        this.loadConfig();
      }
    });
  }

  /**
   * Load Ollama configuration from VS Code settings
   */
  private loadConfig(): void {
    const config = vscode.workspace.getConfiguration('gitcomai');
    this.baseURL = config.get<string>('ollamaBaseURL');

    this.client = new Ollama({
      host: this.baseURL || 'http://localhost:11434',
    });

    logger.debug(
      `Ollama base URL: ${this.baseURL || 'default (http://localhost:11434)'}`
    );
  }

  /**
   * Get the Ollama provider instance with the current configuration
   */
  public getProvider() {
    const options = this.baseURL
      ? { baseURL: `${this.baseURL}/api` }
      : undefined;

    return createOllama(options);
  }

  /**
   * Fetch available models from Ollama API
   */
  public async fetchModels(): Promise<ModelResponse[]> {
    try {
      logger.debug('Fetching Ollama models');

      const response = await this.client.list();

      if (!response.models) {
        throw new Error('Invalid response format from Ollama API');
      }

      return response.models;
    } catch (error) {
      logger.error('Error fetching Ollama models', error);
      throw error;
    }
  }

  /**
   * Pull a model from Ollama with progress reporting
   */
  public async pullModel(
    modelName: string,
    progressCallback?: (data: IProgressData) => void
  ): Promise<void> {
    try {
      logger.debug(`Pulling Ollama model ${modelName}`);

      const pullStream = await this.client.pull({
        model: modelName,
        stream: true,
      });

      for await (const part of pullStream) {
        if (progressCallback) {
          let downloadedSize = 0;
          let totalSize = 0;

          if (part.completed) {
            downloadedSize = part.completed;
          }

          if (part.total) {
            totalSize = part.total;
          }

          let progressPercent = 0;
          let progressMessage = part.status || '';

          if (totalSize > 0 && downloadedSize > 0) {
            progressPercent = (downloadedSize / totalSize) * 100;

            const downloadedFormatted = formatSize(downloadedSize);
            const totalFormatted = formatSize(totalSize);
            progressMessage = `${
              part.status
            } - ${downloadedFormatted} / ${totalFormatted} (${progressPercent.toFixed(
              1
            )}%)`;
          }

          progressCallback({
            progressPercent,
            progressMessage,
            status: 'downloading',
            downloadedSize,
            totalSize,
          });
        }
      }

      logger.debug(`Successfully pulled Ollama model: ${modelName}`);
    } catch (error) {
      logger.error(`Error pulling Ollama model ${modelName}`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const ollamaService = new OllamaService();
