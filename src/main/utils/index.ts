/* eslint-disable @typescript-eslint/ban-ts-comment */
import { isMac } from '@common/utils';
import { encodePath, isUrl, throttle } from '@common/utils/common';
import migrateSetting from '@common/utils/migrateSetting';
import getStore from '@main/utils/store';
import { STORE_NAMES, URL_SCHEME_RXP } from '@common/constants';
import defaultSetting from '@common/defaultSetting';
import defaultHotKey from '@common/defaultHotKey';
import { migrateDataJson, migrateHotKey, migrateUserApi, parseDataFile } from './migrate';
import { nativeTheme, powerSaveBlocker } from 'electron';
import { joinPath } from '@common/utils/nodejs';
import themes from '@common/theme/index.json';

export const parseEnvParams = (
  argv = process.argv,
): { cmdParams: Coral.CmdParams; deeplink: string | null } => {
  const cmdParams: Coral.CmdParams = {};
  let deeplink = null;
  const rx = /^-\w+/;
  for (let param of argv) {
    if (URL_SCHEME_RXP.test(param)) {
      deeplink = param;
    }

    if (!rx.test(param)) continue;
    param = param.substring(1);
    let index = param.indexOf('=');
    if (index < 0) {
      cmdParams[param] = true;
    } else {
      cmdParams[param.substring(0, index)] = param.substring(index + 1);
    }
  }
  return {
    cmdParams,
    deeplink,
  };
};

const primitiveType = ['string', 'boolean', 'number'];
const checkPrimitiveType = (val: any): boolean =>
  val === null || primitiveType.includes(typeof val);
// const handleMergeSetting = (defaultSetting: Coral.AppSetting, currentSetting: Partial<Coral.AppSetting>) => {
//   const updatedSettingKeys: Array<keyof Coral.AppSetting> = []
//   for (const key of Object.keys(defaultSetting) as Array<keyof Coral.AppSetting>) {
//     const currentValue: any = currentSetting[key]
//     const isPrimitive = checkPrimitiveType(currentValue)
//     // if (checkPrimitiveType(value)) {
//     if (!isPrimitive) continue
//     updatedSettingKeys.push(key)
//     // @ts-expect-error
//     defaultSetting[key] = currentValue
//     // } else {
//     //   if (!isPrimitive && currentValue != undefined) handleMergeSetting(value, currentValue)
//     // }
//   }
//   return {
//     setting: defaultSetting,
//     updatedSettingKeys,
//   }
// }

export const mergeSetting = (
  originSetting: Coral.AppSetting,
  targetSetting?: Partial<Coral.AppSetting> | null,
): {
  setting: Coral.AppSetting;
  updatedSettingKeys: Array<keyof Coral.AppSetting>;
  updatedSetting: Partial<Coral.AppSetting>;
} => {
  let originSettingCopy: Coral.AppSetting = { ...originSetting };
  // const defaultVersion = targetSettingCopy.version
  const updatedSettingKeys: Array<keyof Coral.AppSetting> = [];
  const updatedSetting: Partial<Coral.AppSetting> = {};

  if (targetSetting) {
    const originSettingKeys = Object.keys(originSettingCopy);
    const targetSettingKeys = Object.keys(targetSetting);

    if (originSettingKeys.length > targetSettingKeys.length) {
      for (const key of targetSettingKeys as Array<keyof Coral.AppSetting>) {
        const targetValue: any = targetSetting[key];
        const isPrimitive = checkPrimitiveType(targetValue);
        // if (checkPrimitiveType(value)) {
        if (
          !isPrimitive ||
          targetValue == originSettingCopy[key] ||
          originSettingCopy[key] === undefined
        ) {
          continue;
        }
        updatedSettingKeys.push(key);
        updatedSetting[key] = targetValue;
        // @ts-expect-error
        originSettingCopy[key] = targetValue;
        // } else {
        //   if (!isPrimitive && currentValue != undefined) handleMergeSetting(value, currentValue)
        // }
      }
    } else {
      for (const key of originSettingKeys as Array<keyof Coral.AppSetting>) {
        const targetValue: any = targetSetting[key];
        const isPrimitive = checkPrimitiveType(targetValue);
        // if (checkPrimitiveType(value)) {
        if (!isPrimitive || targetValue == originSettingCopy[key]) continue;
        updatedSettingKeys.push(key);
        updatedSetting[key] = targetValue;
        // @ts-expect-error
        originSettingCopy[key] = targetValue;
        // } else {
        //   if (!isPrimitive && currentValue != undefined) handleMergeSetting(value, currentValue)
        // }
      }
    }
  }

  return {
    setting: originSettingCopy,
    updatedSettingKeys,
    updatedSetting,
  };
};

