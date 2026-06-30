import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Segmented, Space, Spin, Tag, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo } from 'react';
import { OnlineBoardSelector, OnlineSourceSelect } from '../online/OnlineControls';
import { OnlineMusicRowActions } from '../online/OnlineMusicRowActions';
import { OnlineMusicPreviewList, OnlinePager } from '../online/OnlinePreviewList';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

export const LeaderboardRoutePanel = observer(() => {
  const { leaderboard, list, player } = rootStore;
  const activeBoardId = leaderboard.listDetailInfo.id || leaderboard.boardId;
  const activeBoardName =
    leaderboard.activeBoardList.find((board) => board.id === activeBoardId)?.name ?? '当前榜单';
  const currentQueueId = activeBoardId
    ? `leaderboard:${leaderboard.source}:${activeBoardId}:${leaderboard.listDetailInfo.page}`
    : null;

  const maxPage =
    leaderboard.listDetailInfo.total > 0
      ? Math.ceil(leaderboard.listDetailInfo.total / leaderboard.listDetailInfo.limit)
      : undefined;
  const hasNextPage =
    maxPage != null
      ? leaderboard.listDetailInfo.page < maxPage
      : leaderboard.listDetailInfo.list.length >= leaderboard.listDetailInfo.limit;

  const handlePageChange = (page: number): void => {
    if (!activeBoardId || leaderboard.isLoadingDetail) return;
    leaderboard.loadListDetail(activeBoardId, page);
  };

  const loadDefaultLeaderboard = useCallback(
    async (source = leaderboard.source): Promise<void> => {
      leaderboard.setRouteState(source, null);
      await leaderboard.loadBoards(source);
      const firstBoardId = leaderboard.activeBoardList[0]?.id ?? leaderboard.boardId;
      if (!firstBoardId) {
        leaderboard.setViewMode('board');
        return;
      }

      await leaderboard.loadListDetail(firstBoardId);
    },
    [leaderboard],
  );

  useEffect(() => {
    if (leaderboard.isLoadingBoards || leaderboard.activeBoardList.length || leaderboard.boardId)
      return;
    loadDefaultLeaderboard();
  }, [leaderboard, loadDefaultLeaderboard]);

  const boardListOptions = useMemo(
    () => [
      { label: '榜单', value: 'board' },
      { label: '歌曲', value: 'music' },
    ],
    [],
  );

  const handlePlayAll = (): void => {
    const queue = leaderboard.listDetailInfo.list;
    if (!queue.length) return;
    player.playFromQueue(queue[0], queue, currentQueueId);
  };

  return (
    <div className="coral-leaderboard-route">
      {/* Controls */}
      <div className="coral-leaderboard-toolbar">
        <Space wrap className="coral-leaderboard-toolbar-inner">
          <OnlineSourceSelect
            value={leaderboard.source}
            onChange={(source) => {
              loadDefaultLeaderboard(source);
            }}
            sources={leaderboard.sources}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={leaderboard.isLoadingBoards}
            onClick={() => {
              loadDefaultLeaderboard().catch(() => {});
            }}
          >
            榜单
          </Button>
          <OnlinePager
            disabled={!activeBoardId}
            hasNext={hasNextPage}
            loading={leaderboard.isLoadingDetail}
            maxPage={maxPage}
            page={leaderboard.listDetailInfo.page}
            onChange={handlePageChange}
          />
          <Segmented
            value={leaderboard.viewMode}
            options={boardListOptions}
            disabled={leaderboard.isLoadingBoards || leaderboard.isLoadingDetail}
            onChange={(value) => {
              leaderboard.setViewMode(value as 'board' | 'music');
            }}
          />
        </Space>
      </div>

      {/* Errors */}
      {leaderboard.detailError ? (
        <Alert
          showIcon
          type="error"
          message={leaderboard.detailError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}
      {list.actionError ? (
        <Alert
          showIcon
          type="error"
          message={list.actionError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}

      {/* Board list + selected board detail */}
      <div className="coral-leaderboard-body scroll">
        {/* Board list sidebar */}
        <div className="coral-leaderboard-sidebar">
          <Spin spinning={leaderboard.isLoadingBoards}>
            <OnlineBoardSelector
              activeBoardId={leaderboard.boardId}
              boards={leaderboard.activeBoardList}
              disabled={leaderboard.isLoadingDetail}
              onSelect={(board) => {
                if (leaderboard.isLoadingDetail) return;
                leaderboard.loadListDetail(board.id);
                leaderboard.setViewMode('music');
              }}
            />
          </Spin>
        </div>

        {/* Detail content */}
        <div className="coral-leaderboard-detail">
          {leaderboard.viewMode === 'board' && !leaderboard.boardId ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary">选择一个榜单以查看歌曲</Text>
            </div>
          ) : null}

          {leaderboard.viewMode === 'music' && (
            <div className="coral-leaderboard-music-view">
              {leaderboard.boardId ? (
                <>
                  <Divider titlePlacement="left" plain style={{ fontSize: 13, margin: '0 0 8px' }}>
                    <Space>
                      <Text strong>{activeBoardName}</Text>
                      <Tag>{`${leaderboard.listDetailInfo.total} 首`}</Tag>
                      <Button
                        size="small"
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        disabled={!leaderboard.listDetailInfo.list.length}
                        onClick={handlePlayAll}
                      >
                        播放全部
                      </Button>
                    </Space>
                  </Divider>
                  <Spin spinning={leaderboard.isLoadingDetail} className="coral-leaderboard-spin">
                    <OnlineMusicPreviewList
                      list={leaderboard.listDetailInfo.list}
                      emptyText={leaderboard.listDetailInfo.noItemLabel || '暂无歌曲'}
                      actions={(item) => [
                        <OnlineMusicRowActions
                          key="actions"
                          musicInfo={item}
                          queue={leaderboard.listDetailInfo.list}
                          queueId={currentQueueId}
                        />,
                      ]}
                    />
                  </Spin>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Text type="secondary">选择一个榜单以查看歌曲</Text>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
