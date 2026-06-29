import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Segmented, Space, Spin, Tag, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { OnlineBoardSelector, OnlineSourceSelect } from '../online/OnlineControls';
import { OnlineMusicRowActions } from '../online/OnlineMusicRowActions';
import { OnlineMusicPreviewList, OnlinePager } from '../online/OnlinePreviewList';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

export const LeaderboardRoutePanel = observer(() => {
  const { leaderboard, list } = rootStore;
  const [viewMode, setViewMode] = useState<'board' | 'music'>('board');
  const activeBoardId = leaderboard.listDetailInfo.id || leaderboard.boardId;

  const maxPage =
    leaderboard.listDetailInfo.total > 0
      ? Math.ceil(leaderboard.listDetailInfo.total / leaderboard.listDetailInfo.limit)
      : undefined;
  const hasNextPage =
    maxPage != null
      ? leaderboard.listDetailInfo.page < maxPage
      : leaderboard.listDetailInfo.list.length >= leaderboard.listDetailInfo.limit;

  const handlePageChange = (page: number): void => {
    if (!activeBoardId) return;
    void leaderboard.loadListDetail(activeBoardId, page);
  };

  const boardListOptions = useMemo(
    () => [
      { label: '榜单', value: 'board' },
      { label: '歌曲', value: 'music' },
    ],
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Controls */}
      <div style={{ padding: '8px 15px', flex: 'none' }}>
        <Space wrap style={{ width: '100%' }}>
          <OnlineSourceSelect
            value={leaderboard.source}
            onChange={(source) => {
              leaderboard.setRouteState(source, null);
              void leaderboard.loadBoards(source);
            }}
            sources={leaderboard.sources}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={leaderboard.isLoadingBoards}
            onClick={() => {
              leaderboard.loadBoards().catch(() => {});
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
            value={viewMode}
            options={boardListOptions}
            onChange={(value) => {
              setViewMode(value as 'board' | 'music');
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
      <div
        className="scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '0 15px 15px', display: 'flex', gap: 15 }}
      >
        {/* Board list sidebar */}
        <div style={{ minWidth: 180, flex: 'none' }}>
          <Spin spinning={leaderboard.isLoadingBoards}>
            <OnlineBoardSelector
              activeBoardId={leaderboard.boardId}
              boards={leaderboard.activeBoardList}
              onSelect={(board) => {
                void leaderboard.loadListDetail(board.id);
                setViewMode('music');
              }}
            />
          </Spin>
        </div>

        {/* Detail content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === 'board' && !leaderboard.boardId ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary">选择一个榜单以查看歌曲</Text>
            </div>
          ) : null}

          {viewMode === 'music' && (
            <div>
              {leaderboard.boardId ? (
                <>
                  <Divider orientation="left" plain style={{ fontSize: 13, margin: '0 0 8px' }}>
                    <Space>
                      <Text strong>{leaderboard.boardId}</Text>
                      <Tag>{`${leaderboard.listDetailInfo.total} 首`}</Tag>
                    </Space>
                  </Divider>
                  <Spin spinning={leaderboard.isLoadingDetail}>
                    <OnlineMusicPreviewList
                      list={leaderboard.listDetailInfo.list}
                      emptyText={leaderboard.listDetailInfo.noItemLabel || '暂无歌曲'}
                      actions={(item) => [
                        <OnlineMusicRowActions
                          key="actions"
                          musicInfo={item}
                          queue={leaderboard.listDetailInfo.list}
                          queueId={`leaderboard:${leaderboard.source}:${leaderboard.boardId}:${leaderboard.listDetailInfo.page}`}
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
