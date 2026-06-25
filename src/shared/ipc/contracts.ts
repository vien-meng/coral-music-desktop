import {
  CMMON_EVENT_NAME,
  DISLIKE_EVENT_NAME,
  HOTKEY_RENDERER_EVENT_NAME,
  PLAYER_EVENT_NAME,
  WIN_LYRIC_RENDERER_EVENT_NAME,
  WIN_MAIN_RENDERER_EVENT_NAME,
} from '@common/ipcNames'
import type { ExternalDecoderProbeParams, ExternalDecoderProbeResult } from '@shared/playbackCapabilities'

interface IpcContract<Params = undefined, Result = void> {
  params: Params
  result: Result
}

export const ipcChannels = {
  common: {
    clearEnvParamsDeeplink:
      CMMON_EVENT_NAME.clear_env_params_deeplink as 'common_clear_env_params_deeplink',
    deeplink: CMMON_EVENT_NAME.deeplink as 'common_deeplink',
    getAppSetting: CMMON_EVENT_NAME.get_app_setting as 'common_get_app_setting',
    getEnvParams: CMMON_EVENT_NAME.get_env_params as 'common_get_env_params',
    getSystemFonts:
      CMMON_EVENT_NAME.get_system_fonts as 'common_get_system_fonts',
    setAppSetting: CMMON_EVENT_NAME.set_app_setting as 'common_set_app_setting',
    themeChange: CMMON_EVENT_NAME.theme_change as 'common_theme_change',
  },
  dislike: {
    addDislikeMusicInfos:
      DISLIKE_EVENT_NAME.add_dislike_music_infos as 'dislike_add_dislike_music_infos',
    clearDislikeMusicInfos:
      DISLIKE_EVENT_NAME.clear_dislike_music_infos as 'dislike_clear_dislike_music_infos',
    getDislikeMusicInfos:
      DISLIKE_EVENT_NAME.get_dislike_music_infos as 'dislike_get_dislike_music_infos',
    overwriteDislikeMusicInfos:
      DISLIKE_EVENT_NAME.overwrite_dislike_music_infos as 'dislike_overwrite_dislike_music_infos',
  },
  player: {
    invokePlayMusic:
      PLAYER_EVENT_NAME.invoke_play_music as 'player_invoke_play_music',
    invokePlayNext:
      PLAYER_EVENT_NAME.invoke_play_next as 'player_invoke_play_next',
    invokePlayPrev:
      PLAYER_EVENT_NAME.invoke_play_prev as 'player_invoke_play_prev',
    invokeTogglePlay:
      PLAYER_EVENT_NAME.invoke_toggle_play as 'player_invoke_toggle_play',
    listAdd: PLAYER_EVENT_NAME.list_add as 'player_list_add',
    listDataOverwrite:
      PLAYER_EVENT_NAME.list_data_overwire as 'player_list_data_overwire',
    listGet: PLAYER_EVENT_NAME.list_get as 'player_list_get',
    listRemove: PLAYER_EVENT_NAME.list_remove as 'player_list_remove',
    listUpdate: PLAYER_EVENT_NAME.list_update as 'player_list_update',
    listUpdatePosition:
      PLAYER_EVENT_NAME.list_update_position as 'player_list_update_position',
    listMusicAdd: PLAYER_EVENT_NAME.list_music_add as 'player_list_music_add',
    listMusicClear:
      PLAYER_EVENT_NAME.list_music_clear as 'player_list_music_clear',
    listMusicGet: PLAYER_EVENT_NAME.list_music_get as 'player_list_music_get',
    listMusicMove: PLAYER_EVENT_NAME.list_music_move as 'player_list_music_move',
    listMusicRemove:
      PLAYER_EVENT_NAME.list_music_remove as 'player_list_music_remove',
    listMusicUpdatePosition:
      PLAYER_EVENT_NAME.list_music_update_position as 'player_list_music_update_position',
  },
  winMain: {
    downloadListAdd: WIN_MAIN_RENDERER_EVENT_NAME.download_list_add as 'winMain_download_list_add',
    downloadListGet:
      WIN_MAIN_RENDERER_EVENT_NAME.download_list_get as 'winMain_download_list_get',
    downloadListClear:
      WIN_MAIN_RENDERER_EVENT_NAME.download_list_clear as 'winMain_download_list_clear',
    downloadListRemove:
      WIN_MAIN_RENDERER_EVENT_NAME.download_list_remove as 'winMain_download_list_remove',
    downloadListUpdate:
      WIN_MAIN_RENDERER_EVENT_NAME.download_list_update as 'winMain_download_list_update',
    downloadTaskAction:
      WIN_MAIN_RENDERER_EVENT_NAME.download_task_action as 'winMain_download_task_action',
    downloadTaskPause:
      WIN_MAIN_RENDERER_EVENT_NAME.download_task_pause as 'winMain_download_task_pause',
    downloadTaskRetry:
      WIN_MAIN_RENDERER_EVENT_NAME.download_task_retry as 'winMain_download_task_retry',
    downloadTaskStart:
      WIN_MAIN_RENDERER_EVENT_NAME.download_task_start as 'winMain_download_task_start',
    externalDecoderProbe:
      WIN_MAIN_RENDERER_EVENT_NAME.external_decoder_probe as 'winMain_external_decoder_probe',
    getData: WIN_MAIN_RENDERER_EVENT_NAME.get_data as 'winMain_get_data',
    getThemes: WIN_MAIN_RENDERER_EVENT_NAME.get_themes as 'winMain_get_themes',
    getUserApiList:
      WIN_MAIN_RENDERER_EVENT_NAME.get_user_api_list as 'winMain_get_user_api_list',
    getUserApiStatus:
      WIN_MAIN_RENDERER_EVENT_NAME.get_user_api_status as 'winMain_get_user_api_status',
    importUserApi:
      WIN_MAIN_RENDERER_EVENT_NAME.import_user_api as 'winMain_import_user_api',
    inited: WIN_MAIN_RENDERER_EVENT_NAME.inited as 'winMain_inited',
    onConfigChange:
      WIN_MAIN_RENDERER_EVENT_NAME.on_config_change as 'winMain_on_config_change',
    openApiAction:
      WIN_MAIN_RENDERER_EVENT_NAME.open_api_action as 'winMain_open_api_action',
    openDirInExplorer:
      WIN_MAIN_RENDERER_EVENT_NAME.open_dir_in_explorer as 'winMain_open_dir_in_explorer',
    playerActionOnButtonClick:
      WIN_MAIN_RENDERER_EVENT_NAME.player_action_on_button_click as 'winMain_player_action_on_button_click',
    playerStatus:
      WIN_MAIN_RENDERER_EVENT_NAME.player_status as 'winMain_player_status',
    removeUserApi:
      WIN_MAIN_RENDERER_EVENT_NAME.remove_user_api as 'winMain_remove_user_api',
    removeTheme:
      WIN_MAIN_RENDERER_EVENT_NAME.remove_theme as 'winMain_remove_theme',
    saveData: WIN_MAIN_RENDERER_EVENT_NAME.save_data as 'winMain_save_data',
    saveTheme: WIN_MAIN_RENDERER_EVENT_NAME.save_theme as 'winMain_save_theme',
    setUserApi:
      WIN_MAIN_RENDERER_EVENT_NAME.set_user_api as 'winMain_set_user_api',
    setUserApiAllowUpdateAlert:
      WIN_MAIN_RENDERER_EVENT_NAME.user_api_set_allow_update_alert as 'winMain_user_api_set_allow_update_alert',
    showSelectDialog:
      WIN_MAIN_RENDERER_EVENT_NAME.show_select_dialog as 'winMain_show_select_dialog',
    showSaveDialog:
      WIN_MAIN_RENDERER_EVENT_NAME.show_save_dialog as 'winMain_show_save_dialog',
    getCacheSize:
      WIN_MAIN_RENDERER_EVENT_NAME.get_cache_size as 'winMain_get_cache_size',
    clearCache:
      WIN_MAIN_RENDERER_EVENT_NAME.clear_cache as 'winMain_clear_cache',
    getOtherSource:
      WIN_MAIN_RENDERER_EVENT_NAME.get_other_source as 'winMain_get_other_source',
    saveOtherSource:
      WIN_MAIN_RENDERER_EVENT_NAME.save_other_source as 'winMain_save_other_source',
    getOtherSourceCount:
      WIN_MAIN_RENDERER_EVENT_NAME.get_other_source_count as 'winMain_get_other_source_count',
    clearOtherSource:
      WIN_MAIN_RENDERER_EVENT_NAME.clear_other_source as 'winMain_clear_other_source',
    getMusicUrlCount:
      WIN_MAIN_RENDERER_EVENT_NAME.get_music_url_count as 'winMain_get_music_url_count',
    getMusicUrl:
      WIN_MAIN_RENDERER_EVENT_NAME.get_music_url as 'winMain_get_music_url',
    saveMusicUrl:
      WIN_MAIN_RENDERER_EVENT_NAME.save_music_url as 'winMain_save_music_url',
    clearMusicUrl:
      WIN_MAIN_RENDERER_EVENT_NAME.clear_music_url as 'winMain_clear_music_url',
    getLyricRaw:
      WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_raw as 'winMain_get_lyric_raw',
    getLyricEdited:
      WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_edited as 'winMain_get_lyric_edited',
    saveLyricRaw:
      WIN_MAIN_RENDERER_EVENT_NAME.save_lyric_raw as 'winMain_save_lyric_raw',
    saveLyricEdited:
      WIN_MAIN_RENDERER_EVENT_NAME.save_lyric_edited as 'winMain_save_lyric_edited',
    removeLyricEdited:
      WIN_MAIN_RENDERER_EVENT_NAME.remove_lyric_edited as 'winMain_remove_lyric_edited',
    getLyricRawCount:
      WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_raw_count as 'winMain_get_lyric_raw_count',
    clearLyricRaw:
      WIN_MAIN_RENDERER_EVENT_NAME.clear_lyric_raw as 'winMain_clear_lyric_raw',
    getLyricEditedCount:
      WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_edited_count as 'winMain_get_lyric_edited_count',
    clearLyricEdited:
      WIN_MAIN_RENDERER_EVENT_NAME.clear_lyric_edited as 'winMain_clear_lyric_edited',
    hotKeyEnable:
      HOTKEY_RENDERER_EVENT_NAME.enable as 'hotKey_enable',
    hotKeySetConfig:
      HOTKEY_RENDERER_EVENT_NAME.set_config as 'hotKey_set_config',
    hotKeyStatus:
      HOTKEY_RENDERER_EVENT_NAME.status as 'hotKey_status',
    syncAction:
      WIN_MAIN_RENDERER_EVENT_NAME.sync_action as 'winMain_sync_action',
    syncGetServerDevices:
      WIN_MAIN_RENDERER_EVENT_NAME.sync_get_server_devices as 'winMain_sync_get_server_devices',
    syncRemoveServerDevice:
      WIN_MAIN_RENDERER_EVENT_NAME.sync_remove_server_device as 'winMain_sync_remove_server_device',
    close: WIN_MAIN_RENDERER_EVENT_NAME.close as 'winMain_close',
    min: WIN_MAIN_RENDERER_EVENT_NAME.min as 'winMain_min',
    max: WIN_MAIN_RENDERER_EVENT_NAME.max as 'winMain_max',
    fullscreen:
      WIN_MAIN_RENDERER_EVENT_NAME.fullscreen as 'winMain_fullscreen',
  },
  winLyric: {
    getConfig:
      WIN_LYRIC_RENDERER_EVENT_NAME.get_config as 'winLyric_get_config',
    mainWindowInited:
      WIN_LYRIC_RENDERER_EVENT_NAME.main_window_inited as 'winLyric_main_window_inited',
    mouseEnterLeave:
      WIN_LYRIC_RENDERER_EVENT_NAME.mouse_enter_leave as 'winLyric_mouse_enter_leave',
    onConfigChange:
      WIN_LYRIC_RENDERER_EVENT_NAME.on_config_change as 'winLyric_on_config_change',
    provideMainWindowChannel:
      WIN_LYRIC_RENDERER_EVENT_NAME.provide_main_window_channel as 'winLyric_provide_main_window_channel',
    requestMainWindowChannel:
      WIN_LYRIC_RENDERER_EVENT_NAME.request_main_window_channel as 'winLyric_request_main_window_channel',
    setConfig:
      WIN_LYRIC_RENDERER_EVENT_NAME.set_config as 'winLyric_set_config',
    setWinBounds:
      WIN_LYRIC_RENDERER_EVENT_NAME.set_win_bounds as 'winLyric_set_win_bounds',
    setWinResizeable:
      WIN_LYRIC_RENDERER_EVENT_NAME.set_win_resizeable as 'winLyric_set_win_resizeable',
  },
} as const

