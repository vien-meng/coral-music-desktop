import { type IAudioMetadata as iAudioMetadata } from 'music-metadata';

declare global {
  namespace Coral {
    namespace MusicMetadataModule {
      type IAudioMetadata = iAudioMetadata;
    }
  }
}
