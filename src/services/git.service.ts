import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as util from 'util';
import { GitExtension, Repository } from '../@types/git';

export class GitService {
  private execPromise = util.promisify(exec);
  private gitExtension: GitExtension | undefined;

  constructor() {
    // Defer Git extension access until first use to avoid activation race conditions
  }

  private getGitExtension(): GitExtension | undefined {
    if (!this.gitExtension) {
      const extension =
        vscode.extensions.getExtension<GitExtension>('vscode.git');
      if (extension && extension.isActive) {
        this.gitExtension = extension.exports;
      }
    }
    return this.gitExtension;
  }

  /**
   * Get all git repositories in the workspace
   */
  public async getRepositories(): Promise<Repository[]> {
    const gitExtension = this.getGitExtension();
    if (!gitExtension) {
      return [];
    }
    const gitApi = gitExtension.getAPI(1);
    return gitApi.repositories || [];
  }

  /**
   * Find the active repository based on the active text editor
   */
  public async getActiveRepository(): Promise<Repository | null> {
    const repositories = await this.getRepositories();

    if (repositories.length === 0) {
      return null;
    }

    // If there's only one repository, use it
    if (repositories.length === 1) {
      return repositories[0];
    }

    // Try to find repository based on active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const activeFileUri = activeEditor.document.uri;
      for (const repo of repositories) {
        if (activeFileUri.fsPath.startsWith(repo.rootUri.fsPath)) {
          return repo;
        }
      }
    }

    // If no active editor or file not in any repo, return null to prompt user
    return null;
  }

  /**
   * Select a repository from available repositories
   */
  public async selectRepository(): Promise<Repository | null> {
    const repositories = await this.getRepositories();

    if (repositories.length === 0) {
      vscode.window.showErrorMessage('No Git repository found');
      return null;
    }

    if (repositories.length === 1) {
      return repositories[0];
    }

    // Try to get the active repository first
    const activeRepo = await this.getActiveRepository();
    if (activeRepo) {
      return activeRepo;
    }

    // Show quick pick for user to select
    const items = repositories.map((repo) => ({
      label: vscode.workspace.asRelativePath(repo.rootUri.fsPath),
      description: repo.rootUri.fsPath,
      repository: repo,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a Git repository',
      matchOnDescription: true,
    });

    return selected?.repository || null;
  }

  public async getGitDiff(repository?: Repository): Promise<string | null> {
    try {
      const repo = repository || (await this.selectRepository());
      if (!repo) {
        return null;
      }

      const workspaceFolder = repo.rootUri.fsPath;

      const { stdout: stagedChanges } = await this.execPromise(
        'git diff --staged',
        { cwd: workspaceFolder }
      );

      if (!stagedChanges) {
        vscode.window.showInformationMessage('No changes detected');
        return null;
      }

      return stagedChanges;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Error getting git diff: ${errorMessage}`);
      return null;
    }
  }

  public async getStagedFiles(repository?: Repository): Promise<string[]> {
    try {
      const repo = repository || (await this.selectRepository());
      if (!repo) {
        return [];
      }

      const workspaceFolder = repo.rootUri.fsPath;

      const { stdout } = await this.execPromise(
        'git diff --staged --name-only',
        { cwd: workspaceFolder }
      );
      return stdout.split('\n').filter((line) => line.trim() !== '');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Error getting staged files: ${errorMessage}`
      );
      return [];
    }
  }

  /**
   * Get the repository for the SCM input box
   */
  public async getRepositoryForSCM(): Promise<Repository | null> {
    // When triggered from SCM button, use the active repository
    return await this.selectRepository();
  }
}
