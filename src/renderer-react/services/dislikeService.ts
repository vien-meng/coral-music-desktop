import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

export const getDislikeMusicInfos = async (): Promise<LX.Dislike.DislikeInfo | null> => {
  if (!isElectronRenderer()) return null;
  return await ipcClient.invoke(ipcChannels.dislike.getDislikeMusicInfos);
};

export const addDislikeMusicInfos = async (infos: LX.Dislike.DislikeMusicInfo[]): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.dislike.addDislikeMusicInfos, infos);
};

export const overwriteDislikeMusicInfos = async (rules: LX.Dislike.DislikeRules): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.dislike.overwriteDislikeMusicInfos, rules);
};

export const clearDislikeMusicInfos = async (): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.dislike.clearDislikeMusicInfos);
};

export const onAddDislikeMusicInfos = (
  listener: (infos: LX.Dislike.DislikeMusicInfo[]) => void,
): (() => void) => {
  if (!isElectronRenderer()) return () => {};
  return ipcClient.on(ipcChannels.dislike.addDislikeMusicInfos, listener);
};

export const onOverwriteDislikeMusicInfos = (
  listener: (rules: LX.Dislike.DislikeRules) => void,
): (() => void) => {
  if (!isElectronRenderer()) return () => {};
  return ipcClient.on(ipcChannels.dislike.overwriteDislikeMusicInfos, listener);
};

export const onClearDislikeMusicInfos = (listener: () => void): (() => void) => {
  if (!isElectronRenderer()) return () => {};
  return ipcClient.on(ipcChannels.dislike.clearDislikeMusicInfos, listener);
};

export const dislikeService = {
  addDislikeMusicInfos,
  clearDislikeMusicInfos,
  getDislikeMusicInfos,
  onAddDislikeMusicInfos,
  onClearDislikeMusicInfos,
  onOverwriteDislikeMusicInfos,
  overwriteDislikeMusicInfos,
};
