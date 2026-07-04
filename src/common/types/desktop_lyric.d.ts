declare namespace Coral {
  namespace DesktopLyric {
    interface Config {
      'desktopLyric.enable': Coral.AppSetting['desktopLyric.enable'];
      'desktopLyric.isLock': Coral.AppSetting['desktopLyric.isLock'];
      'desktopLyric.isAlwaysOnTop': Coral.AppSetting['desktopLyric.isAlwaysOnTop'];
      'desktopLyric.isAlwaysOnTopLoop': Coral.AppSetting['desktopLyric.isAlwaysOnTopLoop'];
      'desktopLyric.isShowTaskbar': Coral.AppSetting['desktopLyric.isShowTaskbar'];
      'desktopLyric.pauseHide': Coral.AppSetting['desktopLyric.pauseHide'];
      'desktopLyric.audioVisualization': Coral.AppSetting['desktopLyric.audioVisualization'];
      'desktopLyric.width': Coral.AppSetting['desktopLyric.width'];
      'desktopLyric.height': Coral.AppSetting['desktopLyric.height'];
      'desktopLyric.x': Coral.AppSetting['desktopLyric.x'];
      'desktopLyric.y': Coral.AppSetting['desktopLyric.y'];
      'desktopLyric.isLockScreen': Coral.AppSetting['desktopLyric.isLockScreen'];
      'desktopLyric.isDelayScroll': Coral.AppSetting['desktopLyric.isDelayScroll'];
      'desktopLyric.scrollAlign': Coral.AppSetting['desktopLyric.scrollAlign'];
      'desktopLyric.isHoverHide': Coral.AppSetting['desktopLyric.isHoverHide'];
      'desktopLyric.direction': Coral.AppSetting['desktopLyric.direction'];
      'desktopLyric.style.align': Coral.AppSetting['desktopLyric.style.align'];
      'desktopLyric.style.font': Coral.AppSetting['desktopLyric.style.font'];
      'desktopLyric.style.fontSize': Coral.AppSetting['desktopLyric.style.fontSize'];
      'desktopLyric.style.lineGap': Coral.AppSetting['desktopLyric.style.lineGap'];
      'desktopLyric.style.lyricUnplayColor': Coral.AppSetting['desktopLyric.style.lyricUnplayColor'];
      'desktopLyric.style.lyricPlayedColor': Coral.AppSetting['desktopLyric.style.lyricPlayedColor'];
      'desktopLyric.style.lyricShadowColor': Coral.AppSetting['desktopLyric.style.lyricShadowColor'];
      // 'desktopLyric.style.fontWeight': Coral.AppSetting['desktopLyric.style.fontWeight']
      'desktopLyric.style.opacity': Coral.AppSetting['desktopLyric.style.opacity'];
      'desktopLyric.style.ellipsis': Coral.AppSetting['desktopLyric.style.ellipsis'];
      'desktopLyric.style.isFontWeightFont': Coral.AppSetting['desktopLyric.style.isFontWeightFont'];
      'desktopLyric.style.isFontWeightLine': Coral.AppSetting['desktopLyric.style.isFontWeightLine'];
      'desktopLyric.style.isFontWeightExtended': Coral.AppSetting['desktopLyric.style.isFontWeightExtended'];
      'desktopLyric.style.isZoomActiveLrc': Coral.AppSetting['desktopLyric.style.isZoomActiveLrc'];
      'common.langId': Coral.AppSetting['common.langId'];
      'player.isShowLyricTranslation': Coral.AppSetting['player.isShowLyricTranslation'];
      'player.isShowLyricRoma': Coral.AppSetting['player.isShowLyricRoma'];
      'player.isSwapLyricTranslationAndRoma': Coral.AppSetting['player.isSwapLyricTranslationAndRoma'];
      'player.isPlayLxlrc': Coral.AppSetting['player.isPlayLxlrc'];
      'player.playbackRate': Coral.AppSetting['player.playbackRate'];
    }

    type WinMainActions =
      | 'get_info'
      | 'get_status'
      | 'get_analyser_data_array'
      | 'play_prev'
      | 'toggle_play'
      | 'play_next';

    interface LyricActionBase<A> {
      action: A;
    }
    interface LyricActionData<A, D> extends LyricActionBase<A> {
      data: D;
    }
    type LyricAction<A, D = undefined> = D extends undefined
      ? LyricActionBase<A>
      : LyricActionData<A, D>;

    type LyricActions =
      | LyricAction<
          'set_info',
          {
            id: string | null;
            singer: string;
            name: string;
            album: string;
            lrc: string | null;
            tlrc: string | null;
            rlrc: string | null;
            lxlrc: string | null;
            // pic: string | null
            isPlay: boolean;
            line: number;
            played_time: number;
          }
        >
      | LyricAction<
          'set_status',
          {
            isPlay: boolean;
            line: number;
            played_time: number;
          }
        >
      | LyricAction<
          'set_lyric',
          {
            lrc: string | null;
            tlrc: string | null;
            rlrc: string | null;
            lxlrc: string | null;
          }
        >
      | LyricAction<'set_offset', number>
      | LyricAction<'set_playbackRate', number>
      | LyricAction<'set_play', number>
      | LyricAction<'set_pause'>
      | LyricAction<'set_stop'>
      | LyricAction<'send_analyser_data_array', Uint8Array>;

    interface NewBounds {
      x: number;
      y: number;
      w: number;
      h: number;
    }
  }
}