const applyInitSetting = (setting: Coral.AppSetting) => {
  if (global.envParams.cmdParams.hidden && !setting['tray.enable']) {
    setting['tray.enable'] = true;
  }
};

export const updateSetting = (setting?: Partial<Coral.AppSetting>, isInit: boolean = false) => {
  const electronStore_config = getStore(STORE_NAMES.APP_SETTINGS);

  let originSetting: Coral.AppSetting;
  if (isInit) {
    setting &&= migrateSetting(setting);
    applyInitSetting(setting as Coral.AppSetting);
    originSetting = { ...defaultSetting };
  } else originSetting = global.coral.appSetting;

  const result = mergeSetting(originSetting, setting);

  result.setting.version = defaultSetting.version;

  electronStore_config.override({
    version: result.setting.version,
    setting: result.setting,
  });
  return result;
};

/**
 * 初始化设置
 */
export const initSetting = async () => {
  const electronStore_config = getStore(STORE_NAMES.APP_SETTINGS);

  let setting = electronStore_config.get('setting');

  // migrate setting
  if (!setting) {
    const config = await parseDataFile<{ setting?: any }>('config.json');
    if (config?.setting) setting = config.setting as Coral.AppSetting;
    await migrateUserApi();
    await migrateDataJson();
  }

  // console.log(setting)
  return updateSetting(setting ?? undefined, true);
};

/**
 * 初始化快捷键设置
 */
const legacyDefaultHotKeyKeys: Record<'local' | 'global', string[]> = {
  local: ['mod+f5', 'mod+arrowleft', 'mod+arrowright', 'ctrl+alt+arrowleft', 'ctrl+alt+arrowright', 'f8'],
  global: [
    'mod+alt+f5',
    'mod+alt+arrowleft',
    'mod+alt+arrowright',
    'mod+alt+arrowup',
    'mod+alt+arrowdown',
    'ctrl+alt+space',
    'ctrl+alt+arrowleft',
    'ctrl+alt+arrowright',
    'ctrl+alt+arrowup',
    'ctrl+alt+arrowdown',
    'f7',
    'f8',
  ],
};

const migrateDefaultHotKeyConfig = (
  type: 'local' | 'global',
  config: Coral.HotKeyConfig,
): boolean => {
  let changed = false;
  const defaultConfig = defaultHotKey[type];
  const defaultActions = new Set(Object.values(defaultConfig.keys).map((info) => info.action));
  const shouldApplyNewDefaults = legacyDefaultHotKeyKeys[type].some((key) => {
    const info = config.keys[key];
    return info && defaultActions.has(info.action);
  });

  if (!shouldApplyNewDefaults) return false;

  for (const key of legacyDefaultHotKeyKeys[type]) {
    const info = config.keys[key];
    if (info && defaultActions.has(info.action)) {
      delete config.keys[key];
      changed = true;
    }
  }

  for (const [key, info] of Object.entries(defaultConfig.keys)) {
    config.keys[key] = { ...info };
    changed = true;
  }

  return changed;
};

export const initHotKey = async (): Promise<Coral.HotKeyConfigAll> => {
  const electronStore_hotKey = getStore(STORE_NAMES.HOTKEY);

  let localConfig: Coral.HotKeyConfig | undefined = electronStore_hotKey.get('local');
  let globalConfig: Coral.HotKeyConfig | undefined = electronStore_hotKey.get('global');

  if (globalConfig) {
    // 移除v2.2.0及之前设置的全局媒体快捷键注册
    if (globalConfig.keys.MediaPlayPause) {
      delete globalConfig.keys.MediaPlayPause;
      delete globalConfig.keys.MediaNextTrack;
      delete globalConfig.keys.MediaPreviousTrack;
      electronStore_hotKey.set('global', globalConfig);
    }
    if (localConfig && migrateDefaultHotKeyConfig('local', localConfig)) {
      electronStore_hotKey.set('local', localConfig);
    }
    if (migrateDefaultHotKeyConfig('global', globalConfig)) {
      electronStore_hotKey.set('global', globalConfig);
    }
  } else {
    // migrate hotKey
    const config = await migrateHotKey();
    if (config) {
      localConfig = config.local;
      globalConfig = config.global;
    } else {
      localConfig = JSON.parse(JSON.stringify(defaultHotKey.local));
      globalConfig = JSON.parse(JSON.stringify(defaultHotKey.global));
    }

    electronStore_hotKey.set('local', localConfig);
    electronStore_hotKey.set('global', globalConfig);
  }

  return {
    local: localConfig!,
    global: globalConfig!,
  } as Coral.HotKeyConfigAll;
};

type HotKeyType = 'local' | 'global';

