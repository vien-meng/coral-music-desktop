import { readFile } from '../nodeBridgeService';

interface DecodedPcm {
  channelData: Float32Array[];
  sampleRate: number;
}

const toArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  const start = buffer.byteOffset;
  const end = start + buffer.byteLength;
  return buffer.buffer.slice(start, end) as ArrayBuffer;
};

const concatFloat32 = (chunks: Float32Array[]): Float32Array => {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
};

const encodePcm16Wav = (channelData: Float32Array[], sampleRate: number): ArrayBuffer => {
  const validChannels = channelData.filter((channel) => channel.length);
  if (!validChannels.length) throw new Error('WebM 音频解码结果为空。');

  const channelCount = validChannels.length;
  const sampleCount = Math.max(...validChannels.map((channel) => channel.length));
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = sampleCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, value: string): void => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = Math.max(-1, Math.min(1, validChannels[channelIndex][sampleIndex] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return buffer;
};

const decodeWithWebCodecs = async (file: File): Promise<DecodedPcm> => {
  const AudioDecoderConstructor = (globalThis as any).AudioDecoder;
  if (typeof AudioDecoderConstructor !== 'function') {
    throw new Error('当前 Electron 运行时不支持 WebCodecs AudioDecoder。');
  }

  const { WebDemuxer } = await import('web-demuxer');
  const demuxer = new WebDemuxer({ wasmFilePath: './assets/web-demuxer.wasm' });
  try {
    await demuxer.load(file);
    const config = await demuxer.getDecoderConfig('audio');
    const channelChunks: Float32Array[][] = [];
    let sampleRate = Number((config as AudioDecoderConfig).sampleRate) || 44100;

    await new Promise<void>((resolve, reject) => {
      const decoder = new AudioDecoderConstructor({
        error: reject,
        output: (audioData: any) => {
          try {
            sampleRate = Number(audioData.sampleRate) || sampleRate;
            const channelCount = Number(audioData.numberOfChannels) || 1;
            const frameCount = Number(audioData.numberOfFrames) || 0;
            for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
              const plane = new Float32Array(frameCount);
              audioData.copyTo(plane, {
                format: 'f32-planar',
                planeIndex: channelIndex,
              });
              if (!channelChunks[channelIndex]) channelChunks[channelIndex] = [];
              channelChunks[channelIndex].push(plane);
            }
          } finally {
            audioData.close();
          }
        },
      });

      const pump = async (): Promise<void> => {
        try {
          decoder.configure(config);
          const reader = demuxer.read('audio').getReader();
          let isReading = true;
          while (isReading) {
            const { done, value } = await reader.read();
            if (done) {
              isReading = false;
            } else {
              decoder.decode(value);
            }
          }
          await decoder.flush();
          decoder.close();
          resolve();
        } catch (error) {
          decoder.close();
          reject(error);
        }
      };
      pump();
    });

    return {
      channelData: channelChunks.map(concatFloat32),
      sampleRate,
    };
  } finally {
    demuxer.destroy();
  }
};

export const decodeWebmToWav = async (filePath: string): Promise<ArrayBuffer> => {
  const buffer = await readFile(filePath);
  const file = new File([toArrayBuffer(buffer)], filePath.split(/[\\/]/).pop() || 'audio.webm', {
    type: 'audio/webm',
  });
  const decoded = await decodeWithWebCodecs(file);
  return encodePcm16Wav(decoded.channelData, decoded.sampleRate);
};
