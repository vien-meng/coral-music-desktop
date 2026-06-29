import {
  CloseOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Divider,
  Image,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { rootStore } from '../../stores/rootStore';
import type { SongListTagItem } from '../../stores/domains/songListStore';
import { OnlineMusicRowActions } from '../online/OnlineMusicRowActions';
import { OnlineMusicPreviewList, OnlinePager } from '../online/OnlinePreviewList';
import { OpenListModal } from './components/OpenListModal';
import { TagPopover } from './components/TagPopover';

const { Text } = Typography;

const formatSource = (source: string): string => source.toUpperCase();
const formatPlayCount = (count: string): string => {
  const n = Number(count);
  if (Number.isNaN(n)) return count;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return count;
};

export const SongListRoutePanel = observer(() => {
  const { songList } = rootStore;
  const [isOpenListOpen, setIsOpenListOpen] = useState(false);
  const [isDetailPlayLoading, setIsDetailPlayLoading] = useState(false);
  const [isDetailCollectLoading, setIsDetailCollectLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Derived data
  const groupedTags = useMemo(() => {
    const tagInfo = songList.tags[songList.activeSource];
    if (!tagInfo) return [];
    return [{ name: '热门标签', list: tagInfo.hotTag }, ...tagInfo.tags] as Array<{
      name: string;
      list: Array<SongListTagItem>;
    }>;
  }, [songList.tags, songList.activeSource]);

  const maxPage =
    songList.listInfo.total > 0
      ? Math.ceil(songList.listInfo.total / songList.listInfo.limit)
      : undefined;
  const hasNextPage =
    maxPage != null
      ? songList.listInfo.page < maxPage
      : songList.listInfo.list.length >= songList.listInfo.limit;

  const detailMaxPage =
    songList.listDetailInfo.total > 0
      ? Math.ceil(songList.listDetailInfo.total / songList.listDetailInfo.limit)
      : undefined;
  const hasNextDetailPage =
    detailMaxPage != null
      ? songList.listDetailInfo.page < detailMaxPage
      : songList.listDetailInfo.list.length >= songList.listDetailInfo.limit;
  const detailTitle =
    songList.listDetailInfo.info.name ?? songList.selectListInfo?.name ?? '歌单详情';

  const detailDesc = songList.listDetailInfo.desc ?? songList.listDetailInfo.info.desc;

  // Handlers
  const loadCurrentList = useCallback(() => {
    songList.loadList(
      songList.activeSource,
      songList.listInfo.tagId,
      songList.listInfo.sortId,
      songList.listInfo.page,
    );
  }, [songList]);

  const handlePageChange = useCallback(
    (page: number) => {
      songList.setListInfo({ page });
      songList.loadList(
        songList.activeSource,
        songList.listInfo.tagId,
        songList.listInfo.sortId,
        page,
      );
    },
    [songList],
  );

  const handleDetailPageChange = useCallback(
    (page: number) => {
      if (!songList.listDetailInfo.id) return;
      songList.loadListDetail(songList.listDetailInfo.id, songList.listDetailInfo.source, page);
    },
    [songList],
  );

  const handleSelectSongList = useCallback(
    (item: { id: string; source: LX.OnlineSource }) => {
      songList.loadListDetail(item.id, item.source);
    },
    [songList],
  );

  const handlePlayDetail = useCallback(() => {
    if (!songList.listDetailInfo.list.length) return;
    setIsDetailPlayLoading(true);
    setTimeout(() => {
      setIsDetailPlayLoading(false);
    }, 1000);
  }, [songList.listDetailInfo.list.length]);

  const handleCollectDetail = useCallback(() => {
    if (!songList.listDetailInfo.id || !songList.listDetailInfo.list.length) return;
    setIsDetailCollectLoading(true);
    setTimeout(() => {
      setIsDetailCollectLoading(false);
    }, 1000);
  }, [songList.listDetailInfo.id, songList.listDetailInfo.list.length]);

  const handleLoadAllTags = useCallback(() => {
    songList.loadTags();
  }, [songList]);

  // Scroll position save/restore
  const scrollKey = useMemo(
    () =>
      `slist__${songList.activeSource}__${songList.listInfo.sortId}__${songList.listInfo.tagId}`,
    [songList.activeSource, songList.listInfo.sortId, songList.listInfo.tagId],
  );

  const savedScrollRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const saved = savedScrollRef.current[scrollKey];
    if (saved != null && listRef.current) {
      listRef.current.scrollTop = saved;
    }
    return () => {
      if (listRef.current) {
        savedScrollRef.current[scrollKey] = listRef.current.scrollTop;
      }
    };
  });

  return (
    <div
      className="coral-song-list"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      {/* Controls bar */}
      <div style={{ padding: '8px 15px', flex: 'none' }}>
        <Space wrap style={{ width: '100%' }}>
          <Select
            value={songList.activeSource}
            onChange={(source) => {
              songList.setListInfo({ page: 1, source, sortId: '', tagId: '' });
              songList.loadTags(source);
            }}
            options={songList.sources.map((s) => ({ label: formatSource(s), value: s }))}
            className="coral-source-select"
            style={{ width: 80 }}
          />
          <Select
            allowClear
            value={songList.listInfo.sortId || undefined}
            placeholder="排序"
            options={
              songList.sortList[songList.activeSource]?.map((sort) => ({
                label: sort.name,
                value: sort.id,
              })) ?? []
            }
            className="coral-sort-select"
            style={{ minWidth: 100 }}
            onChange={(sortId) => {
              songList.setListInfo({ page: 1, sortId: sortId ?? '' });
            }}
          />
          <OnlinePager
            hasNext={hasNextPage}
            loading={songList.isLoadingList}
            maxPage={maxPage}
            page={songList.listInfo.page}
            onChange={handlePageChange}
          />
          <Tooltip title="标签">
            <Button
              icon={<TagsOutlined />}
              loading={songList.isLoadingTags}
              onClick={handleLoadAllTags}
            />
          </Tooltip>
          <Tooltip title="刷新列表">
            <Button
              icon={<ReloadOutlined />}
              loading={songList.isLoadingList}
              onClick={loadCurrentList}
            />
          </Tooltip>
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              setIsOpenListOpen(true);
            }}
          >
            导入
          </Button>
        </Space>
      </div>

      {/* Errors */}
      {songList.tagError ? (
        <Alert
          showIcon
          type="error"
          message={songList.tagError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}
      {songList.listError ? (
        <Alert
          showIcon
          type="error"
          message={songList.listError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}
      {songList.detailError ? (
        <Alert
          showIcon
          type="error"
          message={songList.detailError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}

      {/* Tag row */}
      <div style={{ padding: '0 15px 8px', flex: 'none' }}>
        <Space>
          <TagPopover
            activeTagId={songList.listInfo.tagId}
            groupedTags={groupedTags}
            onSelect={(tag) => {
              songList.setListInfo({ page: 1, tagId: tag.id });
              songList.loadList(songList.activeSource, tag.id, songList.listInfo.sortId, 1);
            }}
          />
        </Space>
      </div>

      {/* Main content (scrollable) */}
      <div
        ref={listRef}
        className="scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '0 15px 15px' }}
      >
        <Spin spinning={songList.isLoadingList}>
          {/* Song list grid */}
          {songList.listInfo.noItemLabel && !songList.listInfo.list.length ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary">
                {songList.listInfo.noItemLabel === 'list__loading'
                  ? '加载中...'
                  : songList.listInfo.noItemLabel}
              </Text>
            </div>
          ) : (
            <div className="coral-song-list-grid">
              {songList.listInfo.list.map((item) => (
                <Card
                  key={`${item.source}__${item.id}`}
                  size="small"
                  hoverable
                  className="coral-song-list-card"
                  onClick={() => {
                    handleSelectSongList(item);
                  }}
                  cover={
                    <div className="coral-song-list-card-cover">
                      <Image
                        src={item.img}
                        alt={item.name}
                        preview={false}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                      />
                    </div>
                  }
                  style={{ width: '32%', minWidth: 220, maxWidth: 320 }}
                >
                  <Card.Meta
                    title={
                      <Text ellipsis style={{ fontSize: 13 }}>
                        {item.name}
                      </Text>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }} ellipsis>
                          {item.author}
                        </Text>
                        <Space style={{ fontSize: 11, marginTop: 4 }}>
                          <span>{formatPlayCount(item.play_count)}</span>
                          {item.total ? <span>{item.total}首</span> : null}
                          <Tag style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
                            {formatSource(item.source)}
                          </Tag>
                        </Space>
                      </div>
                    }
                  />
                </Card>
              ))}
            </div>
          )}
        </Spin>

        {/* Detail section */}
        {songList.hasListDetail && (
          <div className="coral-detail-section" style={{ marginTop: 24 }}>
            <Divider titlePlacement="left" plain style={{ fontSize: 14, margin: '12px 0' }}>
              <Text ellipsis>{detailTitle}</Text>
            </Divider>

            {/* Detail header */}
            {songList.listDetailInfo.info.name && (
              <div
                className="coral-detail-header"
                style={{ display: 'flex', gap: 15, padding: '0 0 15px' }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    flex: 'none',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={songList.listDetailInfo.info.img}
                    alt={detailTitle}
                    preview={false}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div
                  style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  <Text strong ellipsis style={{ fontSize: 14 }}>
                    {detailTitle}
                  </Text>
                  {detailDesc ? (
                    <Text
                      type="secondary"
                      style={{ fontSize: 12, lineHeight: 1.4 }}
                      ellipsis={{ tooltip: detailDesc }}
                    >
                      {detailDesc}
                    </Text>
                  ) : null}
                  <Space style={{ marginTop: 4 }}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      loading={isDetailPlayLoading}
                      disabled={!songList.listDetailInfo.list.length}
                      onClick={handlePlayDetail}
                    >
                      播放
                    </Button>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      loading={isDetailCollectLoading}
                      disabled={!songList.listDetailInfo.list.length}
                      onClick={handleCollectDetail}
                    >
                      收藏
                    </Button>
                    <Tooltip title="关闭详情">
                      <Button
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          songList.setListDetailVisible(false);
                        }}
                      />
                    </Tooltip>
                  </Space>
                </div>
              </div>
            )}

            <Space wrap style={{ marginBottom: 8 }}>
              <OnlinePager
                disabled={!songList.listDetailInfo.id}
                hasNext={hasNextDetailPage}
                loading={songList.isLoadingDetail}
                maxPage={detailMaxPage}
                page={songList.listDetailInfo.page}
                onChange={handleDetailPageChange}
              />
            </Space>

            <Spin spinning={songList.isLoadingDetail}>
              <OnlineMusicPreviewList
                list={songList.listDetailInfo.list}
                emptyText={songList.listDetailInfo.noItemLabel || '暂无歌曲'}
                actions={(item) => [
                  <OnlineMusicRowActions
                    key="actions"
                    musicInfo={item}
                    queue={songList.listDetailInfo.list}
                    queueId={`songlist:${songList.listDetailInfo.source}:${songList.listDetailInfo.id}:${songList.listDetailInfo.page}`}
                  />,
                ]}
              />
            </Spin>
          </div>
        )}
      </div>

      <OpenListModal
        open={isOpenListOpen}
        onClose={() => {
          setIsOpenListOpen(false);
        }}
      />
    </div>
  );
});
