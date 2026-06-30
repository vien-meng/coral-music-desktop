import { ClearOutlined, DeleteOutlined, FolderAddOutlined } from '@ant-design/icons';
import { Button, Empty, Space, Tabs, Tag, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { PlainList, PlainListItem, PlainListMeta } from '../../components/base';
import { OnlineMusicRowActions } from '../online/OnlineMusicRowActions';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

const categoryTabs: Array<{ key: Coral.Library.CategoryType; label: string }> = [
  { key: 'album', label: '按专辑' },
  { key: 'genre', label: '按类型' },
  { key: 'artist', label: '按歌手' },
  { key: 'year', label: '按年代' },
];

export const LibraryRoutePanel = observer(() => {
  const { library, list, player } = rootStore;

  useEffect(() => {
    library.hydrate();
  }, [library]);

  const historyMusics = library.history.map((record) => record.musicInfo);

  const handleAddToSelectedList = async (musics: Coral.Music.MusicInfo[]) => {
    await list.hydrate();
    if (!list.selectedListId) return;
    await list.addMusicsToList(list.selectedListId, musics, 'top');
  };

  return (
    <div className="coral-page-panel">
      <Tabs
        items={[
          {
            key: 'history',
            label: `播放记录 ${library.history.length}`,
            children: (
              <>
                <div className="coral-page-toolbar">
                  <Space wrap>
                    <Button
                      icon={<FolderAddOutlined />}
                      disabled={!historyMusics.length}
                      onClick={() => {
                        handleAddToSelectedList(historyMusics);
                      }}
                    >
                      加入当前列表
                    </Button>
                    <Button
                      danger
                      icon={<ClearOutlined />}
                      disabled={!library.history.length}
                      onClick={() => {
                        library.clearHistory();
                      }}
                    >
                      清空记录
                    </Button>
                  </Space>
                </div>
                <PlainList
                  items={library.history}
                  loading={library.isHydrating}
                  renderItem={(record) => (
                    <PlainListItem
                      key={`${record.musicInfo.source}:${record.id}`}
                      actions={[
                        <OnlineMusicRowActions
                          key="actions"
                          musicInfo={record.musicInfo}
                          queue={historyMusics}
                          queueId="library:history"
                        />,
                        <Button
                          key="remove"
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            library.removeHistory([record.id]);
                          }}
                        />,
                      ]}
                    >
                      <PlainListMeta
                        title={`${record.musicInfo.name} - ${record.musicInfo.singer}`}
                        description={
                          <Space size={6} wrap>
                            <Text type="secondary">{record.musicInfo.meta.albumName || '无专辑'}</Text>
                            <Tag>{record.musicInfo.source}</Tag>
                            <Text type="secondary">
                              {record.playCount} 次 · {new Date(record.playedAt).toLocaleString()}
                            </Text>
                          </Space>
                        }
                      />
                    </PlainListItem>
                  )}
                />
              </>
            ),
          },
          {
            key: 'categories',
            label: '音乐分类',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12 }}>
                <div>
                  <Tabs
                    activeKey={library.selectedCategoryType}
                    items={categoryTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
                    onChange={(key) => {
                      library.loadCategoryGroups(key as Coral.Library.CategoryType);
                    }}
                  />
                  <PlainList
                    items={library.categoryGroups}
                    loading={library.isLoadingCategory}
                    renderItem={(group) => (
                      <PlainListItem
                        key={group.key}
                        className={
                          group.key === library.selectedCategoryKey ? 'coral-list-item-active' : ''
                        }
                        onClick={() => {
                          library.loadCategoryItems(group.key);
                        }}
                      >
                        <PlainListMeta
                          title={group.name}
                          description={`${group.count} 首歌曲`}
                        />
                      </PlainListItem>
                    )}
                  />
                </div>
                <PlainList
                  items={library.categoryItems}
                  loading={library.isLoadingCategory}
                  empty={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无分类歌曲" />}
                  renderItem={(musicInfo) => (
                    <PlainListItem
                      key={`${musicInfo.source}:${musicInfo.id}`}
                      actions={[
                        <OnlineMusicRowActions
                          key="actions"
                          musicInfo={musicInfo}
                          queue={library.categoryItems}
                          queueId={`library:${library.selectedCategoryType}:${library.selectedCategoryKey}`}
                        />,
                        <Button
                          key="album"
                          type="text"
                          size="small"
                          onClick={() => {
                            library.toggleFavoriteAlbumFromMusic(musicInfo);
                          }}
                        >
                          收藏专辑
                        </Button>,
                      ]}
                    >
                      <PlainListMeta
                        title={`${musicInfo.name} - ${musicInfo.singer}`}
                        description={musicInfo.meta.albumName || musicInfo.source}
                      />
                    </PlainListItem>
                  )}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
});

