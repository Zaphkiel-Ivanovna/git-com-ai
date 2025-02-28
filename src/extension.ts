import * as vscode from 'vscode';
import { GitService } from './gitService';
import { AIService } from './ai/aiService';
import { UIHandler } from './uiHandler';
import { logger } from './logger';
import { modelOptions } from './modelConfig';
import { IModelConfig } from './types';

export function activate(context: vscode.ExtensionContext): void {
  logger.log('GitComAI extension activated');

  const gitService = new GitService();
  const aiService = new AIService();
  const uiHandler = new UIHandler();

  const disposable = vscode.commands.registerCommand(
    'gitcomai.generateCommitMessage',
    async () => {
      logger.log('Command gitcomai.generateCommitMessage executed');

      const config = vscode.workspace.getConfiguration('gitcomai');
      const modelConfig: IModelConfig | undefined = config.get('selectedModel');

      if (!modelConfig) {
        logger.warn('No AI model selected');
        const configureModel = 'Configure Model';
        const result = await vscode.window.showErrorMessage(
          'No AI model selected. Please configure a model in the extension settings.',
          configureModel
        );

        if (result === configureModel) {
          vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'gitcomai.selectedModel'
          );
        }
        return;
      }

      const provider = modelConfig.provider;
      const apiKeyConfig = `${provider}ApiKey`;
      const apiKey = config.get<string>(apiKeyConfig);

      if (provider !== 'ollama') {
        if (!apiKey) {
          const setApiKey = 'Set API Key';
          const result = await vscode.window.showWarningMessage(
            `${provider} API key not configured. You need to set it before using this provider.`,
            setApiKey
          );

          if (result === setApiKey) {
            vscode.commands.executeCommand(
              'workbench.action.openSettings',
              `gitcomai.${provider}ApiKey`
            );
          }
          return;
        }
      } else {
        try {
          const baseURL =
            vscode.workspace
              .getConfiguration('gitcomai')
              .get<string>('ollamaBaseURL') || 'http://localhost:11434/api';

          vscode.window.showInformationMessage(
            `Ollama will use the local server at ${baseURL}. Make sure Ollama is running.`
          );
        } catch (error) {
          logger.error('Error checking Ollama configuration', error);
        }
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Generating commit message...',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 0, message: 'Getting git diff...' });
          logger.log('Getting git diff');

          const gitDiff = await gitService.getGitDiff();
          if (!gitDiff) {
            logger.warn('No git diff found');
            return;
          }

          const stagedFiles = await gitService.getStagedFiles();
          logger.log(`Found ${stagedFiles.length} staged files`);

          progress.report({ increment: 30, message: 'Analyzing changes...' });
          logger.log(`Generating commit message with ${provider} API`);

          const commitMessage = await aiService.generateCommitMessage(
            gitDiff.diff,
            stagedFiles
          );
          if (!commitMessage) {
            logger.error('Failed to generate commit message');
            return;
          }

          progress.report({
            increment: 70,
            message: 'Processing commit message...',
          });
          logger.log('Commit message generated successfully');

          const formattedMessage = uiHandler.formatCommitMessage(commitMessage);

          const gitExtension =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vscode.extensions.getExtension<any>('vscode.git')?.exports;
          if (gitExtension) {
            const gitAPI = gitExtension.getAPI(1);
            const repositories = gitAPI.repositories;

            if (repositories.length > 0) {
              const repository = repositories[0];
              repository.inputBox.value = formattedMessage;
              vscode.commands.executeCommand('workbench.scm.focus');
              logger.log('Commit message inserted into Git input box');
              vscode.window.showInformationMessage(
                'Commit message generated and inserted'
              );
            } else {
              logger.warn(
                'No Git repositories found, copying to clipboard instead'
              );
              await uiHandler.copyToClipboard(formattedMessage);
            }
          } else {
            logger.warn(
              'Git extension not found, copying to clipboard instead'
            );
            await uiHandler.copyToClipboard(formattedMessage);
          }
        }
      );
    }
  );
  context.subscriptions.push(disposable);

  const selectModelCommand = vscode.commands.registerCommand(
    'gitcomai.selectModel',
    async () => {
      logger.log('Command gitcomai.selectModel executed');

      const providerOptions = [
        { label: 'Anthropic (Claude)', value: 'anthropic' },
        { label: 'OpenAI (GPT)', value: 'openai' },
        { label: 'Mistral AI', value: 'mistral' },
        { label: 'Ollama (Local Models)', value: 'ollama' },
      ];

      const selectedProvider = await vscode.window.showQuickPick(
        providerOptions.map((option) => ({
          label: option.label,
          value: option.value,
        })),
        {
          placeHolder: 'Select AI provider',
          title: 'Select AI Provider',
        }
      );

      if (!selectedProvider) {
        return;
      }

      const provider = selectedProvider.value;

      if (provider !== 'ollama') {
        const apiKey = vscode.workspace
          .getConfiguration('gitcomai')
          .get<string>(`${provider}ApiKey`);
        if (!apiKey) {
          const setApiKey = 'Set API Key';
          const result = await vscode.window.showWarningMessage(
            `${provider} API key not configured. You need to set it before using this provider.`,
            setApiKey
          );

          if (result === setApiKey) {
            vscode.commands.executeCommand(
              'workbench.action.openSettings',
              `gitcomai.${provider}ApiKey`
            );
          }
          return;
        }
      } else {
        try {
          const baseURL =
            vscode.workspace
              .getConfiguration('gitcomai')
              .get<string>('ollamaBaseURL') || 'http://localhost:11434/api';

          vscode.window.showInformationMessage(
            `Ollama will use the local server at ${baseURL}. Make sure Ollama is running.`
          );
        } catch (error) {
          logger.error('Error checking Ollama configuration', error);
        }
      }

      const modelOpts = modelOptions[provider];
      const selectedModel = await vscode.window.showQuickPick(
        modelOpts.map((option) => ({
          label: option.label,
          description: option.description,
          value: option.value,
        })),
        {
          placeHolder: 'Select AI model',
          title: `Select ${selectedProvider.label} Model`,
        }
      );

      if (!selectedModel) {
        return;
      }

      await vscode.workspace.getConfiguration('gitcomai').update(
        'selectedModel',
        {
          provider,
          model: selectedModel.value,
        },
        vscode.ConfigurationTarget.Global
      );

      vscode.window.showInformationMessage(
        `Model set to ${selectedModel.label} (${selectedProvider.label})`
      );
    }
  );

  context.subscriptions.push(selectModelCommand);
}

export function deactivate(): void {
  logger.log('GitComAI extension deactivated');
}
