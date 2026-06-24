import { Form, Input, Space, Switch, Typography } from 'antd'
import { observer } from 'mobx-react-lite'
import { makeAutoObservable, runInAction } from 'mobx'
import { useEffect, useRef, useState } from 'react'
import { hotKeyService } from '../../services/hotKeyService'

const { Text } = Typography

interface HotKeyState {
  status: boolean
  info: LX.HotKey
}

const omitHotKey = (keys: Record<string, LX.HotKey>, key: string): Record<string, LX.HotKey> => {
  const { [key]: _removed, ...nextKeys } = keys
  return nextKeys
}

class HotKeyStore {
  config: LX.HotKeyConfigAll = {
    local: { enable: false, keys: {} },
    global: { enable: false, keys: {} },
  }

  status: Record<string, HotKeyState> = {}
  isLoaded = false

  constructor() {
    makeAutoObservable(this)
  }

  setConfig(config: LX.HotKeyConfigAll): void {
    this.config = config
    this.isLoaded = true
  }

  setStatus(status: LX.HotKeyState): void {
    const result: Record<string, HotKeyState> = {}
    for (const [key, value] of status.entries()) {
      result[key] = value
    }
    this.status = result
  }

  setEnable(type: 'local' | 'global', enable: boolean): void {
    this.config[type].enable = enable
  }

  updateKey(
    type: 'local' | 'global',
    oldKey: string | null,
    newKey: string | null,
    info: LX.HotKey,
  ): void {
    runInAction(() => {
      if (oldKey) {
        this.config[type].keys = omitHotKey(this.config[type].keys, oldKey)
      }
      if (newKey) {
        for (const [tempType, tempInfo] of Object.entries(this.config)) {
          if (tempType === type) continue
          const existing = tempInfo.keys[newKey]
          if (existing) {
            tempInfo.keys = omitHotKey(tempInfo.keys, newKey)
            break
          }
        }
        const keys = this.config[type].keys
        keys[newKey] = info
      }
    })
  }

  buildConfigMap(
    type: 'local' | 'global',
  ): Record<string, { key: string, info: LX.HotKey }> {
    const result: Record<string, { key: string, info: LX.HotKey }> = {}
    for (const [key, info] of Object.entries(this.config[type].keys)) {
      if (info.name) {
        result[info.name] = { key, info }
      }
    }
    return result
  }
}

const hotKeyStore = new HotKeyStore()

interface HotKeyItemInputProps {
  info: LX.HotKey
  type: 'local' | 'global'
  configMap: Record<string, { key: string, info: LX.HotKey }>
  onSaved: () => Promise<void>
}

const HotKeyItemInput = observer(
  ({ info, type, configMap, onSaved }: HotKeyItemInputProps) => {
    const [inputValue, setInputValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const newKeyRef = useRef<string | null>(null)
    const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      return () => {
        if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
        if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
      }
    }, [])

    useEffect(() => {
      if (!isFocused) {
        const config = configMap[info.name]
        setInputValue(config ? hotKeyService.formatHotKeyName(config.key) : '')
      }
    }, [configMap, info.name, isFocused])

    const handleFocus = async(): Promise<void> => {
      focusTimerRef.current = setTimeout(async() => {
        await hotKeyService.setHotKeyEnable(false)
        setIsFocused(true)
        const config = configMap[info.name]
        newKeyRef.current = config?.key ?? null
        setInputValue('按下快捷键...')
      })
    }

    const handleBlur = async(): Promise<void> => {
      blurTimerRef.current = setTimeout(async() => {
        await hotKeyService.setHotKeyEnable(true)
        setIsFocused(false)
        const newKey = newKeyRef.current
        const config = configMap[info.name]

        if (
          type === 'global' &&
          newKey &&
          hotKeyStore.config.global.enable &&
          newKey !== config?.key
        ) {
          try {
            await hotKeyService.setHotKeyConfig({
              action: 'register',
              data: { key: newKey, info },
            })
          } catch {
            return
          }
        }

        if (config && config.key === newKey) return
        if (!config && !newKey) return

        if (config?.key && hotKeyStore.config.global.enable) {
          try {
            await hotKeyService.setHotKeyConfig({
              action: 'unregister',
              data: config.key,
            })
          } catch {
            // ignore
          }
        }

        hotKeyStore.updateKey(type, config?.key ?? null, newKey, info)
        await onSaved()
        await refreshStatus()
      })
    }

    const handleKeyDown = (event: React.KeyboardEvent): void => {
      if (event.repeat || !isFocused) return
      event.preventDefault()

      let key = event.key.toLowerCase()
      if (key === 'delete' || key === 'backspace') {
        key = ''
      }
      const parts: string[] = []
      if (event.ctrlKey || event.metaKey) parts.push('mod')
      if (event.altKey) parts.push('alt')
      if (event.shiftKey) parts.push('shift')
      if (
        key &&
        key !== 'control' &&
        key !== 'meta' &&
        key !== 'alt' &&
        key !== 'shift'
      ) {
        parts.push(key)
      }
      const finalKey = parts.join('+')

      newKeyRef.current = finalKey || null
      setInputValue(finalKey ? hotKeyService.formatHotKeyName(finalKey) : '')
    }

    const config = configMap[info.name]
    const isFailed =
      type === 'global' &&
      config &&
      !(hotKeyStore.status[config.key]?.status)

    return (
      <Input
        readOnly
        value={inputValue}
        placeholder="未设置"
        style={isFailed ? { textDecoration: 'line-through' } : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    )
  },
)

