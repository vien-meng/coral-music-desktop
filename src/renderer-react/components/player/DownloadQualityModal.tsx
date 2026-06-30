import { DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import { QUALITYS } from '@common/constants';
import { Button, Modal, Space, Typography } from 'antd';
import { useState } from 'react';
import * as downloadService from '../../services/downloadService';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

const qualityLabels: Record<Coral.Quality, string> = {
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
};

export interface DownloadQualityModalProps {
  musicInfo: Coral.Music.MusicInfo | null;
  listId?: string;
  onClose: () => void;
}

const isOnlineMusic = (
  musicInfo: Coral.Music.MusicInfo | null,
): musicInfo is Coral.Music.MusicInfoOnline =>
  Boolean(musicInfo && musicInfo.source !== 'local' && musicInfo.source !== 'webdav');

export const DownloadQualityModal = ({ musicInfo, listId, onClose }: DownloadQualityModalProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const onlineMusicInfo = isOnlineMusic(musicInfo) ? musicInfo : null;

  const sourceQualities = onlineMusicInfo?.meta.qualitys ?? [];
  const availableQualities = sourceQualities.slice().sort((left, right) => {
    const leftIndex = QUALITYS.indexOf(left.type);
    const rightIndex = QUALITYS.indexOf(right.type);
    return (
      (leftIndex < 0 ? QUALITYS.length : leftIndex) -
      (rightIndex < 0 ? QUALITYS.length : rightIndex)
    );
  });

  const handleDownload = async (quality: Coral.Quality): Promise<void> => {
    if (!onlineMusicInfo) return;

    setIsCreating(true);

    try {
      const tasks = await downloadService.createDownloadTasks(
        [onlineMusicInfo],
        quality,
        rootStore.settings.appSetting?.['download.fileName'] ?? '歌名 - 歌手',
        { [onlineMusicInfo.source]: [quality] },
        listId ?? '',
      );
      await rootStore.download.refreshTasks();
      await rootStore.download.startTasks(tasks.map((task) => task.id));
    } finally {
      setIsCreating(false);
      onClose();
    }
  };

  return (
    <Modal
      open={Boolean(onlineMusicInfo)}
      title={onlineMusicInfo ? `下载：${onlineMusicInfo.name} - ${onlineMusicInfo.singer}` : '下载'}
      footer={null}
      closeIcon={<CloseOutlined />}
      onCancel={onClose}
    >
      <Space orientation="vertical" size="small" className="coral-wide">
        {availableQualities.length === 0 ? (
          <Text type="secondary">暂无可用音质</Text>
        ) : (
          availableQualities.map((quality) => (
            <Button
              key={quality.type}
              block
              icon={<DownloadOutlined />}
              loading={isCreating}
              onClick={() => {
                handleDownload(quality.type as Coral.Quality);
              }}
            >
              {qualityLabels[quality.type as Coral.Quality] ?? quality.type}
              {quality.size ? ` - ${quality.size.toUpperCase()}` : ''}
            </Button>
          ))
        )}
      </Space>
    </Modal>
  );
};
