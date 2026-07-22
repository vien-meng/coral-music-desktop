import { makeAutoObservable, observable } from 'mobx';
import type { IpcDownloadTaskAction } from '@shared/ipc/contracts';
import * as downloadService from '../../services/downloadService';
import type { SettingsStore } from './settingsStore';

export class DownloadStore {
  actionError: string | null = null;

  hydrateError: string | null = null;

  isHydrated = false;

  isHydrating = false;

  isMutatingTask = false;

  tasks: Coral.Download.ListItem[] = [];

  private readonly settings?: SettingsStore;

  private runtimeDisposer: (() => void) | null = null;

  private readonly queuedTaskIds = new Set<string>();

  private readonly activeStartTaskIds = new Set<string>();

  private readonly autoRetryCounts = new Map<string, number>();

  private isPumpingQueue = false;

  constructor(settings?: SettingsStore) {
    this.settings = settings;
    makeAutoObservable<
      this,
      | 'settings'
      | 'runtimeDisposer'
      | 'queuedTaskIds'
      | 'activeStartTaskIds'
      | 'autoRetryCounts'
      | 'isPumpingQueue'
    >(
      this,
      {
        activeStartTaskIds: false,
        autoRetryCounts: false,
        isPumpingQueue: false,
        queuedTaskIds: false,
        settings: false,
        tasks: observable.shallow,
        runtimeDisposer: false,
      },
      { autoBind: true },
    );
  }

  get taskCount(): number {
    return this.tasks.length;
  }

  get completedTaskCount(): number {
    return this.tasks.filter((task) => task.status === 'completed' || task.isComplate).length;
  }

  get waitingTaskCount(): number {
    return this.tasks.filter((task) => task.status === 'waiting').length;
  }

  get playableTasks(): Coral.Download.ListItem[] {
    return this.tasks.filter((task) => task.status === 'completed' || task.isComplate);
  }

  get maxConcurrentTaskCount(): number {
    return this.settings?.appSetting?.['download.maxDownloadNum'] ?? 3;
  }

  get isDownloadEnabled(): boolean {
    return this.settings?.appSetting?.['download.enable'] ?? true;
  }

  get runningTaskCount(): number {
    return this.tasks.filter((task) => task.status === 'run').length;
  }

  get queuedTaskCount(): number {
    return this.tasks.filter((task) => this.queuedTaskIds.has(task.id) || task.status === 'waiting')
      .length;
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return;

    this.bindRuntime();
    this.isHydrating = true;
    this.hydrateError = null;

    try {
      this.tasks = await downloadService.getDownloadTasks();
      this.isHydrated = true;
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isHydrating = false;
    }
  }

  async refreshTasks(): Promise<void> {
    this.bindRuntime();
    this.isHydrating = true;
    this.hydrateError = null;

    try {
      this.tasks = await downloadService.getDownloadTasks();
      this.isHydrated = true;
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isHydrating = false;
    }
  }

  async removeTask(taskId: string): Promise<void> {
    await this.removeTasks([taskId]);
  }

  async removeTasks(taskIds: string[]): Promise<void> {
    const ids = Array.from(new Set(taskIds)).filter(Boolean);
    if (!ids.length) return;

    this.isMutatingTask = true;
    this.actionError = null;

    try {
      await downloadService.removeDownloadTasks(ids);
      for (const id of ids) {
        this.queuedTaskIds.delete(id);
        this.activeStartTaskIds.delete(id);
        this.autoRetryCounts.delete(id);
      }
      const removeIdSet = new Set(ids);
      this.tasks = this.tasks.filter((task) => !removeIdSet.has(task.id));
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingTask = false;
    }
  }

  async clearTasks(): Promise<void> {
    if (!this.tasks.length) return;

    this.isMutatingTask = true;
    this.actionError = null;

    try {
      await downloadService.clearDownloadTasks();
      this.queuedTaskIds.clear();
      this.activeStartTaskIds.clear();
      this.autoRetryCounts.clear();
      this.tasks = [];
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingTask = false;
    }
  }

