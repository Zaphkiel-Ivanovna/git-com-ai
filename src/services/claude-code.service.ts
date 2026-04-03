import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger.util';

export interface IClaudeCodeResult {
  type: string;
  subtype: string;
  is_error: boolean;
  result: string;
  total_cost_usd: number;
  duration_ms: number;
  num_turns: number;
  session_id: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export class ClaudeCodeService {
  async generateCommitMessage(
    prompt: string,
    model: string,
    executablePath: string,
    abortSignal: AbortSignal,
    onData?: (chunk: string) => void
  ): Promise<IClaudeCodeResult> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let childProcess: ChildProcess;

      try {
        const args = [
          '-p',
          prompt,
          '--output-format',
          'json',
          '--model',
          model,
          '--max-turns',
          '1',
        ];

        logger.debug(
          `Spawning claude CLI: ${executablePath} with model: ${model}`
        );

        childProcess = spawn(executablePath, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (error) {
        reject(
          new Error(
            `Failed to spawn claude CLI. Make sure Claude Code is installed and available in your PATH. ${error instanceof Error ? error.message : String(error)}`
          )
        );
        return;
      }

      const onAbort = () => {
        logger.debug('Aborting claude CLI process');
        childProcess.kill('SIGTERM');
      };

      if (abortSignal.aborted) {
        childProcess.kill('SIGTERM');
        reject(new Error('Aborted'));
        return;
      }

      abortSignal.addEventListener('abort', onAbort, { once: true });

      childProcess.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        if (onData) {
          onData(chunk);
        }
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      childProcess.on('error', (error) => {
        abortSignal.removeEventListener('abort', onAbort);
        reject(
          new Error(
            `Claude CLI error: ${error.message}. Make sure Claude Code is installed and available in your PATH.`
          )
        );
      });

      childProcess.on('close', (code) => {
        abortSignal.removeEventListener('abort', onAbort);

        if (abortSignal.aborted) {
          reject(new Error('Aborted'));
          return;
        }

        if (code !== 0) {
          logger.error(`Claude CLI exited with code ${code}: ${stderr}`);
          reject(
            new Error(
              `Claude CLI exited with code ${code}${stderr ? `: ${stderr}` : ''}`
            )
          );
          return;
        }

        try {
          const result = JSON.parse(stdout) as IClaudeCodeResult;

          if (result.is_error || result.subtype !== 'success') {
            reject(
              new Error(`Claude CLI returned an error: ${result.result}`)
            );
            return;
          }

          logger.debug(
            `Claude CLI result: cost=$${result.total_cost_usd}, tokens=${result.usage.input_tokens}+${result.usage.output_tokens}`
          );

          resolve(result);
        } catch (parseError) {
          logger.error('Failed to parse Claude CLI output', parseError);
          logger.debug(`Raw stdout: ${stdout}`);
          reject(
            new Error(
              `Failed to parse Claude CLI output: ${parseError instanceof Error ? parseError.message : String(parseError)}`
            )
          );
        }
      });
    });
  }
}

export const claudeCodeService = new ClaudeCodeService();
