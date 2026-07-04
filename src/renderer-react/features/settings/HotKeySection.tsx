import { Collapse, Input, Space, Switch, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { makeAutoObservable, runInAction } from 'mobx';
import { useEffect, useRef, useState } from 'react';
import { hotKeyService } from '../../services/hotKeyService';

const { Text } = Typography;

const HOTKEY_LABELS: Record<string, string> = {
  common_min: '最小化窗口',
  common_toggle_min: '切换最小化',
  common_toggle_hide: '切换隐藏',
  common_toggle_close: '关闭窗口',
  common_focus_search_input: '聚焦搜索框',
  player_toggle_play: '播放/暂停',
  player_next: '下一首',
  player_prev: '上一首',
  player_seekbackward: '快退',
  player_seekforward: '快进',
  player_volume_up: '音量加',
  player_volume_down: '音量减',
  player_volume_mute: '静音切换',
  player_music_love: '喜欢歌曲',
  player_music_unlove: '取消喜欢',
  player_music_dislike: '不喜欢歌曲',
  desktop_lyric_toggle_visible: '桌面歌词显示切换',
  desktop_lyric_toggle_lock: '桌面歌词锁定切换',
  desktop_lyric_toggle_always_top: '桌面歌词置顶切换',
};

const getHotKeyLabel = (name: string): string => HOTKEY_LABELS[name] || name;

interface HotKeyState {
  status: boolean;
  info: Coral.HotKey;
}

const omitHotKey = (
  keys: Record<string, Coral.HotKey>,
  key: string,
): Record<string, Coral.HotKey> => {
  const { [key]: _removed, ...nextKeys } = keys;
  return nextKeys;
};

class HotKeyStore {
  config: Coral.HotKeyConfigAll = {
    local: { enable: false, keys: {} },
    global: { enable: false, keys: {} },
  };

  status: Record<string, HotKeyState> = {};

  isLoaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  setConfig(config: Coral.HotKeyConfigAll): void {
    this.config = config;
    this.isLoaded = true;
  }

  setStatus(status: Coral.HotKeyState): void {
    const result: Record<string, HotKeyState> = {};
    for (const [key, value] of status.entries()) {
      result[key] = value;
    }
    this.status = result;
  }

  setEnable(type: 'local' | 'global', enable: boolean): void {
    this.config[type].enable = enable;
  }

  updateKey(
    type: 'local' | 'global',
    oldKey: string | null,
    newKey: string | null,
    info: Coral.HotKey,
  ): void {
    runInAction(() => {
      if (oldKey) {
        this.config[type].keys = omitHotKey(this.config[type].keys, oldKey);
      }
      if (newKey) {
        for (const [tempType, tempInfo] of Object.entries(this.config)) {
          if (tempType === type) continue;
          const existing = tempInfo.keys[newKey];
          if (existing) {
            tempInfo.keys = omitHotKey(tempInfo.keys, newKey);
            break;
          }
        }
        const keys = this.config[type].keys;
        keys[newKey] = info;
      }
    });
  }

  buildConfigMap(type: 'local' | 'global'): Record<string, { key: string; info: Coral.HotKey }> {
    const result: Record<string, { key: string; info: Coral.HotKey }> = {};
    for (const [key, info] of Object.entries(this.config[type].keys)) {
      if (info.name) {
        result[info.name] = { key, info };
      }
    }
    return result;
  }
}

const hotKeyStore = new HotKeyStore();

interface HotKeyItemInputProps {
  info: Coral.HotKey;
  type: 'local' | 'global';
  configMap: Record<string, { key: string; info: Coral.HotKey }>;
  onSaved: () => Promise<void>;
}

const HotKeyItemInput = observer(({ info, type, configMap, onSaved }: HotKeyItemInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const newKeyRef = useRef<string | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isFocused) {
      const config = configMap[info.name];
      setInputValue(config ? hotKeyService.formatHotKeyName(config.key) : '');
    }
  }, [configMap, info.name, isFocused]);

  const handleFocus = async (): Promise<void> => {
    focusTimerRef.current = setTimeout(async () => {
      await hotKeyService.setHotKeyEnable(false);
      setIsFocused(true);
      const config = configMap[info.name];
      newKeyRef.current = config?.key ?? null;
      setInputValue('按下快捷键...');
    });
  };

  const handleBlur = async (): Promise<void> => {
    blurTimerRef.current = setTimeout(async () => {
      await hotKeyService.setHotKeyEnable(true);
      setIsFocused(false);
      const newKey = newKeyRef.current;
      const config = configMap[info.name];

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
          });
        } catch {
          return;
        }
      }

      if (config && config.key === newKey) return;
      if (!config && !newKey) return;

      if (config?.key && hotKeyStore.config.global.enable) {
        try {
          await hotKeyService.setHotKeyConfig({
            action: 'unregister',
            data: config.key,
          });
        } catch {
          // ignore
        }
      }

      hotKeyStore.updateKey(type, config?.key ?? null, newKey, info);
      await onSaved();
      await refreshStatus();
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.repeat || !isFocused) return;
    event.preventDefault();

    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'delete' || key === 'backspace') {
      key = '';
    }
    const parts: string[] = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.metaKey) parts.push('mod');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (key && key !== 'control' && key !== 'meta' && key !== 'alt' && key !== 'shift') {
      parts.push(key);
    }
    const finalKey = parts.join('+');

    newKeyRef.current = finalKey || null;
    setInputValue(finalKey ? hotKeyService.formatHotKeyName(finalKey) : '');
  };

  const config = configMap[info.name];
  const isFailed = type === 'global' && config && !hotKeyStore.status[config.key]?.status;

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
  );
});

