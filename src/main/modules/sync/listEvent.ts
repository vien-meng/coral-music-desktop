import { LIST_IDS } from '@common/constants';

// 构建列表信息对象，用于统一字段位置顺序
export const buildUserListInfoFull = ({
  id,
  name,
  source,
  sourceListId,
  list,
  locationUpdateTime,
}: Coral.List.UserListInfoFull) => ({
  id,
  name,
  source,
  sourceListId,
  locationUpdateTime,
  list,
});

export const getLocalListData = async (): Promise<Coral.Sync.List.ListData> => {
  const lists: Coral.Sync.List.ListData = {
    defaultList: await global.coral.worker.dbService.getListMusics(LIST_IDS.DEFAULT),
    loveList: await global.coral.worker.dbService.getListMusics(LIST_IDS.LOVE),
    userList: [],
  };

  const userListInfos = await global.coral.worker.dbService.getAllUserList();
  for await (const list of userListInfos) {
    lists.userList.push(
      await global.coral.worker.dbService
        .getListMusics(list.id)
        .then((musics) => buildUserListInfoFull({ ...list, list: musics })),
    );
  }

  return lists;
};

export const setLocalListData = async (listData: Coral.Sync.List.ListData) => {
  await global.coral.event_list.list_data_overwrite(listData, true);
};

export const registerListActionEvent = (
  sendListAction: (action: Coral.Sync.List.ActionList) => void | Promise<void>,
) => {
  const list_data_overwrite = async (
    listData: MakeOptional<Coral.List.ListDataFull, 'tempList'>,
    isRemote: boolean = false,
  ) => {
    if (isRemote) return;
    await sendListAction({ action: 'list_data_overwrite', data: listData });
  };
  const list_create = async (
    position: number,
    listInfos: Coral.List.UserListInfo[],
    isRemote: boolean = false,
  ) => {
    if (isRemote) return;
    await sendListAction({ action: 'list_create', data: { position, listInfos } });
  };
  const list_remove = async (ids: string[], isRemote: boolean = false) => {
    if (isRemote) return;
    await sendListAction({ action: 'list_remove', data: ids });
  };
  const list_update = async (lists: Coral.List.UserListInfo[], isRemote: boolean = false) => {
    if (isRemote) return;
    await sendListAction({ action: 'list_update', data: lists });
  };
  const list_update_position = async (
    position: number,
    ids: string[],
    isRemote: boolean = false,
  ) => {
    if (isRemote) return;
    await sendListAction({ action: 'list_update_position', data: { position, ids } });
  };
  const list_music_overwrite = async (
    listId: string,
    musicInfos: Coral.Music.MusicInfo[],
    isRemote: boolean = false,
  ) => {
    if (isRemote || listId == LIST_IDS.TEMP) return;
    await sendListAction({ action: 'list_music_overwrite', data: { listId, musicInfos } });
  };
  const list_music_add = async (
    id: string,
    musicInfos: Coral.Music.MusicInfo[],
    addMusicLocationType: Coral.AddMusicLocationType,
    isRemote: boolean = false,
  ) => {
    if (isRemote) return;
    await sendListAction({
      action: 'list_music_add',
      data: { id, musicInfos, addMusicLocationType },
    });
  };
  const list_music_move = async (
    fromId: string,
    toId: string,
    musicInfos: Coral.Music.MusicInfo[],
    addMusicLocationType: Coral.AddMusicLocationType,
    isRemote: boolean = false,
  ) => {
    if (isRemote) return;
    await sendListAction({
      action: 'list_music_move',
      data: { fromId, toId, musicInfos, addMusicLocationType },
    });
  };
  const list_music_remove = async (listId: string, ids: string[], isRemote: boolean = false) => {
    if (isRemote || listId == LIST_IDS.TEMP) return;
    await sendListAction({ action: 'list_music_remove', data: { listId, ids } });
  };
  const list_music_update = async (
    musicInfos: Coral.List.ListActionMusicUpdate,
    isRemote: boolean = false,
  ) => {
    musicInfos = musicInfos.filter((item) => item.id != LIST_IDS.TEMP);
    if (isRemote || !musicInfos.length) return;
    await sendListAction({ action: 'list_music_update', data: musicInfos });
  };
  const list_music_clear = async (ids: string[], isRemote: boolean = false) => {
    if (isRemote) return;
    await sendListAction({ action: 'list_music_clear', data: ids });
  };
  const list_music_update_position = async (
    listId: string,
    position: number,
    ids: string[],
    isRemote: boolean = false,
  ) => {
    if (isRemote || listId == LIST_IDS.TEMP) return;
    await sendListAction({ action: 'list_music_update_position', data: { listId, position, ids } });
  };
  global.coral.event_list.on('list_data_overwrite', list_data_overwrite);
  global.coral.event_list.on('list_create', list_create);
  global.coral.event_list.on('list_remove', list_remove);
  global.coral.event_list.on('list_update', list_update);
  global.coral.event_list.on('list_update_position', list_update_position);
  global.coral.event_list.on('list_music_overwrite', list_music_overwrite);
  global.coral.event_list.on('list_music_add', list_music_add);
  global.coral.event_list.on('list_music_move', list_music_move);
  global.coral.event_list.on('list_music_remove', list_music_remove);
  global.coral.event_list.on('list_music_update', list_music_update);
  global.coral.event_list.on('list_music_clear', list_music_clear);
  global.coral.event_list.on('list_music_update_position', list_music_update_position);
  return () => {
    global.coral.event_list.off('list_data_overwrite', list_data_overwrite);
    global.coral.event_list.off('list_create', list_create);
    global.coral.event_list.off('list_remove', list_remove);
    global.coral.event_list.off('list_update', list_update);
    global.coral.event_list.off('list_update_position', list_update_position);
    global.coral.event_list.off('list_music_overwrite', list_music_overwrite);
    global.coral.event_list.off('list_music_add', list_music_add);
    global.coral.event_list.off('list_music_move', list_music_move);
    global.coral.event_list.off('list_music_remove', list_music_remove);
    global.coral.event_list.off('list_music_update', list_music_update);
    global.coral.event_list.off('list_music_clear', list_music_clear);
    global.coral.event_list.off('list_music_update_position', list_music_update_position);
  };
};

