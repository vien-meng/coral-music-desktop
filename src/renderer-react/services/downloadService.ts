import { ipcChannels, type IpcDownloadTaskAction } from '@shared/ipc/contracts'
import { toOldMusicInfo } from '@common/utils/tools'
import { createDownloadTaskList } from './downloadTaskFactory'
import { ipcClient } from './ipc/client'
import { lyricService } from './lyricService'
import { resolvePlayableMusicUrl } from './playerRuntime/musicUrlResolver'

type ElectronShellGlobal = typeof globalThis & {
  require?: (moduleName: 'electron') => {
    shell: {
      showItemInFolder: (fullPath: string) => void
    }
  }
}

export const getDownloadTasks = async(): Promise<LX.Download.ListItem[]> => {
  if (!ipcClient.canUseIpc()) return []
  return await ipcClient.invoke(ipcChannels.winMain.downloadListGet)
}

export const createDownloadTasks = async(
  list: LX.Music.MusicInfoOnline[],
  quality: LX.Quality,
  fileNameFormat: string,
  qualityList: LX.QualityList,
  listId?: string,
): Promise<LX.Download.ListItem[]> => {
  if (!ipcClient.canUseIpc()) return []

  const tasks = createDownloadTaskList(list, quality, fileNameFormat, qualityList, listId)

  if (tasks.length) {
    const action: LX.Download.saveDownloadMusicInfo = {
      list: tasks,
      addMusicLocationType: 'top',
    }
    await ipcClient.invoke(ipcChannels.winMain.downloadListAdd, action)
  }

  return tasks
}

export const removeDownloadTasks = async(ids: string[]): Promise<void> => {
  if (!ipcClient.canUseIpc()) return

  await ipcClient.invoke(ipcChannels.winMain.downloadListRemove, ids)
}

export const clearDownloadTasks = async(): Promise<void> => {
  if (!ipcClient.canUseIpc()) return
  await ipcClient.invoke(ipcChannels.winMain.downloadListClear)
}

export const updateDownloadTasks = async(tasks: LX.Download.ListItem[]): Promise<void> => {
  if (!ipcClient.canUseIpc()) return
  await ipcClient.invoke(ipcChannels.winMain.downloadListUpdate, tasks)
}

export const openDownloadTaskFile = (filePath: string): void => {
  const electronRequire = (globalThis as ElectronShellGlobal).require
  electronRequire?.('electron').shell.showItemInFolder(filePath)
}

interface StartDownloadTaskOptions {
  ensureLyric?: boolean
  isRefresh?: boolean
  isRetry?: boolean
}

interface MusicSdkSource {
  getLyric?: (musicInfo: unknown, isGetLyricx?: boolean) => { promise: Promise<LX.Music.LyricInfo> }
}

type MusicSdk = Record<string, unknown>

const loadMusicSdk = async(): Promise<MusicSdk> => {
  const module = await import('./musicSdk/sdk')
  return module.default as MusicSdk
}

const getSourceSdk = (sdk: MusicSdk, source: LX.OnlineSource): MusicSdkSource | null => {
  const sourceSdk = sdk[source]
  if (typeof sourceSdk !== 'object' || sourceSdk == null || Array.isArray(sourceSdk)) return null
  return sourceSdk as MusicSdkSource
}

const hasLyricContent = (lyricInfo: LX.Music.LyricInfo): boolean => {
  return [lyricInfo.lyric, lyricInfo.lxlyric, lyricInfo.tlyric, lyricInfo.rlyric].some(Boolean)
}

export const ensureDownloadLyricCached = async(task: LX.Download.ListItem): Promise<void> => {
  const musicInfo = task.metadata.musicInfo
  const cachedLyric = await lyricService.getLyricRaw(musicInfo)
  if (hasLyricContent(cachedLyric)) return

  const sdk = await loadMusicSdk()
  const request = getSourceSdk(sdk, musicInfo.source)?.getLyric?.(toOldMusicInfo(musicInfo), true)
  if (!request) return

  const lyricInfo = await request.promise
  if (!hasLyricContent(lyricInfo)) return
  await lyricService.saveLyricRaw(musicInfo, lyricInfo)
}

export const startDownloadTask = async(
  task: LX.Download.ListItem,
  options: StartDownloadTaskOptions = {},
): Promise<LX.Download.ListItem> => {
  if (!ipcClient.canUseIpc()) return task

  if (options.ensureLyric) {
    await ensureDownloadLyricCached(task).catch(() => {})
  }

  const resolved = await resolvePlayableMusicUrl(task, {
    isRefresh: options.isRefresh ?? options.isRetry,
    preferredQuality: task.metadata.quality,
  })
  if (!resolved?.url) throw new Error('无法获取下载地址')

  const params = {
    isRetry: options.isRetry,
    task: {
      ...task,
      metadata: {
        ...task.metadata,
        quality: resolved.quality,
        url: resolved.url,
      },
    },
    url: resolved.url,
  }

  return await ipcClient.invoke(
    options.isRetry ? ipcChannels.winMain.downloadTaskRetry : ipcChannels.winMain.downloadTaskStart,
    params,
  )
}

export const pauseDownloadTask = async(taskId: string): Promise<LX.Download.ListItem | null> => {
  if (!ipcClient.canUseIpc()) return null
  return await ipcClient.invoke(ipcChannels.winMain.downloadTaskPause, taskId)
}

export const onDownloadTaskAction = (
  listener: (action: IpcDownloadTaskAction) => void,
): (() => void) => {
  if (!ipcClient.canUseIpc()) return () => {}
  return ipcClient.on(ipcChannels.winMain.downloadTaskAction, listener)
}
