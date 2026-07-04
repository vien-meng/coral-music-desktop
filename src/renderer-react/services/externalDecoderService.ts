import { ipcChannels } from '@shared/ipc/contracts';
import type {
  ExternalDecoderProbeParams,
  ExternalDecoderProbeResult,
  ExternalDecoderStreamParams,
  ExternalDecoderStreamResult,
  ExternalDecoderTranscodeParams,
  ExternalDecoderTranscodeResult,
} from '@shared/playbackCapabilities';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

const createDisabledProbeResult = (): ExternalDecoderProbeResult => ({
  canProbe: false,
  errors: ['Electron IPC is unavailable.'],
  executableExists: false,
  executablePath: '',
  missingExtensions: [],
  platform: 'browser' as NodeJS.Platform,
  supportedExtensions: [],
  warnings: [],
});

export const probeExternalDecoder = async (
  params: ExternalDecoderProbeParams,
): Promise<ExternalDecoderProbeResult> => {
  if (!isElectronRenderer()) return createDisabledProbeResult();
  return await ipcClient.invoke(ipcChannels.winMain.externalDecoderProbe, params);
};

export const transcodeExternalDecoder = async (
  params: ExternalDecoderTranscodeParams,
): Promise<ExternalDecoderTranscodeResult> => {
  if (!isElectronRenderer()) throw new Error('Electron IPC is unavailable.');
  return await ipcClient.invoke(ipcChannels.winMain.externalDecoderTranscode, params);
};

export const createExternalDecoderStream = async (
  params: ExternalDecoderStreamParams,
): Promise<ExternalDecoderStreamResult> => {
  if (!isElectronRenderer()) throw new Error('Electron IPC is unavailable.');
  return await ipcClient.invoke(ipcChannels.winMain.externalDecoderCreateStream, params);
};

export const revokeExternalDecoderStream = async (token: string): Promise<void> => {
  if (!isElectronRenderer()) throw new Error('Electron IPC is unavailable.');
  await ipcClient.invoke(ipcChannels.winMain.externalDecoderRevokeStream, token);
};

export const externalDecoderService = {
  createExternalDecoderStream,
  probeExternalDecoder,
  revokeExternalDecoderStream,
  transcodeExternalDecoder,
};
