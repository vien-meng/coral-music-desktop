import { makeAutoObservable } from 'mobx';

export type UiQuickAction =
  'configureExternalDecoder' | 'importLocalAudio' | 'importUserApiFile' | 'importUserApiOnline';

export class UiStore {
  activeRoute = 'search';

  isSidebarCollapsed = false;

  pendingQuickAction: UiQuickAction | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setActiveRoute(route: string): void {
    this.activeRoute = route;
  }

  setSidebarCollapsed(isCollapsed: boolean): void {
    this.isSidebarCollapsed = isCollapsed;
  }

  requestQuickAction(action: UiQuickAction): void {
    this.pendingQuickAction = action;
  }

  consumeQuickAction(action: UiQuickAction): boolean {
    if (this.pendingQuickAction !== action) return false;
    this.pendingQuickAction = null;
    return true;
  }
}
