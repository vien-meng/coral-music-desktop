import path from 'node:path'
import fs from 'node:fs/promises'
import { DOWNLOAD_STATUS } from '@common/constants'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { checkAndCreateDir, checkPath, getFileStats } from '@common/utils/nodejs'
import { createDownload, type DownloaderType } from '@common/utils/download'
import iconv from 'iconv-lite'
import { setMeta, type MusicMeta } from '@common/utils/musicMeta'
import { sendEvent } from './main'

interface StartParams {
  task: LX.Download.ListItem
  url: string
  isRetry?: boolean
}

const activeDownloads = new Map<string, DownloaderType>()

const cloneTask = (task: LX.Download.ListItem): LX.Download.ListItem => ({
  ...task,
  metadata: {
    ...task.metadata,
  },
})

const saveTask = async(task: LX.Download.ListItem): Promise<void> => {
  await global.lx.worker.dbService.downloadInfoUpdate([task])
}

const getDownloadList = async(): Promise<LX.Download.ListItem[]> => {
  return await global.lx.worker.dbService.getDownloadList()
}

const emitAction = (task: LX.Download.ListItem, action: LX.Download.DownloadTaskActions) => {
  sendEvent(WIN_MAIN_RENDERER_EVENT_NAME.download_task_action, {
    action,
    task,
    taskId: task.id,
  })
}

const setTaskStatus = (
  task: LX.Download.ListItem,
  status: LX.Download.DownloadTaskStatus,
  statusText: string,
): LX.Download.ListItem => {
  task.status = status
  task.statusText = statusText
  task.isComplate = status === DOWNLOAD_STATUS.COMPLETED
  if (status !== DOWNLOAD_STATUS.RUN) task.speed = ''
  return task
}

const resolveTaskFilePath = async(task: LX.Download.ListItem): Promise<string> => {
  const savePath = global.lx.appSetting['download.savePath']
  const fileName = task.metadata.fileName || `${task.metadata.musicInfo.name}.${task.metadata.ext}`
  const filePath = path.join(savePath, fileName)

  if (!await checkAndCreateDir(savePath)) {
    throw new Error(`download save path is unavailable: ${savePath}`)
  }

  return filePath
}

const completeExistingFile = async(task: LX.Download.ListItem, filePath: string): Promise<LX.Download.ListItem | null> => {
  if (!global.lx.appSetting['download.skipExistFile']) return null
  if (!await checkPath(filePath)) return null

  const stats = await getFileStats(filePath)
  if (!stats?.size) return null
  task.metadata.filePath = filePath
  task.downloaded = stats?.size ?? task.downloaded
  task.total = stats?.size ?? task.total
  task.progress = 100
  task.writeQueue = 0
  setTaskStatus(task, DOWNLOAD_STATUS.COMPLETED, '文件已存在')
  saveTask(task)
  emitAction(task, { action: 'complete' })
  runCompleteSideEffects(task)
  return task
}

const markTaskError = (task: LX.Download.ListItem, error: unknown): LX.Download.ListItem => {
  const message = error instanceof Error ? error.message : String(error)
  setTaskStatus(task, DOWNLOAD_STATUS.ERROR, message || '下载失败')
  saveTask(task)
  emitAction(task, {
    action: 'error',
    data: { message: task.statusText },
  })
  return task
}

const encodeLyricText = (text: string): string | Buffer => {
  return global.lx.appSetting['download.lrcFormat'] === 'gbk'
    ? iconv.encode(text, 'gb18030')
    : text
}

const writeLyricFile = async(filePath: string, suffix: string, content?: string | null): Promise<void> => {
  if (!content) return
  const parsed = path.parse(filePath)
  await fs.writeFile(
    path.join(parsed.dir, `${parsed.name}${suffix}`),
    encodeLyricText(content),
  )
}

