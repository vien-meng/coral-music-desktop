import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import {
  createExternalDecoderStreamProviders,
  selectExternalDecoderStreamProvider,
  type ExternalDecoderStreamProviderId,
} from '@shared/externalDecoderProviders';
import { createExternalDecoderStreamArgs } from '@shared/externalDecoderStreamArgs';
import { createNativeApeHelperStreamArgs } from '@shared/nativeApeHelperArgs';
import {
  type ExternalDecoderStreamParams,
  type ExternalDecoderStreamResult,
  type ExternalDecoderTranscodeParams,
  type ExternalDecoderTranscodeResult,
} from '@shared/playbackCapabilities';

const MAX_STDERR_LENGTH = 4000;
const STREAM_TOKEN_TTL_MS = 30 * 60 * 1000;

interface ExternalStreamToken {
  endMs?: number | null;
  expiresAt: number;
  inputFormat?: string | null;
  inputPath: string;
  startMs?: number | null;
  timeoutMs: number;
}

let streamServer: http.Server | null = null;
let streamServerPort = 0;
const streamTokens = new Map<string, ExternalStreamToken>();

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

const getNativeApeHelperPath = (): string =>
  process.env.CORAL_NATIVE_APE_HELPER_PATH ||
  path.join(
    process.resourcesPath || app.getAppPath(),
    'bin',
    process.platform === 'win32' ? 'coral-ape-helper.exe' : 'coral-ape-helper',
  );

const isNativeApeHelperAvailable = async (): Promise<boolean> => {
  const stat = await fs.stat(getNativeApeHelperPath()).catch(() => null);
  return Boolean(stat?.isFile());
};

const cleanupExpiredStreamTokens = (): void => {
  const now = Date.now();
  for (const [token, info] of streamTokens) {
    if (info.expiresAt < now) streamTokens.delete(token);
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
      reject(new Error(error.message || '内嵌 FFmpeg 启动失败，请检查应用完整性或重新安装。'));
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
    throw new Error('当前播放器运行时只能播放内嵌 FFmpeg 转码后的 WAV 输出。');
  }

  const ffmpegPath = resolveBundledFfmpegPath();
  await assertFile(ffmpegPath, 'FFmpeg 可执行文件');

  const baseArgs = ['-y', '-hide_banner', '-loglevel', 'error'];
  // 强制 stereo：DTS/AC3 可能是多声道，Chrome 对多声道 PCM 支持有限
  const outputArgs = ['-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', outputPath];

  try {
    // 标准探测模式：让 FFmpeg 自动识别格式
    await runProcess(
      ffmpegPath,
      [...baseArgs, '-i', params.inputPath, ...outputArgs],
      params.timeoutMs,
      {
        eacces: 'FFmpeg 无法执行，请检查应用完整性或重新安装。',
        enoent: '内嵌 FFmpeg 未找到，请重新安装应用。',
        timeout: '内嵌 FFmpeg 解码超时，请检查音频文件是否完整。',
      },
    );
  } catch (standardError) {
    // 标准探测失败时（如无头 raw PCM WAV），回退到 raw PCM 强制解码
    // 常见参数：s16le/48000Hz/stereo（CD/高清 PCM 最常见规格）
    const errMsg = standardError instanceof Error ? standardError.message : String(standardError);
    if (!/Invalid data found|Demuxer|not a file/i.test(errMsg)) throw standardError;

    await runProcess(
      ffmpegPath,
      [
        ...baseArgs,
        '-f',
        's16le',
        '-ar',
        '48000',
        '-ac',
        '2',
        '-i',
        params.inputPath,
        ...outputArgs,
      ],
      params.timeoutMs,
      {
        eacces: 'FFmpeg 无法执行，请检查应用完整性或重新安装。',
        enoent: '内嵌 FFmpeg 未找到，请重新安装应用。',
        timeout: '内嵌 FFmpeg 解码超时，请检查音频文件是否完整。',
      },
    );
  }
};

const ensureStreamServer = async (): Promise<number> => {
  if (streamServer && streamServerPort) return streamServerPort;

  streamServer = http.createServer((req, res) => {
    handleStreamRequest(req, res).catch((error) => {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error instanceof Error ? error.message : String(error));
    });
  });

  await new Promise<void>((resolve) => {
    streamServer!.listen(0, '127.0.0.1', () => {
      const address = streamServer!.address();
      streamServerPort = typeof address === 'object' && address ? address.port : 0;
      resolve();
    });
  });

  return streamServerPort;
};

const createStreamChild = async (
  providerId: ExternalDecoderStreamProviderId,
  info: ExternalStreamToken,
): Promise<ChildProcessWithoutNullStreams> => {
  if (providerId === 'native-ape') {
    const helperPath = getNativeApeHelperPath();
    await assertFile(helperPath, 'APE helper');
    return spawn(helperPath, createNativeApeHelperStreamArgs(info), { windowsHide: true });
  }

  const ffmpegPath = resolveBundledFfmpegPath();
  await assertFile(ffmpegPath, 'FFmpeg 可执行文件');
  return spawn(ffmpegPath, createExternalDecoderStreamArgs(info), { windowsHide: true });
};

