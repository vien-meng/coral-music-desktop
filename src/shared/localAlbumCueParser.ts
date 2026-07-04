export interface CuePathTools {
  basename: (filePath: string) => string;
  dirname: (filePath: string) => string;
  joinPath: (...paths: string[]) => string;
}

export interface ParsedCueTrack {
  albumArtist: string | null;
  albumName: string | null;
  cuePath: string;
  filePath: string;
  genre: string | null;
  performer: string | null;
  startMs: number;
  title: string | null;
  trackNo: number;
  year: string | null;
}

export interface ParsedSfvFile {
  expectedCrc32: string;
  fileName: string;
  filePath: string;
  sfvPath: string;
}

export type ParsedSfvStatus = 'unchecked' | 'missing' | undefined;

interface RawCueTrack {
  filePath: string;
  index00Ms: number | null;
  index01Ms: number | null;
  performer: string | null;
  title: string | null;
  trackNo: number;
}

interface CueSheetInfo {
  albumArtist: string | null;
  albumName: string | null;
  genre: string | null;
  tracks: RawCueTrack[];
  year: string | null;
}

const CUE_TIME_RE = /^(\d+):(\d{2}):(\d{2})$/;

const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

export const unquoteCueValue = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
  return trimmed;
};

export const resolveSidecarPath = (
  baseDir: string,
  fileName: string,
  pathTools: Pick<CuePathTools, 'joinPath'>,
): string => {
  const rawFileName = fileName.trim();
  const fileUriPath = /^file:\/\//i.test(rawFileName)
    ? rawFileName.replace(/^file:\/\/(?:localhost)?/i, '')
    : rawFileName;
  const decodedFileName = (() => {
    try {
      return decodeURIComponent(fileUriPath);
    } catch {
      return fileUriPath;
    }
  })();
  const normalized = decodedFileName.replace(/^\/([A-Za-z]:\/)/, '$1').replace(/\\/g, '/');
  if (!normalized) return baseDir;
  if (/^[A-Za-z]:\//.test(normalized)) return normalized.replace(/\//g, '\\');
  if (normalized.startsWith('/')) return normalized;
  return pathTools.joinPath(baseDir, ...normalized.split('/').filter(Boolean));
};

const getSidecarBasename = (fileName: string, pathTools: Pick<CuePathTools, 'basename'>): string =>
  pathTools.basename(fileName.replace(/\\/g, '/'));

export const parseCueTimeMs = (value: string): number | null => {
  const match = CUE_TIME_RE.exec(value.trim());
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const frames = Number(match[3]);
  if (![minutes, seconds, frames].every(Number.isFinite)) return null;
  return Math.round((minutes * 60 + seconds + frames / 75) * 1000);
};

export const calculateCrc32 = (data: Uint8Array): string => {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).toUpperCase().padStart(8, '0');
};

export const getParsedSfvStatus = (
  hasSfvSidecar: boolean,
  hasMatchingEntry: boolean,
): ParsedSfvStatus => {
  if (hasMatchingEntry) return 'unchecked';
  return hasSfvSidecar ? 'missing' : undefined;
};

const parseCueSheet = (content: string, cuePath: string, pathTools: CuePathTools): CueSheetInfo => {
  const cueDir = pathTools.dirname(cuePath);
  const sheet: CueSheetInfo = {
    albumArtist: null,
    albumName: null,
    genre: null,
    tracks: [],
    year: null,
  };
  let currentFilePath = '';
  let currentTrack: RawCueTrack | null = null;

  const commitTrack = (): void => {
    if (!currentTrack || currentTrack.index01Ms == null || !currentTrack.filePath) return;
    sheet.tracks.push(currentTrack);
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const fileMatch = /^FILE\s+(.+?)\s+\S+$/i.exec(line);
    if (fileMatch) {
      currentFilePath = resolveSidecarPath(cueDir, unquoteCueValue(fileMatch[1]), pathTools);
      continue;
    }

    const trackMatch = /^TRACK\s+(\d+)\s+\S+$/i.exec(line);
    if (trackMatch) {
      commitTrack();
      currentTrack = {
        filePath: currentFilePath,
        index00Ms: null,
        index01Ms: null,
        performer: null,
        title: null,
        trackNo: Number(trackMatch[1]),
      };
      continue;
    }

    const titleMatch = /^TITLE\s+(.+)$/i.exec(line);
    if (titleMatch) {
      const value = unquoteCueValue(titleMatch[1]);
      if (currentTrack) currentTrack.title = value;
      else sheet.albumName = value;
      continue;
    }

    const performerMatch = /^PERFORMER\s+(.+)$/i.exec(line);
    if (performerMatch) {
      const value = unquoteCueValue(performerMatch[1]);
      if (currentTrack) currentTrack.performer = value;
      else sheet.albumArtist = value;
      continue;
    }

    const indexMatch = /^INDEX\s+(00|01)\s+(\S+)$/i.exec(line);
    if (indexMatch && currentTrack) {
      const value = parseCueTimeMs(indexMatch[2]);
      if (value == null) continue;
      if (indexMatch[1] === '00') currentTrack.index00Ms = value;
      else currentTrack.index01Ms = value;
      continue;
    }

    const remMatch = /^REM\s+(\S+)\s+(.+)$/i.exec(line);
    if (remMatch) {
      const key = remMatch[1].toUpperCase();
      const value = unquoteCueValue(remMatch[2]);
      if (key === 'DATE' || key === 'YEAR') sheet.year = value;
      if (key === 'GENRE') sheet.genre = value;
    }
  }

  commitTrack();
  return sheet;
};

export const parseCueTracks = (
  content: string,
  cuePath: string,
  pathTools: CuePathTools,
): ParsedCueTrack[] => {
  const sheet = parseCueSheet(content, cuePath, pathTools);
  return sheet.tracks.map((track) => ({
    albumArtist: sheet.albumArtist,
    albumName: sheet.albumName,
    cuePath,
    filePath: track.filePath,
    genre: sheet.genre,
    performer: track.performer,
    startMs: track.index01Ms ?? 0,
    title: track.title,
    trackNo: track.trackNo,
    year: sheet.year,
  }));
};

export const parseSfvFiles = (
  content: string,
  sfvPath: string,
  pathTools: CuePathTools,
): ParsedSfvFile[] => {
  const sfvDir = pathTools.dirname(sfvPath);
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith(';'))
    .map((line) => /^(.+?)\s+([a-f0-9]{8})$/i.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => ({
      expectedCrc32: match[2].toUpperCase(),
      fileName: getSidecarBasename(match[1], pathTools),
      filePath: resolveSidecarPath(sfvDir, match[1], pathTools),
      sfvPath,
    }));
};
