import { makeAutoObservable } from 'mobx';
import { syncService } from '../../services/syncService';

export class SyncStore {
  actionError: string | null = null;

  hydrateError: string | null = null;

  isHydrated = false;

  isHydrating = false;

  isMutating = false;

  lastAction: Coral.Sync.SyncMainWindowActions | null = null;

  clientStatus: Coral.Sync.ClientStatus | null = null;

  serverStatus: Coral.Sync.ServerStatus | null = null;

  serverDevices: Coral.Sync.ServerDevices | null = null;

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
      const [serverDevices, serverStatus, clientStatus] = await Promise.all([
        syncService.getSyncServerDevices(),
        syncService.sendSyncAction({ action: 'get_server_status' }),
        syncService.sendSyncAction({ action: 'get_client_status' }),
      ]);
      this.serverDevices = serverDevices;
      this.serverStatus = serverStatus as Coral.Sync.ServerStatus;
      this.clientStatus = clientStatus as Coral.Sync.ClientStatus;
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

  async connectClient(host: string, authCode: string): Promise<void> {
    this.isMutating = true;
    this.actionError = null;
    try {
      await syncService.sendSyncAction({
        action: 'enable_client',
        data: { enable: true, host, authCode: authCode || undefined },
      });
      this.clientStatus = (await syncService.sendSyncAction({
        action: 'get_client_status',
      })) as Coral.Sync.ClientStatus;
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      this.isMutating = false;
    }
  }

  async disconnectClient(): Promise<void> {
    this.isMutating = true;
    this.actionError = null;
    try {
      await syncService.sendSyncAction({
        action: 'enable_client',
        data: { enable: false, host: '' },
      });
      this.clientStatus = (await syncService.sendSyncAction({
        action: 'get_client_status',
      })) as Coral.Sync.ClientStatus;
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      this.isMutating = false;
    }
  }

  async resolveSelectMode(mode: Coral.Sync.ModeTypes[keyof Coral.Sync.ModeTypes]): Promise<void> {
    const action = this.lastAction;
    if (!action || action.action !== 'select_mode') return;

    this.isMutating = true;
    this.actionError = null;
    try {
      if (action.data.type === 'list') {
        await syncService.sendSyncAction({
          action: 'select_mode',
          data: { type: 'list', mode: mode as Coral.Sync.List.SyncMode },
        });
      } else {
        await syncService.sendSyncAction({
          action: 'select_mode',
          data: { type: 'dislike', mode: mode as Coral.Sync.Dislike.SyncMode },
        });
      }
      this.lastAction = null;
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutating = false;
    }
  }

  async sendAction(action: Coral.Sync.SyncServiceActions): Promise<unknown> {
    return await syncService.sendSyncAction(action);
  }

  private startRealtimeSync(): void {
    if (this.disposers.length) return;

    this.disposers.push(
      syncService.onSyncAction((action) => {
        this.lastAction = action;
        if (action.action === 'client_status') this.clientStatus = action.data;
        if (action.action === 'server_status') this.serverStatus = action.data;
      }),
    );
  }
}
