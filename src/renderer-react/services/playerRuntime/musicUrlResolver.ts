import { encodePath } from '@common/utils/common'
import { checkPath } from '@common/utils/nodejs'
import { cacheService } from '../cacheService'
import type { PlayerRuntimeMusicInfo } from './types'

const TRY_QUALITIES: LX.Quality[] = ['flac24bit', 'flac', '320k']
const TOO_MANY_REQUESTS_MESSAGE = 'too many requests'

const pendingOtherSourcePromises = new Map<string, Promise<LX.Music.MusicInfoOnline[]>>()
const otherSourceCache = new Map<string, LX.Music.MusicInfoOnline[]>()

interface MusicUrlResult {
  type: LX.Quality
  url: string
}

interface MusicUrlRequest {
  promise: Promise<MusicUrlResult>
}

interface MusicSdkSource {
  getMusicUrl?: (musicInfo: unknown, quality: LX.Quality) => MusicUrlRequest
}

interface MusicSdk {
  findMusic?: (musicInfo: {
    albumName: string
    interval: string
    name: string
    singer: string
    source: string
  }) => Promise<unknown[]>
  [source: string]: unknown
}

const loadMusicSdk = async(): Promise<MusicSdk> => {
  const module = await import('../musicSdk/sdk')
  return module.default as MusicSdk
}

const isDownloadMusicInfo = (musicInfo: PlayerRuntimeMusicInfo): musicInfo is LX.Download.ListItem => {
  return 'progress' in musicInfo && 'metadata' in musicInfo
}

const toOldPlayableMusicInfo = (musicInfo: LX.Music.MusicInfoOnline): Record<string, unknown> => {
  const oldMusicInfo: Record<string, unknown> = {
    albumName: musicInfo.meta.albumName,
    img: musicInfo.meta.picUrl ?? '',
    interval: musicInfo.interval,
    name: musicInfo.name,
    singer: musicInfo.singer,
    songmid: musicInfo.meta.songId,
    source: musicInfo.source,
    typeUrl: {},
    types: musicInfo.meta.qualitys,
    _types: musicInfo.meta._qualitys,
  }

  switch (musicInfo.source) {
    case 'kg':
      oldMusicInfo.hash = musicInfo.meta.hash
      break
    case 'tx':
      oldMusicInfo.albumMid = musicInfo.meta.albumMid
      oldMusicInfo.songId = musicInfo.meta.id
      oldMusicInfo.strMediaMid = musicInfo.meta.strMediaMid
      break
    case 'mg':
      oldMusicInfo.copyrightId = musicInfo.meta.copyrightId
      oldMusicInfo.lrcUrl = musicInfo.meta.lrcUrl
      oldMusicInfo.mrcUrl = musicInfo.meta.mrcUrl
      oldMusicInfo.trcUrl = musicInfo.meta.trcUrl
      break
  }

  if ('albumId' in musicInfo.meta) oldMusicInfo.albumId = musicInfo.meta.albumId

  return oldMusicInfo
}

const toOnlineMusicInfo = (musicInfo: unknown): LX.Music.MusicInfoOnline | null => {
  if (typeof musicInfo !== 'object' || musicInfo == null) return null

  const oldMusicInfo = musicInfo as Record<string, any>
  const source = oldMusicInfo.source
  const songId = oldMusicInfo.songmid
  if (typeof source !== 'string' || !songId) return null

  const meta: Record<string, unknown> = {
    _qualitys: oldMusicInfo._types ?? {},
    albumId: oldMusicInfo.albumId,
    albumName: oldMusicInfo.albumName ?? '',
    picUrl: oldMusicInfo.img ?? '',
    qualitys: oldMusicInfo.types ?? [],
    songId,
  }
  const newMusicInfo = {
    id: `${source}_${songId}`,
    interval: oldMusicInfo.interval ?? '',
    meta,
    name: oldMusicInfo.name ?? '',
    singer: oldMusicInfo.singer ?? '',
    source: source as LX.OnlineSource,
  }

  switch (source) {
    case 'kg':
      meta.hash = oldMusicInfo.hash
      newMusicInfo.id = `${songId}_${oldMusicInfo.hash}`
      break
    case 'tx':
      meta.albumMid = oldMusicInfo.albumMid
      meta.id = oldMusicInfo.songId
      meta.strMediaMid = oldMusicInfo.strMediaMid
      break
    case 'mg':
      meta.copyrightId = oldMusicInfo.copyrightId
      meta.lrcUrl = oldMusicInfo.lrcUrl
      meta.mrcUrl = oldMusicInfo.mrcUrl
      meta.trcUrl = oldMusicInfo.trcUrl
      break
  }

  return newMusicInfo as unknown as LX.Music.MusicInfoOnline
}

