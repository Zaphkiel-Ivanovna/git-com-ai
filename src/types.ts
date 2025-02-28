export interface ICommitMessage {
  emoji: string;
  type: string;
  scope?: string;
  description: string;
  body?: ICommitBodyItem[];
}

export interface ICommitBodyItem {
  emoji: string;
  type: string;
  scope?: string;
  description: string;
}

export interface IAnthropicResponse {
  content: Array<IContentItem>;
}

export interface IGitDiff {
  diff: string;
  workingDirectory: string;
}

export interface IContentItem {
  type: 'text' | 'tool_use' | 'thinking' | 'redacted_thinking';
  text?: string;
  name?: string;
  input?: string | Record<string, unknown>;
}
