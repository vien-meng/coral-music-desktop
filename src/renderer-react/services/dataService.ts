import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

export const getData = async <Value>(path: string): Promise<Value | null> => {
  if (!isElectronRenderer()) return null;
  return (await ipcClient.invoke(ipcChannels.winMain.getData, path)) as Value | null;
};

export const saveData = (path: string, data: unknown): void => {
  if (!isElectronRenderer()) return;
  ipcClient.send(ipcChannels.winMain.saveData, { path, data });
};

export const dataService = {
  getData,
  saveData,
};