  openTaskFile(task: Coral.Download.ListItem): void {
    if (!task.metadata.filePath) return;
    downloadService.openDownloadTaskFile(task.metadata.filePath);
  }

  async startTask(taskId: string): Promise<void> {
    if (!this.isDownloadEnabled) {
      this.actionError = '下载功能已在设置中关闭';
      return;
    }
    const task = this.getTaskById(taskId);
    if (!task) return;

    this.enqueueTask(task);
    await this.pumpQueue();
  }

  async retryTask(taskId: string): Promise<void> {
    const task = this.getTaskById(taskId);
    if (!task) return;

    this.autoRetryCounts.delete(taskId);
    this.enqueueTask(task);
    await this.pumpQueue();
  }

  async pauseTask(taskId: string): Promise<void> {
    if (this.queuedTaskIds.delete(taskId)) {
      const task = this.getTaskById(taskId);
      if (!task) return;
      this.upsertTask({
        ...task,
        status: 'pause',
        statusText: '已暂停',
      });
      await downloadService.updateDownloadTasks([this.getTaskById(taskId)!]);
      return;
    }

    this.isMutatingTask = true;
    this.actionError = null;

    try {
      const nextTask = await downloadService.pauseDownloadTask(taskId);
      if (nextTask) this.upsertTask(nextTask);
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingTask = false;
    }
  }

  async startTasks(taskIds: string[]): Promise<void> {
    if (!this.isDownloadEnabled) {
      this.actionError = '下载功能已在设置中关闭';
      return;
    }
    const ids = Array.from(new Set(taskIds)).filter(Boolean);
    for (const id of ids) {
      const task = this.getTaskById(id);
      if (task) this.enqueueTask(task);
    }
    await this.pumpQueue();
  }

  async addAndStartTasks(tasks: Coral.Download.ListItem[]): Promise<void> {
    if (!tasks.length) return;
    if (!this.isDownloadEnabled) {
      this.actionError = '下载功能已在设置中关闭';
      return;
    }
    this.isMutatingTask = true;
    this.actionError = null;

    try {
      await downloadService.addDownloadTasks(tasks);
      for (const task of tasks) {
        this.upsertTask(task);
        this.enqueueTask(task);
      }
      await this.pumpQueue();
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingTask = false;
    }
  }

  async pauseTasks(taskIds: string[]): Promise<void> {
    const ids = Array.from(new Set(taskIds)).filter(Boolean);
    for (const id of ids) {
      const task = this.getTaskById(id);
      if (!task || task.status !== 'run') continue;
      await this.pauseTask(id);
    }
    await this.pumpQueue();
  }

  bindRuntime(): void {
    if (this.runtimeDisposer) return;
    this.runtimeDisposer = downloadService.onDownloadTaskAction((action) => {
      this.applyRuntimeAction(action);
    });
  }

  disposeRuntime(): void {
    this.runtimeDisposer?.();
    this.runtimeDisposer = null;
  }

  private applyRuntimeAction(action: IpcDownloadTaskAction): void {
    if (action.task) this.upsertTask(action.task);

    if (action.action.action === 'refreshUrl') {
      const task = action.task ?? this.getTaskById(action.taskId);
      if (task && this.shouldAutoRetry(task.id)) {
        downloadService
          .startDownloadTask(task, { isRefresh: true, isRetry: true })
          .then((nextTask) => {
            this.upsertTask(nextTask);
          })
          .catch((error) => {
            this.actionError = error instanceof Error ? error.message : String(error);
          });
      }
      return;
    }

    if (action.action.action === 'complete') {
      this.autoRetryCounts.delete(action.taskId);
    }

    if (
      action.action.action === 'complete' ||
      action.action.action === 'error' ||
      action.action.action === 'statusText'
    ) {
      this.pumpQueue();
    }
  }

