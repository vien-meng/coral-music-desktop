import { mainHandle } from '@common/mainIpc';
import { DISLIKE_EVENT_NAME } from '@common/ipcNames';

// 列表操作事件（公共，只注册一次）
export default () => {
  mainHandle<Coral.Dislike.DislikeInfo>(DISLIKE_EVENT_NAME.get_dislike_music_infos, async () =>
    global.coral.worker.dbService.getDislikeListInfo(),
  );
  mainHandle<Coral.Dislike.DislikeMusicInfo[]>(
    DISLIKE_EVENT_NAME.add_dislike_music_infos,
    async ({ params: listData }) => {
      await global.coral.event_dislike.dislike_music_add(listData, false);
    },
  );
  mainHandle<Coral.Dislike.DislikeRules>(
    DISLIKE_EVENT_NAME.overwrite_dislike_music_infos,
    async ({ params: rules }) => {
      await global.coral.event_dislike.dislike_data_overwrite(rules, false);
    },
  );
  mainHandle(DISLIKE_EVENT_NAME.clear_dislike_music_infos, async () => {
    await global.coral.event_dislike.dislike_music_clear(false);
  });
};
