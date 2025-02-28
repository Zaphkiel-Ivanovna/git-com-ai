import * as vscode from 'vscode';
import { ICommitMessage } from './types';

export class UIHandler {
  public async showCommitMessageInput(
    initialMessage: ICommitMessage
  ): Promise<string | undefined> {
    const formattedMessage = this.formatCommitMessage(initialMessage);

    return vscode.window.showInputBox({
      prompt: 'Generated commit message (you can edit it)',
      value: formattedMessage,
      validateInput: (text) => {
        if (!text.trim()) {
          return 'Commit message cannot be empty';
        }
        return null;
      },
    });
  }

  public formatCommitMessage(message: ICommitMessage): string {
    let formattedMessage = `${message.emoji} ${message.type}`;

    if (message.scope) {
      formattedMessage += `(${message.scope})`;
    }

    formattedMessage += `: ${message.description}`;

    if (message.body && message.body.length > 0) {
      for (const item of message.body) {
        let bodyLine = `* ${item.emoji} ${item.type}`;

        if (item.scope) {
          bodyLine += `(${item.scope})`;
        }

        bodyLine += `: ${item.description}`;
        formattedMessage += `\n${bodyLine}`;
      }
    }

    return formattedMessage;
  }

  public async copyToClipboard(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage('Commit message copied to clipboard');
  }
}
