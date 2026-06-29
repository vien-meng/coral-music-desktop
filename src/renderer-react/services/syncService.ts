import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

export const sendSyncAction = async (action: LX.Sync.SyncServiceActions): Promise<unknown> => {
  if (!isElectronRenderer()) return null;
  return await ipcClient.invoke(ipcChannels.winMain.syncAction, action);
};

export const getSyncServerDevices = async (): Promise<LX.Sync.ServerDevices | null> => {
  if (!isElectronRenderer()) return null;
  return await ipcClient.invoke(ipcChannels.winMain.syncGetServerDevices);
};

export const removeSyncServerDevice = async (clientId: string): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.winMain.syncRemoveServerDevice, clientId);
};

export const onSyncAction = (
  listener: (action: LX.Sync.SyncMainWindowActions) => void,
): (() => void) => {
  if (!isElectronRenderer()) return () => {};
  return ipcClient.on(ipcChannels.winMain.syncAction, listener);
};

export const syncService = {
  getSyncServerDevices,
  onSyncAction,
  removeSyncServerDevice,
  sendSyncAction,
};
