export interface LyricPlayerLine {
  dom_line: HTMLDivElement
  extendedLyrics: string[]
  text: string
  time: number
}

export interface LyricPlayerOptions {
  activeLineClassName?: string
  extendedLyrics?: string[]
  lyric?: string
  offset?: number
  rate?: number
  shadowContent?: boolean
  isVertical?: boolean
  onPlay?: (line: number, text: string) => void
  onSetLyric?: (lines: LyricPlayerLine[], offset: number) => void
  onUpdateLyric?: (lines: LyricPlayerLine[]) => void
}

export default class Lyric {
  constructor(options?: LyricPlayerOptions)
  pause(): void
  play(curTime?: number): void
  setDisabledAutoPause(autoPause: boolean): void
  setLyric(lyric: string, extendedLyrics?: string[]): void
  setOffset(offset: number): void
  setPlaybackRate(rate: number): void
  setVertical(isVertical: boolean): void
}
