/**
 * 修改透明度（内联自 @common/theme/colorUtils，避免 CJS → ESM 转换问题）
 * @param p 透明度 -1.0 - 1.0（负值降低，正值增加）
 * @param color rgba 颜色字符串，如 "rgb(255,0,0)" / "rgba(255,0,0,0.5)"
 */
const RGB_Alpha_Shade = (p: number, color: string): string => {
  const i = parseInt;
  const n = p < 0;
  const [r, g, b, a] = color.split(',') as [string, string, string, string | undefined];
  let red = r[3] === 'a' ? r.slice(5) : r.slice(4);
  let alpha: number;
  if (a) {
    alpha = parseFloat(a);
    alpha -= n ? (1 - alpha) * p : alpha * p;
    alpha = n ? Math.max(0, alpha) : Math.min(1, alpha);
  } else {
    alpha = 1 - p;
    alpha = Math.min(1, alpha);
  }
  return `rgba(${i(red)}, ${i(g)}, ${i(b)}, ${alpha.toFixed(2)})`;
};

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
