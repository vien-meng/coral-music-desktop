import { makeAutoObservable } from 'mobx';

export type UiQuickAction =
  'configureExternalDecoder' | 'importLocalAudio' | 'importUserApiFile' | 'importUserApiOnline';

export class UiStore {
  activeRoute = 'leaderboard';

  isRouteTransitioning = false;

  isSidebarCollapsed = false;

  pendingQuickAction: UiQuickAction | null = null;

  private routeTransitionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable<this, 'routeTransitionTimer'>(
      this,
      {
        routeTransitionTimer: false,
      },
      { autoBind: true },
    );
  }

  setActiveRoute(route: string): void {
    if (this.isRouteTransitioning && route !== this.activeRoute) return;
    if (route === this.activeRoute) return;
    this.activeRoute = route;
    this.isRouteTransitioning = true;
    if (this.routeTransitionTimer) clearTimeout(this.routeTransitionTimer);
    this.routeTransitionTimer = setTimeout(() => {
      this.isRouteTransitioning = false;
      this.routeTransitionTimer = null;
    }, 280);
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
