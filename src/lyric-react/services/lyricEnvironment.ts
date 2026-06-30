import { RGB_Alpha_Shade } from '@common/theme/colorUtils';

const formatLangId = (langId: string | null | undefined): string | null => {
  if (!langId) return null;
  return langId;
};

export const applyLyricLanguage = (langId: string | null | undefined): void => {
  const languageId = formatLangId(langId);
  if (!languageId) return;

  if (window.i18n?.locale !== languageId) {
    window.i18n?.setLanguage?.(languageId);
  }
  window.setLang?.(languageId);
};

export const applyLyricTheme = (setting: Coral.ThemeSetting): void => {
  window.setTheme?.(setting.theme.colors);
};

export const applyLyricColors = (config: Coral.DesktopLyric.Config): void => {
  const shadowColor = config['desktopLyric.style.lyricShadowColor'];

  window.setLyricColor?.({
    '--color-lyric-played': config['desktopLyric.style.lyricPlayedColor'],
    '--color-lyric-shadow': shadowColor,
    '--color-lyric-shadow-font-mode': RGB_Alpha_Shade(0.49, shadowColor),
    '--color-lyric-unplay': config['desktopLyric.style.lyricUnplayColor'],
  });
};
