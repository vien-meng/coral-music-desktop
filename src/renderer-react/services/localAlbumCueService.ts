import type { IAudioMetadata } from 'music-metadata';
import {
  getParsedSfvStatus,
  parseCueTracks,
  parseSfvFiles,
  type CuePathTools,
} from '@shared/localAlbumCueParser';
import { basename, dirname, extname, joinPath, readFile } from './nodeBridgeService';

interface IconvLiteModule {
  decode: (buffer: Buffer, encoding: string) => string;
}

interface CueNodeRequire {
  (moduleName: 'iconv-lite'): IconvLiteModule;
}

interface CueNodeGlobal {
  require?: CueNodeRequire;
}

export interface CueTrackInfo {
  albumArtist: string | null;
  albumName: string | null;
  cuePath: string;
  filePath: string;
  genre: string | null;
  title: string | null;
  performer: string | null;
  startMs: number;
  endMs: number | null;
  trackNo: number;
  year: string | null;
}

export interface SfvFileInfo {
  expectedCrc32: string;
  fileName: string;
  filePath: string;
  sfvPath: string;
}

export const getCueTrackSfvMeta = (
  sfvInfo: SfvFileInfo | null,
  hasSfvSidecar: boolean,
): Pick<Coral.Music.MusicInfoMeta_local, 'sfvExpectedCrc32' | 'sfvPath' | 'sfvStatus'> => ({
  sfvExpectedCrc32: sfvInfo?.expectedCrc32 ?? null,
  sfvPath: sfvInfo?.sfvPath ?? null,
  sfvStatus: getParsedSfvStatus(hasSfvSidecar, Boolean(sfvInfo)),
});

const cuePathTools: CuePathTools = {
  basename,
  dirname,
  joinPath,
};

const decodeText = (buffer: Buffer): string => {
  const utf8 = buffer.toString('utf8');
  const replacementCount = (utf8.match(/\uFFFD/g) ?? []).length;
  if (replacementCount <= 1) return utf8.replace(/^\uFEFF/, '');

  const iconv = (globalThis as typeof globalThis & CueNodeGlobal).require?.('iconv-lite');
  return (iconv?.decode(buffer, 'gb18030') ?? utf8).replace(/^\uFEFF/, '');
};

export const readCueTracks = async (
  cuePath: string,
  durationByFilePath: Map<string, number | null>,
): Promise<CueTrackInfo[]> => {
  const content = decodeText(await readFile(cuePath));
  const tracks = parseCueTracks(content, cuePath, cuePathTools);
  return completeCueTrackEndTimes(
    tracks.map((track) => ({
      albumArtist: track.albumArtist,
      albumName: track.albumName,
      cuePath,
      filePath: track.filePath,
      genre: track.genre,
      performer: track.performer,
      startMs: track.startMs,
      endMs: null,
      title: track.title,
      trackNo: track.trackNo,
      year: track.year,
    })),
    durationByFilePath,
  );
};

export const completeCueTrackEndTimes = (
  tracks: CueTrackInfo[],
  durationByFilePath: Map<string, number | null>,
): CueTrackInfo[] =>
  tracks.map((track, index) => {
    const nextTrack = tracks.slice(index + 1).find((item) => item.filePath === track.filePath);
    return {
      ...track,
      endMs: nextTrack?.startMs ?? durationByFilePath.get(track.filePath) ?? track.endMs,
    };
  });

export const readSfvFiles = async (sfvPath: string): Promise<SfvFileInfo[]> => {
  const content = decodeText(await readFile(sfvPath));
  return parseSfvFiles(content, sfvPath, cuePathTools);
};

export const createCueTrackMusicInfo = (
  baseMusicInfo: Coral.Music.MusicInfoLocal,
  cueTrack: CueTrackInfo,
  metadata: IAudioMetadata | null,
  sfvInfo: SfvFileInfo | null,
  hasSfvSidecar: boolean,
): Coral.Music.MusicInfoLocal => {
  const trackDurationSeconds =
    cueTrack.endMs != null && cueTrack.endMs > cueTrack.startMs
      ? (cueTrack.endMs - cueTrack.startMs) / 1000
      : undefined;
  const trackNo = String(cueTrack.trackNo).padStart(2, '0');
  const albumName = cueTrack.albumName ?? baseMusicInfo.meta.albumName;
  const performer = cueTrack.performer ?? cueTrack.albumArtist ?? baseMusicInfo.singer;
  const sfvMeta = getCueTrackSfvMeta(sfvInfo, hasSfvSidecar);
  return {
    ...baseMusicInfo,
    id: `local_cue_${cueTrack.cuePath}#${cueTrack.filePath}#${cueTrack.trackNo}#${cueTrack.startMs}`,
    interval: trackDurationSeconds
      ? `${Math.floor(trackDurationSeconds / 60)}:${String(
          Math.round(trackDurationSeconds % 60),
        ).padStart(2, '0')}`
      : baseMusicInfo.interval,
    meta: {
      ...baseMusicInfo.meta,
      albumArtist: cueTrack.albumArtist,
      albumFilePath: cueTrack.filePath,
      albumId: cueTrack.cuePath,
      albumName,
      cuePath: cueTrack.cuePath,
      durationMs: cueTrack.endMs != null ? cueTrack.endMs - cueTrack.startMs : null,
      ...sfvMeta,
      songId: `${cueTrack.cuePath}#${cueTrack.trackNo}`,
      trackEndMs: cueTrack.endMs,
      trackNo: cueTrack.trackNo,
      trackStartMs: cueTrack.startMs,
    },
    name: cueTrack.title ?? `${trackNo}. ${baseMusicInfo.name}`,
    singer: performer,
  };
};

export const getAudioDurationMs = (metadata: IAudioMetadata | null): number | null => {
  const duration = metadata?.format.duration;
  if (!duration || !Number.isFinite(duration) || duration <= 0) return null;
  return Math.round(duration * 1000);
};

export const isCueFile = (filePath: string): boolean => extname(filePath).toLowerCase() === '.cue';
export const isSfvFile = (filePath: string): boolean => extname(filePath).toLowerCase() === '.sfv';