export interface IpcThemeCollection {
  themes: LX.Theme[]
  userThemes: LX.Theme[]
  dataPath: string
}

export interface IpcPlayerActionClick {
  action: LX.Player.StatusButtonActions
  data?: unknown
}

export interface IpcDataSaveParams {
  path: string
  data: unknown
}

export interface IpcDownloadTaskStartParams {
  task: LX.Download.ListItem
  url: string
  isRetry?: boolean
}

export interface IpcDownloadTaskAction {
  taskId: string
  task?: LX.Download.ListItem
  action: LX.Download.DownloadTaskActions
}

export interface CoralIpcInvokeMap {
  [ipcChannels.common.getAppSetting]: IpcContract<undefined, LX.AppSetting>
  [ipcChannels.common.getEnvParams]: IpcContract<undefined, LX.EnvParams>
  [ipcChannels.common.getSystemFonts]: IpcContract<undefined, string[]>
  [ipcChannels.common.setAppSetting]: IpcContract<Partial<LX.AppSetting>, void>
  [ipcChannels.dislike.addDislikeMusicInfos]: IpcContract<
  LX.Dislike.DislikeMusicInfo[],
  void
  >
  [ipcChannels.dislike.clearDislikeMusicInfos]: IpcContract<undefined, void>
  [ipcChannels.dislike.getDislikeMusicInfos]: IpcContract<
  undefined,
  LX.Dislike.DislikeInfo
  >
  [ipcChannels.dislike.overwriteDislikeMusicInfos]: IpcContract<
  LX.Dislike.DislikeRules,
  void
  >
  [ipcChannels.player.listAdd]: IpcContract<LX.List.ListActionAdd, void>
  [ipcChannels.player.listDataOverwrite]: IpcContract<
  LX.List.ListActionDataOverwrite,
  void
  >
  [ipcChannels.player.listGet]: IpcContract<undefined, LX.List.UserListInfo[]>
  [ipcChannels.player.listRemove]: IpcContract<LX.List.ListActionRemove, void>
  [ipcChannels.player.listUpdate]: IpcContract<LX.List.ListActionUpdate, void>
  [ipcChannels.player.listUpdatePosition]: IpcContract<
  LX.List.ListActionUpdatePosition,
  void
  >
  [ipcChannels.player.listMusicAdd]: IpcContract<
  LX.List.ListActionMusicAdd,
  void
  >
  [ipcChannels.player.listMusicClear]: IpcContract<
  LX.List.ListActionMusicClear,
  void
  >
  [ipcChannels.player.listMusicGet]: IpcContract<string, LX.Music.MusicInfo[]>
  [ipcChannels.player.listMusicMove]: IpcContract<
  LX.List.ListActionMusicMove,
  void
  >
  [ipcChannels.player.listMusicRemove]: IpcContract<
  LX.List.ListActionMusicRemove,
  void
  >
  [ipcChannels.player.listMusicUpdatePosition]: IpcContract<
  LX.List.ListActionMusicUpdatePosition,
  void
  >
  [ipcChannels.winMain.downloadListClear]: IpcContract<undefined, void>
  [ipcChannels.winMain.downloadListAdd]: IpcContract<LX.Download.saveDownloadMusicInfo, void>
  [ipcChannels.winMain.downloadListGet]: IpcContract<
  undefined,
  LX.Download.ListItem[]
  >
  [ipcChannels.winMain.downloadListRemove]: IpcContract<string[], void>
  [ipcChannels.winMain.downloadListUpdate]: IpcContract<LX.Download.ListItem[], void>
  [ipcChannels.winMain.downloadTaskPause]: IpcContract<string, LX.Download.ListItem | null>
  [ipcChannels.winMain.downloadTaskRetry]: IpcContract<IpcDownloadTaskStartParams, LX.Download.ListItem>
  [ipcChannels.winMain.downloadTaskStart]: IpcContract<IpcDownloadTaskStartParams, LX.Download.ListItem>
  [ipcChannels.winMain.externalDecoderProbe]: IpcContract<
  ExternalDecoderProbeParams,
  ExternalDecoderProbeResult
  >
  [ipcChannels.winMain.getData]: IpcContract<string, unknown>
  [ipcChannels.winMain.getThemes]: IpcContract<undefined, IpcThemeCollection>
  [ipcChannels.winMain.getUserApiList]: IpcContract<
  undefined,
  LX.UserApi.UserApiInfo[]
  >
  [ipcChannels.winMain.getUserApiStatus]: IpcContract<
  undefined,
  LX.UserApi.UserApiStatus
  >
  [ipcChannels.winMain.importUserApi]: IpcContract<
  string,
  LX.UserApi.ImportUserApi
  >
  [ipcChannels.winMain.openApiAction]: IpcContract<
  LX.OpenAPI.Actions,
  LX.OpenAPI.Status
  >
  [ipcChannels.winMain.removeUserApi]: IpcContract<
  string[],
  LX.UserApi.UserApiInfo[]
  >
  [ipcChannels.winMain.removeTheme]: IpcContract<string, void>
  [ipcChannels.winMain.saveTheme]: IpcContract<LX.Theme, void>
  [ipcChannels.winMain.setUserApi]: IpcContract<string, void>
  [ipcChannels.winMain.setUserApiAllowUpdateAlert]: IpcContract<
  LX.UserApi.UserApiSetAllowUpdateAlertParams,
  void
  >
  [ipcChannels.winMain.showSelectDialog]: IpcContract<
  Electron.OpenDialogOptions,
  Electron.OpenDialogReturnValue
  >
  [ipcChannels.winMain.showSaveDialog]: IpcContract<
  Electron.SaveDialogOptions,
  Electron.SaveDialogReturnValue
  >
  [ipcChannels.winMain.getCacheSize]: IpcContract<undefined, number>
  [ipcChannels.winMain.clearCache]: IpcContract<undefined, void>
  [ipcChannels.winMain.getOtherSource]: IpcContract<string, LX.Music.MusicInfoOnline[]>
  [ipcChannels.winMain.saveOtherSource]: IpcContract<LX.Music.MusicInfoOtherSourceSave, void>
  [ipcChannels.winMain.getOtherSourceCount]: IpcContract<undefined, number>
  [ipcChannels.winMain.clearOtherSource]: IpcContract<undefined, void>
  [ipcChannels.winMain.getMusicUrlCount]: IpcContract<undefined, number>
  [ipcChannels.winMain.getMusicUrl]: IpcContract<string, string>
  [ipcChannels.winMain.saveMusicUrl]: IpcContract<LX.Music.MusicUrlInfo, void>
  [ipcChannels.winMain.clearMusicUrl]: IpcContract<undefined, void>
  [ipcChannels.winMain.getLyricRaw]: IpcContract<string, LX.Music.LyricInfo>
  [ipcChannels.winMain.getLyricEdited]: IpcContract<string, LX.Music.LyricInfo>
  [ipcChannels.winMain.saveLyricRaw]: IpcContract<LX.Music.LyricInfoSave, void>
  [ipcChannels.winMain.saveLyricEdited]: IpcContract<LX.Music.LyricInfoSave, void>
  [ipcChannels.winMain.removeLyricEdited]: IpcContract<string, void>
  [ipcChannels.winMain.getLyricRawCount]: IpcContract<undefined, number>
  [ipcChannels.winMain.clearLyricRaw]: IpcContract<undefined, void>
  [ipcChannels.winMain.getLyricEditedCount]: IpcContract<undefined, number>
  [ipcChannels.winMain.clearLyricEdited]: IpcContract<undefined, void>
  [ipcChannels.winMain.hotKeyEnable]: IpcContract<boolean, void>
  [ipcChannels.winMain.hotKeySetConfig]: IpcContract<LX.HotKeyActions, void>
  [ipcChannels.winMain.hotKeyStatus]: IpcContract<
  undefined,
  LX.HotKeyState
  >
  [ipcChannels.winMain.syncAction]: IpcContract<
  LX.Sync.SyncServiceActions,
  unknown
  >
  [ipcChannels.winMain.syncGetServerDevices]: IpcContract<
  undefined,
  LX.Sync.ServerDevices
  >
  [ipcChannels.winMain.syncRemoveServerDevice]: IpcContract<string, void>
  [ipcChannels.winMain.close]: IpcContract<undefined, void>
  [ipcChannels.winMain.min]: IpcContract<undefined, void>
  [ipcChannels.winMain.max]: IpcContract<undefined, void>
  [ipcChannels.winMain.fullscreen]: IpcContract<boolean, boolean>
  [ipcChannels.winLyric.getConfig]: IpcContract<
  undefined,
  LX.DesktopLyric.Config
  >
  [ipcChannels.winLyric.setConfig]: IpcContract<
  Partial<LX.DesktopLyric.Config>,
  void
  >
}

