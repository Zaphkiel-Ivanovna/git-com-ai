import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { logger } from './logger';

/**
 * Interface pour les prompts retournés
 */
export interface IPrompts {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Charge le prompt depuis un fichier texte et retourne à la fois le system prompt et le user prompt
 */
export async function loadCommitPrompt(
  diff: string,
  files: string[]
): Promise<IPrompts> {
  try {
    const extensionPath =
      vscode.extensions.getExtension('ZaphkielIvanovna.gitcomai')
        ?.extensionPath || '';
    const promptPath = path.join(
      extensionPath,
      'resources',
      'commit-prompt.md'
    );

    const systemPrompt = await fs.readFile(promptPath, 'utf-8');

    const userPrompt = `Modified files:
${files.join('\n')}

Git diff:
\`\`\`
${diff}
\`\`\`

Analyze the changes and determine the most appropriate type and scope. Be specific and concise in the description.`;

    return {
      systemPrompt,
      userPrompt,
    };
  } catch (error) {
    logger.error('Error loading prompt template:', error);

    return {
      systemPrompt:
        'You are a helpful assistant that generates concise, meaningful git commit messages following the Conventional Commits specification.',
      userPrompt: `Based on the following git diff, generate a concise, meaningful commit message.

Modified files:
${files.join('\n')}

Git diff:
\`\`\`
${diff}
\`\`\`

Analyze the changes and determine the most appropriate type and scope. Be specific and concise in the description.`,
    };
  }
}
