import { DOWNLOAD_STATUS, QUALITYS } from '@common/constants';
import { filterFileName } from '@common/utils/common';
import { clipFileNameLength, clipNameLength, formatMusicName } from '@common/utils/tools';

export const getDownloadFileExt = (type: string): Coral.Download.FileExt => {
  switch (type) {
    case 'ape':
      return 'ape';
    case 'flac':
    case 'flac24bit':
    case 'hires':
    case 'atmos':
    case 'atmos_plus':
    case 'master':
      return 'flac';
    case 'wav':
      return 'wav';
    case '128k':
    case '192k':
    case '320k':
    default:
      return 'mp3';
  }
};

const getWebDavDownloadFileExt = (ext: string): Coral.Download.FileExt => {
  const normalized = ext.toLowerCase();
  if (['mp3', 'flac', 'wav', 'ape', 'm4a', 'aac', 'ogg', 'opus'].includes(normalized)) {
    return normalized as Coral.Download.FileExt;
  }
  return 'mp3';
};

export const getDownloadMusicQuality = (
  musicInfo: Coral.Music.MusicInfoOnline,
  type: Coral.Quality,
  qualityList: Coral.QualityList,
): Coral.Quality => {
  const sourceQualityList = qualityList[musicInfo.source];
  if (!sourceQualityList?.length) return musicInfo.meta._qualitys[type] ? type : '128k';

  const preferredType = sourceQualityList.includes(type)
    ? type
    : sourceQualityList[sourceQualityList.length - 1];
  const rangeType = QUALITYS.slice(QUALITYS.indexOf(preferredType));
  for (const quality of rangeType) {
    if (musicInfo.meta._qualitys[quality]) return quality;
  }
  return '128k';
};

export const createDownloadInfo = (
  musicInfo: Coral.Music.MusicInfoOnline,
  type: Coral.Quality,
  fileNameFormat: string,
  qualityList: Coral.QualityList,
  listId?: string,
): Coral.Download.ListItem => {
  const quality = getDownloadMusicQuality(musicInfo, type, qualityList);
  const ext = getDownloadFileExt(quality);
  const key = `${musicInfo.id}_${quality}_${ext}`;

  return {
    id: key,
    isComplate: false,
    status: DOWNLOAD_STATUS.WAITING,
    statusText: '待下载',
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '',
    writeQueue: 0,
    metadata: {
      musicInfo,
      url: null,
      quality,
      ext,
      filePath: '',
      listId,
      fileName: filterFileName(
        `${clipFileNameLength(
          formatMusicName(fileNameFormat, musicInfo.name, clipNameLength(musicInfo.singer)),
        )}.${ext}`,
      ),
    },
  };
};

export const createDownloadTaskList = (
  list: Coral.Music.MusicInfoOnline[],
  quality: Coral.Quality,
  fileNameFormat: string,
  qualityList: Coral.QualityList,
  listId?: string,
): Coral.Download.ListItem[] =>
  list.map((musicInfo) =>
    createDownloadInfo(musicInfo, quality, fileNameFormat, qualityList, listId),
  );

export const createWebDavDownloadInfo = (
  musicInfo: Coral.Music.MusicInfoWebDav,
  listId?: string,
): Coral.Download.ListItem => {
  const ext = getWebDavDownloadFileExt(musicInfo.meta.ext);
  const key = `${musicInfo.id}_${ext}`;

  return {
    id: key,
    isComplate: false,
    status: DOWNLOAD_STATUS.WAITING,
    statusText: '待下载',
    downloaded: 0,
    total: musicInfo.meta.contentLength ?? 0,
    progress: 0,
    speed: '',
    writeQueue: 0,
    metadata: {
      musicInfo,
      url: null,
      quality: ext === 'flac' ? 'flac' : ext === 'wav' ? 'wav' : '320k',
      ext,
      filePath: '',
      listId,
      fileName: filterFileName(`${clipFileNameLength(musicInfo.name)}.${ext}`),
    },
  };
};