const writeDownloadLyricFiles = async(task: LX.Download.ListItem): Promise<void> => {
  if (!global.lx.appSetting['download.isDownloadLrc']) return
  if (!task.metadata.filePath) return

  const lyricInfo = await global.lx.worker.dbService.getPlayerLyric(task.metadata.musicInfo.id)
  await Promise.all([
    writeLyricFile(task.metadata.filePath, '.lrc', lyricInfo.lyric),
    global.lx.appSetting['download.isDownloadLxLrc']
      ? writeLyricFile(task.metadata.filePath, '.lx.lrc', lyricInfo.lxlyric)
      : Promise.resolve(),
    global.lx.appSetting['download.isDownloadTLrc']
      ? writeLyricFile(task.metadata.filePath, '.tlrc', lyricInfo.tlyric)
      : Promise.resolve(),
    global.lx.appSetting['download.isDownloadRLrc']
      ? writeLyricFile(task.metadata.filePath, '.rlrc', lyricInfo.rlyric)
      : Promise.resolve(),
  ])
}

const buildEmbeddedLyric = (lyricInfo: LX.Player.LyricInfo): string | null => {
  const lyrics = [
    global.lx.appSetting['download.isEmbedLyric'] ? lyricInfo.lyric : '',
    global.lx.appSetting['download.isEmbedLyricLx'] ? lyricInfo.lxlyric : '',
    global.lx.appSetting['download.isEmbedLyricT'] ? lyricInfo.tlyric : '',
    global.lx.appSetting['download.isEmbedLyricR'] ? lyricInfo.rlyric : '',
  ].filter(Boolean)

  return lyrics.length ? lyrics.join('\n') : null
}

const writeDownloadMetadata = async(task: LX.Download.ListItem): Promise<void> => {
  if (!task.metadata.filePath) return
  if (!/\.flac$|\.mp3$/i.test(task.metadata.filePath)) return

  const shouldEmbedLyric = global.lx.appSetting['download.isEmbedLyric'] ||
    global.lx.appSetting['download.isEmbedLyricLx'] ||
    global.lx.appSetting['download.isEmbedLyricT'] ||
    global.lx.appSetting['download.isEmbedLyricR']
  const shouldEmbedPic = global.lx.appSetting['download.isEmbedPic']
  if (!shouldEmbedLyric && !shouldEmbedPic) return

  const lyricInfo = shouldEmbedLyric
    ? await global.lx.worker.dbService.getPlayerLyric(task.metadata.musicInfo.id)
    : null
  const meta: MusicMeta = {
    APIC: shouldEmbedPic ? task.metadata.musicInfo.meta.picUrl ?? null : null,
    album: task.metadata.musicInfo.meta.albumName ?? null,
    artist: task.metadata.musicInfo.singer || null,
    lyrics: lyricInfo ? buildEmbeddedLyric(lyricInfo) : null,
    title: task.metadata.musicInfo.name,
  }

  setMeta(task.metadata.filePath, meta)
}

const verifyCompletedFile = async(task: LX.Download.ListItem): Promise<void> => {
  const stats = await getFileStats(task.metadata.filePath)
  if (!stats?.size) throw new Error('下载完成文件不存在或为空')
  task.downloaded = stats.size
  task.total = Math.max(task.total, stats.size)
}

const runCompleteSideEffects = async(task: LX.Download.ListItem): Promise<void> => {
  try {
    await writeDownloadLyricFiles(task)
    await writeDownloadMetadata(task)
  } catch (error) {
    console.error('[downloadRuntime] failed to run download side effects', error)
    emitAction(task, { action: 'statusText', data: '下载完成，附加信息写入失败' })
  }
}

const completeDownloadTask = async(task: LX.Download.ListItem, statusText: string): Promise<void> => {
  try {
    await verifyCompletedFile(task)
    task.progress = 100
    task.speed = ''
    task.writeQueue = 0
    setTaskStatus(task, DOWNLOAD_STATUS.COMPLETED, statusText)
    await saveTask(task)
    emitAction(task, { action: 'complete' })
    await runCompleteSideEffects(task)
  } catch (error) {
    markTaskError(task, error)
  }
}

