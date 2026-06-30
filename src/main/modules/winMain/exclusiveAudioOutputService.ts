import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import type {
  ExclusiveAudioDevice,
  ExclusiveAudioOutputBackend,
  ExclusiveAudioOutputProbeParams,
  ExclusiveAudioOutputProbeResult,
  ExclusiveAudioOutputStartParams,
  ExclusiveAudioOutputStatus,
} from '@shared/playbackCapabilities';

type StatusSender = (status: ExclusiveAudioOutputStatus) => void;

const backend: ExclusiveAudioOutputBackend = 'wasapi';

let statusSender: StatusSender | null = null;

let currentStatus: ExclusiveAudioOutputStatus = {
  backend,
  deviceId: '',
  duration: 0,
  errorText: '',
  helperAvailable: false,
  mode: 'exclusive',
  platform: process.platform,
  progress: 0,
  status: 'idle',
};

const getHelperPath = (): string =>
  process.env.CORAL_WASAPI_HELPER_PATH ||
  path.join(process.resourcesPath || app.getAppPath(), 'bin', 'coral-wasapi-helper.exe');

const canUseWasapi = (): boolean => process.platform === 'win32';

const isHelperAvailable = async (): Promise<boolean> => {
  if (!canUseWasapi()) return false;

  const helperPath = getHelperPath();
  const stat = await fs.stat(helperPath).catch(() => null);
  return Boolean(stat?.isFile());
};

const createUnsupportedMessage = (): string => {
  if (!canUseWasapi()) {
    return 'USB 独占输出第一版仅支持 Windows WASAPI Exclusive；当前平台暂不支持。';
  }

  return 'WASAPI 独占输出 helper 尚未随应用打包，当前只能完成配置与能力探测。';
};

const publishStatus = (nextStatus: Partial<ExclusiveAudioOutputStatus>): ExclusiveAudioOutputStatus => {
  currentStatus = {
    ...currentStatus,
    ...nextStatus,
    platform: process.platform,
  };
  statusSender?.(currentStatus);
  return currentStatus;
};

export const setExclusiveAudioOutputStatusSender = (sender: StatusSender): void => {
  statusSender = sender;
};

export const listExclusiveAudioDevices = async (): Promise<ExclusiveAudioDevice[]> => {
  const helperAvailable = await isHelperAvailable();
  publishStatus({ helperAvailable });

  if (!helperAvailable) return [];

  // The native helper contract is reserved here. Once the WASAPI helper is bundled,
  // this service should call it with a list-devices command and normalize the result.
  return [];
};

export const probeExclusiveAudioOutput = async (
  params: ExclusiveAudioOutputProbeParams,
): Promise<ExclusiveAudioOutputProbeResult> => {
  const helperAvailable = await isHelperAvailable();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (params.backend !== backend) {
    errors.push('当前仅支持 WASAPI 独占输出后端。');
  }
  if (!params.deviceId.trim()) {
    errors.push('请先选择一个 USB/DAC 输出设备。');
  }
  if (params.bufferMs < 20 || params.bufferMs > 500) {
    errors.push('缓冲时长需要在 20ms 到 500ms 之间。');
  }
  if (!canUseWasapi() || !helperAvailable) {
    warnings.push(createUnsupportedMessage());
  }

  publishStatus({
    backend: params.backend,
    deviceId: params.deviceId,
    errorText: errors[0] ?? warnings[0] ?? '',
    helperAvailable,
    status: errors.length || warnings.length ? 'error' : 'idle',
  });

  return {
    backend: params.backend,
    canUseExclusive: helperAvailable && errors.length === 0,
    deviceId: params.deviceId,
    errors,
    helperAvailable,
    platform: process.platform,
    warnings,
  };
};

export const startExclusiveAudioOutput = async (
  params: ExclusiveAudioOutputStartParams,
): Promise<ExclusiveAudioOutputStatus> => {
  const probeResult = await probeExclusiveAudioOutput({
    backend: params.backend,
    bufferMs: params.bufferMs,
    deviceId: params.deviceId,
    sampleRatePolicy: params.sampleRatePolicy,
  });

  if (!probeResult.canUseExclusive) {
    return publishStatus({
      backend: params.backend,
      deviceId: params.deviceId,
      errorText: probeResult.errors[0] ?? probeResult.warnings[0] ?? createUnsupportedMessage(),
      helperAvailable: probeResult.helperAvailable,
      status: 'error',
    });
  }

  return publishStatus({
    backend: params.backend,
    deviceId: params.deviceId,
    errorText: 'WASAPI helper protocol is not implemented yet.',
    helperAvailable: true,
    progress: 0,
    status: 'error',
  });
};

export const pauseExclusiveAudioOutput = async (): Promise<ExclusiveAudioOutputStatus> =>
  publishStatus({ status: currentStatus.status === 'playing' ? 'paused' : currentStatus.status });

export const resumeExclusiveAudioOutput = async (): Promise<ExclusiveAudioOutputStatus> =>
  publishStatus({ status: currentStatus.status === 'paused' ? 'playing' : currentStatus.status });

export const seekExclusiveAudioOutput = async (
  progress: number,
): Promise<ExclusiveAudioOutputStatus> =>
  publishStatus({ progress: Math.max(0, Number.isFinite(progress) ? progress : 0) });

export const stopExclusiveAudioOutput = async (): Promise<ExclusiveAudioOutputStatus> =>
  publishStatus({
    duration: 0,
    errorText: '',
    progress: 0,
    status: 'stoped',
  });

