import { HOTKEY_COMMON, HOTKEY_PLAYER } from '@common/hotKey';
import { ipcChannels } from '@shared/ipc/contracts';
import { rootStore } from '../stores/rootStore';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';
import { hotKeyService } from './hotKeyService';

const VOLUME_STEP = 0.05;

const normalizeKeyName = (key: string): string => {
  const normalized = key.toLowerCase();
  if (normalized === ' ') return 'space';
  if (normalized === 'spacebar') return 'space';
  return normalized;
};

const getKeyCandidates = (event: KeyboardEvent): string[] => {
  const key = normalizeKeyName(event.key);
  if (!key || key === 'control' || key === 'meta' || key === 'alt' || key === 'shift') return [];

  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.metaKey) parts.push('mod');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  parts.push(key);

  const keyName = parts.join('+');
  const candidates = new Set([keyName]);
  if (event.ctrlKey) candidates.add(keyName.replace(/^ctrl(\+|$)/, 'mod$1'));
  if (event.metaKey) candidates.add(keyName.replace(/^mod(\+|$)/, 'ctrl$1'));
  return Array.from(candidates);
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const editableElement = target.closest(
    'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="searchbox"], [role="spinbutton"], [role="combobox"]',
  );
  return editableElement != null;
};

const focusSearchInput = (): void => {
  const input = document.querySelector<HTMLInputElement>(
    '.coral-header-search input, input[type="search"]',
  );
  input?.focus();
  input?.select();
};

const runPlayerAction = (action: string): boolean => {
  const { player } = rootStore;
  switch (action) {
    case HOTKEY_PLAYER.toggle_play.action:
      player.togglePlay();
      return true;
    case HOTKEY_PLAYER.prev.action:
      player.playPrev();
      return true;
    case HOTKEY_PLAYER.next.action:
      player.playNext();
      return true;
    case HOTKEY_PLAYER.volume_up.action:
      player.setVolume(player.volume + VOLUME_STEP);
      return true;
    case HOTKEY_PLAYER.volume_down.action:
      player.setVolume(player.volume - VOLUME_STEP);
      return true;
    case HOTKEY_PLAYER.volume_mute.action:
      player.setMute(!player.isMute);
      return true;
    default:
      return false;
  }
};

const runAction = (action: string): boolean => {
  if (runPlayerAction(action)) return true;
  switch (action) {
    case HOTKEY_COMMON.focusSearchInput.action:
      focusSearchInput();
      return true;
    default:
      return false;
  }
};

class KeyboardShortcutService {
  private config: Coral.HotKeyConfigAll | null = null;

  private disposers: Array<() => void> = [];

  async start(): Promise<void> {
    if (this.disposers.length) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      this.handleLocalKeyDown(event);
    };
    window.addEventListener('keydown', handleKeyDown);
    this.disposers.push(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    if (isElectronRenderer()) {
      const disposeGlobalKey = ipcClient.on(ipcChannels.winMain.keyDown, ({ key }) => {
        this.handleConfiguredKey('global', key);
      });
      const disposeConfigChange = ipcClient.on(
        ipcChannels.winMain.onHotKeyConfigChange,
        (config) => {
          this.config = config;
        },
      );
      this.disposers.push(disposeGlobalKey);
      this.disposers.push(disposeConfigChange);
    }

    await this.refreshConfig();
  }

  stop(): void {
    for (const dispose of this.disposers.splice(0)) dispose();
    this.config = null;
  }

  private async refreshConfig(): Promise<void> {
    this.config = await hotKeyService.getHotKeyConfig();
  }

  private handleLocalKeyDown(event: KeyboardEvent): void {
    if (event.repeat || isEditableTarget(event.target)) return;
    if (!this.config?.local.enable) return;

    for (const key of getKeyCandidates(event)) {
      if (this.handleConfiguredKey('local', key)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
  }

  private handleConfiguredKey(type: 'local' | 'global', key: string): boolean {
    const info = this.config?.[type].keys[key];
    if (!info) return false;
    return runAction(info.action);
  }
}

export const keyboardShortcutService = new KeyboardShortcutService();
