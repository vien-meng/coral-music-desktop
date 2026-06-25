import { ipcChannels } from '@shared/ipc/contracts'
import { ipcClient } from './ipc/client'

const emptyLyricInfo: LX.Music.LyricInfo = {
  lyric: '',
  lxlyric: '',
  rlyric: '',
  tlyric: '',
}

const normalizeLyricInfo = (lyricInfo: LX.Music.LyricInfo | null | undefined): LX.Music.LyricInfo => {
  return {
    lyric: lyricInfo?.lyric ?? '',
    lxlyric: lyricInfo?.lxlyric ?? '',
    rlyric: lyricInfo?.rlyric ?? '',
    tlyric: lyricInfo?.tlyric ?? '',
  }
}

export const getLyricRaw = async(musicInfo: LX.Music.MusicInfo): Promise<LX.Music.LyricInfo> => {
  if (!ipcClient.canUseIpc()) return emptyLyricInfo
  return normalizeLyricInfo(await ipcClient.invoke(ipcChannels.winMain.getLyricRaw, musicInfo.id))
}

export const getLyricEdited = async(musicInfo: LX.Music.MusicInfo): Promise<LX.Music.LyricInfo> => {
  if (!ipcClient.canUseIpc()) return emptyLyricInfo
  return normalizeLyricInfo(await ipcClient.invoke(ipcChannels.winMain.getLyricEdited, musicInfo.id))
}

export const saveLyricEdited = async(
  musicInfo: LX.Music.MusicInfo,
  lyricInfo: LX.Music.LyricInfo,
): Promise<void> => {
  if (!ipcClient.canUseIpc()) return
  await ipcClient.invoke(ipcChannels.winMain.saveLyricEdited, {
    id: musicInfo.id,
    lyrics: normalizeLyricInfo(lyricInfo),
  })
}

export const saveLyricRaw = async(
  musicInfo: LX.Music.MusicInfo,
  lyricInfo: LX.Music.LyricInfo,
): Promise<void> => {
  if (!ipcClient.canUseIpc()) return
  await ipcClient.invoke(ipcChannels.winMain.saveLyricRaw, {
    id: musicInfo.id,
    lyrics: normalizeLyricInfo(lyricInfo),
  })
}

export const removeLyricEdited = async(musicInfo: LX.Music.MusicInfo): Promise<void> => {
  if (!ipcClient.canUseIpc()) return
  await ipcClient.invoke(ipcChannels.winMain.removeLyricEdited, musicInfo.id)
}

export const lyricService = {
  getLyricEdited,
  getLyricRaw,
  removeLyricEdited,
  saveLyricEdited,
  saveLyricRaw,
}
