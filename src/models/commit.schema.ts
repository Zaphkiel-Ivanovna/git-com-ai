import { z } from 'zod';

export const commitBodyItemSchema = z.object({
  emoji: z.string().describe('The emoji for this change'),
  type: z.string().describe('The type of this change'),
  scope: z.string().optional().describe('The scope of this change (optional)'),
  description: z.string().describe('A short description of this change'),
});

export const commitMessageSchema = z.object({
  emoji: z.string().describe('The emoji that represents the type of change'),
  type: z.string().describe('The type of change'),
  scope: z.string().optional().describe('The scope of the change (optional)'),
  description: z
    .string()
    .describe(
      'A short description in imperative mood, not exceeding 74 characters'
    ),
  body: z
    .array(commitBodyItemSchema)
    .optional()
    .describe('Optional additional details about the changes'),
});

export type ICommitBodyItem = z.infer<typeof commitBodyItemSchema>;
export type ICommitMessage = z.infer<typeof commitMessageSchema>;
