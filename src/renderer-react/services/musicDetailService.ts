import musicSdk from './musicSdk/sdk'
import { appService } from './appService'

const isSourceSupported = (source: string): boolean => {
  return typeof source === 'string' && source !== 'local' && source in musicSdk
}

const getDetailPageUrl = (musicInfo: LX.Music.MusicInfo): string | null => {
  if (!isSourceSupported(musicInfo.source)) return null

  const sdk = musicSdk[musicInfo.source]
  if (typeof sdk.getMusicDetailPageUrl !== 'function') return null

  const url = sdk.getMusicDetailPageUrl(musicInfo) as string | undefined
  return url ?? null
}

export const openMusicDetail = async(musicInfo: LX.Music.MusicInfo): Promise<void> => {
  const url = getDetailPageUrl(musicInfo)
  if (!url) return

  await appService.openUrl(url)
}

export const musicDetailService = {
  getDetailPageUrl,
  openMusicDetail,
}
