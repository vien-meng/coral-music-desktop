import 'vite/client'

interface LyricWindowI18n {
  locale?: string
  setLanguage?: (locale: string) => void
}

interface Window {
  dom_style_lyric?: HTMLStyleElement
  dom_style_theme?: HTMLStyleElement
  i18n?: LyricWindowI18n
  os?: string
  setLang?: (lang?: string) => void
  setLyricColor?: (colors: Record<string, string>) => void
  setTheme?: (colors: Record<string, string>) => void
}
