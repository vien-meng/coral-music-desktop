import path from 'node:path';

export type ExternalDecoderStreamProviderId = 'native-ape' | 'ffmpeg';
export type ExternalDecoderStreamProviderStatus = 'available' | 'planned';

export interface ExternalDecoderStreamProvider {
  canStream: boolean;
  extensions: readonly string[];
  id: ExternalDecoderStreamProviderId;
  packaged: boolean;
  status: ExternalDecoderStreamProviderStatus;
  zeroConfig: boolean;
}

export interface ExternalDecoderProviderSelection {
  fallbackProviderId?: ExternalDecoderStreamProviderId;
  provider: ExternalDecoderStreamProvider;
}

export interface ExternalDecoderProviderAvailability {
  nativeApeAvailable?: boolean;
}

export const externalDecoderStreamProviders: readonly ExternalDecoderStreamProvider[] = [
  {
    canStream: true,
    extensions: ['ape'],
    id: 'native-ape',
    packaged: false,
    status: 'planned',
    zeroConfig: false,
  },
  {
    canStream: true,
    // wav 也要走流式转码：部分 .wav 实际封装 DTS/AC3 等编码音频但伪装 PCM 头，
    // 浏览器按 PCM 解码会白噪音，统一交给 FFmpeg 识别真实编码
    extensions: ['dsf', 'dff', 'alac', 'ac3', 'ape', 'wav', 'webm'],
    id: 'ffmpeg',
    packaged: true,
    status: 'available',
    zeroConfig: true,
  },
];

const normalizeExternalDecoderProviderExtension = (extension: string): string =>
  extension.trim().replace(/^\./, '').toLowerCase();

export const createExternalDecoderStreamProviders = ({
  nativeApeAvailable = false,
}: ExternalDecoderProviderAvailability = {}): readonly ExternalDecoderStreamProvider[] =>
  externalDecoderStreamProviders.map((provider) =>
    provider.id === 'native-ape'
      ? {
          ...provider,
          packaged: nativeApeAvailable,
          status: nativeApeAvailable ? 'available' : 'planned',
          zeroConfig: nativeApeAvailable,
        }
      : provider,
  );

export const getExternalDecoderStreamExtension = (inputPath: string): string =>
  normalizeExternalDecoderProviderExtension(path.extname(inputPath));

export const selectExternalDecoderStreamProvider = (
  inputPath: string,
  providers: readonly ExternalDecoderStreamProvider[] = externalDecoderStreamProviders,
): ExternalDecoderProviderSelection => {
  const extension = getExternalDecoderStreamExtension(inputPath);
  const candidates = providers.filter((provider) =>
    provider.extensions.some(
      (supportedExtension) =>
        normalizeExternalDecoderProviderExtension(supportedExtension) === extension,
    ),
  );
  const provider =
    candidates.find(
      (candidate) =>
        candidate.status === 'available' &&
        candidate.canStream &&
        candidate.packaged &&
        candidate.zeroConfig,
    ) ?? candidates.find((candidate) => candidate.status === 'available');

  const fallbackProvider = candidates.find(
    (candidate) =>
      candidate.id === 'ffmpeg' &&
      candidate.status === 'available' &&
      candidate.canStream &&
      candidate.packaged &&
      candidate.zeroConfig,
  );

  if (!provider && fallbackProvider) return { provider: fallbackProvider };
  if (!provider) {
    throw new Error(
      `No external decoder stream provider is available for .${extension || 'unknown'}.`,
    );
  }

  return provider.id === fallbackProvider?.id
    ? { fallbackProviderId: provider.id, provider }
    : { fallbackProviderId: fallbackProvider?.id, provider };
};
