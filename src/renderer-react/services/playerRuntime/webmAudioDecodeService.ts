import { AVLogLevel, WebDemuxer, type WebAVPacket, type WebAVStream } from 'web-demuxer';
import webDemuxerWasmUrl from 'web-demuxer/wasm-mini?url';
import type { DecodedAudioData } from '@shared/playbackCapabilities';
import { basename, readFile } from '../nodeBridgeService';

interface AudioDecoderConstructor {
  new (init: {
    error: (error: Error) => void;
    output: (audioData: WebCodecsAudioData) => void;
  }): WebCodecsAudioDecoder;
}

interface WebCodecsAudioData {
  readonly numberOfChannels: number;
  readonly numberOfFrames: number;
  readonly sampleRate: number;
  close: () => void;
  copyTo: (
    destination: Float32Array,
    options: { format?: 'f32' | 'f32-planar'; planeIndex?: number },
  ) => void;
}

interface WebCodecsAudioDecoder {
  close: () => void;
  configure: (config: unknown) => void;
  decode: (chunk: EncodedAudioChunk) => void;
  flush: () => Promise<void>;
}

interface WebmAudioInfo {
  bitrate: number | null;
  sampleRate: number | null;
}

const MAX_DECODE_QUEUE_SIZE = 32;

const getAudioDecoder = (): AudioDecoderConstructor | null => {
  const decoder = (globalThis as typeof globalThis & { AudioDecoder?: AudioDecoderConstructor })
    .AudioDecoder;
  return decoder ?? null;
};

const readLocalFileAsFile = async (filePath: string): Promise<File> => {
  const buffer = await readFile(filePath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  return new File([arrayBuffer], basename(filePath), { type: 'audio/webm' });
};

const copyAudioDataToChannels = (audioData: WebCodecsAudioData): Float32Array[] => {
  const channelCount = audioData.numberOfChannels;
  const frameCount = audioData.numberOfFrames;
  if (!channelCount || !frameCount) return [];

  try {
    return Array.from({ length: channelCount }, (_, channelIndex) => {
      const channelData = new Float32Array(frameCount);
      audioData.copyTo(channelData, { format: 'f32-planar', planeIndex: channelIndex });
      return channelData;
    });
  } catch {
    const interleaved = new Float32Array(frameCount * channelCount);
    audioData.copyTo(interleaved, { format: 'f32' });
    return Array.from({ length: channelCount }, (_, channelIndex) => {
      const channelData = new Float32Array(frameCount);
      for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        channelData[frameIndex] = interleaved[frameIndex * channelCount + channelIndex] ?? 0;
      }
      return channelData;
    });
  }
};

const appendChannels = (target: Float32Array[][], source: Float32Array[]): void => {
  source.forEach((channelData, channelIndex) => {
    target[channelIndex] ??= [];
    target[channelIndex].push(channelData);
  });
};

const concatChannels = (chunks: Float32Array[][]): Float32Array[] =>
  chunks
    .filter((channelChunks) => channelChunks.length)
    .map((channelChunks) => {
      const sampleCount = channelChunks.reduce((total, chunk) => total + chunk.length, 0);
      const merged = new Float32Array(sampleCount);
      let offset = 0;
      for (const chunk of channelChunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      return merged;
    });

const parseNumericString = (value: string | null | undefined): number | null => {
  if (!value || value === 'N/A') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const getWebmAudioInfo = async (
  demuxer: WebDemuxer,
  audioStream: WebAVStream,
): Promise<WebmAudioInfo> => {
  const mediaInfo = await demuxer.getMediaInfo().catch(() => null);
  return {
    bitrate:
      parseNumericString(audioStream.bit_rate) ?? parseNumericString(mediaInfo?.bit_rate ?? null),
    sampleRate:
      Number.isFinite(audioStream.sample_rate) && audioStream.sample_rate > 0
        ? audioStream.sample_rate
        : null,
  };
};

const waitForDecodeQueue = async (decoder: WebCodecsAudioDecoder): Promise<void> => {
  const decodeQueueSize = (decoder as unknown as { decodeQueueSize?: number }).decodeQueueSize ?? 0;
  if (decodeQueueSize < MAX_DECODE_QUEUE_SIZE) return;
  await decoder.flush();
};

export const canDecodeWebmWithWebCodecs = (): boolean => Boolean(getAudioDecoder());

export const getWebmAudioMetadata = async (filePath: string): Promise<WebmAudioInfo | null> => {
  const demuxer = new WebDemuxer({ wasmFilePath: webDemuxerWasmUrl });
  try {
    await demuxer.setLogLevel(AVLogLevel.AV_LOG_ERROR);
    await demuxer.load(await readLocalFileAsFile(filePath));
    const audioStream = await demuxer.getMediaStream('audio');
    return await getWebmAudioInfo(demuxer, audioStream);
  } catch {
    return null;
  } finally {
    demuxer.destroy();
  }
};

export const decodeWebmAudioFile = async (filePath: string): Promise<DecodedAudioData> => {
  const AudioDecoder = getAudioDecoder();
  if (!AudioDecoder) throw new Error('当前运行环境不支持 WebCodecs AudioDecoder。');

  const demuxer = new WebDemuxer({ wasmFilePath: webDemuxerWasmUrl });
  let decoder: WebCodecsAudioDecoder | null = null;

  try {
    await demuxer.setLogLevel(AVLogLevel.AV_LOG_ERROR);
    await demuxer.load(await readLocalFileAsFile(filePath));

    const audioStream = await demuxer.getMediaStream('audio');
    const decoderConfig = demuxer.genDecoderConfig('audio', audioStream);
    const channelChunks: Float32Array[][] = [];
    let sampleRate = audioStream.sample_rate || 0;
    let decodeError: Error | null = null;

    decoder = new AudioDecoder({
      error: (error) => {
        decodeError = error;
      },
      output: (audioData) => {
        sampleRate = audioData.sampleRate || sampleRate;
        appendChannels(channelChunks, copyAudioDataToChannels(audioData));
        audioData.close();
      },
    });
    decoder.configure(decoderConfig);

    const packetStream = demuxer.readMediaPacket('audio');
    const reader = packetStream.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (decodeError) throw decodeError;
        await waitForDecodeQueue(decoder);
        decoder.decode(demuxer.genEncodedChunk('audio', value as WebAVPacket));
      }
      await decoder.flush();
    } finally {
      reader.releaseLock();
    }

    if (decodeError) throw decodeError;

    const channelData = concatChannels(channelChunks);
    if (!channelData.length || !sampleRate) throw new Error('WebM 音频解码结果为空。');

    return {
      channelData,
      sampleRate,
    };
  } finally {
    decoder?.close();
    demuxer.destroy();
  }
};
