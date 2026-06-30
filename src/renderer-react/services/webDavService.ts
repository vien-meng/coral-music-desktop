import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';

const AUDIO_EXTS = new Set(['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'opus']);

export const webDavProviders: Array<{ label: string; value: Coral.WebDav.Provider; hint: string }> =
  [
    { label: '百度网盘', value: 'baidu', hint: '填写可用的百度网盘 WebDAV 桥接地址' },
    { label: '迅雷云盘', value: 'xunlei', hint: '填写可用的迅雷云盘 WebDAV 桥接地址' },
    { label: '夸克网盘', value: 'quark', hint: '填写可用的夸克网盘 WebDAV 桥接地址' },
    { label: '阿里云盘', value: 'aliyun', hint: '填写可用的阿里云盘 WebDAV 桥接地址' },
    { label: '115', value: '115', hint: '填写可用的 115 WebDAV 桥接地址' },
    { label: '天意/天翼云盘', value: 'tianyi', hint: '填写可用的天意/天翼云盘 WebDAV 地址' },
    { label: 'UC网盘', value: 'uc', hint: '填写可用的 UC 网盘 WebDAV 桥接地址' },
    { label: '自定义', value: 'custom', hint: '填写任意兼容 WebDAV 的服务地址' },
  ];

export const getWebDavProviderLabel = (provider: Coral.WebDav.Provider): string =>
  webDavProviders.find((item) => item.value === provider)?.label ?? 'WebDAV';

export const getWebDavProviderHint = (provider: Coral.WebDav.Provider): string =>
  webDavProviders.find((item) => item.value === provider)?.hint ?? '';

export const createEmptyWebDavAccount = (): Coral.WebDav.Account => {
  const now = Date.now();
  return {
    createdAt: now,
    enabled: true,
    id: '',
    name: '',
    password: '',
    provider: 'custom',
    remark: '',
    rootPath: '/',
    updatedAt: now,
    url: '',
    username: '',
  };
};

export const listWebDavAccounts = async (): Promise<Coral.WebDav.SafeAccount[]> => {
  if (!ipcClient.canUseIpc()) return [];
  return ipcClient.invoke(ipcChannels.winMain.webDavAccountList);
};

export const saveWebDavAccount = async (
  account: Coral.WebDav.Account,
): Promise<Coral.WebDav.SafeAccount[]> => {
  if (!ipcClient.canUseIpc()) return [];
  return ipcClient.invoke(ipcChannels.winMain.webDavAccountSave, account);
};

export const removeWebDavAccount = async (
  accountId: string,
): Promise<Coral.WebDav.SafeAccount[]> => {
  if (!ipcClient.canUseIpc()) return [];
  return ipcClient.invoke(ipcChannels.winMain.webDavAccountRemove, accountId);
};

export const testWebDavAccount = async (
  account: Coral.WebDav.Account,
): Promise<Coral.WebDav.TestResult> => {
  if (!ipcClient.canUseIpc()) return { ok: false, message: '当前环境不支持 IPC' };
  return ipcClient.invoke(ipcChannels.winMain.webDavAccountTest, account);
};

export const listWebDavDir = async (
  params: Coral.WebDav.ListDirParams,
): Promise<Coral.WebDav.ListDirResult> => {
  if (!ipcClient.canUseIpc()) throw new Error('当前环境不支持 IPC');
  return ipcClient.invoke(ipcChannels.winMain.webDavListDir, params);
};

export const createWebDavStreamUrl = async (
  params: Coral.WebDav.StreamUrlParams,
): Promise<Coral.WebDav.StreamUrlResult> => {
  if (!ipcClient.canUseIpc()) throw new Error('当前环境不支持 IPC');
  return ipcClient.invoke(ipcChannels.winMain.webDavCreateStreamUrl, params);
};

export const isWebDavAudioFile = (item: Coral.WebDav.FileItem): boolean =>
  !item.isDirectory && AUDIO_EXTS.has(item.ext);

export const toWebDavMusicInfo = (
  item: Coral.WebDav.FileItem,
  account?: Coral.WebDav.SafeAccount | null,
): Coral.Music.MusicInfoWebDav => {
  const name = item.name.replace(/\.[^.]+$/, '');
  return {
    id: `webdav_${item.accountId}_${encodeURIComponent(item.href)}`,
    interval: null,
    meta: {
      accountId: item.accountId,
      albumName: getWebDavProviderLabel(account?.provider ?? item.provider),
      contentLength: item.contentLength,
      contentType: item.contentType,
      ext: item.ext,
      href: item.href,
      lastModified: item.lastModified,
      provider: account?.provider ?? item.provider,
      songId: item.href,
    },
    name,
    singer: account?.name || getWebDavProviderLabel(account?.provider ?? item.provider),
    source: 'webdav',
  };
};
