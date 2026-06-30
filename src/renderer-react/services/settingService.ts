import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

export const getAppSetting = async (): Promise<Coral.AppSetting | null> => {
  if (!isElectronRenderer()) return null;
  return await ipcClient.invoke(ipcChannels.common.getAppSetting);
};

export const updateAppSetting = async (setting: Partial<Coral.AppSetting>): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.common.setAppSetting, setting);
};

export const onSettingChanged = (
  listener: (setting: Partial<Coral.AppSetting>) => void,
): (() => void) => {
  if (!isElectronRenderer()) return () => {};
  return ipcClient.on(ipcChannels.winMain.onConfigChange, listener);
};

export const settingService = {
  getAppSetting,
  onSettingChanged,
  updateAppSetting,
};
