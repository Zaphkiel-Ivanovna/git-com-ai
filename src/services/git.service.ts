import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as util from 'util';

export class GitService {
  private execPromise = util.promisify(exec);

  public async getGitDiff(): Promise<string | null> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return null;
      }

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

  public async getStagedFiles(): Promise<string[]> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return [];
      }

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
}
