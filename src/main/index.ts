import { app } from 'electron';
import './utils/logInit';
import '@common/error';
import {
  initGlobalData,
  initSingleInstanceHandle,
  applyElectronEnvParams,
  setUserDataPath,
  registerDeeplink,
  listenerAppEvent,
} from './app';
import { isLinux } from '@common/utils';
import { initAppSetting } from '@main/app';
import registerModules from '@main/modules';
import { runDownloadSmokeIfEnabled } from '@main/modules/winMain/downloadSmoke';

// 初始化应用
const init = () => {
  console.log('init');
  initAppSetting().then(() => {
    registerModules();
    global.lx.event_app.app_inited();
    runDownloadSmokeIfEnabled();
  });
};

initGlobalData();
initSingleInstanceHandle();
applyElectronEnvParams();
setUserDataPath();
registerDeeplink(init);
listenerAppEvent(init);

// https://github.com/electron/electron/issues/16809
app.whenReady().then(() => {
  isLinux ? setTimeout(init, 300) : init();
});
