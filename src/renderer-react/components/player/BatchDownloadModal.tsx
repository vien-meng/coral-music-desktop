import { DownloadOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Empty, Modal, Space, Typography } from 'antd'
import { useState } from 'react'
import { PlainList, PlainListItem, PlainListMeta } from '../base'
import * as downloadService from '../../services/downloadService'
import { rootStore } from '../../stores/rootStore'

const { Text } = Typography

const qualityLabels: Record<string, string> = {
  flac24bit: 'FLAC Hires',
  hires: 'Hi-Res',
  atmos: 'Atmos',
  atmos_plus: 'Atmos Plus',
  master: 'Master',
  flac: 'FLAC',
  ape: 'APE',
  wav: 'WAV',
  '320k': '320k MP3',
  '192k': '192k MP3',
  '128k': '128k MP3',
}

export interface BatchDownloadModalProps {
  musics: LX.Music.MusicInfo[]
  onClose: () => void
}

export const BatchDownloadModal = ({ musics, onClose }: BatchDownloadModalProps) => {
  const [isCreating, setIsCreating] = useState(false)

  const handleDownloadAll = async(quality: LX.Quality): Promise<void> => {
    setIsCreating(true)
    try {
      const qualityList = musics.reduce<LX.QualityList>((list, musicInfo) => {
        list[musicInfo.source] = [quality]
        return list
      }, {})
      await downloadService.createDownloadTasks(
        musics as LX.Music.MusicInfoOnline[],
        quality,
        '%title% - %artist%',
        qualityList,
        '',
      )
      void rootStore.download.refreshTasks()
    } finally {
      setIsCreating(false)
      onClose()
    }
  }

  return (
    <Modal
      open={musics.length > 0}
      title={`批量下载（${musics.length} 首）`}
      footer={null}
      closeIcon={<CloseOutlined />}
      onCancel={onClose}
    >
      <Space direction="vertical" size="small" className="coral-wide">
        <Text type="secondary">选择音质后，所有歌曲将以该音质添加到下载列表</Text>
        <PlainList
          items={musics.slice(0, 100)}
          empty={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无歌曲" />}
          renderItem={item => (
            <PlainListItem key={item.id}>
              <PlainListMeta
                title={item.name}
                description={`${item.singer} · ${item.source}`}
              />
            </PlainListItem>
          )}
        />
        {musics.length > 100 && <Text type="secondary">...及其他 {musics.length - 100} 首</Text>}
        <Space wrap>
          {(['flac24bit', 'flac', 'ape', 'wav', '320k', '192k', '128k'] as LX.Quality[]).map(quality => (
            <Button
              key={quality}
              icon={<DownloadOutlined />}
              loading={isCreating}
              onClick={() => { void handleDownloadAll(quality) }}
            >
              {qualityLabels[quality as string] ?? quality}
            </Button>
          ))}
        </Space>
      </Space>
    </Modal>
  )
}
