import { PLAYER_EVENT_NAME } from '@common/ipcNames';

// 发送列表操作事件到渲染进程的注册方法
// 哪个渲染进程需要接收则引入此方法注册
export const registerRendererEvents = (
  sendEvent: <T = any>(name: string, params?: T | undefined) => void,
) => {
  const list_data_overwrite = async (listData: Coral.List.ListActionDataOverwrite) => {
    sendEvent<Coral.List.ListActionDataOverwrite>(PLAYER_EVENT_NAME.list_data_overwire, listData);
  };
  const list_create = async (position: number, listInfos: Coral.List.UserListInfo[]) => {
    sendEvent<Coral.List.ListActionAdd>(PLAYER_EVENT_NAME.list_add, { position, listInfos });
  };
  const list_remove = async (ids: string[]) => {
    sendEvent<Coral.List.ListActionRemove>(PLAYER_EVENT_NAME.list_remove, ids);
  };
  const list_update = async (lists: Coral.List.UserListInfo[]) => {
    sendEvent<Coral.List.ListActionUpdate>(PLAYER_EVENT_NAME.list_update, lists);
  };
  const list_update_position = async (position: number, ids: string[]) => {
    sendEvent<Coral.List.ListActionUpdatePosition>(PLAYER_EVENT_NAME.list_update_position, {
      position,
      ids,
    });
  };
  const list_music_add = async (
    id: string,
    musicInfos: Coral.Music.MusicInfo[],
    addMusicLocationType: Coral.AddMusicLocationType,
  ) => {
    sendEvent<Coral.List.ListActionMusicAdd>(PLAYER_EVENT_NAME.list_music_add, {
      id,
      musicInfos,
      addMusicLocationType,
    });
  };
  const list_music_move = async (
    fromId: string,
    toId: string,
    musicInfos: Coral.Music.MusicInfo[],
    addMusicLocationType: Coral.AddMusicLocationType,
  ) => {
    sendEvent<Coral.List.ListActionMusicMove>(PLAYER_EVENT_NAME.list_music_move, {
      fromId,
      toId,
      musicInfos,
      addMusicLocationType,
    });
  };
  const list_music_remove = async (listId: string, ids: string[]) => {
    sendEvent<Coral.List.ListActionMusicRemove>(PLAYER_EVENT_NAME.list_music_remove, {
      listId,
      ids,
    });
  };
  const list_music_update = async (musicInfos: Coral.List.ListActionMusicUpdate) => {
    sendEvent<Coral.List.ListActionMusicUpdate>(PLAYER_EVENT_NAME.list_music_update, musicInfos);
  };
  const list_music_update_position = async (listId: string, position: number, ids: string[]) => {
    sendEvent<Coral.List.ListActionMusicUpdatePosition>(
      PLAYER_EVENT_NAME.list_music_update_position,
      {
        listId,
        position,
        ids,
      },
    );
  };
  const list_music_overwrite = async (listId: string, musicInfos: Coral.Music.MusicInfo[]) => {
    sendEvent<Coral.List.ListActionMusicOverwrite>(PLAYER_EVENT_NAME.list_music_overwrite, {
      listId,
      musicInfos,
    });
  };
  const list_music_clear = async (ids: string[]) => {
    sendEvent<Coral.List.ListActionMusicClear>(PLAYER_EVENT_NAME.list_data_overwire, ids);
  };
  global.coral.event_list.on('list_data_overwrite', list_data_overwrite);
  global.coral.event_list.on('list_create', list_create);
  global.coral.event_list.on('list_remove', list_remove);
  global.coral.event_list.on('list_update', list_update);
  global.coral.event_list.on('list_update_position', list_update_position);
  global.coral.event_list.on('list_music_add', list_music_add);
  global.coral.event_list.on('list_music_move', list_music_move);
  global.coral.event_list.on('list_music_remove', list_music_remove);
  global.coral.event_list.on('list_music_update', list_music_update);
  global.coral.event_list.on('list_music_update_position', list_music_update_position);
  global.coral.event_list.on('list_music_overwrite', list_music_overwrite);
  global.coral.event_list.on('list_music_clear', list_music_clear);

  return () => {
    global.coral.event_list.off('list_data_overwrite', list_data_overwrite);
    global.coral.event_list.off('list_create', list_create);
    global.coral.event_list.off('list_remove', list_remove);
    global.coral.event_list.off('list_update', list_update);
    global.coral.event_list.off('list_update_position', list_update_position);
    global.coral.event_list.off('list_music_add', list_music_add);
    global.coral.event_list.off('list_music_move', list_music_move);
    global.coral.event_list.off('list_music_remove', list_music_remove);
    global.coral.event_list.off('list_music_update', list_music_update);
    global.coral.event_list.off('list_music_update_position', list_music_update_position);
    global.coral.event_list.off('list_music_overwrite', list_music_overwrite);
    global.coral.event_list.off('list_music_clear', list_music_clear);
  };
};
