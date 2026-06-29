import { makeAutoObservable } from 'mobx';
import { syncService } from '../../services/syncService';

export class SyncStore {
  actionError: string | null = null;

  hydrateError: string | null = null;

  isHydrated = false;

  isHydrating = false;

  isMutating = false;

  lastAction: LX.Sync.SyncMainWindowActions | null = null;

  serverDevices: LX.Sync.ServerDevices | null = null;

  private readonly disposers: Array<() => void> = [];

  constructor() {
    makeAutoObservable<this, 'disposers'>(
      this,
      {
        disposers: false,
      },
      { autoBind: true },
    );
  }

  get serverDeviceCount(): number {
    return this.serverDevices?.length ?? 0;
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return;

    this.isHydrating = true;
    this.hydrateError = null;

    try {
      this.serverDevices = await syncService.getSyncServerDevices();
      this.startRealtimeSync();
      this.isHydrated = true;
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isHydrating = false;
    }
  }

  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose();
  }

  async refreshServerDevices(): Promise<void> {
    this.actionError = null;

    try {
      this.serverDevices = await syncService.getSyncServerDevices();
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    }
  }

  async removeServerDevice(clientId: string): Promise<void> {
    this.isMutating = true;
    this.actionError = null;

    try {
      await syncService.removeSyncServerDevice(clientId);
      await this.refreshServerDevices();
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutating = false;
    }
  }

  async generateCode(): Promise<void> {
    this.isMutating = true;
    this.actionError = null;

    try {
      await syncService.sendSyncAction({ action: 'generate_code' });
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutating = false;
    }
  }

  async sendAction(action: LX.Sync.SyncServiceActions): Promise<unknown> {
    return await syncService.sendSyncAction(action);
  }

  private startRealtimeSync(): void {
    if (this.disposers.length) return;

    this.disposers.push(
      syncService.onSyncAction((action) => {
        this.lastAction = action;
      }),
    );
  }
}
