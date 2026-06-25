import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { mainHandle } from '@common/mainIpc'
import {
  clearDownloadTasks,
  pauseDownloadTask,
  removeDownloadTasks,
  startDownloadTask,
} from '../downloadRuntime'


export default () => {
  mainHandle<LX.Download.ListItem[]>(WIN_MAIN_RENDERER_EVENT_NAME.download_list_get, async() => {
    return global.lx.worker.dbService.getDownloadList()
  })
  mainHandle<LX.Download.saveDownloadMusicInfo>(WIN_MAIN_RENDERER_EVENT_NAME.download_list_add, async({ params: { list, addMusicLocationType } }) => {
    await global.lx.worker.dbService.downloadInfoSave(list, addMusicLocationType)
  })
  mainHandle<LX.Download.ListItem[]>(WIN_MAIN_RENDERER_EVENT_NAME.download_list_update, async({ params: list }) => {
    await global.lx.worker.dbService.downloadInfoUpdate(list)
  })
  mainHandle<string[]>(WIN_MAIN_RENDERER_EVENT_NAME.download_list_remove, async({ params: ids }) => {
    await removeDownloadTasks(ids)
    await global.lx.worker.dbService.downloadInfoRemove(ids)
  })
  mainHandle(WIN_MAIN_RENDERER_EVENT_NAME.download_list_clear, async() => {
    await clearDownloadTasks()
    await global.lx.worker.dbService.downloadInfoClear()
  })
  mainHandle<{ task: LX.Download.ListItem, url: string, isRetry?: boolean }, LX.Download.ListItem>(WIN_MAIN_RENDERER_EVENT_NAME.download_task_start, async({ params }) => {
    return startDownloadTask(params)
  })
  mainHandle<string, LX.Download.ListItem | null>(WIN_MAIN_RENDERER_EVENT_NAME.download_task_pause, async({ params: taskId }) => {
    return pauseDownloadTask(taskId)
  })
  mainHandle<{ task: LX.Download.ListItem, url: string, isRetry?: boolean }, LX.Download.ListItem>(WIN_MAIN_RENDERER_EVENT_NAME.download_task_retry, async({ params }) => {
    return startDownloadTask({ ...params, isRetry: true })
  })
}
