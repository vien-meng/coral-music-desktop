import { ipcChannels } from '@shared/ipc/contracts'
import { createDownloadTaskList } from './downloadTaskFactory'
import { ipcClient } from './ipc/client'

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

export const openDownloadTaskFile = (filePath: string): void => {
  const electronRequire = (globalThis as ElectronShellGlobal).require
  electronRequire?.('electron').shell.showItemInFolder(filePath)
}

export const startDownloadTask = async(taskId: string): Promise<void> => {
  console.warn('[downloadService] download runtime is not migrated yet, skip startTask', taskId)
}

export const pauseDownloadTask = async(taskId: string): Promise<void> => {
  console.warn('[downloadService] download runtime is not migrated yet, skip pauseTask', taskId)
}
