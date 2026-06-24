import { makeAutoObservable } from 'mobx'

export class UiStore {
  activeRoute = 'search'
  isSidebarCollapsed = false

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  setActiveRoute(route: string): void {
    this.activeRoute = route
  }

  setSidebarCollapsed(isCollapsed: boolean): void {
    this.isSidebarCollapsed = isCollapsed
  }
}
