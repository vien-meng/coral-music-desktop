import {
  CloseOutlined,
  CompressOutlined,
  CustomerServiceOutlined,
  DownOutlined,
  ExpandOutlined,
  FileTextOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  MinusOutlined,
  MessageOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons'
import { Alert, Button, Flex, Space, Typography } from 'antd'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { appService } from '../../services/appService'
import { rootStore } from '../../stores/rootStore'
import { AudioVisualizer } from './AudioVisualizer'
import { LyricMenu } from './LyricMenu'
import { LyricSelectionPanel } from './LyricSelectionPanel'
import { MusicCommentPanel } from './MusicCommentPanel'
import { PlaybackRateBtn } from './PlaybackRateBtn'
import { PlayDetailLyricView } from './PlayDetailLyricView'
import { ProgressBar } from './ProgressBar'
import { QualitySwitchBtn } from './QualitySwitchBtn'
import { SoundEffectBtn } from './SoundEffectBtn'
import { TogglePlayModeBtn } from './TogglePlayModeBtn'
import { VolumeBtn } from './VolumeBtn'

const { Text, Title } = Typography

type PlayDetailLyricStyle = CSSProperties & {
  '--coral-playdetail-lyric-active-font-size': string
  '--coral-playdetail-lyric-font-size': string
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const PlayDetailOverlay = observer(() => {
  const { player, settings, ui } = rootStore
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const isPlaying = player.isPlaying
  const lyricAlign = settings.appSetting?.['playDetail.style.align'] ?? 'center'
  const lyricFontScale = ((settings.appSetting?.['playDetail.style.fontSize'] ?? 140) / 100) * (isFullscreen ? 1.25 : 1)
  const lyricStyles: PlayDetailLyricStyle = {
    '--coral-playdetail-lyric-active-font-size': `${24 * lyricFontScale}px`,
    '--coral-playdetail-lyric-font-size': `${18 * lyricFontScale}px`,
    textAlign: lyricAlign,
  }
  const overlayClassName = player.isPlayDetailOpen
    ? `coral-playdetail is-open${isFullscreen ? ' is-fullscreen' : ''}`
    : `coral-playdetail${isFullscreen ? ' is-fullscreen' : ''}`

  const applyFullscreen = useCallback(async(nextIsFullscreen: boolean): Promise<void> => {
    setIsFullscreen(await appService.setFullscreen(nextIsFullscreen))
  }, [])

  const handleSeek = (seconds: number): void => {
    player.seek(seconds)
  }

  const handleFullscreen = async(): Promise<void> => {
    await applyFullscreen(!isFullscreen)
  }

  const handleMinWindow = (): void => {
    void appService.minWindow()
  }

  const handleMaxWindow = (): void => {
    void appService.maximizeWindow().then(setIsMaximized)
  }

  const handleCloseWindow = (): void => {
    void appService.closeWindow()
  }

  useEffect(() => {
    if (!player.isPlayDetailOpen) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.repeat) return

      if (event.key === 'F11') {
        event.preventDefault()
        void applyFullscreen(!isFullscreen)
        return
      }

      if (event.key !== 'Escape') return
      event.preventDefault()
      if (isFullscreen) {
        void applyFullscreen(false)
        return
      }
      player.closePlayDetail()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [applyFullscreen, isFullscreen, player, player.isPlayDetailOpen])

  const coverNode = player.coverUrl
    ? (
      <img
        src={player.coverUrl}
        alt={player.displayName}
        className="coral-playdetail-cover-img"
      />
      )
    : <CustomerServiceOutlined className="coral-playdetail-cover-icon" />

  let centerNode = (
    <div className="coral-playdetail-lyric">
      <PlayDetailLyricView style={lyricStyles} />
    </div>
  )
  if (player.isLyricSelectionOpen) centerNode = <LyricSelectionPanel />
  if (player.isCommentPanelOpen) centerNode = <MusicCommentPanel />

  const errorActionNode = player.needsSourcePlugin
    ? (
      <Button
        size="small"
        type="primary"
        onClick={() => {
          player.closePlayDetail()
          ui.setActiveRoute('setting')
          ui.requestQuickAction('importUserApiFile')
        }}
      >
        添加音源
      </Button>
      )
    : player.needsExternalDecoder
      ? (
        <Button
          size="small"
          type="primary"
          onClick={() => {
            player.closePlayDetail()
            ui.setActiveRoute('setting')
            ui.requestQuickAction('configureExternalDecoder')
          }}
        >
          配置解码器
        </Button>
        )
      : undefined

  return (
    <section className={overlayClassName} aria-hidden={!player.isPlayDetailOpen}>
      <AudioVisualizer />
      <div className="coral-playdetail-bg" />
      <header className="coral-playdetail-header">
        <div className="coral-playdetail-heading">
          <Text type="secondary">正在播放</Text>
          <Title level={4} ellipsis>
            {player.displayName}
          </Title>
        </div>
        <Space size="small" className="coral-playdetail-window-controls">
          <Button
            aria-label="收起播放详情"
            icon={<DownOutlined />}
            shape="circle"
            onClick={() => { player.closePlayDetail() }}
          />
          <Button
            aria-label={isFullscreen ? '退出全屏' : '全屏'}
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            shape="circle"
            onClick={() => {
              void handleFullscreen()
            }}
          />
          {!isFullscreen
            ? (
              <>
                <Button
                  aria-label="最小化"
                  icon={<MinusOutlined />}
                  shape="circle"
                  onClick={handleMinWindow}
                />
                <Button
                  aria-label={isMaximized ? '还原窗口' : '最大化窗口'}
                  icon={isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
                  shape="circle"
                  onClick={handleMaxWindow}
                />
                <Button
                  danger
                  aria-label="关闭窗口"
                  icon={<CloseOutlined />}
                  shape="circle"
                  onClick={handleCloseWindow}
                />
              </>
              )
            : null}
        </Space>
      </header>

      <div className="coral-playdetail-main">
        <div className="coral-playdetail-art-wrap">
          <div className="coral-playdetail-art">
            {coverNode}
          </div>
          <div className="coral-playdetail-meta">
            <Title level={3} ellipsis>
              {player.displayName}
            </Title>
            <Text type="secondary" ellipsis>
              {player.displaySinger}
            </Text>
            {player.albumName
              ? (
                <Text type="secondary" ellipsis className="coral-playdetail-album">
                  {player.albumName}
                </Text>
                )
              : null}
            {player.queuePositionText
              ? (
                <Text type="secondary" className="coral-playdetail-queue">
                  {player.queuePositionText}
                </Text>
                )
              : null}
            {player.bitrateText
              ? (
                <Text type="secondary" className="coral-playdetail-bitrate">
                  {player.bitrateText}
                </Text>
                )
              : null}
            {player.errorText ? (
              <Alert
                showIcon
                type="error"
                className="coral-playdetail-error"
                message={player.errorText}
                action={errorActionNode}
              />
            ) : null}
          </div>
        </div>

        <div className="coral-playdetail-center">
          {centerNode}
        </div>

        <div className="coral-playdetail-controls">
          <Flex align="center" gap={12} className="coral-playdetail-progress-row">
            <Text type="secondary" className="coral-playdetail-time">
              {formatTime(player.currentTime)}
            </Text>
            <ProgressBar
              progress={player.progress}
              maxPlayTime={player.maxPlayTime}
              isActiveTransition={false}
              onSeek={handleSeek}
              className="coral-playdetail-progress"
            />
            <Text type="secondary" className="coral-playdetail-time">
              {formatTime(player.maxPlayTime)}
            </Text>
          </Flex>

          <Space size="middle" className="coral-playdetail-main-controls">
            <Button
              aria-label="上一首"
              icon={<StepBackwardOutlined />}
              shape="circle"
              size="large"
              onClick={() => { player.playPrev() }}
            />
            <Button
              aria-label={isPlaying ? '暂停' : '播放'}
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              shape="circle"
              size="large"
              type="primary"
              onClick={() => { player.togglePlay() }}
            />
            <Button
              aria-label="下一首"
              icon={<StepForwardOutlined />}
              shape="circle"
              size="large"
              onClick={() => { player.playNext() }}
            />
          </Space>

          <Space size="small" className="coral-playdetail-extra-controls">
            <Button
              aria-label={player.isCommentPanelOpen ? '关闭评论' : '歌曲评论'}
              icon={<MessageOutlined />}
              shape="circle"
              type={player.isCommentPanelOpen ? 'primary' : 'default'}
              onClick={() => { player.toggleCommentPanel() }}
            />
            <Button
              aria-label={player.isLyricSelectionOpen ? '关闭歌词文本' : '歌词文本'}
              icon={<FileTextOutlined />}
              shape="circle"
              type={player.isLyricSelectionOpen ? 'primary' : 'default'}
              onClick={() => { player.toggleLyricSelection() }}
            />
            <LyricMenu />
            <QualitySwitchBtn />
            <VolumeBtn />
            <TogglePlayModeBtn />
            <SoundEffectBtn />
            <PlaybackRateBtn />
          </Space>
        </div>
      </div>
    </section>
  )
})
