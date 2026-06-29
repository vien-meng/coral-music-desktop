import { LIST_IDS } from '@common/constants';
import { filterFileName } from '@common/utils/common';
import { filterMusicList, fixNewMusicInfoQuality, toNewMusicInfo } from '@common/utils/tools';
import migrateSetting from '@common/utils/migrateSetting';
import { message } from 'antd';
import { listService } from './listService';
import { settingService } from './settingService';
import { cacheService } from './cacheService';
import { isElectronRenderer } from './appService';
import { joinPath, readLxConfigFile, saveLxConfigFile, saveStrToFile } from './nodeBridgeService';

interface BackupListInfo {
  id: string;
  list: LX.Music.MusicInfo[];
  name?: string;
  source?: string;
  sourceListId?: string;
  locationUpdateTime?: string | null;
}

interface AllDataV2 {
  type: 'allData_v2';
  setting: Partial<LX.AppSetting>;
  playList: BackupListInfo[];
}

interface AllDataV1 {
  type: 'allData';
  defaultList?: { list: LX.Music.MusicInfo[] };
  playList: BackupListInfo[];
  setting: Record<string, unknown>;
}

interface SettingV2 {
  type: 'setting_v2';
  data: Partial<LX.AppSetting>;
}

interface SettingV1 {
  type: 'setting';
  data: Record<string, unknown>;
}

interface PlayListV2 {
  type: 'playList_v2';
  data: BackupListInfo[];
}

interface PlayListV1 {
  type: 'playList';
  data: BackupListInfo[];
}

interface DefaultListV1 {
  type: 'defautlList';
  data: { list: LX.Music.MusicInfo[] };
}

type ConfigFile =
  AllDataV2 | AllDataV1 | SettingV2 | SettingV1 | PlayListV2 | PlayListV1 | DefaultListV1;

const getAllLists = async (): Promise<BackupListInfo[]> => {
  const lists: BackupListInfo[] = [];
  lists.push({ id: LIST_IDS.DEFAULT, list: await listService.getListMusics(LIST_IDS.DEFAULT) });
  lists.push({ id: LIST_IDS.LOVE, list: await listService.getListMusics(LIST_IDS.LOVE) });
  const userLists = await listService.getUserLists();
  for (const list of userLists) {
    lists.push({ ...list, list: await listService.getListMusics(list.id) });
  }
  return lists;
};

const importOldListData = async (lists: BackupListInfo[]): Promise<void> => {
  const allLists = await getAllLists();
  for (const list of lists) {
    const targetList = allLists.find((l) => l.id === list.id);
    if (targetList) {
      targetList.list = filterMusicList(list.list.map((m) => toNewMusicInfo(m)));
    } else {
      allLists.push({
        name: list.name,
        id: list.id,
        list: filterMusicList(list.list.map((m) => toNewMusicInfo(m))),
        source: list.source,
        sourceListId: list.sourceListId,
        locationUpdateTime: list.locationUpdateTime ?? null,
      });
    }
  }
  const defaultList = allLists.shift()!.list;
  const loveList = allLists.shift()!.list;
  await listService.overwriteListFull({ defaultList, loveList, userList: allLists });
};

const importNewListData = async (lists: BackupListInfo[]): Promise<void> => {
  const allLists = await getAllLists();
  for (const list of lists) {
    const targetList = allLists.find((l) => l.id === list.id);
    if (targetList) {
      targetList.list = filterMusicList(list.list).map((m) => fixNewMusicInfoQuality(m));
    } else {
      allLists.push({
        name: list.name,
        id: list.id,
        list: filterMusicList(list.list).map((m) => fixNewMusicInfoQuality(m)),
        source: list.source,
        sourceListId: list.sourceListId,
        locationUpdateTime: list.locationUpdateTime ?? null,
      });
    }
  }
  const defaultList = allLists.shift()!.list;
  const loveList = allLists.shift()!.list;
  await listService.overwriteListFull({ defaultList, loveList, userList: allLists });
};

const importOldSettingData = (setting: Record<string, unknown>): void => {
  const migrated = migrateSetting(setting);
  migrated['common.isAgreePact'] = false;
  settingService.updateAppSetting(migrated);
};

const importNewSettingData = (setting: Partial<LX.AppSetting>): void => {
  setting['common.isAgreePact'] = false;
  settingService.updateAppSetting(setting);
};

