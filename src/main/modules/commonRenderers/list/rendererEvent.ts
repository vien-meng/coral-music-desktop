import { mainHandle } from '@common/mainIpc';
import { PLAYER_EVENT_NAME } from '@common/ipcNames';

// 列表操作事件（公共，只注册一次）
export default () => {
  mainHandle<Coral.List.UserListInfo[]>(PLAYER_EVENT_NAME.list_get, async () =>
    global.coral.worker.dbService.getAllUserList(),
  );
  mainHandle<Coral.List.ListActionDataOverwrite>(
    PLAYER_EVENT_NAME.list_data_overwire,
    async ({ params: listData }) => {
      await global.coral.event_list.list_data_overwrite(listData, false);
    },
  );
  mainHandle<Coral.List.ListActionAdd>(
    PLAYER_EVENT_NAME.list_add,
    async ({ params: { position, listInfos } }) => {
      await global.coral.event_list.list_create(position, listInfos, false);
    },
  );
  mainHandle<Coral.List.ListActionRemove>(
    PLAYER_EVENT_NAME.list_remove,
    async ({ params: ids }) => {
      await global.coral.event_list.list_remove(ids, false);
    },
  );
  mainHandle<Coral.List.ListActionUpdate>(
    PLAYER_EVENT_NAME.list_update,
    async ({ params: listInfos }) => {
      await global.coral.event_list.list_update(listInfos, false);
    },
  );
  mainHandle<Coral.List.ListActionUpdatePosition>(
    PLAYER_EVENT_NAME.list_update_position,
    async ({ params: { position, ids } }) => {
      await global.coral.event_list.list_update_position(position, ids, false);
    },
  );
  mainHandle<string, Coral.Music.MusicInfo[]>(
    PLAYER_EVENT_NAME.list_music_get,
    async ({ params: listId }) => global.coral.worker.dbService.getListMusics(listId),
  );
  mainHandle<Coral.List.ListActionMusicAdd>(
    PLAYER_EVENT_NAME.list_music_add,
    async ({ params: { id, musicInfos, addMusicLocationType } }) => {
      await global.coral.event_list.list_music_add(id, musicInfos, addMusicLocationType, false);
    },
  );
  mainHandle<Coral.List.ListActionMusicMove>(
    PLAYER_EVENT_NAME.list_music_move,
    async ({ params: { fromId, toId, musicInfos, addMusicLocationType } }) => {
      await global.coral.event_list.list_music_move(
        fromId,
        toId,
        musicInfos,
        addMusicLocationType,
        false,
      );
    },
  );
  mainHandle<Coral.List.ListActionMusicRemove>(
    PLAYER_EVENT_NAME.list_music_remove,
    async ({ params: { listId, ids } }) => {
      await global.coral.event_list.list_music_remove(listId, ids, false);
    },
  );
  mainHandle<Coral.List.ListActionMusicUpdate>(
    PLAYER_EVENT_NAME.list_music_update,
    async ({ params: musicInfos }) => {
      await global.coral.event_list.list_music_update(musicInfos, false);
    },
  );
  mainHandle<Coral.List.ListActionMusicUpdatePosition>(
    PLAYER_EVENT_NAME.list_music_update_position,
    async ({ params: { listId, position, ids } }) => {
      await global.coral.event_list.list_music_update_position(listId, position, ids, false);
    },
  );
  mainHandle<Coral.List.ListActionMusicOverwrite>(
    PLAYER_EVENT_NAME.list_music_overwrite,
    async ({ params: { listId, musicInfos } }) => {
      await global.coral.event_list.list_music_overwrite(listId, musicInfos, false);
    },
  );
  mainHandle<Coral.List.ListActionMusicClear>(
    PLAYER_EVENT_NAME.list_music_clear,
    async ({ params: listId }) => {
      await global.coral.event_list.list_music_clear(listId, false);
    },
  );
  mainHandle<Coral.List.ListActionCheckMusicExistList, boolean>(
    PLAYER_EVENT_NAME.list_music_check_exist,
    async ({ params: { listId, musicInfoId } }) =>
      global.coral.worker.dbService.checkListExistMusic(listId, musicInfoId),
  );
  mainHandle<string, string[]>(
    PLAYER_EVENT_NAME.list_music_get_list_ids,
    async ({ params: musicInfoId }) =>
      global.coral.worker.dbService.getMusicExistListIds(musicInfoId),
  );
};
