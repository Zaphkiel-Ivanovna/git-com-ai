import * as vscode from 'vscode';
import { GitService } from './services/git.service';
import { AIService } from './services/ai.service';
import { UIHandler } from './ui/ui.handler';
import { Logger } from './utils/logger';
import { AIProvider, IModelConfig } from './@types/types';

const logger = Logger.getInstance();

export function activate(context: vscode.ExtensionContext): void {
  logger.log('GitComAI extension activated');

  const gitService = new GitService();
  const aiService = new AIService();
  const uiHandler = new UIHandler();

  const config = vscode.workspace.getConfiguration('gitcomai');
  const modelConfig: IModelConfig | undefined = config.get('selectedModel');
  const provider = modelConfig?.provider || AIProvider.ANTHROPIC;

  const disposable = vscode.commands.registerCommand(
    'gitcomai.generateCommitMessage',
    async () => {
      logger.log('Command gitcomai.generateCommitMessage executed');

      try {
        const gitExtension =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vscode.extensions.getExtension<any>('vscode.git')?.exports;
        if (!gitExtension) {
          vscode.window.showErrorMessage('Git extension not found');
          return;
        }

        const gitApi = gitExtension.getAPI(1);
        if (!gitApi.repositories.length) {
          vscode.window.showErrorMessage('No Git repository found');
          return;
        }
      } catch (error) {
        logger.error('Error checking Git repository', error);
        vscode.window.showErrorMessage('Failed to verify Git repository');
        return;
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Working with Git...',
          cancellable: false,
        },
        async (progress) => {
          try {
            progress.report({ increment: 0, message: 'Getting git diff...' });
            logger.log('Getting git diff');

            const gitDiff = await gitService.getGitDiff();
            if (!gitDiff) {
              logger.warn('No git diff found');
              return;
            }

            const stagedFiles = await gitService.getStagedFiles();
            logger.log(`Found ${stagedFiles.length} staged files`);

            progress.report({
              increment: 30,
              message: 'Starting AI generation...',
            });
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
              increment: 100,
              message: 'Commit message generated',
            });
            logger.log('Commit message generation completed');

            return new Promise<void>((resolve) => {
              setTimeout(() => {
                const copyToClipboard = 'Copy to Clipboard';
                vscode.window
                  .showInformationMessage(
                    'Commit message has been generated',
                    copyToClipboard
                  )
                  .then((userChoice) => {
                    if (userChoice === copyToClipboard) {
                      const formattedMessage =
                        uiHandler.formatCommitMessage(commitMessage);
                      uiHandler.copyToClipboard(formattedMessage);
                    }
                    resolve();
                  });
              }, 1000);
            });
          } catch (error) {
            logger.error('Error in commit message generation process', error);
            vscode.window.showErrorMessage(
              `Error generating commit message: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }
      );
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(
    vscode.commands.registerCommand('gitcomai.showLogs', () => {
      logger.show();
    })
  );
}

export function deactivate(): void {
  logger.log('GitComAI extension deactivated');
}
