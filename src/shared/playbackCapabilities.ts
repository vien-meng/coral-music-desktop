export type ExternalDecoderOutput = 'wav' | 'pcm';
export type AudioOutputMode = 'system' | 'exclusive';
export type ExclusiveAudioOutputBackend = 'wasapi';
export type ExclusiveAudioSampleRatePolicy = 'source' | 'deviceDefault' | 'resample';

export interface ExternalDecoderProbeParams {
  extensions: readonly string[];
}

export interface ExternalDecoderProbePathStatus {
  exists: boolean;
  isDirectory: boolean;
  path: string;
}

export interface ExternalDecoderProbeResult {
  canProbe: boolean;
  errors: string[];
  executableExists: boolean;
  executablePath: string;
  missingExtensions: string[];
  platform: NodeJS.Platform;
  supportedExtensions: string[];
  warnings: string[];
}

export interface ExternalDecoderTranscodeParams {
  inputPath: string;
  output: ExternalDecoderOutput;
  timeoutMs: number;
}

export interface ExternalDecoderTranscodeResult {
  outputPath: string;
  output: ExternalDecoderOutput;
  warnings: string[];
}

export interface DecodedAudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

export interface ExclusiveAudioDevice {
  backend: ExclusiveAudioOutputBackend;
  id: string;
  isDefault: boolean;
  name: string;
  sampleRates: number[];
}

export interface ExclusiveAudioOutputProbeParams {
  backend: ExclusiveAudioOutputBackend;
  deviceId: string;
  bufferMs: number;
  sampleRatePolicy: ExclusiveAudioSampleRatePolicy;
}

export interface ExclusiveAudioOutputProbeResult {
  backend: ExclusiveAudioOutputBackend;
  canUseExclusive: boolean;
  deviceId: string;
  errors: string[];
  helperAvailable: boolean;
  platform: NodeJS.Platform;
  warnings: string[];
}

export interface ExclusiveAudioOutputStartParams {
  backend: ExclusiveAudioOutputBackend;
  bufferMs: number;
  deviceId: string;
  sampleRatePolicy: ExclusiveAudioSampleRatePolicy;
  sourceUrl: string;
}

export interface ExclusiveAudioOutputStatus {
  backend: ExclusiveAudioOutputBackend;
  deviceId: string;
  duration: number;
  errorText: string;
  helperAvailable: boolean;
  mode: AudioOutputMode;
  platform: NodeJS.Platform;
  progress: number;
  status: 'idle' | 'opening' | 'playing' | 'paused' | 'stoped' | 'error';
}

export const nativeLocalAudioExtensions = [
  'mp3',
  'flac',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'oga',
  'opus',
  'qoa',
  'aiff',
  'aif',
  'm4r',
  'caf',
  'webm',
  'amr',
  'wma',
] as const;

export const internalAudioDecodeExtensions = [
  'mp3',
  'wav',
  'ogg',
  'oga',
  'flac',
  'opus',
  'm4a',
  'aac',
  'qoa',
  'aiff',
  'aif',
  'm4r',
  'caf',
  'webm',
  'amr',
  'wma',
] as const;

export const externalDecoderExtensions = ['dsf', 'dff', 'alac', 'ac3'] as const;

export const externalDecoderExtensionAliases = {
  sadc: 'sacd',
} as const;

export const playbackCapabilityRoadmap = {
  localAudio: {
    nativeExtensions: nativeLocalAudioExtensions,
    internalDecodeExtensions: internalAudioDecodeExtensions,
    externalDecoderExtensions,
  },
  externalDecoder: {
    preferredOutputs: ['wav', 'pcm'] as const,
  },
  audioOutput: {
    modes: ['system', 'exclusive'] as const,
    exclusiveBackends: ['wasapi'] as const,
    sampleRatePolicies: ['source', 'deviceDefault', 'resample'] as const,
  },
  sourcePlugin: {
    usesUserApiRuntime: true,
    settingKey: 'common.apiSource',
  },
} as const;

export const normalizeAudioExtension = (ext: string): string => {
  const normalized = ext.trim().replace(/^\./, '').toLowerCase();
  return (
    externalDecoderExtensionAliases[normalized as keyof typeof externalDecoderExtensionAliases] ??
    normalized
  );
};

export const isNativeLocalAudioExtension = (ext: string): boolean => {
  const normalized = normalizeAudioExtension(ext);
  return nativeLocalAudioExtensions.includes(
    normalized as (typeof nativeLocalAudioExtensions)[number],
  );
};

export const isExternalDecoderExtension = (ext: string): boolean => {
  const normalized = normalizeAudioExtension(ext);
  return externalDecoderExtensions.includes(
    normalized as (typeof externalDecoderExtensions)[number],
  );
};
