import { useSyncExternalStore } from 'react'
import { messages } from '../../lang/index'
import type { Messages, Message } from '../../lang/index'

type Langs = keyof Messages
type TranslateValues = Record<string, string | number | boolean>

let currentLocale: Langs = 'zh-cn'
const listeners = new Set<() => void>()

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = (): Langs => {
  return currentLocale
}

const fillMessage = (message: string, vals: TranslateValues): string => {
  let result = message
  for (const [key, val] of Object.entries(vals)) {
    result = result.replaceAll(`{${key}}`, String(val))
  }
  return result
}

const getMessage = (key: keyof Message, val?: TranslateValues): string => {
  const targetMessage = messages[currentLocale][key] ?? messages['zh-cn'][key] ?? key
  return val ? fillMessage(targetMessage, val) : targetMessage
}

export const setLanguage = (lang: Langs): void => {
  if (lang === currentLocale) return
  currentLocale = lang
  for (const listener of listeners) {
    listener()
  }
}

export const getCurrentLocale = (): Langs => {
  return currentLocale
}

export const availableLocales = Object.keys(messages) as Langs[]

export const useI18n = () => {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return (key: keyof Message, val?: TranslateValues): string => {
    return getMessage(key, val)
  }
}

export const t = (key: keyof Message, val?: TranslateValues): string => {
  return getMessage(key, val)
}
