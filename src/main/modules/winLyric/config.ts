import { isLinux } from '@common/utils';
import {
  closeWindow,
  createWindow,
  getBounds,
  isExistWindow,
  alwaysOnTopTools,
  setBounds,
  setIgnoreMouseEvents,
  setSkipTaskbar,
} from './main';
import { sendConfigChange, sendMouseLeave } from './rendererEvent';
import { buildLyricConfig, getLyricWindowBounds, initWindowSize, watchConfigKeys } from './utils';
import { mouseCheckTools } from './mouseCheckTools';

let isLock: boolean;
let isEnable: boolean;
let isAlwaysOnTop: boolean;
let isAlwaysOnTopLoop: boolean;
let isShowTaskbar: boolean;
let isLockScreen: boolean;
let isHoverHide: boolean;

export const setLrcConfig = (
  keys: Array<keyof Coral.AppSetting>,
  setting: Partial<Coral.AppSetting>,
) => {
  if (!watchConfigKeys.some((key) => keys.includes(key))) return;

  if (isExistWindow()) {
    sendConfigChange(buildLyricConfig(setting));
    if (
      keys.includes('desktopLyric.isLock') &&
      isLock != global.coral.appSetting['desktopLyric.isLock']
    ) {
      isLock = global.coral.appSetting['desktopLyric.isLock'];
      if (global.coral.appSetting['desktopLyric.isLock']) {
        setIgnoreMouseEvents(true, {
          forward: !isLinux && global.coral.appSetting['desktopLyric.isHoverHide'],
        });
        mouseCheckTools.runCheck(sendMouseLeave);
      } else {
        setIgnoreMouseEvents(false, {
          forward: !isLinux && global.coral.appSetting['desktopLyric.isHoverHide'],
        });
        mouseCheckTools.cacnelCheck();
      }
    }
    if (
      keys.includes('desktopLyric.isHoverHide') &&
      isHoverHide != global.coral.appSetting['desktopLyric.isHoverHide']
    ) {
      isHoverHide = global.coral.appSetting['desktopLyric.isHoverHide'];
      if (!isLinux) {
        setIgnoreMouseEvents(global.coral.appSetting['desktopLyric.isLock'], {
          forward: isHoverHide,
        });
        if (isHoverHide) {
          mouseCheckTools.runCheck(sendMouseLeave);
        } else {
          mouseCheckTools.cacnelCheck();
        }
      }
    }
    if (
      keys.includes('desktopLyric.isAlwaysOnTop') &&
      isAlwaysOnTop != global.coral.appSetting['desktopLyric.isAlwaysOnTop']
    ) {
      isAlwaysOnTop = global.coral.appSetting['desktopLyric.isAlwaysOnTop'];
      alwaysOnTopTools.setAlwaysOnTop(global.coral.appSetting['desktopLyric.isAlwaysOnTopLoop']);
      if (isAlwaysOnTop && global.coral.appSetting['desktopLyric.isAlwaysOnTopLoop']) {
        alwaysOnTopTools.startLoop();
      } else alwaysOnTopTools.clearLoop();
    }
    if (
      keys.includes('desktopLyric.isShowTaskbar') &&
      isShowTaskbar != global.coral.appSetting['desktopLyric.isShowTaskbar']
    ) {
      isShowTaskbar = global.coral.appSetting['desktopLyric.isShowTaskbar'];
      setSkipTaskbar(!global.coral.appSetting['desktopLyric.isShowTaskbar']);
    }
    if (
      keys.includes('desktopLyric.isAlwaysOnTopLoop') &&
      isAlwaysOnTopLoop != global.coral.appSetting['desktopLyric.isAlwaysOnTopLoop']
    ) {
      isAlwaysOnTopLoop = global.coral.appSetting['desktopLyric.isAlwaysOnTopLoop'];
      if (!global.coral.appSetting['desktopLyric.isAlwaysOnTop']) return;
      if (isAlwaysOnTopLoop) {
        alwaysOnTopTools.startLoop();
      } else {
        alwaysOnTopTools.clearLoop();
      }
    }
    if (
      keys.includes('desktopLyric.isLockScreen') &&
      isLockScreen != global.coral.appSetting['desktopLyric.isLockScreen']
    ) {
      isLockScreen = global.coral.appSetting['desktopLyric.isLockScreen'];
      if (global.coral.appSetting['desktopLyric.isLockScreen']) {
        setBounds(
          getLyricWindowBounds(getBounds()!, {
            x: 0,
            y: 0,
            w: global.coral.appSetting['desktopLyric.width'],
            h: global.coral.appSetting['desktopLyric.height'],
          }),
        );
      }
    }
    if (keys.includes('desktopLyric.x') && setting['desktopLyric.x'] == null) {
      setBounds(
        initWindowSize(
          global.coral.appSetting['desktopLyric.x'],
          global.coral.appSetting['desktopLyric.y'],
          global.coral.appSetting['desktopLyric.width'],
          global.coral.appSetting['desktopLyric.height'],
        ),
      );
    }
  }
  if (
    keys.includes('desktopLyric.enable') &&
    isEnable != global.coral.appSetting['desktopLyric.enable']
  ) {
    isEnable = global.coral.appSetting['desktopLyric.enable'];
    if (global.coral.appSetting['desktopLyric.enable']) {
      createWindow();
    } else {
      alwaysOnTopTools.clearLoop();
      mouseCheckTools.cacnelCheck();
      closeWindow();
    }
  }
};
