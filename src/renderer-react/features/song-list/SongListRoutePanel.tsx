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
  Image,
  Select,
  Space,
  Spin,
  Tag,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { rootStore } from '../../stores/rootStore';
import type { SongListTagItem } from '../../stores/domains/songListStore';
import { getSourceDisplayName } from '../../services/sourceNameService';
import { OnlineMusicRowActions } from '../online/OnlineMusicRowActions';
import { OnlineMusicPreviewList, OnlinePager } from '../online/OnlinePreviewList';
import { OpenListModal } from './components/OpenListModal';
import { TagPopover } from './components/TagPopover';

const { Text } = Typography;

const formatPlayCount = (count: string): string => {
  const n = Number(count);
  if (Number.isNaN(n)) return count;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return count;
};

export const SongListRoutePanel = observer(() => {
  const { player, songList, ui } = rootStore;
  const { library } = rootStore;
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
    (item: { id: string; source: Coral.OnlineSource }) => {
      if (songList.isLoadingDetail || ui.isGlobalLoading) return;
      songList.setDetailBackTarget('square');
      ui.withGlobalLoading(() => songList.loadListDetail(item.id, item.source), '正在打开歌单...');
    },
    [songList, ui],
  );

  const handleBackFromDetail = useCallback(() => {
    songList.setListDetailVisible(false);
    if (songList.detailBackTarget !== 'favorites') return;

    ui.setActiveFavoritesTab('songlists');
    ui.setActiveRoute('favorites');
  }, [songList, ui]);

  const handlePlayDetail = useCallback(() => {
    const queue = songList.listDetailInfo.list;
    if (!queue.length) return;
    setIsDetailPlayLoading(true);
    player.playFromQueue(
      queue[0],
      queue,
      `songlist:${songList.listDetailInfo.source}:${songList.listDetailInfo.id}:${songList.listDetailInfo.page}`,
    );
    setTimeout(() => {
      setIsDetailPlayLoading(false);
    }, 300);
  }, [
    player,
    songList.listDetailInfo.id,
    songList.listDetailInfo.list,
    songList.listDetailInfo.page,
    songList.listDetailInfo.source,
  ]);

  const handleCollectDetail = useCallback(() => {
    if (!songList.listDetailInfo.id || !songList.listDetailInfo.list.length) return;
    setIsDetailCollectLoading(true);
    library
      .toggleFavoriteSongList({
        author: songList.listDetailInfo.info.author ?? '',
        createdAt: Date.now(),
        desc: detailDesc ?? null,
        id: songList.listDetailInfo.id,
        img: songList.listDetailInfo.info.img ?? '',
        name: detailTitle,
        playCount: songList.listDetailInfo.info.play_count ?? '',
        source: songList.listDetailInfo.source,
      })
      .finally(() => {
        setIsDetailCollectLoading(false);
      });
  }, [
    detailDesc,
    detailTitle,
    library,
    songList.listDetailInfo.id,
    songList.listDetailInfo.info.author,
    songList.listDetailInfo.info.img,
    songList.listDetailInfo.info.play_count,
    songList.listDetailInfo.list.length,
    songList.listDetailInfo.source,
  ]);

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
    if (songList.isLoadingList || songList.hasListDetail || songList.listInfo.list.length) return;
    songList.loadList(songList.activeSource, '', '', 1);
  }, [songList]);

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
      {!songList.hasListDetail ? (
        <div className="coral-song-list-toolbar">
          <Space wrap size={10} className="coral-song-list-toolbar-inner">
            <Select
              value={songList.activeSource}
              onChange={(source) => {
                songList.setListInfo({ page: 1, source, sortId: '', tagId: '' });
                songList.loadList(source, '', '', 1);
                songList.loadTags(source);
              }}
              options={songList.sources.map((s) => ({ label: getSourceDisplayName(s), value: s }))}
              className="coral-source-select"
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
                className="coral-toolbar-icon-btn"
                icon={<TagsOutlined />}
                loading={songList.isLoadingTags}
                onClick={handleLoadAllTags}
              />
            </Tooltip>
            <Tooltip title="刷新列表">
              <Button
                className="coral-toolbar-icon-btn"
                icon={<ReloadOutlined />}
                loading={songList.isLoadingList}
                onClick={loadCurrentList}
              />
            </Tooltip>
            <Button
              className="coral-toolbar-text-btn"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsOpenListOpen(true);
              }}
            >
              导入歌单
            </Button>
          </Space>
        </div>
      ) : (
        <div className="coral-song-list-tabs">
          <Tabs
            activeKey="detail"
            onChange={(key) => {
              if (key === 'square') songList.setListDetailVisible(false);
            }}
            items={[
              { key: 'square', label: '歌单广场' },
              { key: 'detail', label: detailTitle },
            ]}
          />
        </div>
      )}

      {/* Errors */}
      {songList.tagError ? (
        <Alert
          showIcon
          type="error"
          title={songList.tagError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}
      {songList.listError ? (
        <Alert
          showIcon
          type="error"
          title={songList.listError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}
      {songList.detailError ? (
        <Alert
          showIcon
          type="error"
          title={songList.detailError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}

      {!songList.hasListDetail ? (
        <div className="coral-song-list-filter-row">
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
      ) : null}

      {/* Main content (scrollable) */}
      <div
        ref={listRef}
        className="scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '0 15px 15px' }}
      >
        {!songList.hasListDetail ? (
          <Spin spinning={songList.isLoadingList}>
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
                      if (songList.isLoadingDetail || ui.isGlobalLoading) return;
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
                  >
                    <Card.Meta
                      title={
                        <Text ellipsis style={{ fontSize: 13 }}>
                          {item.name}
                        </Text>
                      }
                      description={
                        <div>
                          <Text
                            type="secondary"
                            style={{ fontSize: 12, display: 'block' }}
                            ellipsis
                          >
                            {item.author}
                          </Text>
                          <Space style={{ fontSize: 11, marginTop: 4 }}>
                            <span>{formatPlayCount(item.play_count)}</span>
                            {item.total ? <span>{item.total}首</span> : null}
                            <Tag style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
                              {getSourceDisplayName(item.source)}
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
        ) : (
          <div className="coral-song-list-detail-page">
            {songList.listDetailInfo.info.name ? (
              <div className="coral-detail-header">
                <div className="coral-detail-cover">
                  <Image
                    src={songList.listDetailInfo.info.img}
                    alt={detailTitle}
                    preview={false}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                </div>
                <div className="coral-detail-meta">
                  <Text strong ellipsis className="coral-detail-title">
                    {detailTitle}
                  </Text>
                  {detailDesc ? (
                    <Text type="secondary" ellipsis={{ tooltip: detailDesc }}>
                      {detailDesc}
                    </Text>
                  ) : null}
                  <Space wrap size={8} className="coral-detail-actions">
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      loading={isDetailPlayLoading}
                      disabled={!songList.listDetailInfo.list.length}
                      onClick={handlePlayDetail}
                    >
                      播放全部
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      loading={isDetailCollectLoading}
                      disabled={!songList.listDetailInfo.list.length}
                      onClick={handleCollectDetail}
                    >
                      收藏歌单
                    </Button>
                    <Button icon={<CloseOutlined />} onClick={handleBackFromDetail}>
                      {songList.detailBackTarget === 'favorites' ? '返回收藏' : '返回广场'}
                    </Button>
                  </Space>
                </div>
              </div>
            ) : null}

            <Space wrap className="coral-song-list-detail-pager">
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
