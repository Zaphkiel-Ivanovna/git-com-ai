import * as vscode from 'vscode';
import { GitService } from './services/git.service';
import { AIService } from './services/ai.service';
import { Logger } from './utils/logger.util';
import { AIProvider, IModelConfig } from './@types/types';
import { ConfigView } from './ui/config-view';
import { GitExtension } from './@types/git';

const logger = Logger.getInstance();

export function activate(context: vscode.ExtensionContext): void {
  try {
    logger.log('GitComAI extension activated');

    const gitService = new GitService();
    const aiService = new AIService();
    const configView = new ConfigView(context);

    const config = vscode.workspace.getConfiguration('gitcomai');
    const modelConfig: IModelConfig | undefined = config.get('selectedModel');
    const provider = modelConfig?.provider || AIProvider.ANTHROPIC;

    const generateCommitMessageCmd = vscode.commands.registerCommand(
      'gitcomai.generateCommitMessage',
      async () => {
        logger.log('Command gitcomai.generateCommitMessage executed');

        try {
          const gitExtension =
            vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
          if (!gitExtension) {
            vscode.window.showErrorMessage('Git extension not found');
            return;
          }
          const gitApi = gitExtension.getAPI(1);
          if (!gitApi.repositories || gitApi.repositories.length === 0) {
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
            cancellable: true,
          },
          async (progress, token) => {
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
                stagedFiles,
                progress,
                token
              );

              if (!commitMessage) {
                logger.error('Failed to generate commit message');
                return;
              }
              logger.log('Commit message generation completed');

              return new Promise<void>((resolve) => {
                setTimeout(() => {
                  resolve();
                }, 2000);
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

    const showLogsCmd = vscode.commands.registerCommand(
      'gitcomai.showLogs',
      () => {
        logger.show();
      }
    );

    // Nouvelle commande pour ouvrir la page de configuration
    const openConfigCmd = vscode.commands.registerCommand(
      'gitcomai.openConfig',
      () => {
        configView.show();
      }
    );

    context.subscriptions.push(generateCommitMessageCmd);
    context.subscriptions.push(showLogsCmd);
    context.subscriptions.push(openConfigCmd);
  } catch (err) {
    logger.error('Error activating GitComAI extension', err);
  }
}

export function deactivate(): void {
  logger.log('GitComAI extension deactivated');
}
