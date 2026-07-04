import {
  DeleteOutlined,
  DownloadOutlined,
  OrderedListOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Badge, Button, Drawer, Empty, Tooltip, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { PlainList, PlainListItem, PlainListMeta } from '../base';
import { getSourceDisplayName } from '../../services/sourceNameService';
import { rootStore } from '../../stores/rootStore';
import type { PlayerRuntimeMusicInfo } from '../../services/playerService';
import { createWebDavDownloadInfo } from '../../services/downloadTaskFactory';
import { DownloadQualityModal } from './DownloadQualityModal';
import { FavoriteSongBtn } from './FavoriteSongBtn';

const { Text } = Typography;

const isDownloadMusicInfo = (
  musicInfo: PlayerRuntimeMusicInfo,
): musicInfo is Coral.Download.ListItem => 'progress' in musicInfo && 'metadata' in musicInfo;

const getQueueMusicId = (musicInfo: PlayerRuntimeMusicInfo): string => musicInfo.id;

const getQueueMusicName = (musicInfo: PlayerRuntimeMusicInfo): string =>
  isDownloadMusicInfo(musicInfo)
    ? musicInfo.metadata.musicInfo.name || musicInfo.metadata.fileName
    : musicInfo.name;

const getQueueMusicSinger = (musicInfo: PlayerRuntimeMusicInfo): string =>
  isDownloadMusicInfo(musicInfo) ? musicInfo.metadata.musicInfo.singer : musicInfo.singer;

const getQueueMusicSourceText = (musicInfo: PlayerRuntimeMusicInfo): string => {
  if (isDownloadMusicInfo(musicInfo)) return '下载';
  return musicInfo.source === 'local' ? '本地音乐' : getSourceDisplayName(musicInfo.source);
};

const getQueueMusicInterval = (musicInfo: PlayerRuntimeMusicInfo): string =>
  isDownloadMusicInfo(musicInfo)
    ? musicInfo.metadata.musicInfo.interval || '--:--'
    : musicInfo.interval || '--:--';

const getQueueMusicInfo = (musicInfo: PlayerRuntimeMusicInfo): Coral.Music.MusicInfo =>
  isDownloadMusicInfo(musicInfo) ? musicInfo.metadata.musicInfo : musicInfo;

export const PlayQueueBtn = observer(() => {
  const { download, player } = rootStore;
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [downloadMusicInfo, setDownloadMusicInfo] = useState<Coral.Music.MusicInfo | null>(null);
  const queueItems = player.queueItems;
  const currentQueueMusicId = player.currentQueueMusicId;

  const handleDownload = async (musicInfo: Coral.Music.MusicInfo): Promise<void> => {
    if (musicInfo.source === 'local') return;
    if (musicInfo.source === 'webdav') {
      await download.addAndStartTasks([createWebDavDownloadInfo(musicInfo)]);
      return;
    }
    setDownloadMusicInfo(musicInfo);
  };

  const content = (
    <div className="coral-play-queue-panel">
      <PlainList
        className="coral-play-queue-list"
        items={queueItems}
        empty={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无播放列表" />}
        renderItem={(item) => {
          const itemId = getQueueMusicId(item);
          const isActive = itemId === currentQueueMusicId;
          const musicInfo = getQueueMusicInfo(item);
          const canDownload = !isDownloadMusicInfo(item) && musicInfo.source !== 'local';
          const description = [
            getQueueMusicSinger(item),
            getQueueMusicSourceText(item),
            getQueueMusicInterval(item),
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <PlainListItem
              key={itemId}
              className={isActive ? 'is-active' : undefined}
              actions={[
                <Button
                  key="play"
                  type="text"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  aria-label="播放"
                  onClick={(event) => {
                    event.stopPropagation();
                    player.playFromQueue(item, queueItems, player.currentQueueId);
                  }}
                />,
                <FavoriteSongBtn
                  key="favorite"
                  musicInfo={musicInfo}
                  shape={undefined}
                  size="small"
                />,
                canDownload ? (
                  <Tooltip key="download" title="下载">
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      loading={download.isMutatingTask}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDownload(musicInfo);
                      }}
                    />
                  </Tooltip>
                ) : null,
                <Tooltip key="remove" title="从播放列表移除">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(event) => {
                      event.stopPropagation();
                      player.removeQueueItem(item);
                    }}
                  />
                </Tooltip>,
              ]}
              onClick={() => {
                player.playFromQueue(item, queueItems, player.currentQueueId);
              }}
            >
              <PlainListMeta
                title={<Text ellipsis>{getQueueMusicName(item)}</Text>}
                description={
                  <Text type="secondary" ellipsis>
                    {description}
                  </Text>
                }
              />
            </PlainListItem>
          );
        }}
      />
      <DownloadQualityModal
        musicInfo={downloadMusicInfo}
        listId={player.currentQueueId ?? ''}
        onClose={() => {
          setDownloadMusicInfo(null);
        }}
      />
    </div>
  );

  return (
    <>
      <Tooltip title="播放列表">
        <Badge count={queueItems.length} size="small" offset={[-2, 4]}>
          <Button
            aria-label="播放列表"
            icon={<OrderedListOutlined />}
            shape="circle"
            loading={isOpening}
            disabled={isOpening}
            onClick={() => {
              if (isOpening) return;
              setIsOpening(true);
              setIsOpen(true);
              setTimeout(() => {
                setIsOpening(false);
              }, 220);
            }}
          />
        </Badge>
      </Tooltip>
      <Drawer
        open={isOpen}
        title="播放列表"
        placement="right"
        width={420}
        className="coral-play-queue-drawer"
        styles={{ body: { padding: 0 } }}
        extra={<Text type="secondary">{queueItems.length} 首</Text>}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        {content}
      </Drawer>
    </>
  );
});
