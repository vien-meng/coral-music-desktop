import { makeAutoObservable, runInAction } from 'mobx';

export type UiQuickAction =
  'configureExternalDecoder' | 'importLocalAudio' | 'importUserApiFile' | 'importUserApiOnline';

export class UiStore {
  activeRoute = 'leaderboard';

  isRouteTransitioning = false;

  isGlobalLoading = false;

  globalLoadingText = '';

  isSidebarCollapsed = false;

  pendingQuickAction: UiQuickAction | null = null;

  private globalLoadingCount = 0;

  private routeTransitionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable<this, 'globalLoadingCount' | 'routeTransitionTimer'>(
      this,
      {
        globalLoadingCount: false,
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
    this.showGlobalLoading('切换中...');
    if (this.routeTransitionTimer) clearTimeout(this.routeTransitionTimer);
    this.routeTransitionTimer = setTimeout(() => {
      runInAction(() => {
        this.isRouteTransitioning = false;
        this.routeTransitionTimer = null;
        this.hideGlobalLoading();
      });
    }, 280);
  }

  showGlobalLoading(text = '加载中...'): void {
    this.globalLoadingCount += 1;
    this.globalLoadingText = text;
    this.isGlobalLoading = true;
  }

  hideGlobalLoading(): void {
    this.globalLoadingCount = Math.max(0, this.globalLoadingCount - 1);
    if (this.globalLoadingCount > 0) return;
    this.isGlobalLoading = false;
    this.globalLoadingText = '';
  }

  async withGlobalLoading<T>(task: () => Promise<T>, text = '加载中...'): Promise<T> {
    this.showGlobalLoading(text);
    try {
      return await task();
    } finally {
      this.hideGlobalLoading();
    }
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
