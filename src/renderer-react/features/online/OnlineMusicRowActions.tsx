import { DownloadOutlined, FolderAddOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { DownloadQualityModal } from '../../components/player/DownloadQualityModal';
import { createWebDavDownloadInfo } from '../../services/downloadTaskFactory';
import { rootStore } from '../../stores/rootStore';

export interface OnlineMusicRowActionsProps {
  musicInfo: Coral.Music.MusicInfo;
  queue?: Coral.Music.MusicInfo[];
  queueId?: string | null;
}

export const OnlineMusicRowActions = observer(
  ({ musicInfo, queue, queueId = null }: OnlineMusicRowActionsProps) => {
    const { list, player, settings } = rootStore;
    const [downloadMusicInfo, setDownloadMusicInfo] = useState<Coral.Music.MusicInfo | null>(null);
    const addMusicLocationType = settings.appSetting?.['list.addMusicLocationType'] ?? 'top';

    const handlePlay = (): void => {
      if (queue?.length) {
        player.playFromQueue(musicInfo, queue, queueId);
        return;
      }

      player.playMusic(musicInfo);
    };

    const handleAddToList = async (): Promise<void> => {
      await list.hydrate();
      if (!list.selectedListId) {
        list.setActionError('没有可添加的本地列表');
        return;
      }
      await list.addMusicsToList(list.selectedListId, [musicInfo], addMusicLocationType);
    };

    const handleDownload = async (): Promise<void> => {
      if (musicInfo.source === 'webdav') {
        const task = createWebDavDownloadInfo(musicInfo);
        await rootStore.download.addAndStartTasks([task]);
        return;
      }

      setDownloadMusicInfo(musicInfo);
    };

    return (
      <>
        <Space size={4}>
          <Tooltip title="播放">
            <Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={handlePlay} />
          </Tooltip>
          <Tooltip title="添加到当前列表">
            <Button
              type="text"
              size="small"
              icon={<FolderAddOutlined />}
              loading={list.isAddingMusic}
              onClick={() => {
                handleAddToList();
              }}
            />
          </Tooltip>
          {musicInfo.source !== 'local' ? (
            <Tooltip title="下载">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
              />
            </Tooltip>
          ) : null}
        </Space>
        <DownloadQualityModal
          musicInfo={downloadMusicInfo}
          onClose={() => {
            setDownloadMusicInfo(null);
          }}
        />
      </>
    );
  },
);