export interface ResolvedPlaybackUrl {
  musicInfo: PlayerRuntimeMusicInfo
  quality: LX.Quality
  source: 'cache' | 'download' | 'fresh' | 'local'
  url: string
}

export interface ResolvePlayableMusicUrlOptions {
  allowFresh?: boolean
  allowToggleSource?: boolean
  isRefresh?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
  preferredQuality?: LX.Quality
}

export const resolveLocalMusicUrl = (musicInfo?: PlayerRuntimeMusicInfo): string | null => {
  if (!musicInfo || isDownloadMusicInfo(musicInfo) || musicInfo.source !== 'local') return null

  const filePath = musicInfo.meta.filePath.trim()
  if (!filePath) return null

  return encodePath(filePath)
}

export const canPlayWithLocalRuntime = (musicInfo?: PlayerRuntimeMusicInfo): boolean => {
  return resolveLocalMusicUrl(musicInfo) != null
}

export const resolveDownloadMusicUrl = async(
  musicInfo: LX.Download.ListItem,
  isRefresh = false,
): Promise<string | null> => {
  if (isRefresh || !musicInfo.isComplate || /\.ape$/i.test(musicInfo.metadata.fileName)) return null
  if (musicInfo.metadata.filePath && await checkPath(musicInfo.metadata.filePath)) {
    return encodePath(musicInfo.metadata.filePath)
  }

  return null
}

export const getPreferredPlayQuality = (
  preferredQuality: LX.Quality,
  musicInfo: LX.Music.MusicInfoOnline,
): LX.Quality => {
  const fallbackQuality = musicInfo.meta._qualitys['128k']
    ? '128k'
    : musicInfo.meta.qualitys[0]?.type ?? '128k'

  if (!TRY_QUALITIES.includes(preferredQuality)) return fallbackQuality

  const quality = TRY_QUALITIES
    .slice(TRY_QUALITIES.indexOf(preferredQuality))
    .find(item => musicInfo.meta._qualitys[item])

  return quality ?? fallbackQuality
}

const getSourceSdk = (sdk: MusicSdk, source: LX.OnlineSource): MusicSdkSource | null => {
  const sourceSdk = sdk[source]
  if (typeof sourceSdk !== 'object' || sourceSdk == null || Array.isArray(sourceSdk)) return null
  return sourceSdk as MusicSdkSource
}

export const fetchFreshOnlineMusicUrl = async(
  musicInfo: LX.Music.MusicInfoOnline,
  quality: LX.Quality,
): Promise<MusicUrlResult> => {
  const sdk = await loadMusicSdk()
  const request = getSourceSdk(sdk, musicInfo.source)?.getMusicUrl?.(toOldPlayableMusicInfo(musicInfo), quality)
  if (!request) throw new Error(`music url source not found: ${musicInfo.source}`)

  const result = await request.promise
  if (!result.url) throw new Error('music url is empty')
  return result
}

const createOtherSourceCacheKey = (musicInfo: LX.Music.MusicInfoOnline): string => {
  return `${musicInfo.source}_${musicInfo.id}`
}

