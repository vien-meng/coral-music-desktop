import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames';
import { mainHandle } from '@common/mainIpc';
import {
  clearDownloadTasks,
  pauseDownloadTask,
  removeDownloadTasks,
  startDownloadTask,
} from '../downloadRuntime';

export default () => {
  mainHandle<Coral.Download.ListItem[]>(WIN_MAIN_RENDERER_EVENT_NAME.download_list_get, async () =>
    global.coral.worker.dbService.getDownloadList(),
  );
  mainHandle<Coral.Download.saveDownloadMusicInfo>(
    WIN_MAIN_RENDERER_EVENT_NAME.download_list_add,
    async ({ params: { list, addMusicLocationType } }) => {
      await global.coral.worker.dbService.downloadInfoSave(list, addMusicLocationType);
    },
  );
  mainHandle<Coral.Download.ListItem[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.download_list_update,
    async ({ params: list }) => {
      await global.coral.worker.dbService.downloadInfoUpdate(list);
    },
  );
  mainHandle<string[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.download_list_remove,
    async ({ params: ids }) => {
      await removeDownloadTasks(ids);
      await global.coral.worker.dbService.downloadInfoRemove(ids);
    },
  );
  mainHandle(WIN_MAIN_RENDERER_EVENT_NAME.download_list_clear, async () => {
    await clearDownloadTasks();
    await global.coral.worker.dbService.downloadInfoClear();
  });
  mainHandle<
    { task: Coral.Download.ListItem; url: string; isRetry?: boolean },
    Coral.Download.ListItem
  >(WIN_MAIN_RENDERER_EVENT_NAME.download_task_start, async ({ params }) =>
    startDownloadTask(params),
  );
  mainHandle<string, Coral.Download.ListItem | null>(
    WIN_MAIN_RENDERER_EVENT_NAME.download_task_pause,
    async ({ params: taskId }) => pauseDownloadTask(taskId),
  );
  mainHandle<
    { task: Coral.Download.ListItem; url: string; isRetry?: boolean },
    Coral.Download.ListItem
  >(WIN_MAIN_RENDERER_EVENT_NAME.download_task_retry, async ({ params }) =>
    startDownloadTask({ ...params, isRetry: true }),
  );
};
