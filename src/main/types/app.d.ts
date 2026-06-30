/* eslint-disable vars-on-top */
/* eslint-disable no-var */
// import { Event as WinMainEvent } from '@main/modules/winMain/event'
// import { Event as WinLyricEvent } from '@main/modules/winLyric/event'
import { type DislikeType, type AppType, type ListType } from '@main/event';
import { type DBSeriveTypes } from '@main/worker/utils';

interface Coral {
  inited: boolean;
  appSetting: Coral.AppSetting;
  hotKey: {
    enable: boolean;
    config: Coral.HotKeyConfigAll;
    state: Coral.HotKeyState;
  };
  /**
   * 是否跳过托盘退出
   */
  isSkipTrayQuit: boolean;
  /**
   * main window 是否关闭
   */
  // mainWindowClosed: boolean
  event_app: AppType;
  event_list: ListType;
  event_dislike: DislikeType;
  worker: {
    dbService: DBSeriveTypes;
  };
  theme: Coral.ThemeSetting;
  player_status: Coral.Player.Status;
}

declare global {
  // declare module NodeJS {
  //   export interface Global {
  //     coral: {
  //       app_event: {
  //         winMain: WinMainEvent
  //         winLyric: WinLyricEvent
  //       }
  //     }
  //   }
  // }

  // var isDev: boolean
  var envParams: Coral.EnvParams;
  var staticPath: string;
  var coralDataPath: string;
  var coralOldDataPath: string;
  var coral: Coral;
  var appWorder: AppWorder;
}
