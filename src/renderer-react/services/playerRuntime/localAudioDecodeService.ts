import {
  internalAudioDecodeExtensions,
  normalizeAudioExtension,
  type DecodedAudioData,
} from '@shared/playbackCapabilities';
import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from '../ipc/client';
import { canDecodeWebmWithWebCodecs, decodeWebmAudioFile } from './webmAudioDecodeService';

export interface DecodedAudioObjectUrl {
  decodedAudio?: DecodedAudioData;
  objectUrl?: string;
  url?: string;
}

const localDecoderExtensions = new Set<string>(internalAudioDecodeExtensions);

const decodeWavFileInMain = async (filePath: string): Promise<ArrayBuffer> =>
  await ipcClient.invoke(ipcChannels.winMain.decodeLocalAudio, filePath);

export const canDecodeLocalAudioExtension = (extension: string): boolean =>
  localDecoderExtensions.has(normalizeAudioExtension(extension));

export const decodeLocalAudioToObjectUrl = async (
  filePath: string,
  extension: string,
): Promise<DecodedAudioObjectUrl | null> => {
  const normalizedExtension = normalizeAudioExtension(extension);
  if (!canDecodeLocalAudioExtension(normalizedExtension)) return null;

  if (normalizedExtension === 'webm' && canDecodeWebmWithWebCodecs()) {
    try {
      return { decodedAudio: await decodeWebmAudioFile(filePath) };
    } catch (error) {
      console.warn('web-demuxer WebM decode failed, falling back to audio-decode.', error);
    }
  }

  const wavBuffer = await decodeWavFileInMain(filePath);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const objectUrl = URL.createObjectURL(blob);

  return { objectUrl, url: objectUrl };
};
