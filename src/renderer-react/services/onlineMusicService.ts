import { similar } from '@common/utils/common'
import { toNewMusicInfo } from '@common/utils/tools'
import musicSdk from './musicSdk/sdk'

export type OnlineSourceWithAll = LX.OnlineSource | 'all'

export interface OnlineMusicSearchResult {
  limit: number
  list: LX.Music.MusicInfo[]
  maxPage: number
  source: OnlineSourceWithAll
  total: number
}

export interface OnlineSongListItem {
  author: string
  desc: string | null
  id: string
  img: string
  name: string
  play_count: string
  source: LX.OnlineSource
  time?: string
  total?: string
}

export interface OnlineSongListResult {
  limit: number
  list: OnlineSongListItem[]
  source: OnlineSourceWithAll
  total: number
}

export interface OnlineSongListDetailResult {
  id?: string
  info: {
    author?: string
    desc?: string
    img?: string
    name?: string
    play_count?: string
  }
  limit: number
  list: LX.Music.MusicInfoOnline[]
  source: LX.OnlineSource
  total: number
}

export interface OnlineLeaderboardBoardItem {
  bangid: string
  id: string
  name: string
}

export interface OnlineLeaderboardBoard {
  list: OnlineLeaderboardBoardItem[]
  source: LX.OnlineSource
}

export interface OnlineLeaderboardDetailResult {
  limit: number
  list: LX.Music.MusicInfoOnline[]
  source: LX.OnlineSource
  total: number
}

interface MusicSdkSourceInfo {
  id: LX.OnlineSource
  name: string
}

interface RawMusicSearchResult {
  allPage: number
  limit: number
  list: LX.Music.MusicInfo[]
  source: LX.OnlineSource
  total: number
}

interface RawSongListSearchResult {
  limit: number
  list: OnlineSongListItem[]
  source: LX.OnlineSource
  total: number
}

interface MusicSearchApi {
  search: (text: string, page: number, limit: number) => Promise<RawMusicSearchResult>
}

interface SongListApi {
  getList: (sortId: string, tagId: string, page: number) => Promise<OnlineSongListResult>
  getListDetail: (id: string, page: number) => Promise<OnlineSongListDetailResult>
  getTags: () => Promise<unknown>
  search: (text: string, page: number, limit: number) => Promise<RawSongListSearchResult>
  sortList?: Array<{ id: string, name: string }>
}

interface LeaderboardApi {
  getBoards: () => Promise<OnlineLeaderboardBoard>
  getList: (id: string, page: number) => Promise<OnlineLeaderboardDetailResult>
}

interface MusicSdkSource {
  leaderboard?: LeaderboardApi
  musicSearch?: MusicSearchApi
  songList?: SongListApi
}

type MusicSdk = Record<string, unknown> & {
  sources: MusicSdkSourceInfo[]
}

const sdk = musicSdk as MusicSdk

const getSourceSdk = (source: LX.OnlineSource): MusicSdkSource | null => {
  const sourceSdk = sdk[source]
  if (typeof sourceSdk !== 'object' || sourceSdk == null || Array.isArray(sourceSdk)) return null
  return sourceSdk as MusicSdkSource
}

const dedupeById = <Item extends { id: string }>(list: Item[]): Item[] => {
  const ids = new Set<string>()
  return list.filter(item => {
    if (ids.has(item.id)) return false
    ids.add(item.id)
    return true
  })
}

const getSourcesByFeature = (feature: keyof MusicSdkSource): LX.OnlineSource[] => {
  return sdk.sources
    .map(source => source.id)
    .filter(source => Boolean(getSourceSdk(source)?.[feature]))
}

const sortMusicByKeyword = (list: LX.Music.MusicInfo[], keyword: string): LX.Music.MusicInfo[] => {
  return [...list].sort((left, right) => {
    const leftScore = similar(keyword, `${left.name} ${left.singer}`)
    const rightScore = similar(keyword, `${right.name} ${right.singer}`)
    return rightScore - leftScore
  })
}

const sortSongListsByKeyword = (list: OnlineSongListItem[], keyword: string): OnlineSongListItem[] => {
  return [...list].sort((left, right) => similar(keyword, right.name) - similar(keyword, left.name))
}

const normalizeMusicSearchResult = (
  result: RawMusicSearchResult,
  source: LX.OnlineSource,
): OnlineMusicSearchResult => {
  return {
    limit: result.limit,
    list: dedupeById(result.list.map(musicInfo => toNewMusicInfo(musicInfo))),
    maxPage: result.allPage,
    source,
    total: result.total,
  }
}

export const getMusicSearchSources = (): LX.OnlineSource[] => {
  return getSourcesByFeature('musicSearch')
}

export const getSongListSources = (): LX.OnlineSource[] => {
  return getSourcesByFeature('songList')
}

