export type ExternalDecoderProvider = 'none' | 'foobar2000' | 'ffmpeg';
export type ExternalDecoderOutput = 'wav' | 'pcm';

export interface ExternalDecoderProbeParams {
  executablePath: string;
  extensions: readonly string[];
  pluginDirs: readonly string[];
  provider: ExternalDecoderProvider;
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
  pluginDirs: ExternalDecoderProbePathStatus[];
  provider: ExternalDecoderProvider;
  supportedExtensions: string[];
  warnings: string[];
}

export interface ExternalDecoderTranscodeParams {
  executablePath: string;
  inputPath: string;
  output: ExternalDecoderOutput;
  provider: ExternalDecoderProvider;
  timeoutMs: number;
}

export interface ExternalDecoderTranscodeResult {
  outputPath: string;
  output: ExternalDecoderOutput;
  warnings: string[];
}

export const nativeLocalAudioExtensions = [
  'mp3',
  'flac',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'opus',
] as const;

export const externalDecoderExtensions = ['dsf', 'dff', 'iso', 'sacd'] as const;

export const externalDecoderExtensionAliases = {
  sadc: 'sacd',
} as const;

export const foobar2000DecoderPluginHints = [
  {
    id: 'flac',
    formats: ['flac'],
    purpose: 'FLAC input support when the platform runtime cannot decode it natively.',
  },
  {
    id: 'foo_input_sacd',
    formats: ['dsf', 'dff', 'iso', 'sacd'],
    purpose: 'DSD and SACD input support through an external Foobar2000 process.',
  },
  {
    id: 'foo_input_dsdiff',
    formats: ['dff'],
    purpose: 'DSDIFF input support through an external Foobar2000 process.',
  },
] as const;

export const playbackCapabilityRoadmap = {
  localAudio: {
    nativeExtensions: nativeLocalAudioExtensions,
    externalDecoderExtensions,
  },
  externalDecoder: {
    supportedProviders: ['none', 'foobar2000', 'ffmpeg'] as const,
    preferredOutputs: ['wav', 'pcm'] as const,
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
