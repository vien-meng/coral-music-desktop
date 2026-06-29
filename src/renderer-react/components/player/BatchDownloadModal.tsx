import { DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import { QUALITYS } from '@common/constants';
import { Button, Empty, Modal, Space, Typography } from 'antd';
import { useState } from 'react';
import { PlainList, PlainListItem, PlainListMeta } from '../base';
import * as downloadService from '../../services/downloadService';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

const batchDownloadQualities = QUALITYS.filter((quality) => quality !== 'wav' && quality !== 'ape');

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
};

export interface BatchDownloadModalProps {
  musics: LX.Music.MusicInfo[];
  onClose: () => void;
}

export const BatchDownloadModal = ({ musics, onClose }: BatchDownloadModalProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const onlineMusics = musics.filter(
    (musicInfo): musicInfo is LX.Music.MusicInfoOnline => musicInfo.source !== 'local',
  );
  const availableQualities = batchDownloadQualities.filter((quality) => {
    const qualityIndex = QUALITYS.indexOf(quality);
    if (!onlineMusics.length || qualityIndex < 0) return false;

    return onlineMusics.every((musicInfo) =>
      QUALITYS.slice(qualityIndex).some((fallbackQuality) =>
        Boolean(musicInfo.meta._qualitys[fallbackQuality]),
      ),
    );
  });

  const handleDownloadAll = async (quality: LX.Quality): Promise<void> => {
    if (!onlineMusics.length) return;

    setIsCreating(true);
    try {
      const qualityList = onlineMusics.reduce<LX.QualityList>((list, musicInfo) => {
        list[musicInfo.source] = [quality];
        return list;
      }, {});
      const tasks = await downloadService.createDownloadTasks(
        onlineMusics,
        quality,
        rootStore.settings.appSetting?.['download.fileName'] ?? '歌名 - 歌手',
        qualityList,
        '',
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
      open={musics.length > 0}
      title={`批量下载（${musics.length} 首）`}
      footer={null}
      closeIcon={<CloseOutlined />}
      onCancel={onClose}
    >
      <Space direction="vertical" size="small" className="coral-wide">
        <Text type="secondary">选择音质后，所有在线歌曲将按该音质或可用低档音质添加到下载列表</Text>
        <PlainList
          items={musics.slice(0, 100)}
          empty={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无歌曲" />}
          renderItem={(item) => (
            <PlainListItem key={item.id}>
              <PlainListMeta title={item.name} description={`${item.singer} · ${item.source}`} />
            </PlainListItem>
          )}
        />
        {musics.length > 100 && <Text type="secondary">...及其他 {musics.length - 100} 首</Text>}
        <Space wrap>
          {availableQualities.length ? (
            availableQualities.map((quality) => (
              <Button
                key={quality}
                icon={<DownloadOutlined />}
                loading={isCreating}
                onClick={() => {
                  handleDownloadAll(quality);
                }}
              >
                {qualityLabels[quality as string] ?? quality}
              </Button>
            ))
          ) : (
            <Text type="secondary">暂无可下载音质</Text>
          )}
        </Space>
      </Space>
    </Modal>
  );
};
