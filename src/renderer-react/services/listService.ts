import { LIST_IDS } from '@common/constants'
import { filterMusicList, fixNewMusicInfoQuality, toNewMusicInfo } from '@common/utils/tools'
import { ipcChannels } from '@shared/ipc/contracts'
import { ipcClient } from './ipc/client'
import { isElectronRenderer } from './appService'
import { readLxConfigFile, saveLxConfigFile } from './nodeBridgeService'

interface PlayListPartV1 {
  type: 'playListPart'
  data: ImportedPlayListPart
}

interface PlayListPartV2 {
  type: 'playListPart_v2'
  data: ImportedPlayListPart
}

interface ImportedPlayListPart {
  id: string
  list: LX.Music.MusicInfo[]
  locationUpdateTime?: number | null
  name: string
  source?: LX.OnlineSource
  sourceListId?: string
}

type PlayListPartConfig = PlayListPartV1 | PlayListPartV2

export const getUserLists = async(): Promise<LX.List.UserListInfo[]> => {
  if (!isElectronRenderer()) return []
  return await ipcClient.invoke(ipcChannels.player.listGet)
}

export const createUserLists = async(position: number, listInfos: LX.List.UserListInfo[]): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listAdd, {
    listInfos,
    position,
  })
}

export const removeUserLists = async(ids: string[]): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listRemove, ids)
}

export const updateUserLists = async(listInfos: LX.List.UserListInfo[]): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listUpdate, listInfos)
}

export const updateUserListsPosition = async(position: number, ids: string[]): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listUpdatePosition, {
    ids,
    position,
  })
}

export const getListMusics = async(listId: string): Promise<LX.Music.MusicInfo[]> => {
  if (!isElectronRenderer()) return []
  return await ipcClient.invoke(ipcChannels.player.listMusicGet, listId)
}

export const addListMusics = async(
  listId: string,
  musicInfos: LX.Music.MusicInfo[],
  addMusicLocationType: LX.AddMusicLocationType,
): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listMusicAdd, {
    addMusicLocationType,
    id: listId,
    musicInfos,
  })
}

export const removeListMusics = async(listId: string, ids: string[]): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listMusicRemove, {
    ids,
    listId,
  })
}

export const moveListMusics = async(
  fromId: string,
  toId: string,
  musicInfos: LX.Music.MusicInfo[],
  addMusicLocationType: LX.AddMusicLocationType,
): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listMusicMove, {
    addMusicLocationType,
    fromId,
    musicInfos,
    toId,
  })
}

export const updateListMusicsPosition = async(
  listId: string,
  position: number,
  ids: string[],
): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listMusicUpdatePosition, {
    ids,
    listId,
    position,
  })
}

export const clearListMusics = async(ids: string[]): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listMusicClear, ids)
}

export const overwriteListFull = async(data: LX.List.ListActionDataOverwrite): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.player.listDataOverwrite, data)
}

const normalizeImportedListPart = (configData: unknown): ImportedPlayListPart => {
  const config = configData as PlayListPartConfig
  if (config.type !== 'playListPart' && config.type !== 'playListPart_v2') {
    throw new Error('不支持的列表文件')
  }

  if (!config.data?.id || !config.data.name || !Array.isArray(config.data.list)) {
    throw new Error('列表文件内容不完整')
  }

  const list = config.type === 'playListPart'
    ? filterMusicList(config.data.list.map(musicInfo => toNewMusicInfo(musicInfo))).map(musicInfo => fixNewMusicInfoQuality(musicInfo))
    : filterMusicList(config.data.list).map(musicInfo => fixNewMusicInfoQuality(musicInfo))

  return {
    id: config.data.id,
    list,
    locationUpdateTime: config.data.locationUpdateTime ?? null,
    name: config.data.name,
    source: config.data.source,
    sourceListId: config.data.sourceListId,
  }
}

export const exportListPart = async(
  filePath: string,
  listInfo: LX.List.UserListInfo,
  musicInfos: LX.Music.MusicInfo[],
): Promise<void> => {
  if (!isElectronRenderer()) return
  await saveLxConfigFile(filePath, {
    data: {
      ...listInfo,
      list: musicInfos,
    },
    type: 'playListPart_v2',
  })
}

export const importListPartAsUserList = async(
  filePath: string,
  userLists: LX.List.UserListInfo[],
  position: number,
  addMusicLocationType: LX.AddMusicLocationType,
): Promise<LX.List.UserListInfo | null> => {
  if (!isElectronRenderer()) return null

  const listPart = normalizeImportedListPart(await readLxConfigFile(filePath))
  const usedIds = new Set([
    LIST_IDS.DEFAULT,
    LIST_IDS.LOVE,
    ...userLists.map(list => list.id),
  ])
  const listId = usedIds.has(listPart.id) ? `${listPart.id}__${Date.now()}` : listPart.id
  const listInfo: LX.List.UserListInfo = {
    id: listId,
    locationUpdateTime: listPart.locationUpdateTime ?? null,
    name: listPart.name,
    source: listPart.source,
    sourceListId: listPart.sourceListId,
  }

  await createUserLists(position, [listInfo])
  await addListMusics(listInfo.id, listPart.list, addMusicLocationType)

  return listInfo
}

export const listService = {
  addListMusics,
  clearListMusics,
  createUserLists,
  exportListPart,
  getListMusics,
  getUserLists,
  importListPartAsUserList,
  moveListMusics,
  overwriteListFull,
  removeListMusics,
  removeUserLists,
  updateListMusicsPosition,
  updateUserListsPosition,
  updateUserLists,
}