const refreshStatus = async (): Promise<void> => {
  const status = await hotKeyService.getHotKeyStatus();
  hotKeyStore.setStatus(status);
};

export const HotKeySection = observer(() => {
  useEffect(() => {
    const init = async (): Promise<void> => {
      const config = await hotKeyService.getHotKeyConfig();
      if (config) hotKeyStore.setConfig(config);
      await refreshStatus();
    };
    init();
  }, []);

  const handleSaveConfig = async (): Promise<void> => {
    await hotKeyService.setHotKeyConfig({
      action: 'config',
      data: hotKeyStore.config,
    });
  };

  const handleEnableGlobal = async (checked: boolean): Promise<void> => {
    try {
      await hotKeyService.setHotKeyConfig({
        action: 'enable',
        data: checked,
      });
      hotKeyStore.setEnable('global', checked);
      await handleSaveConfig();
      await refreshStatus();
    } catch {
      // rollback handled by not updating store on failure
    }
  };

  const handleEnableLocal = async (checked: boolean): Promise<void> => {
    try {
      hotKeyStore.setEnable('local', checked);
      await handleSaveConfig();
    } catch {
      hotKeyStore.setEnable('local', !checked);
    }
  };

  if (!hotKeyStore.isLoaded) {
    return <Text type="secondary">加载中...</Text>;
  }

  const localConfigMap = hotKeyStore.buildConfigMap('local');
  const globalConfigMap = hotKeyStore.buildConfigMap('global');

  const renderHotKeyItems = (
    configMap: Record<string, { key: string; info: Coral.HotKey }>,
    type: 'local' | 'global',
  ) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}
    >
      {Object.entries(hotKeyService.allHotKeys[type]).map(([_, info]) => (
        <div key={info.name} style={{ minWidth: 0 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
            {getHotKeyLabel(info.name)}
          </Text>
          <HotKeyItemInput
            info={info}
            type={type}
            configMap={configMap}
            onSaved={handleSaveConfig}
          />
        </div>
      ))}
    </div>
  );

  const collapseItems = [
    {
      key: 'local',
      label: (
        <Space>
          <Text strong>本地快捷键</Text>
          <Switch
            size="small"
            checked={hotKeyStore.config.local.enable}
            onChange={handleEnableLocal}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {hotKeyStore.config.local.enable ? '已启用' : '已禁用'}
          </Text>
        </Space>
      ),
      children: (
        <div style={{ opacity: hotKeyStore.config.local.enable ? 1 : 0.6 }}>
          {renderHotKeyItems(localConfigMap, 'local')}
        </div>
      ),
    },
    {
      key: 'global',
      label: (
        <Space>
          <Text strong>全局快捷键</Text>
          <Switch
            size="small"
            checked={hotKeyStore.config.global.enable}
            onChange={handleEnableGlobal}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {hotKeyStore.config.global.enable ? '已启用' : '已禁用'}
          </Text>
        </Space>
      ),
      children: (
        <div style={{ opacity: hotKeyStore.config.global.enable ? 1 : 0.6 }}>
          {renderHotKeyItems(globalConfigMap, 'global')}
        </div>
      ),
    },
  ];

  return (
    <Collapse
      items={collapseItems}
      defaultActiveKey={['local', 'global']}
      size="small"
      style={{ marginBottom: 8 }}
    />
  );
});
