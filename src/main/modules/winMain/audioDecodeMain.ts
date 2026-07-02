import { readFile } from 'node:fs/promises';
import decodeAudio from 'audio-decode';

const toArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  const start = buffer.byteOffset;
  const end = start + buffer.byteLength;
  return buffer.buffer.slice(start, end) as ArrayBuffer;
};

/**
 * 检测是否为标准 RIFF/WAVE 文件。
 * FFmpeg 转码输出的 WAV 是标准格式，无需再经 audio-decode 解码+重编码，
 * 直接返回原始 bytes 即可，避免大文件内存压力和解码失败。
 */
const isStandardWavFile = (bytes: Uint8Array): boolean =>
  bytes.length >= 12 &&
  bytes[0] === 0x52 && // R
  bytes[1] === 0x49 && // I
  bytes[2] === 0x46 && // F
  bytes[3] === 0x46 && // F
  bytes[8] === 0x57 && // W
  bytes[9] === 0x41 && // A
  bytes[10] === 0x56 && // V
  bytes[11] === 0x45; // E

const encodePcm16Wav = (channelData: Float32Array[], sampleRate: number): ArrayBuffer => {
  const validChannels = channelData.filter((ch) => ch.length);
  if (!validChannels.length) throw new Error('本地音频解码结果为空。');

  const channelCount = validChannels.length;
  const sampleCount = Math.max(...validChannels.map((ch) => ch.length));
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

const decodeLocalAudioFile = async (filePath: string): Promise<ArrayBuffer> => {
  const fileBuffer = await readFile(filePath);
  const arrayBuffer = toArrayBuffer(fileBuffer);
  const data = new Uint8Array(arrayBuffer);

  // 标准 RIFF/WAVE 文件（含 FFmpeg 转码输出）直接返回原始 bytes，
  // 跳过 audio-decode 解码+重编码，避免大文件内存压力和解码失败。
  if (isStandardWavFile(data)) return arrayBuffer;

  const decoded = await decodeAudio(data);
  return encodePcm16Wav(decoded.channelData, decoded.sampleRate);
};

export default decodeLocalAudioFile;
