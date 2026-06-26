import { DOWNLOAD_STATUS, QUALITYS } from '@common/constants'
import { filterFileName } from '@common/utils/common'
import { clipFileNameLength, clipNameLength, formatMusicName } from '@common/utils/tools'

export const getDownloadFileExt = (type: string): LX.Download.FileExt => {
  switch (type) {
    case 'ape':
      return 'ape'
    case 'flac':
    case 'flac24bit':
    case 'hires':
    case 'atmos':
    case 'atmos_plus':
    case 'master':
      return 'flac'
    case 'wav':
      return 'wav'
    case '128k':
    case '192k':
    case '320k':
    default:
      return 'mp3'
  }
}

export const getDownloadMusicQuality = (
  musicInfo: LX.Music.MusicInfoOnline,
  type: LX.Quality,
  qualityList: LX.QualityList,
): LX.Quality => {
  const sourceQualityList = qualityList[musicInfo.source]
  if (!sourceQualityList?.length) return musicInfo.meta._qualitys[type] ? type : '128k'

  const preferredType = sourceQualityList.includes(type) ? type : sourceQualityList[sourceQualityList.length - 1]
  const rangeType = QUALITYS.slice(QUALITYS.indexOf(preferredType))
  for (const quality of rangeType) {
    if (musicInfo.meta._qualitys[quality]) return quality
  }
  return '128k'
}

export const createDownloadInfo = (
  musicInfo: LX.Music.MusicInfoOnline,
  type: LX.Quality,
  fileNameFormat: string,
  qualityList: LX.QualityList,
  listId?: string,
): LX.Download.ListItem => {
  const quality = getDownloadMusicQuality(musicInfo, type, qualityList)
  const ext = getDownloadFileExt(quality)
  const key = `${musicInfo.id}_${quality}_${ext}`

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
      fileName: filterFileName(`${clipFileNameLength(formatMusicName(
        fileNameFormat,
        musicInfo.name,
        clipNameLength(musicInfo.singer),
      ))}.${ext}`),
    },
  }
}

export const createDownloadTaskList = (
  list: LX.Music.MusicInfoOnline[],
  quality: LX.Quality,
  fileNameFormat: string,
  qualityList: LX.QualityList,
  listId?: string,
): LX.Download.ListItem[] => {
  return list.map(musicInfo => createDownloadInfo(musicInfo, quality, fileNameFormat, qualityList, listId))
}
