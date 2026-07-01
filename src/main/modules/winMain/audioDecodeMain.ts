import decodeAudio from 'audio-decode';
import type { DecodedAudioData } from '@shared/playbackCapabilities';

const decodeLocalAudioBuffer = async (buffer: Uint8Array): Promise<DecodedAudioData> => {
  const decoded = await decodeAudio(buffer);
  return {
    channelData: decoded.channelData,
    sampleRate: decoded.sampleRate,
  };
};

export default decodeLocalAudioBuffer;