export const handleRemoteListAction = async ({ action, data }: Coral.Sync.List.ActionList) => {
  // console.log('handleRemoteListAction', action)

  switch (action) {
    case 'list_data_overwrite':
      await global.coral.event_list.list_data_overwrite(data, true);
      break;
    case 'list_create':
      await global.coral.event_list.list_create(data.position, data.listInfos, true);
      break;
    case 'list_remove':
      await global.coral.event_list.list_remove(data, true);
      break;
    case 'list_update':
      await global.coral.event_list.list_update(data, true);
      break;
    case 'list_update_position':
      await global.coral.event_list.list_update_position(data.position, data.ids, true);
      break;
    case 'list_music_add':
      await global.coral.event_list.list_music_add(
        data.id,
        data.musicInfos,
        data.addMusicLocationType,
        true,
      );
      break;
    case 'list_music_move':
      await global.coral.event_list.list_music_move(
        data.fromId,
        data.toId,
        data.musicInfos,
        data.addMusicLocationType,
        true,
      );
      break;
    case 'list_music_remove':
      await global.coral.event_list.list_music_remove(data.listId, data.ids, true);
      break;
    case 'list_music_update':
      await global.coral.event_list.list_music_update(data, true);
      break;
    case 'list_music_update_position':
      await global.coral.event_list.list_music_update_position(
        data.listId,
        data.position,
        data.ids,
        true,
      );
      break;
    case 'list_music_overwrite':
      await global.coral.event_list.list_music_overwrite(data.listId, data.musicInfos, true);
      break;
    case 'list_music_clear':
      await global.coral.event_list.list_music_clear(data, true);
      break;
    default:
      throw new Error('unknown list sync action');
  }
};