export const startDownloadTask = async({ task: rawTask, url, isRetry = false }: StartParams): Promise<LX.Download.ListItem> => {
  const task = cloneTask(rawTask)
  const previous = activeDownloads.get(task.id)
  if (previous) {
    await previous.stop().catch(() => {})
    activeDownloads.delete(task.id)
  }

  try {
    const filePath = await resolveTaskFilePath(task)
    const existingTask = await completeExistingFile(task, filePath)
    if (existingTask) return existingTask

    task.metadata.url = url
    task.metadata.filePath = filePath
    task.speed = ''
    task.writeQueue = 0
    if (isRetry || task.status === DOWNLOAD_STATUS.ERROR) {
      task.downloaded = 0
      task.total = 0
      task.progress = 0
    }
    setTaskStatus(task, DOWNLOAD_STATUS.RUN, '下载中')
    await saveTask(task)
    emitAction(task, { action: 'start' })

    const downloader = createDownload({
      url,
      path: path.dirname(filePath),
      fileName: path.basename(filePath),
      forceResume: true,
      onCompleted: () => {
        activeDownloads.delete(task.id)
        completeDownloadTask(task, '下载完成')
      },
      onError: (error) => {
        activeDownloads.delete(task.id)
        const message = error instanceof Error ? error.message : String(error)
        if (/ENOTFOUND|ECONNRESET|ETIMEDOUT|403|404|416|aborted/i.test(message)) {
          setTaskStatus(task, DOWNLOAD_STATUS.ERROR, '下载地址失效')
          saveTask(task)
          emitAction(task, { action: 'refreshUrl' })
          return
        }
        markTaskError(task, error)
      },
      onFail: (response) => {
        activeDownloads.delete(task.id)
        if (response.statusCode === 403 || response.statusCode === 404 || response.statusCode === 416) {
          setTaskStatus(task, DOWNLOAD_STATUS.ERROR, '下载地址失效')
          saveTask(task)
          emitAction(task, { action: 'refreshUrl' })
          return
        }
        markTaskError(task, new Error(response.statusMessage || `HTTP ${response.statusCode ?? 'error'}`))
      },
      onProgress: (progress) => {
        task.downloaded = progress.downloaded
        task.total = progress.total
        task.progress = progress.progress
        task.speed = progress.speed
        task.writeQueue = progress.writeQueue
        saveTask(task)
        emitAction(task, { action: 'progress', data: progress })
      },
      onStop: () => {
        activeDownloads.delete(task.id)
        if (task.status === DOWNLOAD_STATUS.COMPLETED || task.status === DOWNLOAD_STATUS.ERROR) return
        setTaskStatus(task, DOWNLOAD_STATUS.PAUSE, '已暂停')
        saveTask(task)
        emitAction(task, { action: 'statusText', data: task.statusText })
      },
    })

    activeDownloads.set(task.id, downloader)
    return task
  } catch (error) {
    return markTaskError(task, error)
  }
}

export const pauseDownloadTask = async(taskId: string): Promise<LX.Download.ListItem | null> => {
  const downloader = activeDownloads.get(taskId)
  if (!downloader) {
    const task = (await getDownloadList()).find(item => item.id === taskId)
    if (!task) return null
    if (task.status !== DOWNLOAD_STATUS.COMPLETED) {
      setTaskStatus(task, DOWNLOAD_STATUS.PAUSE, '已暂停')
      await saveTask(task)
      emitAction(task, { action: 'statusText', data: task.statusText })
    }
    return task
  }

  await downloader.stop()
  activeDownloads.delete(taskId)
  return (await getDownloadList()).find(item => item.id === taskId) ?? null
}

export const removeDownloadTasks = async(ids: string[]): Promise<void> => {
  await Promise.all(ids.map(async(id) => {
    const downloader = activeDownloads.get(id)
    if (!downloader) return
    await downloader.stop().catch(() => {})
    activeDownloads.delete(id)
  }))
}

export const clearDownloadTasks = async(): Promise<void> => {
  await removeDownloadTasks(Array.from(activeDownloads.keys()))
}