  private getTaskById(taskId: string): Coral.Download.ListItem | null {
    return this.tasks.find((task) => task.id === taskId) ?? null;
  }

  private upsertTask(task: Coral.Download.ListItem): void {
    const index = this.tasks.findIndex((item) => item.id === task.id);
    if (index < 0) {
      this.tasks = [task, ...this.tasks];
      return;
    }
    const nextTasks = [...this.tasks];
    nextTasks[index] = task;
    this.tasks = nextTasks;
  }

  private enqueueTask(task: Coral.Download.ListItem): void {
    if (!this.isRunnableTask(task)) return;
    this.queuedTaskIds.add(task.id);
    if (task.status !== 'waiting' || task.statusText !== '排队中') {
      const queuedTask: Coral.Download.ListItem = {
        ...task,
        isComplate: false,
        speed: '',
        status: 'waiting',
        statusText: '排队中',
      };
      this.upsertTask(queuedTask);
      downloadService.updateDownloadTasks([queuedTask]);
    }
  }

  private isRunnableTask(task: Coral.Download.ListItem): boolean {
    return task.status === 'waiting' || task.status === 'pause' || task.status === 'error';
  }

  private getAvailableQueueSlots(): number {
    const max = Math.max(1, this.maxConcurrentTaskCount);
    return Math.max(0, max - this.runningTaskCount - this.activeStartTaskIds.size);
  }

  private async pumpQueue(): Promise<void> {
    if (this.isPumpingQueue) return;
    this.isPumpingQueue = true;

    try {
      const startPromises: Array<Promise<void>> = [];
      while (this.getAvailableQueueSlots() > startPromises.length) {
        const taskId = Array.from(this.queuedTaskIds).find((id) => {
          const task = this.getTaskById(id);
          return task ? this.isRunnableTask(task) : false;
        });
        if (!taskId) break;

        this.queuedTaskIds.delete(taskId);
        startPromises.push(this.startQueuedTask(taskId));
      }

      await Promise.all(startPromises);
    } finally {
      this.isPumpingQueue = false;
    }
  }

  private async startQueuedTask(taskId: string): Promise<void> {
    const task = this.getTaskById(taskId);
    if (!task) return;

    this.activeStartTaskIds.add(taskId);
    this.isMutatingTask = true;
    this.actionError = null;

    try {
      const nextTask = await downloadService.startDownloadTask(task, {
        ensureLyric: this.shouldPrepareDownloadLyric(),
        isRefresh: task.status === 'error',
        isRetry: task.status === 'error',
      });
      this.upsertTask(nextTask);
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
      const failedTask = this.getTaskById(taskId);
      if (failedTask) {
        const nextTask: Coral.Download.ListItem = {
          ...failedTask,
          status: 'error',
          statusText: this.actionError,
        };
        this.upsertTask(nextTask);
        await downloadService.updateDownloadTasks([nextTask]);
      }
    } finally {
      this.activeStartTaskIds.delete(taskId);
      this.isMutatingTask = this.activeStartTaskIds.size > 0;
    }
  }

  private shouldAutoRetry(taskId: string): boolean {
    const count = this.autoRetryCounts.get(taskId) ?? 0;
    if (count >= 2) {
      const task = this.getTaskById(taskId);
      if (task) {
        const nextTask: Coral.Download.ListItem = {
          ...task,
          status: 'error',
          statusText: '下载地址刷新失败',
        };
        this.upsertTask(nextTask);
        downloadService.updateDownloadTasks([nextTask]);
      }
      return false;
    }

    this.autoRetryCounts.set(taskId, count + 1);
    return true;
  }

  private shouldPrepareDownloadLyric(): boolean {
    const setting = this.settings?.appSetting;
    if (!setting) return false;
    return (
      setting['download.isDownloadLrc'] ||
      setting['download.isEmbedLyric'] ||
      setting['download.isEmbedLyricLx'] ||
      setting['download.isEmbedLyricT'] ||
      setting['download.isEmbedLyricR']
    );
  }
}
