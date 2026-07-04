import { HOTKEY_PLAYER, HOTKEY_COMMON, HOTKEY_DESKTOP_LYRIC } from './hotKey';

const local: Coral.HotKeyConfig = {
  enable: true,
  keys: {
    space: {
      type: HOTKEY_PLAYER.toggle_play.type,
      name: HOTKEY_PLAYER.toggle_play.name,
      action: HOTKEY_PLAYER.toggle_play.action,
    },
    'mod+alt+arrowleft': {
      type: HOTKEY_PLAYER.prev.type,
      name: HOTKEY_PLAYER.prev.name,
      action: HOTKEY_PLAYER.prev.action,
    },
    f7: {
      type: HOTKEY_PLAYER.prev.type,
      name: HOTKEY_PLAYER.prev.name,
      action: HOTKEY_PLAYER.prev.action,
    },
    'mod+alt+arrowright': {
      type: HOTKEY_PLAYER.next.type,
      name: HOTKEY_PLAYER.next.name,
      action: HOTKEY_PLAYER.next.action,
    },
    f8: {
      type: HOTKEY_PLAYER.toggle_play.type,
      name: HOTKEY_PLAYER.toggle_play.name,
      action: HOTKEY_PLAYER.toggle_play.action,
    },
    f9: {
      type: HOTKEY_PLAYER.next.type,
      name: HOTKEY_PLAYER.next.name,
      action: HOTKEY_PLAYER.next.action,
    },
    arrowup: {
      type: HOTKEY_PLAYER.volume_up.type,
      name: HOTKEY_PLAYER.volume_up.name,
      action: HOTKEY_PLAYER.volume_up.action,
    },
    arrowdown: {
      type: HOTKEY_PLAYER.volume_down.type,
      name: HOTKEY_PLAYER.volume_down.name,
      action: HOTKEY_PLAYER.volume_down.action,
    },
    f1: {
      type: HOTKEY_COMMON.focusSearchInput.type,
      name: HOTKEY_COMMON.focusSearchInput.name,
      action: HOTKEY_COMMON.focusSearchInput.action,
    },
  },
};

const global: Coral.HotKeyConfig = {
  enable: false,
  keys: {
    'mod+alt+space': {
      type: HOTKEY_PLAYER.toggle_play.type,
      name: HOTKEY_PLAYER.toggle_play.name,
      action: HOTKEY_PLAYER.toggle_play.action,
    },
    'mod+alt+arrowleft': {
      type: HOTKEY_PLAYER.prev.type,
      name: HOTKEY_PLAYER.prev.name,
      action: HOTKEY_PLAYER.prev.action,
    },
    'mod+alt+arrowright': {
      type: HOTKEY_PLAYER.next.type,
      name: HOTKEY_PLAYER.next.name,
      action: HOTKEY_PLAYER.next.action,
    },
    'mod+alt+arrowup': {
      type: HOTKEY_PLAYER.volume_up.type,
      name: HOTKEY_PLAYER.volume_up.name,
      action: HOTKEY_PLAYER.volume_up.action,
    },
    'mod+alt+arrowdown': {
      type: HOTKEY_PLAYER.volume_down.type,
      name: HOTKEY_PLAYER.volume_down.name,
      action: HOTKEY_PLAYER.volume_down.action,
    },
    'mod+alt+0': {
      type: HOTKEY_DESKTOP_LYRIC.toggle_visible.type,
      name: HOTKEY_DESKTOP_LYRIC.toggle_visible.name,
      action: HOTKEY_DESKTOP_LYRIC.toggle_visible.action,
    },
    'mod+alt+-': {
      type: HOTKEY_DESKTOP_LYRIC.toggle_lock.type,
      name: HOTKEY_DESKTOP_LYRIC.toggle_lock.name,
      action: HOTKEY_DESKTOP_LYRIC.toggle_lock.action,
    },
    'mod+alt+=': {
      type: HOTKEY_DESKTOP_LYRIC.toggle_always_top.type,
      name: HOTKEY_DESKTOP_LYRIC.toggle_always_top.name,
      action: HOTKEY_DESKTOP_LYRIC.toggle_always_top.action,
    },
  },
};

export default {
  local,
  global,
};
