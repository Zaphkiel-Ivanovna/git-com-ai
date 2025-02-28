import * as vscode from 'vscode';
import { GitService } from './gitService';
import { AnthropicService } from './anthropicService';
import { UIHandler } from './uiHandler';
import { logger } from './logger';

export function activate(context: vscode.ExtensionContext): void {
  logger.log('GitComAI extension activated');

  const gitService = new GitService();
  const anthropicService = new AnthropicService();
  const uiHandler = new UIHandler();

  const disposable = vscode.commands.registerCommand(
    'gitcomai.generateCommitMessage',
    async () => {
      logger.log('Command gitcomai.generateCommitMessage executed');

      const apiKey = vscode.workspace
        .getConfiguration('gitcomai')
        .get<string>('anthropicApiKey');
      if (!apiKey) {
        logger.warn('Anthropic API key not configured');
        const setApiKey = 'Set API Key';
        const result = await vscode.window.showErrorMessage(
          'Anthropic API key not configured. Please set it in the extension settings.',
          setApiKey
        );

        if (result === setApiKey) {
          vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'gitcomai.anthropicApiKey'
          );
        }
        return;
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
          logger.log('Generating commit message with Anthropic API');

          const commitMessage = await anthropicService.generateCommitMessage(
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
}

export function deactivate(): void {
  logger.log('GitComAI extension deactivated');
}
