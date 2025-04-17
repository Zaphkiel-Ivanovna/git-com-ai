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
  ANTHROPIC_MODEL_DETAILS,
  MISTRAL_MODEL_DETAILS,
  OPENAI_MODEL_DETAILS,
  GOOGLE_MODEL_DETAILS,
} from '../@types/model.types';
import { ollamaService } from '../services/ollama.service';

export class ConfigView {
  private webviewPanel: vscode.WebviewPanel | undefined;
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
      'googleApiKey',
      config.googleApiKey,
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

  private async fetchOllamaModels(): Promise<void> {
    try {
      logger.debug('Starting to fetch Ollama models');

      if (!this.webviewPanel) {
        logger.error(
          'Webview panel is undefined when trying to fetch Ollama models'
        );
        return;
      }

      try {
        this.webviewPanel.webview.postMessage({
          command: 'ollamaModelsLoading',
        });
        logger.debug('Sent ollamaModelsLoading message to webview');
      } catch (postError) {
        logger.error('Error posting ollamaModelsLoading message', postError);
      }

      try {
        const models = await ollamaService.fetchModels();
        logger.debug(`Received ${models.length} models from Ollama service`);

        this.ollamaModels = models.map((model) => {
          logger.debug(`Processing model: ${model.name}`);
          return {
            name: model.name,
            size: formatSize(model.size),
            parameterSize: model.details?.parameter_size || 'Unknown',
            quantizationLevel: model.details?.quantization_level || 'None',
          };
        });
        logger.debug(`Processed ${this.ollamaModels.length} Ollama models`);

        this.webviewPanel.webview.postMessage({
          command: 'ollamaModelsLoaded',
          count: this.ollamaModels.length,
          models: this.ollamaModels,
        });
        logger.debug('Sent ollamaModelsLoaded message to webview');

        try {
          this.updateWebviewContent();
          logger.debug('Updated webview content');
        } catch (updateError) {
          logger.error('Error updating webview content', updateError);
        }
      } catch (fetchError) {
        logger.error('Error in ollamaService.fetchModels()', fetchError);

        this.webviewPanel.webview.postMessage({
          command: 'ollamaModelsLoaded',
          error:
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError),
          count: 0,
          models: [],
        });
        logger.debug('Sent error message to webview');
      }
    } catch (error) {
      logger.error('Unexpected error in fetchOllamaModels', error);
    }
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

