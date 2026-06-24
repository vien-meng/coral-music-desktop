import { message, notification } from 'antd'

const success = (content: string, duration = 3): void => {
  void message.success(content, duration)
}

const error = (content: string, duration = 3): void => {
  void message.error(content, duration)
}

const info = (content: string, duration = 3): void => {
  void message.info(content, duration)
}

const warning = (content: string, duration = 3): void => {
  void message.warning(content, duration)
}

const loading = (content: string, duration = 0): void => {
  void message.loading(content, duration)
}

interface NotifyOptions {
  message: string
  description?: string
  duration?: number
}

const notifySuccess = ({ message: msg, description, duration = 4.5 }: NotifyOptions): void => {
  notification.success({ message: msg, description, duration })
}

const notifyError = ({ message: msg, description, duration = 4.5 }: NotifyOptions): void => {
  notification.error({ message: msg, description, duration })
}

const notifyInfo = ({ message: msg, description, duration = 4.5 }: NotifyOptions): void => {
  notification.info({ message: msg, description, duration })
}

const notifyWarning = ({ message: msg, description, duration = 4.5 }: NotifyOptions): void => {
  notification.warning({ message: msg, description, duration })
}

export const tipsService = {
  error,
  info,
  loading,
  notifyError,
  notifyInfo,
  notifySuccess,
  notifyWarning,
  success,
  warning,
}

export type { NotifyOptions }
