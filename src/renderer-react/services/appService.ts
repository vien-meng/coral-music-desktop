import { ipcChannels } from '@shared/ipc/contracts'
import { ipcClient } from './ipc/client'

export const isElectronRenderer = (): boolean => {
  return ipcClient.canUseIpc()
}

export const getEnvParams = async(): Promise<LX.EnvParams | null> => {
  if (!isElectronRenderer()) return null
  return await ipcClient.invoke(ipcChannels.common.getEnvParams)
}

export const clearEnvParamsDeeplink = (): void => {
  if (!isElectronRenderer()) return
  ipcClient.send(ipcChannels.common.clearEnvParamsDeeplink)
}

export const sendInited = (): void => {
  if (!isElectronRenderer()) return
  ipcClient.send(ipcChannels.winMain.inited)
}

export const onDeeplink = (listener: (link: string) => void): (() => void) => {
  if (!isElectronRenderer()) return () => {}
  return ipcClient.on(ipcChannels.common.deeplink, listener)
}

export const showSelectDialog = async(
  options: Electron.OpenDialogOptions,
): Promise<Electron.OpenDialogReturnValue> => {
  if (!isElectronRenderer()) return { canceled: true, filePaths: [] }
  return await ipcClient.invoke(ipcChannels.winMain.showSelectDialog, options)
}

export const showSaveDialog = async(
  options: Electron.SaveDialogOptions,
): Promise<Electron.SaveDialogReturnValue> => {
  if (!isElectronRenderer()) return { canceled: true, filePath: '' }
  return await ipcClient.invoke(ipcChannels.winMain.showSaveDialog, options)
}

type ElectronShellGlobal = typeof globalThis & {
  require?: (moduleName: 'electron') => {
    shell: {
      openExternal: (url: string) => Promise<void>
    }
  }
}

export const openUrl = async(url: string): Promise<void> => {
  if (!/^https?:\/\//.test(url)) return
  const electronRequire = (globalThis as ElectronShellGlobal).require
  if (!electronRequire) return
  await electronRequire('electron').shell.openExternal(url)
}

export const minWindow = async(): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.winMain.min)
}

export const closeWindow = async(): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.winMain.close)
}

export const maximizeWindow = async(): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.winMain.max)
}

export const setFullscreen = async(isFullscreen: boolean): Promise<boolean> => {
  if (!isElectronRenderer()) return false
  return await ipcClient.invoke(ipcChannels.winMain.fullscreen, isFullscreen)
}

export const toggleFullscreen = setFullscreen

export const appService = {
  clearEnvParamsDeeplink,
  closeWindow,
  getEnvParams,
  isElectronRenderer,
  maximizeWindow,
  minWindow,
  onDeeplink,
  openUrl,
  sendInited,
  setFullscreen,
  showSaveDialog,
  showSelectDialog,
  toggleFullscreen,
}
