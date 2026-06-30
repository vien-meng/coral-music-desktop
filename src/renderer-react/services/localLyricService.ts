import { basename, dirname, extname, readDirectory, readFile } from './nodeBridgeService';
import { onlineMediaService } from './onlineMediaService';

const lrcTimestampRxp = /\[\d{1,2}:\d{1,2}(?:[.:]\d+)?]/;
const textDecoder = new TextDecoder('utf-8', { fatal: false });
let gbkDecoder: TextDecoder | null | undefined;

const emptyLyricInfo: Coral.Music.LyricInfo = {
  lyric: '',
  lxlyric: '',
  rlyric: '',
  tlyric: '',
};

const normalizeName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[()[\]{}【】（）"'“”‘’]/g, '')
    .replace(/[\s._-]+/g, '')
    .trim();

const hasUsableLrc = (content: string): boolean => {
  if (!lrcTimestampRxp.test(content)) return false;
  return content
    .split(/\r?\n/)
    .some((line) => lrcTimestampRxp.test(line) && line.replace(/\[[^\]]+]/g, '').trim());
};

const decodeLrcBuffer = (buffer: Buffer): string => {
  const utf8Text = textDecoder.decode(buffer);
  if (hasUsableLrc(utf8Text) || !/�/.test(utf8Text)) return utf8Text;

  try {
    gbkDecoder ??= new TextDecoder('gb18030', { fatal: false });
    return gbkDecoder.decode(buffer);
  } catch {
    gbkDecoder = null;
    return utf8Text;
  }
};

const getCandidateNames = (musicInfo: Coral.Music.MusicInfoLocal): string[] => {
  const fileBaseName = basename(musicInfo.meta.filePath, extname(musicInfo.meta.filePath));
  const title = musicInfo.name.trim();
  const singer = musicInfo.singer.trim();
  return Array.from(
    new Set(
      [
        fileBaseName,
        singer && title ? `${singer} - ${title}` : '',
        singer && title ? `${title} - ${singer}` : '',
        title,
      ].filter(Boolean),
    ),
  );
};

const findLocalLrcPath = async (musicInfo: Coral.Music.MusicInfoLocal): Promise<string | null> => {
  const dirPath = dirname(musicInfo.meta.filePath);
  const entries = await readDirectory(dirPath).catch(() => []);
  const lrcEntries = entries.filter((entry) => entry.isFile && /\.lrc$/i.test(entry.name));
  if (!lrcEntries.length) return null;

  const normalizedCandidates = getCandidateNames(musicInfo).map(normalizeName).filter(Boolean);
  for (const candidate of normalizedCandidates) {
    const exact = lrcEntries.find((entry) => normalizeName(entry.name) === candidate);
    if (exact) return exact.filePath;
  }

  const fuzzy = lrcEntries.find((entry) => {
    const normalizedName = normalizeName(entry.name);
    return normalizedCandidates.some(
      (candidate) =>
        candidate.length >= 2 &&
        (normalizedName.includes(candidate) || candidate.includes(normalizedName)),
    );
  });
  return fuzzy?.filePath ?? null;
};

export const getLocalLyricInfo = async (
  musicInfo: Coral.Music.MusicInfoLocal,
): Promise<Coral.Music.LyricInfo> => {
  const lrcPath = await findLocalLrcPath(musicInfo);
  if (!lrcPath) return emptyLyricInfo;

  const lyric = decodeLrcBuffer(await readFile(lrcPath));
  if (!hasUsableLrc(lyric)) return emptyLyricInfo;
  return {
    ...emptyLyricInfo,
    lyric,
  };
};

export const getFallbackOnlineLyricInfo = async (
  musicInfo: Coral.Music.MusicInfoLocal,
): Promise<Coral.Music.LyricInfo> =>
  onlineMediaService.getOnlineLyricInfoByKeyword({
    interval: musicInfo.interval ?? '',
    name: musicInfo.name,
    singer: musicInfo.singer,
  });

export const localLyricService = {
  getFallbackOnlineLyricInfo,
  getLocalLyricInfo,
};