const saveHotKeyConfig = throttle<[Coral.HotKeyConfigAll]>((config: Coral.HotKeyConfigAll) => {
  for (const key of Object.keys(config) as HotKeyType[]) {
    global.coral.hotKey.config[key] = config[key];
    getStore(STORE_NAMES.HOTKEY).set(key, config[key]);
  }
});
export const saveAppHotKeyConfig = (config: Coral.HotKeyConfigAll) => {
  saveHotKeyConfig(config);
};

export const openDevTools = (webContents: Electron.WebContents) => {
  webContents.openDevTools({
    mode: 'undocked',
  });
};

let userThemes: Coral.Theme[];
export const getAllThemes = () => {
  userThemes ??= getStore(STORE_NAMES.THEME).get('themes') ?? [];
  return {
    themes,
    userThemes,
    dataPath: joinPath(global.coralDataPath, 'theme_images'),
  };
};

export const saveTheme = (theme: Coral.Theme) => {
  const targetTheme = userThemes.find((t) => t.id === theme.id);
  if (targetTheme) Object.assign(targetTheme, theme);
  else userThemes.push(theme);
  getStore(STORE_NAMES.THEME).set('themes', userThemes);
};

export const removeTheme = (id: string) => {
  const index = userThemes.findIndex((t) => t.id === id);
  if (index < 0) return;
  userThemes.splice(index, 1);
  getStore(STORE_NAMES.THEME).set('themes', userThemes);
};

const copyTheme = (theme: Coral.Theme): Coral.Theme => ({
  ...theme,
  config: {
    ...theme.config,
    extInfo: { ...theme.config.extInfo },
    themeColors: { ...theme.config.themeColors },
  },
});
export const getTheme = () => {
  // fs.promises.readdir()
  const shouldUseDarkColors = nativeTheme.shouldUseDarkColors;
  let themeId =
    global.coral.appSetting['theme.id'] == 'auto'
      ? shouldUseDarkColors
        ? global.coral.appSetting['theme.darkId']
        : global.coral.appSetting['theme.lightId']
      : global.coral.appSetting['theme.id'];
  // themeId = 'naruto'
  // themeId = 'pink'
  // themeId = 'black'
  let theme = themes.find((theme) => theme.id == themeId);
  if (!theme) {
    userThemes = getStore(STORE_NAMES.THEME).get('themes') ?? [];
    theme = userThemes.find((theme) => theme.id == themeId);
    if (theme) {
      if (theme.config.extInfo['--background-image'] != 'none') {
        theme = copyTheme(theme);
        theme.config.extInfo['--background-image'] = isUrl(
          theme.config.extInfo['--background-image'],
        )
          ? `url(${theme.config.extInfo['--background-image']})`
          : `url(file:///${encodePath(joinPath(global.coralDataPath, 'theme_images', theme.config.extInfo['--background-image']))})`;
      }
    } else {
      themeId =
        global.coral.appSetting['theme.id'] == 'auto' && shouldUseDarkColors ? 'black' : 'green';
      theme = themes.find((theme) => theme.id == themeId) as Coral.Theme;
    }
  }

  const colors: Record<string, string> = {
    ...theme.config.themeColors,
    ...theme.config.extInfo,
  };

  return {
    shouldUseDarkColors,
    theme: {
      id: global.coral.appSetting['theme.id'],
      name: theme.name,
      isDark: theme.isDark,
      isDarkFont: theme.isDarkFont,
      colors,
    },
  };
};

let powerSaveBlockerId: number | null = null;
export const setPowerSaveBlocker = (enabled: boolean) => {
  let isEnabled = powerSaveBlockerId != null && powerSaveBlocker.isStarted(powerSaveBlockerId);
  if (enabled) {
    if (isEnabled) return;
    powerSaveBlockerId = powerSaveBlocker.start(
      isMac ? 'prevent-display-sleep' : 'prevent-app-suspension',
    );
  } else {
    if (!isEnabled) return;
    powerSaveBlocker.stop(powerSaveBlockerId!);
    powerSaveBlockerId = null;
  }
};

let envProxy: null | { host: string; port: number } = null;
export const getProxy = () => {
  if (
    global.coral.appSetting['network.proxy.enable'] &&
    global.coral.appSetting['network.proxy.host']
  ) {
    return {
      host: global.coral.appSetting['network.proxy.host'],
      port: parseInt(global.coral.appSetting['network.proxy.port'] || '80'),
    };
  }
  if (envProxy) {
    return {
      host: envProxy.host,
      port: envProxy.port,
    };
  }
  const envProxyStr = envParams.cmdParams['proxy-server'];
  if (envProxyStr && typeof envProxyStr == 'string') {
    const [host, port = ''] = envProxyStr.split(':');
    envProxy = {
      host,
      port: parseInt(port || '80'),
    };
    return envProxy;
  }

  return null;
};
