import fs from 'node:fs/promises'
import {
  externalDecoderExtensions,
  normalizeAudioExtension,
  type ExternalDecoderProbeParams,
  type ExternalDecoderProbePathStatus,
  type ExternalDecoderProbeResult,
} from '@shared/playbackCapabilities'

const probePath = async(path: string): Promise<ExternalDecoderProbePathStatus> => {
  if (!path.trim()) {
    return {
      exists: false,
      isDirectory: false,
      path,
    }
  }

  return await fs.stat(path)
    .then(stats => ({
      exists: true,
      isDirectory: stats.isDirectory(),
      path,
    }))
    .catch(() => ({
      exists: false,
      isDirectory: false,
      path,
    }))
}

export const probeExternalDecoder = async(
  params: ExternalDecoderProbeParams,
): Promise<ExternalDecoderProbeResult> => {
  const provider = params.provider
  const executablePath = params.executablePath.trim()
  const requestedExtensions = Array.from(new Set(params.extensions.map(normalizeAudioExtension)))
  const knownExtensions = new Set(externalDecoderExtensions)
  const supportedExtensions = requestedExtensions.filter(ext => knownExtensions.has(ext as typeof externalDecoderExtensions[number]))
  const missingExtensions = requestedExtensions.filter(ext => !knownExtensions.has(ext as typeof externalDecoderExtensions[number]))
  const warnings: string[] = []
  const errors: string[] = []

  if (provider === 'none') warnings.push('External decoder provider is disabled.')
  if (provider === 'foobar2000' && process.platform !== 'win32') {
    warnings.push('Foobar2000 component probing is Windows-focused; decoder runtime should stay disabled on this platform until an adapter is configured.')
  }
  if (provider === 'foobar2000' && !executablePath) errors.push('Foobar2000 executable path is empty.')

  const executableStatus = await probePath(executablePath)
  if (provider === 'foobar2000' && executablePath && (!executableStatus.exists || executableStatus.isDirectory)) {
    errors.push('Foobar2000 executable path is not a file.')
  }

  const pluginDirs = await Promise.all(params.pluginDirs.map(probePath))
  for (const pluginDir of pluginDirs) {
    if (!pluginDir.exists || !pluginDir.isDirectory) {
      warnings.push(`Foobar2000 plugin directory is unavailable: ${pluginDir.path}`)
    }
  }

  return {
    canProbe: provider === 'foobar2000' && errors.length === 0 && executableStatus.exists && !executableStatus.isDirectory,
    errors,
    executableExists: executableStatus.exists && !executableStatus.isDirectory,
    executablePath,
    missingExtensions,
    platform: process.platform,
    pluginDirs,
    provider,
    supportedExtensions,
    warnings,
  }
}
