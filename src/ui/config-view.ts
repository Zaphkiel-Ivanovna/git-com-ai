import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import {
  AIProvider,
  IModelConfig,
  IOllamaTagsResponse,
  IOllamaModel,
} from '../@types/types';
import { logger } from '../utils/logger.util';
import { formatSize } from '../utils/format.util';

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
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async saveConfig(config: any): Promise<void> {
    const configuration = vscode.workspace.getConfiguration('gitcomai');

    // Save model configuration
    await configuration.update(
      'selectedModel',
      {
        provider: config.provider,
        model: config.model,
      },
      vscode.ConfigurationTarget.Global
    );

    // Save API keys
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

    // Save other parameters
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
          parameterSize: model.details.parameter_size,
          quantizationLevel: model.details.quantization_level,
        }));

        this.updateWebviewContent();

        this.panel?.webview.postMessage({
          command: 'ollamaModelsLoaded',
          success: true,
          count: this.ollamaModels.length,
        });
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
    const templatePath = path.join(
      this.context.extensionPath,
      'resources',
      'templates',
      'config.hbs'
    );
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    const config = vscode.workspace.getConfiguration('gitcomai');
    const modelConfig: IModelConfig = config.get('selectedModel') || {
      provider: AIProvider.ANTHROPIC,
      model: 'claude-3-7-sonnet-latest',
    };

    const data = {
      modelConfig,
      isAnthropicSelected: modelConfig.provider === 'anthropic',
      isOpenAISelected: modelConfig.provider === 'openai',
      isMistralSelected: modelConfig.provider === 'mistral',
      isOllamaSelected: modelConfig.provider === 'ollama',
      anthropicApiKey: config.get<string>('anthropicApiKey') || '',
      openaiApiKey: config.get<string>('openaiApiKey') || '',
      mistralApiKey: config.get<string>('mistralApiKey') || '',
      ollamaBaseURL:
        config.get<string>('ollamaBaseURL') || 'http://localhost:11434/api',
      ollamaModels: this.ollamaModels,
      temperature: config.get<number>('temperature') || 0.2,
      maxTokens: config.get<number>('maxTokens') || 1000,
      debug: config.get<boolean>('debug') || false,
    };

    return template(data);
  }
}
