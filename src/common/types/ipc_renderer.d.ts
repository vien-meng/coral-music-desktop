declare namespace Coral {
  interface IpcRendererEvent {
    event: Electron.IpcRendererEvent;
  }
  interface IpcRendererEventParams<T> {
    event: Electron.IpcRendererEvent;
    params: T;
  }
  type IpcRendererEventListener = (params: Coral.IpcRendererEvent) => any;
  type IpcRendererEventListenerParams<T> = (params: Coral.IpcRendererEventParams<T>) => any;
}