    try {
      this.webviewPanel?.webview.postMessage({
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
          try {
            await ollamaService.pullModel(modelName, (progressData) => {
              progress.report({
                increment:
                  progressData.progressPercent > 0
                    ? progressData.progressPercent / 100
                    : undefined,
                message: progressData.progressMessage,
              });

              this.webviewPanel?.webview.postMessage({
                command: 'ollamaModelPullingProgress',
                modelName,
                status: 'downloading',
                progress: progressData.progressPercent,
                message: progressData.progressMessage,
              });
            });

            await this.fetchOllamaModels();

            this.webviewPanel?.webview.postMessage({
              command: 'ollamaModelPulling',
              modelName,
              status: 'completed',
            });

            vscode.window.showInformationMessage(
              `Successfully pulled Ollama model: ${modelName}`
            );
          } catch (error) {
            this.webviewPanel?.webview.postMessage({
              command: 'ollamaModelPulling',
              modelName,
              status: 'error',
              error: error instanceof Error ? error.message : String(error),
            });

            vscode.window.showErrorMessage(
              `Failed to pull Ollama model: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }
      );
    } catch (error) {
      logger.error('Error pulling Ollama model', error);
      vscode.window.showErrorMessage(
        `Error pulling Ollama model: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  public async show(): Promise<void> {
    try {
      if (this.webviewPanel) {
        this.webviewPanel.reveal(vscode.ViewColumn.One);
        return;
      }

      this.webviewPanel = vscode.window.createWebviewPanel(
        'gitcomaiConfig',
        'Git Commit AI Configuration',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      this.webviewPanel.onDidDispose(() => {
        this.webviewPanel = undefined;
      });

      this.webviewPanel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
          case 'saveConfig':
            await this.saveConfig(message.config);
            vscode.window.showInformationMessage('Configuration saved');
            break;
          case 'fetchOllamaModels':
            await this.fetchOllamaModels();
            break;
          case 'showLogs':
            logger.show();
            break;
          case 'showOllamaModelPullDialog':
            await this.showOllamaModelPullDialog();
            break;
        }
      });

      this.updateWebviewContent();

      await this.fetchOllamaModels();
    } catch (error) {
      logger.error('Error showing config view', error);
      vscode.window.showErrorMessage(
        `Error showing configuration: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private updateWebviewContent(): void {
    if (this.webviewPanel) {
      this.webviewPanel.webview.html = this.getWebviewContent();
      
      // Give the webview time to load, then ensure custom selects are initialized
      setTimeout(() => {
        this.webviewPanel?.webview.postMessage({
          command: 'ready'
        });
      }, 500);
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
        model: AnthropicModel.CLAUDE_3_7_SONNET,
      };

      const openaiModelOptions = Object.entries(OPENAI_MODEL_DETAILS).map(
        ([modelValue, modelDetails]) => {
          return {
            ...modelDetails,
            value: modelValue,
            provider: AIProvider.OPENAI,
            selected: modelConfig.model === modelValue,
          };
        }
      );

      const anthropicModelOptions = Object.entries(ANTHROPIC_MODEL_DETAILS).map(
        ([modelValue, modelDetails]) => {
          return {
            ...modelDetails,
            value: modelValue,
            provider: AIProvider.ANTHROPIC,
            selected: modelConfig.model === modelValue,
          };
        }
      );

      const mistralModelOptions = Object.entries(MISTRAL_MODEL_DETAILS).map(
        ([modelValue, modelDetails]) => {
          return {
            ...modelDetails,
            value: modelValue,
            provider: AIProvider.MISTRAL,
            selected: modelConfig.model === modelValue,
          };
        }
      );

      const googleModelOptions = Object.entries(GOOGLE_MODEL_DETAILS).map(
        ([modelValue, modelDetails]) => {
          return {
            ...modelDetails,
            value: modelValue,
            provider: AIProvider.GOOGLE,
            selected: modelConfig.model === modelValue,
          };
        }
      );

      return compiledTemplate({
        cssContent,

        modelConfig,

        isAnthropicSelected: modelConfig.provider === AIProvider.ANTHROPIC,
        isOpenAISelected: modelConfig.provider === AIProvider.OPENAI,
        isMistralSelected: modelConfig.provider === AIProvider.MISTRAL,
        isGoogleSelected: modelConfig.provider === AIProvider.GOOGLE,
        isOllamaSelected: modelConfig.provider === AIProvider.OLLAMA,

        anthropicModelSelector: {
          id: 'anthropic-model',
          name: 'anthropic-model',
          selectedProvider: AIProvider.ANTHROPIC,
          options: anthropicModelOptions,
        },
        openaiModelSelector: {
          id: 'openai-model',
          name: 'openai-model',
          selectedProvider: AIProvider.OPENAI,
          options: openaiModelOptions,
        },
        mistralModelSelector: {
          id: 'mistral-model',
          name: 'mistral-model',
          selectedProvider: AIProvider.MISTRAL,
          options: mistralModelOptions,
        },
        googleModelSelector: {
          id: 'google-model',
          name: 'google-model',
          selectedProvider: AIProvider.GOOGLE,
          options: googleModelOptions,
        },

        anthropicApiKey: config.get<string>('anthropicApiKey') || '',
        openaiApiKey: config.get<string>('openaiApiKey') || '',
        mistralApiKey: config.get<string>('mistralApiKey') || '',
        googleApiKey: config.get<string>('googleApiKey') || '',
        ollamaBaseURL:
          config.get<string>('ollamaBaseURL') || 'http://localhost:11434',
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
