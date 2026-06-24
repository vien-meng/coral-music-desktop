import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { lyricRootStore } from '../../stores/lyricRootStore'

const getLineListClassName = (): string => {
  const classNames = ['lyric-line-list']
  const { config } = lyricRootStore

  if (config['desktopLyric.style.isZoomActiveLrc']) classNames.push('lrc-active-zoom')
  if (config['desktopLyric.style.ellipsis']) classNames.push('lrc-ellipsis')
  if (config['desktopLyric.style.isFontWeightFont']) classNames.push('font-weight-font')
  if (config['desktopLyric.style.isFontWeightLine']) classNames.push('font-weight-line')
  if (config['desktopLyric.style.isFontWeightExtended']) classNames.push('font-weight-extended')

  return classNames.join(' ')
}

export const LyricLineList = observer(() => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeLine = lyricRootStore.lineIndex
  const timelineLines = lyricRootStore.timelineLines

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.textContent = ''

    const fragment = document.createDocumentFragment()
    for (const line of timelineLines) fragment.appendChild(line.dom_line)
    container.appendChild(fragment)
  }, [timelineLines])

  useEffect(() => {
    const container = containerRef.current
    const line = container?.querySelectorAll<HTMLElement>('.line-content')[activeLine]
    if (!line) return

    line.scrollIntoView({
      behavior: lyricRootStore.config['desktopLyric.isDelayScroll'] ? 'smooth' : 'auto',
      block: 'center',
      inline: 'center',
    })
  }, [activeLine, timelineLines])

  if (!timelineLines.length) {
    return (
      <div className="lyric-fallback">
        <div className="lyric-current">{lyricRootStore.currentLine}</div>
        <div className="lyric-next">{lyricRootStore.nextLine}</div>
      </div>
    )
  }

  return (
    <div className={getLineListClassName()}>
      <div className="lyric-space" />
      <div ref={containerRef} className="lyric-line-host" />
      <div className="lyric-space" />
    </div>
  )
})
