import { QUALITYS } from '@common/constants'
import { ThunderboltOutlined } from '@ant-design/icons'
import { Button, Popover, Space, Typography } from 'antd'
import { observer } from 'mobx-react-lite'
import { rootStore } from '../../stores/rootStore'

const { Text } = Typography

const PLAY_QUALITYS: LX.Quality[] = QUALITYS.filter(quality => quality !== 'wav' && quality !== 'ape')

const qualityLabels: Partial<Record<LX.Quality, string>> = {
  '128k': '128k',
  '192k': '192k',
  '320k': '320k',
  atmos: 'Atmos',
  atmos_plus: 'Atmos Plus',
  flac: 'FLAC',
  flac24bit: 'FLAC Hi-Res',
  hires: 'Hi-Res',
  master: 'Master',
}

const isDownloadMusicInfo = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem | null): musicInfo is LX.Download.ListItem => {
  return Boolean(musicInfo && 'progress' in musicInfo && 'metadata' in musicInfo)
}

const getPlayableQualities = (musicInfo: LX.Music.MusicInfo): LX.Quality[] => {
  const qualitys = musicInfo.meta._qualitys
  return PLAY_QUALITYS.filter((quality, index) => {
    return Boolean(qualitys[quality]) || PLAY_QUALITYS.slice(index + 1).some(fallbackQuality => Boolean(qualitys[fallbackQuality]))
  })
}

export const QualitySwitchBtn = observer(() => {
  const { player } = rootStore
  const currentMusic = player.musicInfo
  const displayMusicInfo = player.displayMusicInfo

  if (!currentMusic || !displayMusicInfo || displayMusicInfo.source === 'local' || isDownloadMusicInfo(currentMusic)) return null

  const playableQualities = getPlayableQualities(displayMusicInfo)
  if (!playableQualities.length) return null

  const currentQuality = player.actualQuality
  const qualityText = player.displayQualityText || '音质'
  const content = (
    <div className="coral-quality-switch">
      <div className="coral-quality-switch-header">
        <Text strong>播放音质</Text>
        <Text type="secondary">不支持时自动降级</Text>
      </div>
      <Space direction="vertical" size={6} className="coral-quality-switch-list">
        {playableQualities.map(quality => (
          <Button
            key={quality}
            block
            type={quality === currentQuality ? 'primary' : 'text'}
            onClick={() => {
              player.refreshCurrentMusicWithQuality(quality)
            }}
          >
            {qualityLabels[quality] ?? quality}
          </Button>
        ))}
      </Space>
    </div>
  )

  return (
    <Popover content={content} trigger="click" placement="topRight">
      <Button
        aria-label={`切换音质，当前${qualityText}`}
        icon={<ThunderboltOutlined />}
        shape="round"
        className="coral-quality-switch-trigger"
      >
        {qualityText}
      </Button>
    </Popover>
  )
})
