import { DownloadOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Modal, Space, Typography } from 'antd'
import { useState } from 'react'
import * as downloadService from '../../services/downloadService'
import { rootStore } from '../../stores/rootStore'

const { Text } = Typography

const qualityLabels: Record<LX.Quality, string> = {
  flac24bit: 'FLAC Hires',
  flac: 'FLAC',
  ape: 'APE',
  wav: 'WAV',
  '320k': '320k MP3',
  '192k': '192k MP3',
  '128k': '128k MP3',
}

export interface DownloadQualityModalProps {
  musicInfo: LX.Music.MusicInfo | null
  listId?: string
  onClose: () => void
}

export const DownloadQualityModal = ({ musicInfo, listId, onClose }: DownloadQualityModalProps) => {
  const [isCreating, setIsCreating] = useState(false)

  const sourceQualities = musicInfo?.source === 'local' ? [] : musicInfo?.meta.qualitys ?? []
  const availableQualities = sourceQualities

  const handleDownload = async(quality: LX.Quality): Promise<void> => {
    if (!musicInfo) return

    setIsCreating(true)

    try {
      await downloadService.createDownloadTasks(
        [musicInfo as LX.Music.MusicInfoOnline],
        quality,
        '%title% - %artist%',
        { [musicInfo.source]: [quality] },
        listId ?? '',
      )
      void rootStore.download.refreshTasks()
    } finally {
      setIsCreating(false)
      onClose()
    }
  }

  return (
    <Modal
      open={Boolean(musicInfo)}
      title={musicInfo ? `下载：${musicInfo.name} - ${musicInfo.singer}` : '下载'}
      footer={null}
      closeIcon={<CloseOutlined />}
      onCancel={onClose}
    >
      <Space direction="vertical" size="small" className="coral-wide">
        {availableQualities.length === 0
          ? <Text type="secondary">暂无可用音质</Text>
          : availableQualities.map(quality => (
            <Button
              key={quality.type}
              block
              icon={<DownloadOutlined />}
              loading={isCreating}
              onClick={() => {
                void handleDownload(quality.type as LX.Quality)
              }}
            >
              {qualityLabels[quality.type as LX.Quality] ?? quality.type}
              {quality.size ? ` - ${quality.size.toUpperCase()}` : ''}
            </Button>
          ))}
      </Space>
    </Modal>
  )
}
