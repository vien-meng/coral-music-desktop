import type { FLACDecoder as FLACDecoderClass } from '@wasm-audio-decoders/flac';
import { readFile } from '../nodeBridgeService';

export interface DecodedAudioObjectUrl {
  audioData: DecodedAudioData;
  objectUrl: string;
  url: string;
}

export interface DecodedAudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

const localDecoderExtensions = new Set(['flac']);

let flacDecoderModulePromise: Promise<typeof import('@wasm-audio-decoders/flac')> | null = null;

const loadFlacDecoder = async (): Promise<typeof FLACDecoderClass> => {
  flacDecoderModulePromise ??= import('@wasm-audio-decoders/flac');
  const module = await flacDecoderModulePromise;
  return module.FLACDecoder;
};

const toArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  const start = buffer.byteOffset;
  const end = start + buffer.byteLength;
  return buffer.buffer.slice(start, end) as ArrayBuffer;
};

const writeAscii = (view: DataView, offset: number, value: string): void => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
};

const encodePcm16Wav = (audioData: DecodedAudioData): ArrayBuffer => {
  const channelData = audioData.channelData.filter((channel) => channel.length);
  if (!channelData.length) throw new Error('本地音频解码结果为空。');

  const channelCount = channelData.length;
  const sampleRate = audioData.sampleRate;
  const sampleCount = Math.max(...channelData.map((channel) => channel.length));
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = sampleCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channelIndex][sampleIndex] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return buffer;
};

const decodeWithFlacWasm = async (data: Uint8Array): Promise<DecodedAudioData> => {
  const FLACDecoder = await loadFlacDecoder();
  const decoder = new FLACDecoder();
  try {
    await decoder.ready;
    const decoded = await decoder.decodeFile(data);
    return {
      channelData: decoded.channelData,
      sampleRate: decoded.sampleRate,
    };
  } finally {
    decoder.free();
  }
};

export const canDecodeLocalAudioExtension = (extension: string): boolean =>
  localDecoderExtensions.has(extension);

export const decodeLocalAudioToObjectUrl = async (
  filePath: string,
  extension: string,
): Promise<DecodedAudioObjectUrl | null> => {
  if (!canDecodeLocalAudioExtension(extension)) return null;

  const fileBuffer = await readFile(filePath);
  const data = new Uint8Array(toArrayBuffer(fileBuffer));
  const decoded = await decodeWithFlacWasm(data);
  const wavBuffer = encodePcm16Wav(decoded);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const objectUrl = URL.createObjectURL(blob);

  return {
    audioData: decoded,
    objectUrl,
    url: objectUrl,
  };
};
