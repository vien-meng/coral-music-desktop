interface ElectronRendererGlobal {
  require?: (moduleName: 'electron') => {
    ipcRenderer: Electron.IpcRenderer;
  };
}

let ipcRendererCache: Electron.IpcRenderer | null = null;

const getIpcRenderer = (): Electron.IpcRenderer => {
  if (ipcRendererCache) return ipcRendererCache;
  const electronRequire = (globalThis as typeof globalThis & ElectronRendererGlobal).require;
  if (!electronRequire)
    throw new Error('Electron ipcRenderer is unavailable in the current renderer context.');
  ipcRendererCache = electronRequire('electron').ipcRenderer;
  return ipcRendererCache;
};

export function rendererSend(name: string): void;
export function rendererSend<T>(name: string, params: T): void;
export function rendererSend<T>(name: string, params?: T): void {
  getIpcRenderer().send(name, params);
}

export function rendererSendSync(name: string): void;
export function rendererSendSync<T>(name: string, params: T): void;
export function rendererSendSync<T>(name: string, params?: T): void {
  getIpcRenderer().sendSync(name, params);
}

export async function rendererInvoke(name: string): Promise<void>;
export async function rendererInvoke<V>(name: string): Promise<V>;
export async function rendererInvoke<T>(name: string, params: T): Promise<void>;
export async function rendererInvoke<T, V>(name: string, params: T): Promise<V>;
export async function rendererInvoke<T, V>(name: string, params?: T): Promise<V> {
  return getIpcRenderer().invoke(name, params);
}

export function rendererOn(name: string, listener: LX.IpcRendererEventListener): void;
export function rendererOn<T>(name: string, listener: LX.IpcRendererEventListenerParams<T>): void;
export function rendererOn<T>(name: string, listener: LX.IpcRendererEventListenerParams<T>): void {
  getIpcRenderer().on(name, (event, params) => {
    listener({ event, params });
  });
}

export function rendererOnce(name: string, listener: LX.IpcRendererEventListener): void;
export function rendererOnce<T>(name: string, listener: LX.IpcRendererEventListenerParams<T>): void;
export function rendererOnce<T>(
  name: string,
  listener: LX.IpcRendererEventListenerParams<T>,
): void {
  getIpcRenderer().once(name, (event, params) => {
    listener({ event, params });
  });
}

export const rendererOff = (name: string, listener: (...args: any[]) => any) => {
  getIpcRenderer().removeListener(name, listener);
};

export const rendererOffAll = (name: string) => {
  getIpcRenderer().removeAllListeners(name);
};
