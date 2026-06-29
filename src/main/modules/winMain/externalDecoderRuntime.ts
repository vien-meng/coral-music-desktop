import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import {
  type ExternalDecoderTranscodeParams,
  type ExternalDecoderTranscodeResult,
} from '@shared/playbackCapabilities';

const MAX_STDERR_LENGTH = 4000;

const isBareExecutableCommand = (executablePath: string): boolean =>
  Boolean(executablePath.trim()) &&
  !path.isAbsolute(executablePath) &&
  !/[\\/]/.test(executablePath);

const assertFile = async (filePath: string, label: string): Promise<void> => {
  if (!filePath.trim()) throw new Error(`${label} path is empty.`);

  const stats = await fs.stat(filePath).catch(() => null);
  if (!stats || stats.isDirectory()) throw new Error(`${label} path is not a file.`);
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

const runFfmpeg = async (
  params: ExternalDecoderTranscodeParams,
  outputPath: string,
): Promise<void> => {
  if (params.output !== 'wav') {
    throw new Error('当前播放器运行时只能播放外部解码后的 WAV 输出，请在设置里选择 WAV。');
  }

  await new Promise<void>((resolve, reject) => {
    const stderrChunks: string[] = [];
    const executablePath = params.executablePath.trim() || 'ffmpeg';
    const child = spawn(
      executablePath,
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
      {
        windowsHide: true,
      },
    );

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('外部解码超时，请检查文件、解码器路径或调大超时时间。'));
    }, params.timeoutMs);

    child.stderr.on('data', (chunk: Buffer) => {
      if (stderrChunks.join('').length < MAX_STDERR_LENGTH) {
        stderrChunks.push(chunk.toString());
      }
    });
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      if (error.code === 'ENOENT') {
        reject(
          new Error(
            '未找到 FFmpeg，请先安装 FFmpeg，或在“设置 > 本地解码”填写 ffmpeg 可执行文件路径。',
          ),
        );
        return;
      }
      if (error.code === 'EACCES') {
        reject(new Error('FFmpeg 无法执行，请检查解码器路径的执行权限。'));
        return;
      }
      reject(new Error(error.message || 'FFmpeg 启动失败。'));
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

export const transcodeExternalDecoder = async (
  params: ExternalDecoderTranscodeParams,
): Promise<ExternalDecoderTranscodeResult> => {
  await assertFile(params.inputPath, 'Input');

  if (params.provider === 'none') {
    throw new Error('外部解码器未启用。');
  }

  if (params.provider === 'foobar2000') {
    await assertFile(params.executablePath, 'External decoder executable');
    throw new Error(
      'Foobar2000 已支持路径探测，但当前还没有可靠的无交互转码适配；请先使用 FFmpeg 作为外部解码器播放 DSD/SACD 文件。',
    );
  }

  const executablePath = params.executablePath.trim() || 'ffmpeg';
  if (!isBareExecutableCommand(executablePath)) {
    await assertFile(executablePath, 'External decoder executable');
  }

  const outputPath = createOutputPath(params.inputPath);
  try {
    await runFfmpeg({ ...params, executablePath }, outputPath);
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
