import { ipcChannels } from '@shared/ipc/contracts'
import { ipcClient } from './ipc/client'
import { isElectronRenderer } from './appService'

export const getUserApiList = async(): Promise<LX.UserApi.UserApiInfo[]> => {
  if (!isElectronRenderer()) return []
  return await ipcClient.invoke(ipcChannels.winMain.getUserApiList)
}

export const getUserApiStatus = async(): Promise<LX.UserApi.UserApiStatus> => {
  if (!isElectronRenderer()) return { status: false }
  return await ipcClient.invoke(ipcChannels.winMain.getUserApiStatus)
}

export const importUserApi = async(
  script: string,
): Promise<LX.UserApi.ImportUserApi> => {
  if (!isElectronRenderer()) { return { apiInfo: null as unknown as LX.UserApi.UserApiInfo, apiList: [] } }
  return await ipcClient.invoke(ipcChannels.winMain.importUserApi, script)
}

export const setUserApi = async(id: string): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.winMain.setUserApi, id)
}

export const removeUserApis = async(
  ids: string[],
): Promise<LX.UserApi.UserApiInfo[]> => {
  if (!isElectronRenderer() || !ids.length) return []
  return await ipcClient.invoke(ipcChannels.winMain.removeUserApi, ids)
}

export const setUserApiAllowUpdateAlert = async(
  id: string,
  enable: boolean,
): Promise<void> => {
  if (!isElectronRenderer()) return
  await ipcClient.invoke(ipcChannels.winMain.setUserApiAllowUpdateAlert, {
    enable,
    id,
  })
}

export const userApiService = {
  getUserApiList,
  getUserApiStatus,
  importUserApi,
  removeUserApis,
  setAllowUpdateAlert: setUserApiAllowUpdateAlert,
  setUserApi,
  setUserApiAllowUpdateAlert,
}
