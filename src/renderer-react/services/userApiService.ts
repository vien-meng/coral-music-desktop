import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

export const getUserApiList = async (): Promise<LX.UserApi.UserApiInfo[]> => {
  if (!isElectronRenderer()) return [];
  return await ipcClient.invoke(ipcChannels.winMain.getUserApiList);
};

export const getUserApiStatus = async (): Promise<LX.UserApi.UserApiStatus> => {
  if (!isElectronRenderer()) return { status: false };
  return await ipcClient.invoke(ipcChannels.winMain.getUserApiStatus);
};

export const importUserApi = async (script: string): Promise<LX.UserApi.ImportUserApi> => {
  if (!isElectronRenderer()) {
    return { apiInfo: null as unknown as LX.UserApi.UserApiInfo, apiList: [] };
  }
  return await ipcClient.invoke(ipcChannels.winMain.importUserApi, script);
};

export const setUserApi = async (id: string): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.winMain.setUserApi, id);
};

export const requestUserApi = async (data: unknown): Promise<unknown> => {
  if (!isElectronRenderer()) throw new Error('User API is unavailable.');
  const result = await ipcClient.invoke(ipcChannels.winMain.requestUserApi, {
    data,
    requestKey: `react_user_api_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  });
  if (
    typeof result === 'object' &&
    result != null &&
    (result as { __coralUserApiCancelled?: boolean }).__coralUserApiCancelled
  ) {
    throw new Error((result as { message?: string }).message ?? 'User API 请求已取消。');
  }
  return result;
};

export const removeUserApis = async (ids: string[]): Promise<LX.UserApi.UserApiInfo[]> => {
  if (!isElectronRenderer() || !ids.length) return [];
  return await ipcClient.invoke(ipcChannels.winMain.removeUserApi, ids);
};

export const setUserApiAllowUpdateAlert = async (id: string, enable: boolean): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.winMain.setUserApiAllowUpdateAlert, {
    enable,
    id,
  });
};

export const userApiService = {
  getUserApiList,
  getUserApiStatus,
  importUserApi,
  requestUserApi,
  removeUserApis,
  setAllowUpdateAlert: setUserApiAllowUpdateAlert,
  setUserApi,
  setUserApiAllowUpdateAlert,
};
