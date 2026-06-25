import { ipcChannels } from '@shared/ipc/contracts'
import { ipcClient } from './ipc/client'
import { isElectronRenderer } from './appService'
import type { ExternalDecoderProbeParams, ExternalDecoderProbeResult } from '@shared/playbackCapabilities'

const createDisabledProbeResult = (params: ExternalDecoderProbeParams): ExternalDecoderProbeResult => {
  return {
    canProbe: false,
    errors: ['Electron IPC is unavailable.'],
    executableExists: false,
    executablePath: params.executablePath,
    missingExtensions: [],
    platform: 'browser' as NodeJS.Platform,
    pluginDirs: params.pluginDirs.map(path => ({
      exists: false,
      isDirectory: false,
      path,
    })),
    provider: params.provider,
    supportedExtensions: [],
    warnings: [],
  }
}

export const probeExternalDecoder = async(
  params: ExternalDecoderProbeParams,
): Promise<ExternalDecoderProbeResult> => {
  if (!isElectronRenderer()) return createDisabledProbeResult(params)
  return await ipcClient.invoke(
    ipcChannels.winMain.externalDecoderProbe,
    params,
  )
}

export const externalDecoderService = {
  probeExternalDecoder,
}