export const importAllData = async (path: string): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    const allData = (await readLxConfigFile(path)) as ConfigFile;
    if (!allData) return;

    switch (allData.type) {
      case 'allData':
        if (allData.defaultList) {
          await listService.clearListMusics([LIST_IDS.DEFAULT]);
          await listService.addListMusics(
            LIST_IDS.DEFAULT,
            filterMusicList(allData.defaultList.list.map((m) => toNewMusicInfo(m))),
            'top',
          );
        } else {
          await importOldListData(allData.playList);
        }
        importOldSettingData(allData.setting);
        break;
      case 'allData_v2':
        await importNewListData(allData.playList);
        importNewSettingData(allData.setting);
        break;
      default:
        break;
    }
  } catch (err) {
    message.error(`导入失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

export const exportAllData = async (path: string, appSetting: LX.AppSetting): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    const allData: AllDataV2 = {
      type: 'allData_v2',
      setting: { ...appSetting },
      playList: await getAllLists(),
    };
    await saveLxConfigFile(path, allData);
  } catch (err) {
    message.error(`导出失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

export const importSetting = async (path: string): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    const settingData = (await readLxConfigFile(path)) as ConfigFile;
    if (!settingData) return;

    switch (settingData.type) {
      case 'setting':
        importOldSettingData(settingData.data);
        break;
      case 'setting_v2':
        importNewSettingData(settingData.data);
        break;
      default:
        break;
    }
  } catch (err) {
    message.error(`导入失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

export const exportSetting = async (path: string, appSetting: LX.AppSetting): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    const data: SettingV2 = {
      type: 'setting_v2',
      data: { ...appSetting },
    };
    await saveLxConfigFile(path, data);
  } catch (err) {
    message.error(`导出失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

export const importPlayList = async (path: string): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    const listData = (await readLxConfigFile(path)) as ConfigFile;
    if (!listData) return;

    switch (listData.type) {
      case 'defautlList':
        await listService.clearListMusics([LIST_IDS.DEFAULT]);
        await listService.addListMusics(
          LIST_IDS.DEFAULT,
          filterMusicList(listData.data.list.map((m) => toNewMusicInfo(m))),
          'top',
        );
        break;
      case 'playList':
        await importOldListData(listData.data);
        break;
      case 'playList_v2':
        await importNewListData(listData.data);
        break;
      default:
        break;
    }
  } catch (err) {
    message.error(`导入失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

export const exportPlayList = async (path: string): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    const data: PlayListV2 = {
      type: 'playList_v2',
      data: await getAllLists(),
    };
    await saveLxConfigFile(path, data);
  } catch (err) {
    message.error(`导出失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

export const exportPlayListToText = async (savePath: string, isMerge: boolean): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    const lists = await getAllLists();
    if (isMerge) {
      const content = lists
        .map((l) =>
          l.list.map((m) => `${m.name}  ${m.singer}  ${m.meta.albumName ?? ''}`).join('\n'),
        )
        .join('\n\n');
      await saveStrToFile(savePath, content);
    } else {
      for (const list of lists) {
        await saveStrToFile(
          joinPath(savePath, `coral_list_${filterFileName(list.name ?? list.id)}.txt`),
          list.list.map((m) => `${m.name}  ${m.singer}  ${m.meta.albumName ?? ''}`).join('\n'),
        );
      }
    }
  } catch (err) {
    message.error(`导出失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

export const exportPlayListToCsv = async (
  savePath: string,
  isMerge: boolean,
  header: string,
): Promise<void> => {
  if (!isElectronRenderer()) return;
  try {
    const lists = await getAllLists();
    const filterStr = (str: string): string => {
      if (!str) return '';
      let s = str.replace(/"/g, '""');
      if (s.includes(',')) s = `"${s}"`;
      return s;
    };
    if (isMerge) {
      const content =
        header +
        lists
          .map((l) =>
            l.list
              .map(
                (m) =>
                  `${filterStr(m.name)},${filterStr(m.singer)},${filterStr(m.meta.albumName ?? '')}`,
              )
              .join('\n'),
          )
          .join('\n');
      await saveStrToFile(savePath, content);
    } else {
      for (const list of lists) {
        await saveStrToFile(
          joinPath(savePath, `coral_list_${filterFileName(list.name ?? list.id)}.csv`),
          header +
            list.list
              .map(
                (m) =>
                  `${filterStr(m.name)},${filterStr(m.singer)},${filterStr(m.meta.albumName ?? '')}`,
              )
              .join('\n'),
        );
      }
    }
  } catch (err) {
    message.error(`导出失败：${err instanceof Error ? err.message : String(err)}`);
  }
};

export const backupService = {
  cacheService,
  exportAllData,
  exportPlayList,
  exportPlayListToCsv,
  exportPlayListToText,
  exportSetting,
  importAllData,
  importPlayList,
  importSetting,
};
