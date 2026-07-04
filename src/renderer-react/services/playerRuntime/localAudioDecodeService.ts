import {
  internalAudioDecodeExtensions,
  normalizeAudioExtension,
} from '@shared/playbackCapabilities';
import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from '../ipc/client';
import { decodeWebmToWav } from './webmDemuxDecodeService';

export interface DecodedAudioObjectUrl {
  objectUrl: string;
  url: string;
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
  if (!canDecodeLocalAudioExtension(extension)) return null;

  const normalizedExtension = normalizeAudioExtension(extension);
  const wavBuffer =
    normalizedExtension === 'webm'
      ? await decodeWebmToWav(filePath)
      : await decodeWavFileInMain(filePath);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const objectUrl = URL.createObjectURL(blob);

  return { objectUrl, url: objectUrl };
};
