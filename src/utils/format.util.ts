import { ICommitMessage } from '../models/commit.schema';

/**
 * Formats a file size in bytes to a human-readable string with appropriate units
 * @param bytes The size in bytes to format
 * @returns A formatted string with the appropriate unit (B, KB, MB, or GB)
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatCommitMessage(message: ICommitMessage): string {
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
