import fs from 'node:fs/promises';
import path from 'node:path';
import {
  externalDecoderExtensions,
  normalizeAudioExtension,
  type ExternalDecoderProbeParams,
  type ExternalDecoderProbePathStatus,
  type ExternalDecoderProbeResult,
} from '@shared/playbackCapabilities';

const isBareExecutableCommand = (executablePath: string): boolean =>
  Boolean(executablePath.trim()) &&
  !path.isAbsolute(executablePath) &&
  !/[\\/]/.test(executablePath);

const probePath = async (path: string): Promise<ExternalDecoderProbePathStatus> => {
  if (!path.trim()) {
    return {
      exists: false,
      isDirectory: false,
      path,
    };
  }

  return await fs
    .stat(path)
    .then((stats) => ({
      exists: true,
      isDirectory: stats.isDirectory(),
      path,
    }))
    .catch(() => ({
      exists: false,
      isDirectory: false,
      path,
    }));
};

export const probeExternalDecoder = async (
  params: ExternalDecoderProbeParams,
): Promise<ExternalDecoderProbeResult> => {
  const provider = params.provider;
  const executablePath = params.executablePath.trim() || (provider === 'ffmpeg' ? 'ffmpeg' : '');
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

  if (provider === 'none') warnings.push('External decoder provider is disabled.');
  if (provider === 'ffmpeg' && process.platform === 'darwin' && executablePath.endsWith('.app')) {
    warnings.push('FFmpeg should point to the ffmpeg binary, not an app bundle.');
  }
  if (provider === 'ffmpeg' && isBareExecutableCommand(executablePath)) {
    warnings.push(`FFmpeg will be resolved from PATH as "${executablePath}".`);
  }
  if (provider === 'foobar2000' && process.platform !== 'win32') {
    warnings.push(
      'Foobar2000 component probing is Windows-focused; decoder runtime should stay disabled on this platform until an adapter is configured.',
    );
  }
  if (provider === 'foobar2000' && !executablePath)
    errors.push('Foobar2000 executable path is empty.');

  const usesPathCommand = provider === 'ffmpeg' && isBareExecutableCommand(executablePath);
  const executableStatus = usesPathCommand
    ? { exists: true, isDirectory: false, path: executablePath }
    : await probePath(executablePath);
  if (
    provider !== 'none' &&
    executablePath &&
    !usesPathCommand &&
    (!executableStatus.exists || executableStatus.isDirectory)
  ) {
    errors.push('External decoder executable path is not a file.');
  }

  const pluginDirs = await Promise.all(params.pluginDirs.map(probePath));
  for (const pluginDir of pluginDirs) {
    if (!pluginDir.exists || !pluginDir.isDirectory) {
      warnings.push(`Foobar2000 plugin directory is unavailable: ${pluginDir.path}`);
    }
  }

  return {
    canProbe:
      provider !== 'none' &&
      errors.length === 0 &&
      executableStatus.exists &&
      !executableStatus.isDirectory,
    errors,
    executableExists: executableStatus.exists && !executableStatus.isDirectory,
    executablePath,
    missingExtensions,
    platform: process.platform,
    pluginDirs,
    provider,
    supportedExtensions,
    warnings,
  };
};