const fetchOtherSourceMusicList = async(musicInfo: LX.Music.MusicInfoOnline): Promise<LX.Music.MusicInfoOnline[]> => {
  const cacheKey = createOtherSourceCacheKey(musicInfo)
  const cachedList = otherSourceCache.get(cacheKey)
  if (cachedList) return cachedList

  const pendingPromise = pendingOtherSourcePromises.get(cacheKey)
  if (pendingPromise) return pendingPromise

  const promise = loadMusicSdk()
    .then(async(sdk) => {
      const dbCachedList = await cacheService.getCachedOtherSource(musicInfo.id)
      if (dbCachedList.length) {
        otherSourceCache.set(cacheKey, dbCachedList)
        return dbCachedList
      }

      const rawList = await sdk.findMusic?.({
        albumName: musicInfo.meta.albumName,
        interval: musicInfo.interval ?? '',
        name: musicInfo.name,
        singer: musicInfo.singer,
        source: musicInfo.source,
      })
      const list = rawList
        ?.map(toOnlineMusicInfo)
        .filter((item): item is LX.Music.MusicInfoOnline => item != null) ?? []

      if (otherSourceCache.size > 10) otherSourceCache.clear()
      otherSourceCache.set(cacheKey, list)
      if (list.length) void cacheService.saveCachedOtherSource(musicInfo.id, list)
      return list
    })
    .finally(() => {
      pendingOtherSourcePromises.delete(cacheKey)
    })

  pendingOtherSourcePromises.set(cacheKey, promise)
  return promise
}

const resolveOnlineMusicUrl = async(
  musicInfo: LX.Music.MusicInfoOnline,
  options: ResolvePlayableMusicUrlOptions,
): Promise<ResolvedPlaybackUrl | null> => {
  const quality = getPreferredPlayQuality(options.preferredQuality ?? '128k', musicInfo)
  const cachedUrl = options.isRefresh
    ? ''
    : await cacheService.getCachedMusicUrl(musicInfo, quality)
  if (cachedUrl) {
    return {
      musicInfo,
      quality,
      source: 'cache',
      url: cachedUrl,
    }
  }

  if (options.allowFresh === false) return null

  try {
    const freshUrl = await fetchFreshOnlineMusicUrl(musicInfo, quality)
    await cacheService.saveCachedMusicUrl(musicInfo, freshUrl.type, freshUrl.url)

    return {
      musicInfo,
      quality: freshUrl.type,
      source: 'fresh',
      url: freshUrl.url,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (options.allowToggleSource === false || message === TOO_MANY_REQUESTS_MESSAGE) throw err

    options.onToggleSource?.()
    const otherSourceList = await fetchOtherSourceMusicList(musicInfo)
    for (const otherMusicInfo of otherSourceList) {
      if (otherMusicInfo.source === musicInfo.source) continue
      const targetQuality = getPreferredPlayQuality(options.preferredQuality ?? quality, otherMusicInfo)
      if (!otherMusicInfo.meta._qualitys[targetQuality]) continue

      options.onToggleSource?.(otherMusicInfo)
      const resolved = await resolveOnlineMusicUrl(otherMusicInfo, {
        ...options,
        allowToggleSource: false,
        preferredQuality: targetQuality,
      }).catch(() => null)
      if (resolved) return resolved
    }

    throw err
  }
}

export const resolvePlayableMusicUrl = async(
  musicInfo: PlayerRuntimeMusicInfo,
  options: ResolvePlayableMusicUrlOptions = {},
): Promise<ResolvedPlaybackUrl | null> => {
  if (isDownloadMusicInfo(musicInfo)) {
    const downloadUrl = await resolveDownloadMusicUrl(musicInfo, options.isRefresh)
    if (downloadUrl) {
      return {
        musicInfo,
        quality: musicInfo.metadata.quality,
        source: 'download',
        url: downloadUrl,
      }
    }

    return resolveOnlineMusicUrl(musicInfo.metadata.musicInfo, {
      ...options,
      preferredQuality: options.preferredQuality ?? musicInfo.metadata.quality,
    })
  }

  const localUrl = resolveLocalMusicUrl(musicInfo)
  if (localUrl) {
    return {
      musicInfo,
      quality: '128k',
      source: 'local',
      url: localUrl,
    }
  }

  if (musicInfo.source === 'local') return null

  return resolveOnlineMusicUrl(musicInfo, options)
}
