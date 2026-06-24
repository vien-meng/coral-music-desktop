import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  FontSizeOutlined,
  MinusOutlined,
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { Button, Flex, Popover, Segmented, Space, Typography, message } from 'antd'
import { observer } from 'mobx-react-lite'
import { useCallback, useState } from 'react'
import { lyricService } from '../../services/lyricService'
import { rootStore } from '../../stores/rootStore'

const { Text } = Typography

const offsetTagRxp = /(?:^|\n)\s*\[offset:\s*(\S+(?:\d+)*)\s*\]/
const offsetTagAllRxp = /(^|\n)\s*\[offset:\s*(\S+(?:\d+)*)\s*\]/g
const lyricKeys = ['lyric', 'tlyric', 'rlyric', 'lxlyric'] as const

const emptyLyricInfo: LX.Music.LyricInfo = {
  lyric: '',
  lxlyric: '',
  rlyric: '',
  tlyric: '',
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const getOffset = (lrc: string | null | undefined): number => {
  const offset = offsetTagRxp.exec(lrc ?? '')
  if (!offset) return 0

  const value = Number.parseInt(offset[1], 10)
  return Number.isNaN(value) ? 0 : value
}

const normalizeLyricInfo = (lyricInfo: LX.Music.LyricInfo | null | undefined): LX.Music.LyricInfo => {
  return {
    lyric: lyricInfo?.lyric ?? '',
    lxlyric: lyricInfo?.lxlyric ?? '',
    rlyric: lyricInfo?.rlyric ?? '',
    tlyric: lyricInfo?.tlyric ?? '',
  }
}

const applyOffset = (lyricInfo: LX.Music.LyricInfo, offset: number): LX.Music.LyricInfo => {
  const nextLyricInfo = normalizeLyricInfo(lyricInfo)

  for (const key of lyricKeys) {
    const lyric = nextLyricInfo[key]
    if (!lyric) continue

    nextLyricInfo[key] = offsetTagRxp.test(lyric)
      ? lyric.replace(offsetTagAllRxp, `$1[offset:${offset}]`)
      : `[offset:${offset}]\n${lyric}`
  }

  return nextLyricInfo
}

export const LyricMenu = observer(() => {
  const { player, settings } = rootStore
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draftLyric, setDraftLyric] = useState<LX.Music.LyricInfo>(emptyLyricInfo)
  const [offset, setOffset] = useState(0)
  const [originOffset, setOriginOffset] = useState(0)

  const musicInfo = player.displayMusicInfo
  const fontSize = settings.appSetting?.['playDetail.style.fontSize'] ?? 140
  const align = settings.appSetting?.['playDetail.style.align'] ?? 'center'
  const canEditOffset = Boolean(musicInfo && draftLyric.lyric)

  const loadLyricInfo = useCallback(async(): Promise<void> => {
    const fallbackLyric = normalizeLyricInfo(player.currentLyricInfo)
    setIsLoading(true)

    try {
      if (!musicInfo) {
        setDraftLyric(fallbackLyric)
        setOffset(getOffset(fallbackLyric.lyric))
        setOriginOffset(getOffset(fallbackLyric.lyric))
        return
      }

      const [rawLyric, editedLyric] = await Promise.all([
        lyricService.getLyricRaw(musicInfo),
        lyricService.getLyricEdited(musicInfo),
      ])
      const activeLyric = editedLyric.lyric
        ? editedLyric
        : fallbackLyric.lyric
          ? fallbackLyric
          : rawLyric

      setDraftLyric(normalizeLyricInfo(activeLyric))
      setOffset(getOffset(activeLyric.lyric))
      setOriginOffset(getOffset(rawLyric.lyric || fallbackLyric.lyric))
    } catch (error) {
      void message.warning(`歌词信息读取失败：${error instanceof Error ? error.message : String(error)}`)
      setDraftLyric(fallbackLyric)
      setOffset(getOffset(fallbackLyric.lyric))
      setOriginOffset(getOffset(fallbackLyric.lyric))
    } finally {
      setIsLoading(false)
    }
  }, [musicInfo, player])

  const handleOpenChange = (nextIsOpen: boolean): void => {
    setIsOpen(nextIsOpen)
    if (nextIsOpen) void loadLyricInfo()
  }

  const setFontSize = (nextFontSize: number): void => {
    void settings.updateAppSetting({
      'playDetail.style.fontSize': clamp(nextFontSize, 70, 200),
    })
  }

  const setAlign = (nextAlign: LX.AppSetting['playDetail.style.align']): void => {
    void settings.updateAppSetting({
      'playDetail.style.align': nextAlign,
    })
  }

  const saveOffset = async(nextOffset: number): Promise<void> => {
    if (!canEditOffset) return

    const nextLyric = applyOffset(draftLyric, nextOffset)
    setDraftLyric(nextLyric)
    setOffset(nextOffset)
    player.updateLyricSnapshot(nextLyric)

    if (!musicInfo) return

    setIsSaving(true)
    try {
      if (nextOffset === originOffset) {
        await lyricService.removeLyricEdited(musicInfo)
      } else {
        await lyricService.saveLyricEdited(musicInfo, nextLyric)
      }
    } catch (error) {
      void message.error(`歌词偏移保存失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const content = (
    <div className="coral-lyric-menu">
      <Flex justify="space-between" align="center" className="coral-lyric-menu-row">
        <Text type="secondary">歌词字号 {fontSize}</Text>
        <Button
          aria-label="重置歌词字号"
          disabled={fontSize === 100}
          icon={<UndoOutlined />}
          size="small"
          onClick={() => { setFontSize(100) }}
        />
      </Flex>
      <Space.Compact block>
        <Button
          aria-label="减小歌词字号"
          disabled={fontSize <= 70}
          icon={<MinusOutlined />}
          onClick={() => { setFontSize(fontSize - 5) }}
          onContextMenu={event => {
            event.preventDefault()
            setFontSize(fontSize - 1)
          }}
        />
        <Button
          aria-label="增大歌词字号"
          disabled={fontSize >= 200}
          icon={<PlusOutlined />}
          onClick={() => { setFontSize(fontSize + 5) }}
          onContextMenu={event => {
            event.preventDefault()
            setFontSize(fontSize + 1)
          }}
        />
      </Space.Compact>

      <Flex vertical gap={8} className="coral-lyric-menu-group">
        <Text type="secondary">歌词对齐</Text>
        <Segmented
          block
          value={align}
          options={[
            {
              icon: <AlignLeftOutlined />,
              label: '左',
              value: 'left',
            },
            {
              icon: <AlignCenterOutlined />,
              label: '中',
              value: 'center',
            },
          ]}
          onChange={value => { setAlign(value as LX.AppSetting['playDetail.style.align']) }}
        />
      </Flex>

      <Flex justify="space-between" align="center" className="coral-lyric-menu-row">
        <Text type="secondary">歌词偏移 {offset}ms</Text>
        <Button
          aria-label="重置歌词偏移"
          disabled={!canEditOffset || isLoading || isSaving || offset === originOffset}
          icon={<UndoOutlined />}
          loading={isSaving}
          size="small"
          onClick={() => { void saveOffset(originOffset) }}
        />
      </Flex>
      <Space.Compact block>
        <Button
          disabled={!canEditOffset || isLoading || isSaving}
          onClick={() => { void saveOffset(offset - 10) }}
        >
          -10ms
        </Button>
        <Button
          disabled={!canEditOffset || isLoading || isSaving}
          onClick={() => { void saveOffset(offset + 10) }}
        >
          +10ms
        </Button>
      </Space.Compact>
      <Space.Compact block>
        <Button
          disabled={!canEditOffset || isLoading || isSaving}
          onClick={() => { void saveOffset(offset - 100) }}
        >
          -100ms
        </Button>
        <Button
          disabled={!canEditOffset || isLoading || isSaving}
          onClick={() => { void saveOffset(offset + 100) }}
        >
          +100ms
        </Button>
      </Space.Compact>
    </div>
  )

  return (
    <Popover
      arrow={false}
      content={content}
      open={isOpen}
      placement="top"
      trigger="click"
      onOpenChange={handleOpenChange}
    >
      <Button
        aria-label="歌词菜单"
        icon={<FontSizeOutlined />}
        shape="circle"
      />
    </Popover>
  )
})
