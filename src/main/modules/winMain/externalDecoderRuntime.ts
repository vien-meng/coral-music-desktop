import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import {
  type ExternalDecoderTranscodeParams,
  type ExternalDecoderTranscodeResult,
} from '@shared/playbackCapabilities';

const MAX_STDERR_LENGTH = 4000;

/**
 * Resolve the bundled ffmpeg-static binary path.
 *
 * In development, `require('ffmpeg-static')` returns the absolute path to the
 * platform binary under node_modules. In a packaged app (asar: false), the
 * node_modules tree is copied verbatim, so the same require resolves to the
 * unpacked binary inside the app folder.
 */
const resolveBundledFfmpegPath = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const ffmpegStatic = require('ffmpeg-static') as string;
  if (!ffmpegStatic) {
    throw new Error('内嵌 FFmpeg 二进制未找到，请重新安装应用。');
  }
  // In packaged apps with asar:false the path points inside the app directory;
  // fix the `app.asar` segment if it slipped in (harmless in asar:false builds).
  return ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
};

const assertFile = async (filePath: string, label: string): Promise<void> => {
  if (!filePath.trim()) throw new Error(`${label} path is empty.`);

  const stats = await fs.stat(filePath).catch(() => null);
  if (!stats || stats.isDirectory()) {
    throw new Error(`${label} path is not a file (resolved: "${filePath}").`);
  }
};

const createOutputPath = (inputPath: string): string => {
  const tempDir = app.getPath('temp');
  const baseName =
    path
      .basename(inputPath, path.extname(inputPath))
      .replace(/[^\w.-]+/g, '_')
      .slice(0, 80) || 'local-audio';
  return path.join(tempDir, `coral-decoder-${Date.now()}-${baseName}.wav`);
};

const runProcess = async (
  executablePath: string,
  args: string[],
  timeoutMs: number,
  messages: {
    enoent: string;
    eacces: string;
    timeout: string;
  },
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const stderrChunks: string[] = [];
    const child = spawn(executablePath, args, {
      windowsHide: true,
    });

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(messages.timeout));
    }, timeoutMs);

    child.stderr.on('data', (chunk: Buffer) => {
      if (stderrChunks.join('').length < MAX_STDERR_LENGTH) {
        stderrChunks.push(chunk.toString());
      }
    });
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      if (error.code === 'ENOENT') {
        reject(new Error(messages.enoent));
        return;
      }
      if (error.code === 'EACCES') {
        reject(new Error(messages.eacces));
        return;
      }
      reject(new Error(error.message || '外部解码器启动失败。'));
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }

      const details = stderrChunks.join('').trim();
      reject(new Error(details || `FFmpeg exited with code ${code ?? 'unknown'}.`));
    });
  });
};

const runFfmpeg = async (
  params: ExternalDecoderTranscodeParams,
  outputPath: string,
): Promise<void> => {
  if (params.output !== 'wav') {
    throw new Error('当前播放器运行时只能播放外部解码后的 WAV 输出，请在设置里选择 WAV。');
  }

  const ffmpegPath = resolveBundledFfmpegPath();
  await assertFile(ffmpegPath, 'FFmpeg 可执行文件');

  await runProcess(
    ffmpegPath,
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      params.inputPath,
      '-vn',
      '-acodec',
      'pcm_s16le',
      '-ar',
      '44100',
      outputPath,
    ],
    params.timeoutMs,
    {
      eacces: 'FFmpeg 无法执行，请检查应用完整性或重新安装。',
      enoent: '内嵌 FFmpeg 未找到，请重新安装应用。',
      timeout: '外部解码超时，请检查文件或调大超时时间。',
    },
  );
};

export const transcodeExternalDecoder = async (
  params: ExternalDecoderTranscodeParams,
): Promise<ExternalDecoderTranscodeResult> => {
  await assertFile(params.inputPath, 'Input');

  const outputPath = createOutputPath(params.inputPath);
  try {
    await runFfmpeg(params, outputPath);
    await assertFile(outputPath, 'Decoded output');
  } catch (error) {
    await fs.rm(outputPath, { force: true }).catch(() => {});
    throw error;
  }

  return {
    output: 'wav',
    outputPath,
    warnings: [],
  };
};
