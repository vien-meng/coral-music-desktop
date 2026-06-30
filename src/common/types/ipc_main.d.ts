declare namespace Coral {
  interface IpcMainEvent {
    event: Electron.IpcMainEvent;
  }
  interface IpcMainEventParams<T> {
    event: Electron.IpcMainEvent;
    params: T;
  }
  type IpcMainEventListener = (params: Coral.IpcMainEvent) => void;
  type IpcMainEventListenerParams<T> = (params: Coral.IpcMainEventParams<T>) => void;

  interface IpcMainInvokeEvent {
    event: Electron.IpcMainInvokeEvent;
  }
  interface IpcMainInvokeEventParams<T> {
    event: Electron.IpcMainInvokeEvent;
    params: T;
  }

  type IpcMainInvokeEventListener = (params: Coral.IpcMainInvokeEvent) => Promise<void>;
  type IpcMainInvokeEventListenerParams<T> = (
    params: Coral.IpcMainInvokeEventParams<T>,
  ) => Promise<void>;
  type IpcMainInvokeEventListenerValue<V> = (params: Coral.IpcMainInvokeEvent) => Promise<V>;
  type IpcMainInvokeEventListenerParamsValue<T, V> = (
    params: Coral.IpcMainInvokeEventParams<T>,
  ) => Promise<V>;
}
