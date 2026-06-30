import { HOTKEY_COMMON, HOTKEY_DESKTOP_LYRIC, HOTKEY_PLAYER } from '@common/hotKey';
import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

const isMacPlatform = /mac/i.test(globalThis.navigator?.platform ?? '');

export const allHotKeys = {
  local: {
    ...HOTKEY_COMMON,
    ...HOTKEY_PLAYER,
  },
  global: {
    ...HOTKEY_COMMON,
    ...HOTKEY_PLAYER,
    ...HOTKEY_DESKTOP_LYRIC,
  },
};

export const setHotKeyEnable = async (enable: boolean): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.winMain.hotKeyEnable, enable);
};

export const setHotKeyConfig = async (action: Coral.HotKeyActions): Promise<void> => {
  if (!isElectronRenderer()) return;
  await ipcClient.invoke(ipcChannels.winMain.hotKeySetConfig, action);
};

export const getHotKeyStatus = async (): Promise<Coral.HotKeyState> => {
  if (!isElectronRenderer()) return new Map();
  return await ipcClient.invoke(ipcChannels.winMain.hotKeyStatus);
};

export const formatHotKeyName = (key: string): string => {
  const name = key
    .replace('arrowleft', '←')
    .replace('arrowright', '→')
    .replace('arrowup', '↑')
    .replace('arrowdown', '↓')
    .replace('mod', isMacPlatform ? 'Command' : 'Ctrl')
    .replace('alt', isMacPlatform ? 'Option' : 'Alt');
  return name
    .split('+')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' + ');
};

export const hotKeyService = {
  allHotKeys,
  formatHotKeyName,
  getHotKeyStatus,
  setHotKeyConfig,
  setHotKeyEnable,
};
