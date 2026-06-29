import { QUALITYS } from '@common/constants';

export const PLAY_QUALITIES: LX.Quality[] = QUALITYS.filter(
  (quality) => quality !== 'wav' && quality !== 'ape',
);

export const getAvailableOnlineMusicQualities = (
  musicInfo: LX.Music.MusicInfoOnline,
): LX.Quality[] => {
  const qualityMap = musicInfo.meta._qualitys ?? {};
  const qualitySet = new Set<LX.Quality>();

  for (const quality of PLAY_QUALITIES) {
    if (qualityMap[quality]) qualitySet.add(quality);
  }

  for (const quality of musicInfo.meta.qualitys ?? []) {
    if (PLAY_QUALITIES.includes(quality.type)) qualitySet.add(quality.type);
  }

  return PLAY_QUALITIES.filter((quality) => qualitySet.has(quality));
};

export const getPreferredOnlineMusicQuality = (
  preferredQuality: LX.Quality,
  musicInfo: LX.Music.MusicInfoOnline,
): LX.Quality => {
  const availableQualities = getAvailableOnlineMusicQualities(musicInfo);
  if (!availableQualities.length) return musicInfo.meta.qualitys[0]?.type ?? '128k';
  if (!PLAY_QUALITIES.includes(preferredQuality)) return availableQualities.at(-1) ?? '128k';

  const preferredIndex = PLAY_QUALITIES.indexOf(preferredQuality);
  return (
    PLAY_QUALITIES.slice(preferredIndex).find((quality) => availableQualities.includes(quality)) ??
    availableQualities.at(-1) ??
    '128k'
  );
};