export interface CoralIpcSendMap {
  [ipcChannels.common.clearEnvParamsDeeplink]: undefined
  [ipcChannels.player.invokePlayMusic]: LX.Music.MusicInfo | undefined
  [ipcChannels.player.invokePlayNext]: undefined
  [ipcChannels.player.invokePlayPrev]: undefined
  [ipcChannels.player.invokeTogglePlay]: undefined
  [ipcChannels.winMain.inited]: undefined
  [ipcChannels.winMain.openDirInExplorer]: string
  [ipcChannels.winMain.playerStatus]: Partial<LX.Player.Status>
  [ipcChannels.winMain.saveData]: IpcDataSaveParams
  [ipcChannels.winLyric.mouseEnterLeave]: boolean
  [ipcChannels.winLyric.requestMainWindowChannel]: undefined
  [ipcChannels.winLyric.setWinBounds]: LX.DesktopLyric.NewBounds
  [ipcChannels.winLyric.setWinResizeable]: boolean
}

export interface CoralIpcEventMap {
  [ipcChannels.common.deeplink]: string
  [ipcChannels.common.themeChange]: LX.ThemeSetting
  [ipcChannels.dislike.addDislikeMusicInfos]: LX.Dislike.DislikeMusicInfo[]
  [ipcChannels.dislike.clearDislikeMusicInfos]: undefined
  [ipcChannels.dislike.overwriteDislikeMusicInfos]: LX.Dislike.DislikeRules
  [ipcChannels.winMain.onConfigChange]: Partial<LX.AppSetting>
  [ipcChannels.winMain.downloadTaskAction]: IpcDownloadTaskAction
  [ipcChannels.winMain.playerActionOnButtonClick]: IpcPlayerActionClick
  [ipcChannels.winMain.syncAction]: LX.Sync.SyncMainWindowActions
  [ipcChannels.winLyric.mainWindowInited]: undefined
  [ipcChannels.winLyric.mouseEnterLeave]: boolean
  [ipcChannels.winLyric.onConfigChange]: Partial<LX.DesktopLyric.Config>
  [ipcChannels.winLyric.provideMainWindowChannel]: undefined
}

export type CoralIpcInvokeChannel = keyof CoralIpcInvokeMap
export type CoralIpcInvokeParams<Channel extends CoralIpcInvokeChannel> =
  CoralIpcInvokeMap[Channel]['params']
export type CoralIpcInvokeResult<Channel extends CoralIpcInvokeChannel> =
  CoralIpcInvokeMap[Channel]['result']

export type CoralIpcSendChannel = keyof CoralIpcSendMap
export type CoralIpcSendParams<Channel extends CoralIpcSendChannel> =
  CoralIpcSendMap[Channel]

export type CoralIpcEventChannel = keyof CoralIpcEventMap
export type CoralIpcEventPayload<Channel extends CoralIpcEventChannel> =
  CoralIpcEventMap[Channel]
