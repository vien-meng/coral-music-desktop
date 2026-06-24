import type { IpcRenderer, IpcRendererEvent } from 'electron'
import type {
  CoralIpcEventChannel,
  CoralIpcEventPayload,
  CoralIpcInvokeChannel,
  CoralIpcInvokeParams,
  CoralIpcInvokeResult,
  CoralIpcSendChannel,
  CoralIpcSendParams,
} from '@shared/ipc/contracts'

type ElectronRequire = (moduleName: 'electron') => {
  ipcRenderer: IpcRenderer
}

type ElectronRendererGlobal = typeof globalThis & {
  require?: ElectronRequire
}

type InvokeArgs<Channel extends CoralIpcInvokeChannel> =
  undefined extends CoralIpcInvokeParams<Channel>
    ? [] | [params: Exclude<CoralIpcInvokeParams<Channel>, undefined>]
    : [params: CoralIpcInvokeParams<Channel>]

type SendArgs<Channel extends CoralIpcSendChannel> =
  undefined extends CoralIpcSendParams<Channel>
    ? [] | [params: Exclude<CoralIpcSendParams<Channel>, undefined>]
    : [params: CoralIpcSendParams<Channel>]

type EventListener<Channel extends CoralIpcEventChannel> = (
  payload: CoralIpcEventPayload<Channel>,
  event: IpcRendererEvent,
) => void

let ipcRendererCache: IpcRenderer | null = null

const getElectronRequire = (): ElectronRequire | null => {
  return (globalThis as ElectronRendererGlobal).require ?? null
}

export const canUseIpc = (): boolean => {
  return getElectronRequire() != null
}

const getIpcRenderer = (): IpcRenderer => {
  if (ipcRendererCache) return ipcRendererCache

  const electronRequire = getElectronRequire()
  if (!electronRequire) {
    throw new Error('Electron ipcRenderer is unavailable in the current lyric renderer context.')
  }

  ipcRendererCache = electronRequire('electron').ipcRenderer
  return ipcRendererCache
}

export const invoke = async<Channel extends CoralIpcInvokeChannel>(
  channel: Channel,
  ...args: InvokeArgs<Channel>
): Promise<CoralIpcInvokeResult<Channel>> => {
  const [params] = args as [CoralIpcInvokeParams<Channel> | undefined]
  return await getIpcRenderer().invoke(channel, params)
}

export const send = <Channel extends CoralIpcSendChannel>(
  channel: Channel,
  ...args: SendArgs<Channel>
): void => {
  const [params] = args as [CoralIpcSendParams<Channel> | undefined]
  if (args.length) getIpcRenderer().send(channel, params)
  else getIpcRenderer().send(channel)
}

export const on = <Channel extends CoralIpcEventChannel>(
  channel: Channel,
  listener: EventListener<Channel>,
): (() => void) => {
  const wrappedListener = (event: IpcRendererEvent, payload: CoralIpcEventPayload<Channel>) => {
    listener(payload, event)
  }

  getIpcRenderer().on(channel, wrappedListener)

  return () => {
    getIpcRenderer().removeListener(channel, wrappedListener)
  }
}

export const ipcClient = {
  canUseIpc,
  invoke,
  on,
  send,
}
