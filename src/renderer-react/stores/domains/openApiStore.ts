import { makeAutoObservable } from 'mobx';
import { openApiService } from '../../services/openApiService';

export class OpenApiStore {
  lastError: string | null = null;

  status: Coral.OpenAPI.Status | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async configure(enable: boolean, port: string, bindLan: boolean): Promise<boolean> {
    const status = await this.sendAction({ action: 'enable', data: { enable, port, bindLan } });
    return Boolean(status?.status) === enable;
  }

  async refreshStatus(): Promise<void> {
    await this.sendAction({ action: 'status' });
  }

  async sendAction(action: Coral.OpenAPI.Actions): Promise<Coral.OpenAPI.Status | null> {
    this.lastError = null;

    try {
      const status = await openApiService.sendOpenApiAction(action);
      this.status = status;
      return status;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      return null;
    }
  }
}