export const getSongListSorts = (source: LX.OnlineSource): Array<{ id: string, name: string }> => {
  return getSourceSdk(source)?.songList?.sortList ?? []
}

export const getLeaderboardSources = (): LX.OnlineSource[] => {
  return getSourcesByFeature('leaderboard')
}

export const searchMusic = async(
  text: string,
  page: number,
  source: OnlineSourceWithAll,
  limit = 30,
): Promise<OnlineMusicSearchResult> => {
  if (source === 'all') {
    const results = await Promise.all(
      getMusicSearchSources().map(async currentSource => {
        try {
          const result = await searchMusic(text, page, currentSource, limit)
          return result
        } catch {
          return {
            limit,
            list: [],
            maxPage: 0,
            source: currentSource,
            total: 0,
          }
        }
      }),
    )
    const maxPage = Math.max(0, ...results.map(result => result.maxPage))
    const total = Math.max(0, ...results.map(result => result.total))
    const resultLimit = Math.max(limit, ...results.map(result => result.limit))
    const list = sortMusicByKeyword(dedupeById(results.flatMap(result => result.list)), text)

    return {
      limit: resultLimit,
      list,
      maxPage,
      source,
      total,
    }
  }

  const searchApi = getSourceSdk(source)?.musicSearch
  if (!searchApi) throw new Error(`music search source not found: ${source}`)

  const result = await searchApi.search(text, page, limit)
  return normalizeMusicSearchResult(result, source)
}

export const searchSongLists = async(
  text: string,
  page: number,
  source: OnlineSourceWithAll,
  limit = 20,
): Promise<OnlineSongListResult> => {
  if (source === 'all') {
    const results = await Promise.all(
      getSongListSources().map(async currentSource => {
        try {
          return await searchSongLists(text, page, currentSource, limit)
        } catch {
          return {
            limit,
            list: [],
            source: currentSource,
            total: 0,
          }
        }
      }),
    )
    const total = Math.max(0, ...results.map(result => result.total))
    const resultLimit = Math.max(limit, ...results.map(result => result.limit))
    const list = sortSongListsByKeyword(results.flatMap(result => result.list), text)

    return {
      limit: resultLimit,
      list,
      source,
      total,
    }
  }

  const songListApi = getSourceSdk(source)?.songList
  if (!songListApi) throw new Error(`song list search source not found: ${source}`)

  const result = await songListApi.search(text, page, limit)
  return {
    limit: result.limit,
    list: result.list,
    source,
    total: result.total,
  }
}

export const getSongListTags = async(source: LX.OnlineSource): Promise<unknown> => {
  const songListApi = getSourceSdk(source)?.songList
  if (!songListApi) throw new Error(`song list source not found: ${source}`)

  return await songListApi.getTags()
}

export const getSongLists = async(
  source: LX.OnlineSource,
  tagId: string,
  sortId: string,
  page: number,
): Promise<OnlineSongListResult> => {
  const songListApi = getSourceSdk(source)?.songList
  if (!songListApi) throw new Error(`song list source not found: ${source}`)

  return await songListApi.getList(sortId, tagId, page)
}

export const getSongListDetail = async(
  source: LX.OnlineSource,
  id: string,
  page: number,
): Promise<OnlineSongListDetailResult> => {
  const songListApi = getSourceSdk(source)?.songList
  if (!songListApi) throw new Error(`song list source not found: ${source}`)

  const result = await songListApi.getListDetail(id, page)
  return {
    ...result,
    list: dedupeById(result.list.map(musicInfo => toNewMusicInfo(musicInfo) as LX.Music.MusicInfoOnline)),
    source,
  }
}

export const getLeaderboardBoards = async(source: LX.OnlineSource): Promise<OnlineLeaderboardBoard> => {
  const leaderboardApi = getSourceSdk(source)?.leaderboard
  if (!leaderboardApi) throw new Error(`leaderboard source not found: ${source}`)

  return await leaderboardApi.getBoards()
}

export const getLeaderboardDetail = async(
  source: LX.OnlineSource,
  id: string,
  page: number,
): Promise<OnlineLeaderboardDetailResult> => {
  const leaderboardApi = getSourceSdk(source)?.leaderboard
  if (!leaderboardApi) throw new Error(`leaderboard source not found: ${source}`)

  const result = await leaderboardApi.getList(id, page)
  return {
    ...result,
    list: dedupeById(result.list.map(musicInfo => toNewMusicInfo(musicInfo) as LX.Music.MusicInfoOnline)),
    source,
  }
}

export const onlineMusicService = {
  getLeaderboardBoards,
  getLeaderboardDetail,
  getLeaderboardSources,
  getMusicSearchSources,
  getSongListDetail,
  getSongListSources,
  getSongListSorts,
  getSongListTags,
  getSongLists,
  searchMusic,
  searchSongLists,
}
