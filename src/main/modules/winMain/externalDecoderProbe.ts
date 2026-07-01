import fs from 'node:fs/promises';
import {
  externalDecoderExtensions,
  normalizeAudioExtension,
  type ExternalDecoderProbeParams,
  type ExternalDecoderProbeResult,
} from '@shared/playbackCapabilities';

/**
 * Resolve the bundled ffmpeg-static binary path (same logic as the runtime).
 */
const resolveBundledFfmpegPath = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const ffmpegStatic = require('ffmpeg-static') as string;
  if (!ffmpegStatic) return '';
  return ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
};

export const probeExternalDecoder = async (
  params: ExternalDecoderProbeParams,
): Promise<ExternalDecoderProbeResult> => {
  const requestedExtensions = Array.from(new Set(params.extensions.map(normalizeAudioExtension)));
  const knownExtensions = new Set(externalDecoderExtensions);
  const supportedExtensions = requestedExtensions.filter((ext) =>
    knownExtensions.has(ext as (typeof externalDecoderExtensions)[number]),
  );
  const missingExtensions = requestedExtensions.filter(
    (ext) => !knownExtensions.has(ext as (typeof externalDecoderExtensions)[number]),
  );
  const warnings: string[] = [];
  const errors: string[] = [];

  const ffmpegPath = resolveBundledFfmpegPath();
  let executableExists = false;
  if (ffmpegPath) {
    const stats = await fs.stat(ffmpegPath).catch(() => null);
    executableExists = Boolean(stats && !stats.isDirectory());
    if (!executableExists) {
      errors.push('内嵌 FFmpeg 二进制缺失，请重新安装应用。');
    }
  } else {
    errors.push('内嵌 FFmpeg 二进制未找到，请重新安装应用。');
  }

  return {
    canProbe: errors.length === 0,
    errors,
    executableExists,
    executablePath: ffmpegPath,
    missingExtensions,
    platform: process.platform,
    supportedExtensions,
    warnings,
  };
};
