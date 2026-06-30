export const getLocalDislikeData = async (): Promise<Coral.Dislike.DislikeRules> =>
  (await global.coral.worker.dbService.getDislikeListInfo()).rules;

export const setLocalDislikeData = async (listData: Coral.Dislike.DislikeRules) => {
  await global.coral.event_dislike.dislike_data_overwrite(listData, true);
};

export const registerDislikeActionEvent = (
  sendDislikeAction: (action: Coral.Sync.Dislike.ActionList) => void | Promise<void>,
) => {
  const dislike_music_add = async (
    listData: Coral.Dislike.DislikeMusicInfo[],
    isRemote: boolean = false,
  ) => {
    if (isRemote) return;
    await sendDislikeAction({ action: 'dislike_music_add', data: listData });
  };
  const dislike_data_overwrite = async (
    listInfos: Coral.Dislike.DislikeRules,
    isRemote: boolean = false,
  ) => {
    if (isRemote) return;
    await sendDislikeAction({ action: 'dislike_data_overwrite', data: listInfos });
  };
  const dislike_music_clear = async (isRemote: boolean = false) => {
    if (isRemote) return;
    await sendDislikeAction({ action: 'dislike_music_clear' });
  };

  global.coral.event_dislike.on('dislike_music_add', dislike_music_add);
  global.coral.event_dislike.on('dislike_data_overwrite', dislike_data_overwrite);
  global.coral.event_dislike.on('dislike_music_clear', dislike_music_clear);
  return () => {
    global.coral.event_dislike.off('dislike_music_add', dislike_music_add);
    global.coral.event_dislike.off('dislike_data_overwrite', dislike_data_overwrite);
    global.coral.event_dislike.off('dislike_music_clear', dislike_music_clear);
  };
};

export const handleRemoteDislikeAction = async (event: Coral.Sync.Dislike.ActionList) => {
  // console.log('handleRemoteDislikeAction', event)

  switch (event.action) {
    case 'dislike_music_add':
      await global.coral.event_dislike.dislike_music_add(event.data, true);
      break;
    case 'dislike_data_overwrite':
      await global.coral.event_dislike.dislike_data_overwrite(event.data, true);
      break;
    case 'dislike_music_clear':
      await global.coral.event_dislike.dislike_music_clear(true);
      break;
    default:
      throw new Error('unknown list sync action');
  }
};
