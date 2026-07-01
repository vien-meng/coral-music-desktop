import { ipcChannels } from '@shared/ipc/contracts';
import type {
  ExternalDecoderProbeParams,
  ExternalDecoderProbeResult,
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

export const externalDecoderService = {
  probeExternalDecoder,
  transcodeExternalDecoder,
};