const pipeProviderStream = async (
  providerId: ExternalDecoderStreamProviderId,
  info: ExternalStreamToken,
  res: http.ServerResponse,
  options: { allowFallback: boolean },
): Promise<void> => {
  const child = await createStreamChild(providerId, info);
  const stderrChunks: string[] = [];
  let didFallback = false;
  let startupTimedOut = false;
  let didWriteOutput = false;
  let startupTimer: NodeJS.Timeout | null = setTimeout(() => {
    startupTimedOut = true;
    child.kill('SIGKILL');
    if (options.allowFallback && providerId === 'native-ape' && !didWriteOutput) return;
    if (!res.writableEnded)
      res.destroy(new Error('内嵌 FFmpeg 启动解码超时，请检查音频文件是否完整。'));
  }, info.timeoutMs);
  const clearStartupTimer = (): void => {
    if (!startupTimer) return;
    clearTimeout(startupTimer);
    startupTimer = null;
  };
  const writeAudioHeaders = (): void => {
    if (res.headersSent) return;
    res.writeHead(200, {
      'Accept-Ranges': 'none',
      'Cache-Control': 'no-store',
      'Content-Type': 'audio/wav',
    });
  };
  const fallbackToFfmpeg = (): void => {
    if (didFallback || didWriteOutput || res.headersSent || res.writableEnded) return;
    didFallback = true;
    clearStartupTimer();
    pipeProviderStream('ffmpeg', info, res, { allowFallback: false }).catch((error) => {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error instanceof Error ? error.message : String(error));
    });
  };

  child.stderr.on('data', (chunk: Buffer) => {
    if (stderrChunks.join('').length < MAX_STDERR_LENGTH) stderrChunks.push(chunk.toString());
  });
  child.on('error', (error: NodeJS.ErrnoException) => {
    clearStartupTimer();
    if (options.allowFallback && providerId === 'native-ape' && !didWriteOutput) {
      fallbackToFfmpeg();
      return;
    }
    if (res.headersSent) return;
    const message =
      error.code === 'ENOENT'
        ? '内嵌 FFmpeg 未找到，请重新安装应用。'
        : error.code === 'EACCES'
          ? 'FFmpeg 无法执行，请检查应用完整性或重新安装。'
          : error.message || '内嵌 FFmpeg 启动失败，请检查应用完整性或重新安装。';
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
  });
  child.on('close', (code) => {
    clearStartupTimer();
    if (
      options.allowFallback &&
      providerId === 'native-ape' &&
      !didWriteOutput &&
      !res.headersSent
    ) {
      fallbackToFfmpeg();
      return;
    }
    if ((code || startupTimedOut) && !res.writableEnded) {
      const details = stderrChunks.join('').trim();
      res.destroy(
        new Error(
          details ||
            (startupTimedOut
              ? '内嵌 FFmpeg 启动解码超时，请检查音频文件是否完整。'
              : `${providerId} exited with code ${code}.`),
        ),
      );
    }
  });

  res.on('close', () => {
    if (!child.killed) child.kill('SIGKILL');
  });
  child.stdout.once('data', (chunk: Buffer) => {
    didWriteOutput = true;
    clearStartupTimer();
    writeAudioHeaders();
    res.write(chunk);
    child.stdout.pipe(res);
  });
};

const handleStreamRequest = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> => {
  const token = decodeURIComponent((req.url ?? '').split('/').pop() ?? '');
  const info = streamTokens.get(token);
  if (!info || info.expiresAt < Date.now()) {
    streamTokens.delete(token);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('External decoder stream token expired');
    return;
  }
  // 注意：不要在这里删除 token。流式播放期间音频元素和头部探测会并发请求同一 URL，
  // 删除会导致第二个请求拿到 404。token 由过期清理（cleanupExpiredStreamTokens）
  // 和显式撤销（revokeExternalDecoderStream）负责回收。

  await assertFile(info.inputPath, 'Input');
  const providerSelection = selectExternalDecoderStreamProvider(
    info.inputPath,
    createExternalDecoderStreamProviders({
      nativeApeAvailable: await isNativeApeHelperAvailable(),
    }),
  );

  await pipeProviderStream(providerSelection.provider.id, info, res, {
    allowFallback: providerSelection.fallbackProviderId === 'ffmpeg',
  });
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

export const createExternalDecoderStream = async (
  params: ExternalDecoderStreamParams,
): Promise<ExternalDecoderStreamResult> => {
  await assertFile(params.inputPath, 'Input');
  cleanupExpiredStreamTokens();
  const port = await ensureStreamServer();
  const token = randomUUID();
  const expiresAt = Date.now() + STREAM_TOKEN_TTL_MS;
  streamTokens.set(token, {
    endMs: params.endMs ?? null,
    expiresAt,
    inputFormat: params.inputFormat ?? null,
    inputPath: params.inputPath,
    startMs: params.startMs ?? null,
    timeoutMs: params.timeoutMs,
  });

  return {
    expiresAt,
    token,
    url: `http://127.0.0.1:${port}/external-decoder/stream/${encodeURIComponent(token)}`,
    warnings: [],
  };
};

export const revokeExternalDecoderStream = (token: string): void => {
  streamTokens.delete(token);
};
