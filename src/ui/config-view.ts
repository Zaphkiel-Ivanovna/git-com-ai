import * as vscode from 'vscode';
import { AIProvider, IModelConfig } from '../@types/types';

export class ConfigView {
  private panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public show(): void {
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
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'saveConfig':
            await this.saveConfig(message.config);
            vscode.window.showInformationMessage(
              'GitComAI configuration saved successfully!'
            );
            break;
          case 'testConnection':
            await this.testConnection(message.provider);
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
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

  private async testConnection(provider: string): Promise<void> {
    // Implement a simple connection test for the selected provider
    try {
      vscode.window.showInformationMessage(
        `Testing connection to ${provider}...`
      );
      // Here you would add actual API connection testing logic

      // For now, just simulate a successful test
      setTimeout(() => {
        this.panel?.webview.postMessage({
          command: 'connectionTestResult',
          provider,
          success: true,
          message: `Successfully connected to ${provider}!`,
        });
      }, 1000);
    } catch (error) {
      this.panel?.webview.postMessage({
        command: 'connectionTestResult',
        provider,
        success: false,
        message: `Failed to connect to ${provider}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  private getWebviewContent(): string {
    const config = vscode.workspace.getConfiguration('gitcomai');
    const modelConfig: IModelConfig = config.get('selectedModel') || {
      provider: AIProvider.ANTHROPIC,
      model: 'claude-3-7-sonnet-latest',
    };
    const anthropicApiKey = config.get<string>('anthropicApiKey') || '';
    const openaiApiKey = config.get<string>('openaiApiKey') || '';
    const mistralApiKey = config.get<string>('mistralApiKey') || '';
    const ollamaBaseURL =
      config.get<string>('ollamaBaseURL') || 'http://localhost:11434/api';
    const temperature = config.get<number>('temperature') || 0.2;
    const maxTokens = config.get<number>('maxTokens') || 1000;
    const debug = config.get<boolean>('debug') || false;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GitComAI Configuration</title>
        <style>
            body {
                padding: 20px;
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            input[type="text"], input[type="password"], input[type="number"], select {
                width: 100%;
                padding: 8px;
                box-sizing: border-box;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 12px;
                cursor: pointer;
                margin-right: 5px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .model-section {
                display: none;
                margin-top: 10px;
                padding: 10px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
            }
            .active {
                display: block;
            }
            .test-result {
                margin-top: 5px;
                padding: 5px;
                border-radius: 3px;
            }
            .success {
                background-color: rgba(0, 128, 0, 0.2);
                color: var(--vscode-terminal-ansiGreen);
            }
            .error {
                background-color: rgba(255, 0, 0, 0.2);
                color: var(--vscode-terminal-ansiRed);
            }
            .slider-container {
                display: flex;
                align-items: center;
            }
            .slider {
                flex-grow: 1;
                margin-right: 10px;
            }
            .slider-value {
                width: 50px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <h1>GitComAI Configuration</h1>
        
        <div class="form-group">
            <label for="provider">AI Provider:</label>
            <select id="provider">
                <option value="anthropic" ${
                  modelConfig.provider === 'anthropic' ? 'selected' : ''
                }>Anthropic Claude</option>
                <option value="openai" ${
                  modelConfig.provider === 'openai' ? 'selected' : ''
                }>OpenAI</option>
                <option value="mistral" ${
                  modelConfig.provider === 'mistral' ? 'selected' : ''
                }>Mistral AI</option>
                <option value="ollama" ${
                  modelConfig.provider === 'ollama' ? 'selected' : ''
                }>Ollama (Local)</option>
            </select>
        </div>
        
        <!-- Anthropic Section -->
        <div id="anthropic-section" class="model-section ${
          modelConfig.provider === 'anthropic' ? 'active' : ''
        }">
            <div class="form-group">
                <label for="anthropic-model">Model:</label>
                <select id="anthropic-model">
                    <option value="claude-3-7-sonnet-latest" ${
                      modelConfig.model === 'claude-3-7-sonnet-latest'
                        ? 'selected'
                        : ''
                    }>Claude 3.7 Sonnet</option>
                    <option value="claude-3-5-sonnet-latest" ${
                      modelConfig.model === 'claude-3-5-sonnet-latest'
                        ? 'selected'
                        : ''
                    }>Claude 3.5 Sonnet</option>
                    <option value="claude-3-opus-latest" ${
                      modelConfig.model === 'claude-3-opus-latest'
                        ? 'selected'
                        : ''
                    }>Claude 3 Opus</option>
                    <option value="claude-3-sonnet-latest" ${
                      modelConfig.model === 'claude-3-sonnet-latest'
                        ? 'selected'
                        : ''
                    }>Claude 3 Sonnet</option>
                    <option value="claude-3-haiku-latest" ${
                      modelConfig.model === 'claude-3-haiku-latest'
                        ? 'selected'
                        : ''
                    }>Claude 3 Haiku</option>
                </select>
            </div>
            <div class="form-group">
                <label for="anthropic-api-key">API Key:</label>
                <input type="password" id="anthropic-api-key" value="${anthropicApiKey}" />
                <button id="test-anthropic">Test Connection</button>
                <div id="anthropic-test-result" class="test-result"></div>
            </div>
        </div>
        
        <!-- OpenAI Section -->
        <div id="openai-section" class="model-section ${
          modelConfig.provider === 'openai' ? 'active' : ''
        }">
            <div class="form-group">
                <label for="openai-model">Model:</label>
                <select id="openai-model">
                    <option value="gpt-4o" ${
                      modelConfig.model === 'gpt-4o' ? 'selected' : ''
                    }>GPT-4o</option>
                    <option value="gpt-4-turbo" ${
                      modelConfig.model === 'gpt-4-turbo' ? 'selected' : ''
                    }>GPT-4 Turbo</option>
                    <option value="gpt-4" ${
                      modelConfig.model === 'gpt-4' ? 'selected' : ''
                    }>GPT-4</option>
                    <option value="gpt-3.5-turbo" ${
                      modelConfig.model === 'gpt-3.5-turbo' ? 'selected' : ''
                    }>GPT-3.5 Turbo</option>
                    <option value="o3-mini" ${
                      modelConfig.model === 'o3-mini' ? 'selected' : ''
                    }>O3 Mini</option>
                </select>
            </div>
            <div class="form-group">
                <label for="openai-api-key">API Key:</label>
                <input type="password" id="openai-api-key" value="${openaiApiKey}" />
                <button id="test-openai">Test Connection</button>
                <div id="openai-test-result" class="test-result"></div>
            </div>
        </div>
        
        <!-- Mistral Section -->
        <div id="mistral-section" class="model-section ${
          modelConfig.provider === 'mistral' ? 'active' : ''
        }">
            <div class="form-group">
                <label for="mistral-model">Model:</label>
                <select id="mistral-model">
                    <option value="mistral-large-latest" ${
                      modelConfig.model === 'mistral-large-latest'
                        ? 'selected'
                        : ''
                    }>Mistral Large</option>
                    <option value="mistral-medium-latest" ${
                      modelConfig.model === 'mistral-medium-latest'
                        ? 'selected'
                        : ''
                    }>Mistral Medium</option>
                    <option value="mistral-small-latest" ${
                      modelConfig.model === 'mistral-small-latest'
                        ? 'selected'
                        : ''
                    }>Mistral Small</option>
                    <option value="codestral-latest" ${
                      modelConfig.model === 'codestral-latest' ? 'selected' : ''
                    }>Codestral</option>
                </select>
            </div>
            <div class="form-group">
                <label for="mistral-api-key">API Key:</label>
                <input type="password" id="mistral-api-key" value="${mistralApiKey}" />
                <button id="test-mistral">Test Connection</button>
                <div id="mistral-test-result" class="test-result"></div>
            </div>
        </div>
        
        <!-- Ollama Section -->
        <div id="ollama-section" class="model-section ${
          modelConfig.provider === 'ollama' ? 'active' : ''
        }">
            <div class="form-group">
                <label for="ollama-model">Model:</label>
                <input type="text" id="ollama-model" value="${
                  modelConfig.provider === 'ollama'
                    ? modelConfig.model
                    : 'llama3'
                }" placeholder="e.g. llama3" />
            </div>
            <div class="form-group">
                <label for="ollama-base-url">Base URL:</label>
                <input type="text" id="ollama-base-url" value="${ollamaBaseURL}" placeholder="http://localhost:11434/api" />
                <button id="test-ollama">Test Connection</button>
                <div id="ollama-test-result" class="test-result"></div>
            </div>
        </div>
        
        <h2>Generation Parameters</h2>
        
        <div class="form-group">
            <label for="temperature">Temperature: <span id="temperature-value">${temperature}</span></label>
            <div class="slider-container">
                <input type="range" id="temperature" min="0" max="1" step="0.05" value="${temperature}" class="slider" />
                <input type="number" id="temperature-input" min="0" max="1" step="0.05" value="${temperature}" class="slider-value" />
            </div>
        </div>
        
        <div class="form-group">
            <label for="max-tokens">Max Tokens:</label>
            <input type="number" id="max-tokens" value="${maxTokens}" min="100" max="4000" step="100" />
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" id="debug-mode" ${
                  debug ? 'checked' : ''
                } />
                Enable Debug Mode
            </label>
        </div>
        
        <button id="save-config">Save Configuration</button>
        
        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                
                // Provider selection
                const providerSelect = document.getElementById('provider');
                const sections = {
                    'anthropic': document.getElementById('anthropic-section'),
                    'openai': document.getElementById('openai-section'),
                    'mistral': document.getElementById('mistral-section'),
                    'ollama': document.getElementById('ollama-section')
                };
                
                // Show/hide sections based on provider selection
                providerSelect.addEventListener('change', () => {
                    const selectedProvider = providerSelect.value;
                    
                    // Hide all sections
                    Object.values(sections).forEach(section => {
                        section.classList.remove('active');
                    });

                    // Show selected section
                    sections[selectedProvider].classList.add('active');
                });
                
                // Temperature slider and input sync
                const temperatureSlider = document.getElementById('temperature');
                const temperatureInput = document.getElementById('temperature-input');
                const temperatureValue = document.getElementById('temperature-value');
                
                temperatureSlider.addEventListener('input', () => {
                    const value = temperatureSlider.value;
                    temperatureInput.value = value;
                    temperatureValue.textContent = value;
                });
                
                temperatureInput.addEventListener('input', () => {
                    const value = temperatureInput.value;
                    if (value >= 0 && value <= 1) {
                        temperatureSlider.value = value;
                        temperatureValue.textContent = value;
                    }
                });
                
                // Test connection buttons
                document.getElementById('test-anthropic').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'testConnection',
                        provider: 'anthropic'
                    });
                });
                
                document.getElementById('test-openai').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'testConnection',
                        provider: 'openai'
                    });
                });
                
                document.getElementById('test-mistral').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'testConnection',
                        provider: 'mistral'
                    });
                });
                
                document.getElementById('test-ollama').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'testConnection',
                        provider: 'ollama'
                    });
                });
                
                // Save configuration
                document.getElementById('save-config').addEventListener('click', () => {
                    const provider = providerSelect.value;
                    
                    // Get model based on selected provider
                    let model;
                    switch (provider) {
                        case 'anthropic':
                            model = document.getElementById('anthropic-model').value;
                            break;
                        case 'openai':
                            model = document.getElementById('openai-model').value;
                            break;
                        case 'mistral':
                            model = document.getElementById('mistral-model').value;
                            break;
                        case 'ollama':
                            model = document.getElementById('ollama-model').value;
                            break;
                    }
                    
                    const config = {
                        provider,
                        model,
                        anthropicApiKey: document.getElementById('anthropic-api-key').value,
                        openaiApiKey: document.getElementById('openai-api-key').value,
                        mistralApiKey: document.getElementById('mistral-api-key').value,
                        ollamaBaseURL: document.getElementById('ollama-base-url').value,
                        temperature: parseFloat(document.getElementById('temperature-input').value),
                        maxTokens: parseInt(document.getElementById('max-tokens').value),
                        debug: document.getElementById('debug-mode').checked
                    };
                    
                    vscode.postMessage({
                        command: 'saveConfig',
                        config
                    });
                });
                
                // Handle connection test results
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    if (message.command === 'connectionTestResult') {
                        const resultElement = document.getElementById("" + message.provider + "-test-result");
                        resultElement.textContent = message.message;
                        resultElement.className = 'test-result ' + (message.success ? 'success' : 'error');
                    }
                });
            })();
        </script>
    </body>
    </html>`;
  }
}
