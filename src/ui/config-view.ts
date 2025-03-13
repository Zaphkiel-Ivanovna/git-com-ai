import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { logger } from '../utils/logger.util';
import { formatSize } from '../utils/format.util';
import {
  IModelConfig,
  AIProvider,
  AnthropicModel,
  MistralModel,
  OpenAIModel,
  ANTHROPIC_MODEL_DETAILS,
  MISTRAL_MODEL_DETAILS,
  OPENAI_MODEL_DETAILS,
} from '../@types/model.types';
import { IOllamaTagsResponse, IOllamaModel } from '../@types/ollama.types';

export class ConfigView {
  private panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;
  private ollamaModels: {
    name: string;
    size: string;
    parameterSize?: string;
    quantizationLevel?: string;
  }[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.registerHandlebarsPartials();
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsPartials(): void {
    try {
      const partialsDir = path.join(
        this.context.extensionPath,
        'resources',
        'templates',
        'partials'
      );

      if (!fs.existsSync(partialsDir)) {
        logger.warn(`Partials directory does not exist: ${partialsDir}`);
        fs.mkdirSync(partialsDir, { recursive: true });
        return;
      }

      const partialFiles = fs.readdirSync(partialsDir);

      partialFiles.forEach((filename) => {
        const matches = /^([^.]+).hbs$/.exec(filename);
        if (!matches) return;

        const name = matches[1];
        const filePath = path.join(partialsDir, filename);
        const template = fs.readFileSync(filePath, 'utf8');

        Handlebars.registerPartial(name, template);
      });
    } catch (error) {
      logger.error('Error registering Handlebars partials:', error);
    }
  }

  private registerHandlebarsHelpers(): void {
    Handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    Handlebars.registerHelper('json', function (context) {
      return new Handlebars.SafeString(JSON.stringify(context));
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async saveConfig(config: any): Promise<void> {
    const configuration = vscode.workspace.getConfiguration('gitcomai');

    await configuration.update(
      'selectedModel',
      {
        provider: config.provider,
        model: config.model,
      },
      vscode.ConfigurationTarget.Global
    );

    await configuration.update(
      'anthropicApiKey',
      config.anthropicApiKey,
      vscode.ConfigurationTarget.Global
    );
    await configuration.update(
      'openaiApiKey',
      config.openaiApiKey,
      vscode.ConfigurationTarget.Global
    );
    await configuration.update(
      'mistralApiKey',
      config.mistralApiKey,
      vscode.ConfigurationTarget.Global
    );
    await configuration.update(
      'ollamaBaseURL',
      config.ollamaBaseURL,
      vscode.ConfigurationTarget.Global
    );

    await configuration.update(
      'temperature',
      config.temperature,
      vscode.ConfigurationTarget.Global
    );
    await configuration.update(
      'maxTokens',
      config.maxTokens,
      vscode.ConfigurationTarget.Global
    );
    await configuration.update(
      'debug',
      config.debug,
      vscode.ConfigurationTarget.Global
    );
  }

  private async showOllamaModelPullDialog(): Promise<void> {
    const modelName = await vscode.window.showInputBox({
      prompt:
        'Enter the name of the model to pull (e.g., llama3, mistral, codellama)',
      placeHolder: 'Model name',
      validateInput: (value) => {
        return value && value.trim().length > 0
          ? null
          : 'Please enter a valid model name';
      },
    });

    if (!modelName) {
      return;
    }

    const config = vscode.workspace.getConfiguration('gitcomai');
    const ollamaBaseURL =
      config.get<string>('ollamaBaseURL') || 'http://localhost:11434/api';

    try {
      this.panel?.webview.postMessage({
        command: 'ollamaModelPulling',
        modelName,
        status: 'started',
      });

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Pulling Ollama model: ${modelName}`,
          cancellable: false,
        },
        async (progress) => {
          let apiUrl = ollamaBaseURL;
          if (!apiUrl.endsWith('/api')) {
            apiUrl = apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`;
          }

          const pullUrl = `${apiUrl}/pull`;

          const response = await fetch(pullUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: modelName, stream: true }),
          });

          if (!response.ok) {
            throw new Error(`Failed to pull model: ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Failed to get response reader');
          }

          const decoder = new TextDecoder();
          let downloadedSize = 0;
          let totalSize = 0;
          let lastStatus = '';
          let done = false;

          while (!done) {
            const result = await reader.read();
            done = result.done;

            if (done) {
              break;
            }

            const chunk = decoder.decode(result.value, { stream: true });
            const lines = chunk.split('\n').filter((line) => line.trim());

            for (const line of lines) {
              try {
                const data = JSON.parse(line);

                if (data.status) {
                  lastStatus = data.status;
                }

                if (data.total) {
                  totalSize = parseInt(data.total, 10);
                }

                if (data.completed) {
                  downloadedSize = parseInt(data.completed, 10);
                }

                let progressMessage = lastStatus;
                let progressPercent = 0;

                if (totalSize > 0 && downloadedSize > 0) {
                  progressPercent = (downloadedSize / totalSize) * 100;

                  const downloadedFormatted = formatSize(downloadedSize);
                  const totalFormatted = formatSize(totalSize);
                  progressMessage = `${lastStatus} - ${downloadedFormatted} / ${totalFormatted} (${progressPercent.toFixed(
                    1
                  )}%)`;
                }

                progress.report({
                  increment:
                    progressPercent > 0 ? progressPercent / 100 : undefined,
                  message: progressMessage,
                });

                this.panel?.webview.postMessage({
                  command: 'ollamaModelPullingProgress',
                  modelName,
                  status: 'downloading',
                  progress: progressPercent,
                  message: progressMessage,
                });
              } catch (parseError) {
                console.warn('Error parsing JSON from stream:', parseError);
              }
            }
          }

          await this.fetchOllamaModels(ollamaBaseURL);

          this.panel?.webview.postMessage({
            command: 'ollamaModelPulling',
            modelName,
            status: 'completed',
          });
        }
      );

      vscode.window.showInformationMessage(
        `Successfully pulled Ollama model: ${modelName}`
      );
    } catch (error) {
      this.panel?.webview.postMessage({
        command: 'ollamaModelPulling',
        modelName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });

      vscode.window.showErrorMessage(
        `Failed to pull Ollama model: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  public async show(): Promise<void> {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'gitcomaiConfig',
      'GitComAI Configuration',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getWebviewContent();

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'saveConfig':
            await this.saveConfig(message.config);
            vscode.window.showInformationMessage(
              'GitComAI configuration saved successfully!'
            );
            break;
          case 'showLogs':
            vscode.commands.executeCommand('gitcomai.showLogs');
            break;
          case 'fetchOllamaModels':
            await this.fetchOllamaModels(message.baseUrl);
            break;
          case 'showOllamaModelPullDialog':
            await this.showOllamaModelPullDialog();
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    const config = vscode.workspace.getConfiguration('gitcomai');
    const ollamaBaseURL =
      config.get<string>('ollamaBaseURL') || 'http://localhost:11434/api';
    await this.fetchOllamaModels(ollamaBaseURL);
  }

  private async fetchOllamaModels(baseUrl: string): Promise<void> {
    try {
      this.panel?.webview.postMessage({
        command: 'ollamaModelsLoading',
        loading: true,
      });

      let apiUrl = baseUrl;
      if (!apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`;
      }

      const modelsUrl = `${apiUrl}/tags`;

      const response = await fetch(modelsUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = (await response.json()) as IOllamaTagsResponse;

      if (data && Array.isArray(data.models)) {
        this.ollamaModels = data.models.map((model: IOllamaModel) => ({
          name: model.name,
          size: formatSize(model.size),
          parameterSize: model.details.parameter_size || 'Unknown',
          quantizationLevel: model.details.quantization_level || 'None',
          family: model.details.family || 'Unknown',
          format: model.details.format || 'Unknown',
        }));

        this.updateWebviewContent();

        this.panel?.webview.postMessage({
          command: 'ollamaModelsLoaded',
          success: true,
          count: this.ollamaModels.length,
          models: this.ollamaModels,
        });

        const configuration = vscode.workspace.getConfiguration('gitcomai');
        await configuration.update(
          'ollamaBaseURL',
          baseUrl,
          vscode.ConfigurationTarget.Global
        );
      } else {
        throw new Error('Invalid response format from Ollama API');
      }
    } catch (error) {
      this.panel?.webview.postMessage({
        command: 'ollamaModelsLoaded',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      this.updateWebviewContent();
    }
  }

  private updateWebviewContent(): void {
    if (this.panel) {
      this.panel.webview.html = this.getWebviewContent();
    }
  }

  private getWebviewContent(): string {
    try {
      const templatePath = path.join(
        this.context.extensionPath,
        'resources',
        'templates',
        'config.hbs'
      );

      const template = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = Handlebars.compile(template);

      const cssPath = path.join(
        this.context.extensionPath,
        'resources',
        'templates',
        'css',
        'styles.css'
      );
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      const config = vscode.workspace.getConfiguration('gitcomai');
      const modelConfig = config.get<IModelConfig>('selectedModel') || {
        provider: AIProvider.ANTHROPIC,
        model: AnthropicModel.CLAUDE_3_SONNET,
      };

      const anthropicModelOptions = Object.keys(AnthropicModel).map((key) => {
        const modelValue = AnthropicModel[key as keyof typeof AnthropicModel];
        const modelDetails = ANTHROPIC_MODEL_DETAILS[modelValue];
        return {
          value: modelValue,
          title: modelDetails.title,
          description: modelDetails.description,
          inputPrice: modelDetails.inputPrice,
          outputPrice: modelDetails.outputPrice,
          provider: AIProvider.ANTHROPIC,
          selected: modelConfig.model === modelValue,
        };
      });

      const openaiModelOptions = Object.keys(OpenAIModel).map((key) => {
        const modelValue = OpenAIModel[key as keyof typeof OpenAIModel];
        const modelDetails = OPENAI_MODEL_DETAILS[modelValue];
        return {
          value: modelValue,
          title: modelDetails.title,
          description: modelDetails.description,
          inputPrice: modelDetails.inputPrice,
          outputPrice: modelDetails.outputPrice,
          provider: AIProvider.OPENAI,
          selected: modelConfig.model === modelValue,
        };
      });

      const mistralModelOptions = Object.keys(MistralModel).map((key) => {
        const modelValue = MistralModel[key as keyof typeof MistralModel];
        const modelDetails = MISTRAL_MODEL_DETAILS[modelValue];
        return {
          value: modelValue,
          title: modelDetails.title,
          description: modelDetails.description,
          inputPrice: modelDetails.inputPrice,
          outputPrice: modelDetails.outputPrice,
          provider: AIProvider.MISTRAL,
          selected: modelConfig.model === modelValue,
        };
      });

      return compiledTemplate({
        cssContent,

        modelConfig,

        isAnthropicSelected: modelConfig.provider === 'anthropic',
        isOpenAISelected: modelConfig.provider === 'openai',
        isMistralSelected: modelConfig.provider === 'mistral',
        isOllamaSelected: modelConfig.provider === 'ollama',

        anthropicModelSelector: {
          id: 'anthropic-model',
          name: 'anthropic-model',
          label: 'Model:',
          selectedProvider: AIProvider.ANTHROPIC,
          options: anthropicModelOptions,
        },
        openaiModelSelector: {
          id: 'openai-model',
          name: 'openai-model',
          label: 'Model:',
          selectedProvider: AIProvider.OPENAI,
          options: openaiModelOptions,
        },
        mistralModelSelector: {
          id: 'mistral-model',
          name: 'mistral-model',
          label: 'Model:',
          selectedProvider: AIProvider.MISTRAL,
          options: mistralModelOptions,
        },

        anthropicApiKey: config.get<string>('anthropicApiKey') || '',
        openaiApiKey: config.get<string>('openaiApiKey') || '',
        mistralApiKey: config.get<string>('mistralApiKey') || '',
        ollamaBaseURL:
          config.get<string>('ollamaBaseURL') || 'http://localhost:11434/api',
        ollamaModels: this.ollamaModels,
        temperature: config.get<number>('temperature') || 0.2,
        maxTokens: config.get<number>('maxTokens') || 1000,
        debug: config.get<boolean>('debug') || false,
      });
    } catch (error) {
      logger.error('Error generating webview content:', error);
      return `<html><body><h1>Error loading configuration</h1><p>${error}</p></body></html>`;
    }
  }
}
