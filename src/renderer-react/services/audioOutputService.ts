import { ipcChannels } from '@shared/ipc/contracts';
import type {
  ExclusiveAudioDevice,
  ExclusiveAudioOutputBackend,
  ExclusiveAudioOutputProbeParams,
  ExclusiveAudioOutputProbeResult,
  ExclusiveAudioOutputStartParams,
  ExclusiveAudioOutputStatus,
} from '@shared/playbackCapabilities';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

const backend: ExclusiveAudioOutputBackend = 'wasapi';

const createDisabledStatus = (errorText: string): ExclusiveAudioOutputStatus => ({
  backend,
  deviceId: '',
  duration: 0,
  errorText,
  helperAvailable: false,
  mode: 'exclusive',
  platform: 'browser' as NodeJS.Platform,
  progress: 0,
  status: 'error',
});

export const listExclusiveAudioDevices = async (): Promise<ExclusiveAudioDevice[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.audioOutputListDevices);
};

export const probeExclusiveAudioOutput = async (
  params: ExclusiveAudioOutputProbeParams,
): Promise<ExclusiveAudioOutputProbeResult> => {
  if (!isElectronRenderer()) {
    return {
      backend: params.backend,
      canUseExclusive: false,
      deviceId: params.deviceId,
      errors: ['Electron IPC is unavailable.'],
      helperAvailable: false,
      platform: 'browser' as NodeJS.Platform,
      warnings: [],
    };
  }
  return await ipcClient.invoke(ipcChannels.winMain.audioOutputProbeExclusive, params);
};

export const startExclusiveAudioOutput = async (
  params: ExclusiveAudioOutputStartParams,
): Promise<ExclusiveAudioOutputStatus> => {
  if (!isElectronRenderer()) return createDisabledStatus('Electron IPC is unavailable.');
  return await ipcClient.invoke(ipcChannels.winMain.audioOutputStart, params);
};

export const pauseExclusiveAudioOutput = async (): Promise<ExclusiveAudioOutputStatus> => {
  if (!isElectronRenderer()) return createDisabledStatus('Electron IPC is unavailable.');
  return await ipcClient.invoke(ipcChannels.winMain.audioOutputPause);
};

export const resumeExclusiveAudioOutput = async (): Promise<ExclusiveAudioOutputStatus> => {
  if (!isElectronRenderer()) return createDisabledStatus('Electron IPC is unavailable.');
  return await ipcClient.invoke(ipcChannels.winMain.audioOutputResume);
};

export const seekExclusiveAudioOutput = async (
  progress: number,
): Promise<ExclusiveAudioOutputStatus> => {
  if (!isElectronRenderer()) return createDisabledStatus('Electron IPC is unavailable.');
  return await ipcClient.invoke(ipcChannels.winMain.audioOutputSeek, progress);
};

export const stopExclusiveAudioOutput = async (): Promise<ExclusiveAudioOutputStatus> => {
  if (!isElectronRenderer()) return createDisabledStatus('Electron IPC is unavailable.');
  return await ipcClient.invoke(ipcChannels.winMain.audioOutputStop);
};

export const onExclusiveAudioOutputStatus = (
  listener: (status: ExclusiveAudioOutputStatus) => void,
): (() => void) => {
  if (!isElectronRenderer()) return () => {};
  return ipcClient.on(ipcChannels.winMain.audioOutputStatus, listener);
};

export const audioOutputService = {
  listExclusiveAudioDevices,
  onExclusiveAudioOutputStatus,
  pauseExclusiveAudioOutput,
  probeExclusiveAudioOutput,
  resumeExclusiveAudioOutput,
  seekExclusiveAudioOutput,
  startExclusiveAudioOutput,
  stopExclusiveAudioOutput,
};