const refreshStatus = async(): Promise<void> => {
  const status = await hotKeyService.getHotKeyStatus()
  hotKeyStore.setStatus(status)
}

export const HotKeySection = observer(() => {
  useEffect(() => {
    const init = async(): Promise<void> => {
      const envParams = (
        globalThis as { lx?: { appHotKeyConfig?: LX.HotKeyConfigAll } }
      ).lx?.appHotKeyConfig
      if (envParams) {
        hotKeyStore.setConfig(envParams)
      }
      await refreshStatus()
    }
    void init()
  }, [])

  const handleSaveConfig = async(): Promise<void> => {
    await hotKeyService.setHotKeyConfig({
      action: 'config',
      data: hotKeyStore.config,
    })
  }

  const handleEnableGlobal = async(checked: boolean): Promise<void> => {
    try {
      await hotKeyService.setHotKeyConfig({
        action: 'enable',
        data: checked,
      })
      hotKeyStore.setEnable('global', checked)
      await handleSaveConfig()
      await refreshStatus()
    } catch {
      // rollback handled by not updating store on failure
    }
  }

  const handleEnableLocal = async(checked: boolean): Promise<void> => {
    try {
      hotKeyStore.setEnable('local', checked)
      await handleSaveConfig()
    } catch {
      hotKeyStore.setEnable('local', !checked)
    }
  }

  if (!hotKeyStore.isLoaded) {
    return <Text type="secondary">加载中...</Text>
  }

  const localConfigMap = hotKeyStore.buildConfigMap('local')
  const globalConfigMap = hotKeyStore.buildConfigMap('global')

  return (
    <>
      <Form.Item label="本地快捷键">
        <Space>
          <Switch
            checked={hotKeyStore.config.local.enable}
            onChange={handleEnableLocal}
          />
          <Text type="secondary">启用</Text>
        </Space>
      </Form.Item>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          opacity: hotKeyStore.config.local.enable ? 1 : 0.6,
          marginBottom: 16,
        }}
      >
        {Object.entries(hotKeyService.allHotKeys.local).map(([_, info]) => (
          <div key={info.name} style={{ width: '30%', minWidth: 200 }}>
            <Text
              type="secondary"
              style={{ display: 'block', marginBottom: 4, fontSize: 12 }}
            >
              {info.name}
            </Text>
            <HotKeyItemInput
              info={info}
              type="local"
              configMap={localConfigMap}
              onSaved={handleSaveConfig}
            />
          </div>
        ))}
      </div>

      <Form.Item label="全局快捷键">
        <Space>
          <Switch
            checked={hotKeyStore.config.global.enable}
            onChange={handleEnableGlobal}
          />
          <Text type="secondary">启用</Text>
        </Space>
      </Form.Item>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          opacity: hotKeyStore.config.global.enable ? 1 : 0.6,
        }}
      >
        {Object.entries(hotKeyService.allHotKeys.global).map(([_, info]) => (
          <div key={info.name} style={{ width: '30%', minWidth: 200 }}>
            <Text
              type="secondary"
              style={{ display: 'block', marginBottom: 4, fontSize: 12 }}
            >
              {info.name}
            </Text>
            <HotKeyItemInput
              info={info}
              type="global"
              configMap={globalConfigMap}
              onSaved={handleSaveConfig}
            />
          </div>
        ))}
      </div>
    </>
  )
})
