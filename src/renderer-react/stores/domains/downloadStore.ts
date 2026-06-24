import { makeAutoObservable, observable } from 'mobx'
import * as downloadService from '../../services/downloadService'

export class DownloadStore {
  actionError: string | null = null
  hydrateError: string | null = null
  isHydrated = false
  isHydrating = false
  isMutatingTask = false
  tasks: LX.Download.ListItem[] = []

  constructor() {
    makeAutoObservable(
      this,
      {
        tasks: observable.shallow,
      },
      { autoBind: true },
    )
  }

  get taskCount(): number {
    return this.tasks.length
  }

  get completedTaskCount(): number {
    return this.tasks.filter(task => task.status === 'completed' || task.isComplate).length
  }

  get playableTasks(): LX.Download.ListItem[] {
    return this.tasks.filter(task => task.status === 'completed' || task.isComplate)
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return

    this.isHydrating = true
    this.hydrateError = null

    try {
      this.tasks = await downloadService.getDownloadTasks()
      this.isHydrated = true
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isHydrating = false
    }
  }

  async refreshTasks(): Promise<void> {
    this.isHydrating = true
    this.hydrateError = null

    try {
      this.tasks = await downloadService.getDownloadTasks()
      this.isHydrated = true
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isHydrating = false
    }
  }

  async removeTask(taskId: string): Promise<void> {
    await this.removeTasks([taskId])
  }

  async removeTasks(taskIds: string[]): Promise<void> {
    const ids = Array.from(new Set(taskIds)).filter(Boolean)
    if (!ids.length) return

    this.isMutatingTask = true
    this.actionError = null

    try {
      await downloadService.removeDownloadTasks(ids)
      const removeIdSet = new Set(ids)
      this.tasks = this.tasks.filter(task => !removeIdSet.has(task.id))
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isMutatingTask = false
    }
  }

  async clearTasks(): Promise<void> {
    if (!this.tasks.length) return

    this.isMutatingTask = true
    this.actionError = null

    try {
      await downloadService.clearDownloadTasks()
      this.tasks = []
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isMutatingTask = false
    }
  }

  openTaskFile(task: LX.Download.ListItem): void {
    if (!task.metadata.filePath) return
    downloadService.openDownloadTaskFile(task.metadata.filePath)
  }
}
