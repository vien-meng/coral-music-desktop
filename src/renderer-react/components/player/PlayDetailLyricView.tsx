import Lyric, { type LyricPlayerLine } from '@common/utils/lyric-font-player'
import { Empty } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { rootStore } from '../../stores/rootStore'

interface PlayDetailLyricViewProps {
  style?: CSSProperties
}

const hasTimestamp = (lyric: string): boolean => /\[\d{1,3}:[\d:.]+]/.test(lyric)
const hasFontTimestamp = (lyric: string): boolean => /<\d+,\d+>/.test(lyric)
const hasDisplayableLyric = (lyric: string): boolean => hasTimestamp(lyric) && lyric.replace(/\[[^\]]+]/g, '').trim().length > 0

export const PlayDetailLyricView = observer(({ style }: PlayDetailLyricViewProps) => {
  const { player } = rootStore
  const hostRef = useRef<HTMLDivElement | null>(null)
  const lyricPlayerRef = useRef<Lyric | null>(null)
  const wasPlayingRef = useRef(false)
  const lastSyncTimeRef = useRef(0)
  const [timelineLines, setTimelineLines] = useState<LyricPlayerLine[]>([])
  const [activeLine, setActiveLine] = useState(-1)
  const lyricInfo = player.currentLyricInfo
  const lyric = useMemo(() => {
    const lxlrc = lyricInfo.lxlyric?.trim() ?? ''
    const normalLyric = lyricInfo.lyric?.trim() ?? ''
    if (hasFontTimestamp(lxlrc) && hasDisplayableLyric(lxlrc)) return lxlrc
    if (hasDisplayableLyric(normalLyric)) return normalLyric
    return ''
  }, [lyricInfo.lxlyric, lyricInfo.lyric])
  const extendedLyrics = useMemo(() => {
    return [lyricInfo.tlyric, lyricInfo.rlyric]
      .map(text => text?.trim() ?? '')
      .filter(hasDisplayableLyric)
  }, [lyricInfo.tlyric, lyricInfo.rlyric])

  useEffect(() => {
    const playerInstance = new Lyric({
      activeLineClassName: 'active',
      extendedLyrics,
      lyric,
      rate: player.playbackRate,
      shadowContent: false,
      onPlay: (line) => {
        setActiveLine(line)
      },
      onSetLyric: (lines) => {
        setTimelineLines(lines)
        setActiveLine(-1)
      },
      onUpdateLyric: (lines) => {
        setTimelineLines(lines)
      },
    })
    lyricPlayerRef.current = playerInstance
    playerInstance.setDisabledAutoPause(true)
    playerInstance.setLyric(lyric, extendedLyrics)

    return () => {
      playerInstance.pause()
      lyricPlayerRef.current = null
    }
  }, [extendedLyrics, lyric, player.playbackRate])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    host.textContent = ''
    const fragment = document.createDocumentFragment()
    for (const line of timelineLines) fragment.appendChild(line.dom_line)
    host.appendChild(fragment)
  }, [timelineLines])

  useEffect(() => {
    const host = hostRef.current
    const line = host?.querySelectorAll<HTMLElement>('.line-content')[activeLine]
    if (!line) return

    line.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })
  }, [activeLine, timelineLines])

  useEffect(() => {
    lyricPlayerRef.current?.setPlaybackRate(player.playbackRate)
  }, [player.playbackRate])

  useEffect(() => {
    const lyricPlayer = lyricPlayerRef.current
    if (!lyricPlayer || !timelineLines.length) return

    const currentTimeMs = Math.max(0, player.currentTime * 1000)
    const wasPlaying = wasPlayingRef.current
    const shouldHardSync = Math.abs(currentTimeMs - lastSyncTimeRef.current) > 1200
    lastSyncTimeRef.current = currentTimeMs
    wasPlayingRef.current = player.isPlaying

    if (player.isPlaying) {
      if (!wasPlaying || shouldHardSync) lyricPlayer.play(currentTimeMs)
      return
    }

    if (wasPlaying || shouldHardSync) lyricPlayer.play(currentTimeMs)
    lyricPlayer.pause()
  }, [player.currentTime, player.isPlaying, timelineLines])

  if (!timelineLines.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无歌词"
        className="coral-playdetail-empty"
      />
    )
  }

  return (
    <div className="coral-playdetail-lyric-lines coral-playdetail-lyric-timeline" style={style}>
      <div className="coral-playdetail-lyric-space" />
      <div ref={hostRef} className="coral-playdetail-lyric-host" />
      <div className="coral-playdetail-lyric-space" />
    </div>
  )
})
