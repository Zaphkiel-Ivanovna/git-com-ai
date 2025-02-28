import * as vscode from 'vscode';

export class Logger {
  private static outputChannel: vscode.OutputChannel;
  private static instance: Logger;

  private constructor() {
    Logger.outputChannel = vscode.window.createOutputChannel('GitCom AI');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(message: string): void {
    const timestamp = new Date().toISOString();
    Logger.outputChannel.appendLine(`[${timestamp}] [INFO] ${message}`);
  }

  public error(message: string, error?: unknown): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? `\n${error.stack}` : '';

    Logger.outputChannel.appendLine(
      `[${timestamp}] [ERROR] ${message}: ${errorMessage}${stack}`
    );
  }

  public warn(message: string): void {
    const timestamp = new Date().toISOString();
    Logger.outputChannel.appendLine(`[${timestamp}] [WARN] ${message}`);
  }

  public debug(message: string): void {
    if (
      vscode.workspace.getConfiguration('gitcomai').get<boolean>('debug', false)
    ) {
      const timestamp = new Date().toISOString();
      Logger.outputChannel.appendLine(`[${timestamp}] [DEBUG] ${message}`);
    }
  }

  public show(): void {
    Logger.outputChannel.show();
  }
}

// Exporter une instance par défaut pour faciliter l'utilisation
export const logger = Logger.getInstance();
