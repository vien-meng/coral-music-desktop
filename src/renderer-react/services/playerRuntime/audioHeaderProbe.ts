/**
 * 在线音频文件头探测
 *
 * 通过 Range 请求获取音频文件前几十 KB 数据，解析文件头获取实际采样率和比特率。
 * 支持 MP3 (ID3v2 + 帧头) 和 FLAC (fLaC marker + STREAMINFO) 格式。
 */

export interface AudioStreamInfo {
  sampleRate: number | null;
  bitrate: number | null;
  format: 'mp3' | 'flac' | 'ogg' | 'm4a' | 'wav' | 'unknown';
}

const PROBE_BYTES = 65536; // 64KB 足够覆盖 ID3v2 标签和至少一个帧头

/**
 * 从在线 URL 探测音频流信息
 * @param url 音频 URL
 * @param signal 可选的 AbortSignal，切歌时取消探测
 * @returns 探测到的音频流信息，失败时各字段为 null
 */
export const probeAudioStreamInfo = async (
  url: string,
  signal?: AbortSignal,
): Promise<AudioStreamInfo> => {
  try {
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${PROBE_BYTES - 1}` },
      signal,
    });
    if (!response.ok && response.status !== 206)
      return { sampleRate: null, bitrate: null, format: 'unknown' };

    const buffer = await response.arrayBuffer();
    return parseAudioHeader(buffer);
  } catch {
    return { sampleRate: null, bitrate: null, format: 'unknown' };
  }
};

/**
 * 从 ArrayBuffer 解析音频文件头
 */
export const parseAudioHeader = (buffer: ArrayBuffer): AudioStreamInfo => {
  const bytes = new Uint8Array(buffer);

  // FLAC: 以 "fLaC" 开头
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x66 &&
    bytes[1] === 0x4c &&
    bytes[2] === 0x61 &&
    bytes[3] === 0x43
  ) {
    return parseFlacHeader(bytes);
  }

  // OGG: 以 "OggS" 开头
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  ) {
    return { sampleRate: null, bitrate: null, format: 'ogg' };
  }

  // M4A/MP4: offset 4-8 为 "ftyp"
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return { sampleRate: null, bitrate: null, format: 'm4a' };
  }

  // DSDIFF/DFF: 以 "FRM8" 开头，紧接着 "DSD "（Big-Endian 格式）
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x46 &&
    bytes[1] === 0x52 &&
    bytes[2] === 0x4d &&
    bytes[3] === 0x38
  ) {
    return parseDffHeader(bytes);
  }

  // DSF: 以 "DSD " 开头（Little-Endian 格式）
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x44 &&
    bytes[1] === 0x53 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x20
  ) {
    return parseDsfHeader(bytes);
  }

  // RIFF/WAV: 以 "RIFF" 开头
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return parseWavHeader(bytes);
  }

  // MP3: 可能以 ID3v2 开头，也可能直接是帧同步字
  if (
    // ID3v2
    (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    // 帧同步字 0xFFE/0xFFF
    (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  ) {
    return parseMp3Header(bytes);
  }

  return { sampleRate: null, bitrate: null, format: 'unknown' };
};

// ==================== MP3 ====================

const mp3BitrateTable = [
  // MPEG Version 1
  [null, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448], // Layer I
  [null, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384], // Layer II
  [null, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], // Layer III
  // MPEG Version 2 / 2.5
  [null, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256], // Layer I
  [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160], // Layer II
  [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160], // Layer III
];

const mp3SampleRateTable = [
  [44100, 48000, 32000], // MPEG 1
  [null, null, null], // reserved
  [22050, 24000, 16000], // MPEG 2
  [11025, 12000, 8000], // MPEG 2.5
];

const parseMp3Header = (bytes: Uint8Array): AudioStreamInfo => {
  // 跳过 ID3v2 标签
  let offset = 0;
  if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    // ID3v2 size: 4 bytes syncsafe integer at offset 6
    const size =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);
    offset = 10 + size;
  }

  // 搜索帧同步字 (0xFF + 3 bits set)
  const maxSearch = Math.min(bytes.length - 4, offset + 8192);
  for (let i = offset; i < maxSearch; i++) {
    if (bytes[i] !== 0xff || (bytes[i + 1] & 0xe0) !== 0xe0) continue;

    const versionBits = (bytes[i + 1] >> 3) & 0x03; // 00=2.5, 01=reserved, 10=2, 11=1
    const layerBits = (bytes[i + 1] >> 1) & 0x03; // 01=Layer III, 10=Layer II, 11=Layer I
    const bitrateIndex = (bytes[i + 2] >> 4) & 0x0f;
    const sampleRateIndex = (bytes[i + 2] >> 2) & 0x03;

    if (bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) continue;

    // 版本索引: 0=2.5, 2=2, 3=1
    const versionIndex = versionBits === 0 ? 3 : versionBits === 2 ? 2 : versionBits === 3 ? 1 : -1;
    if (versionIndex < 0) continue;

    const sampleRate = mp3SampleRateTable[versionIndex][sampleRateIndex];
    if (!sampleRate) continue;

    // 层索引: 3=Layer I, 2=Layer II, 1=Layer III
    const layerIndex = layerBits === 3 ? 0 : layerBits === 2 ? 1 : layerBits === 1 ? 2 : -1;
    if (layerIndex < 0) continue;

    // 比特率表行: MPEG1 用 0-2, MPEG2/2.5 用 3-5
    const bitrateRow = versionIndex === 1 ? layerIndex : layerIndex + 3;
    const bitrateKbps = mp3BitrateTable[bitrateRow]?.[bitrateIndex];
    if (!bitrateKbps) continue;

    return {
      sampleRate,
      bitrate: bitrateKbps * 1000,
      format: 'mp3',
    };
  }

  return { sampleRate: null, bitrate: null, format: 'mp3' };
};

// ==================== FLAC ====================

const parseFlacHeader = (bytes: Uint8Array): AudioStreamInfo => {
  // fLaC (4 bytes) + STREAMINFO block
  // STREAMINFO: block type 0x00 (1 byte) + block length (3 bytes) + data (34 bytes)
  if (bytes.length < 38) return { sampleRate: null, bitrate: null, format: 'flac' };

  const blockType = bytes[4] & 0x7f;
  if (blockType !== 0) return { sampleRate: null, bitrate: null, format: 'flac' };

  // STREAMINFO data starts at offset 8
  // Bytes 10-12 contain sample rate (20 bits), channels (3 bits), bps (5 bits)
  // Layout: [min_block_size(2)][max_block_size(2)][min_frame_size(3)][max_frame_size(3)]
  //         [sample_rate(4 bytes, 20 bits used)][channels(3 bits)][bps(5 bits)][total_samples(36 bits)]
  // sample_rate 在 offset 18 的 4 字节中，高 20 位
  const sampleRate = (bytes[18] << 12) | (bytes[19] << 4) | ((bytes[20] >> 4) & 0x0f);

  if (sampleRate === 0) return { sampleRate: null, bitrate: null, format: 'flac' };

  // FLAC 是无损格式，比特率不固定，用采样率 * 位深 * 声道数估算
  const bps = ((bytes[20] & 0x01) << 4) | ((bytes[21] >> 4) & 0x0f);
  const channels = ((bytes[20] >> 1) & 0x07) + 1;
  const estimatedBitrate = sampleRate * (bps || 16) * channels;

  return {
    sampleRate,
    bitrate: estimatedBitrate,
    format: 'flac',
  };
};

// ==================== WAV ====================

const parseWavHeader = (bytes: Uint8Array): AudioStreamInfo => {
  // RIFF(4) + size(4) + WAVE(4) + fmt chunk
  // fmt chunk: "fmt "(4) + chunk_size(4) + format(2) + channels(2) + sampleRate(4) + byteRate(4) + ...
  if (bytes.length < 44) return { sampleRate: null, bitrate: null, format: 'wav' };

  // 查找 "fmt " 子块
  let offset = 12;
  while (offset + 8 < bytes.length) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const chunkSize =
      bytes[offset + 4] |
      (bytes[offset + 5] << 8) |
      (bytes[offset + 6] << 16) |
      (bytes[offset + 7] << 24);
    if (chunkId === 'fmt ') {
      const sampleRate =
        bytes[offset + 8] |
        (bytes[offset + 9] << 8) |
        (bytes[offset + 10] << 16) |
        (bytes[offset + 11] << 24);
      const byteRate =
        bytes[offset + 12] |
        (bytes[offset + 13] << 8) |
        (bytes[offset + 14] << 16) |
        (bytes[offset + 15] << 24);
      return {
        sampleRate,
        bitrate: byteRate * 8,
        format: 'wav',
      };
    }
    offset += 8 + chunkSize;
    if (offset >= bytes.length) break;
  }

  return { sampleRate: null, bitrate: null, format: 'wav' };
};

// ==================== DSDIFF/DFF ====================
// Big-Endian IFF 格式。不同工具生成的 DFF 文件头结构差异很大：
// 有的 DSD 在 offset 8，有的在 offset 12，FRM8 的 size 字段可能为 0。
// 直接暴カ搜索 "SND " 模式来获取 sampleRate，不依赖特定偏移。
const parseDffHeader = (bytes: Uint8Array): AudioStreamInfo => {
  const maxScan = Math.min(bytes.length - 16, 65536);
  for (let offset = 0; offset < maxScan; offset++) {
    if (
      bytes[offset] === 0x53 &&
      bytes[offset + 1] === 0x4e &&
      bytes[offset + 2] === 0x44 &&
      bytes[offset + 3] === 0x20
    ) {
      // SND 后的 4 字节是 sampleRate (big-endian)
      const sampleRate =
        (bytes[offset + 4] << 24) |
        (bytes[offset + 5] << 16) |
        (bytes[offset + 6] << 8) |
        bytes[offset + 7];
      if (sampleRate > 0 && sampleRate < 20000000) {
        return { sampleRate, bitrate: null, format: 'wav' };
      }
    }
  }
  return { sampleRate: null, bitrate: null, format: 'unknown' };
};

// ==================== DSF ====================
// Little-Endian 格式
// "DSD "(4) + size(8, LE) + version(4) + formatID(4) + channelType(4) + channelNum(4)
// + sampleRate(4, LE) + bitsPerSample(4) + sampleCount(8) + blockSize(4) + ...
const parseDsfHeader = (bytes: Uint8Array): AudioStreamInfo => {
  if (bytes.length < 32) return { sampleRate: null, bitrate: null, format: 'unknown' };

  const sampleRate =
    bytes[28] | (bytes[29] << 8) | (bytes[30] << 16) | (bytes[31] << 24);

  if (sampleRate > 0) {
    return { sampleRate, bitrate: null, format: 'wav' };
  }
  return { sampleRate: null, bitrate: null, format: 'unknown' };
};
