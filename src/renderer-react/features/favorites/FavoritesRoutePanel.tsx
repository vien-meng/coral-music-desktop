import {
  DeleteOutlined,
  FolderAddOutlined,
  HeartFilled,
  OrderedListOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Image, Input, Modal, Space, Tabs, Tag, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { PlainList, PlainListItem, PlainListMeta } from '../../components/base';
import { OnlineMusicRowActions } from '../online/OnlineMusicRowActions';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

const CreateListButton = observer(() => {
  const { list } = rootStore;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async () => {
    await list.createUserList(name);
    setName('');
    setOpen(false);
  };

  return (
    <>
      <Button
        icon={<PlusOutlined />}
        onClick={() => {
          setOpen(true);
        }}
      >
        创建歌单
      </Button>
      <Modal
        open={open}
        title="创建歌单"
        onCancel={() => {
          setOpen(false);
        }}
        onOk={handleCreate}
        okButtonProps={{ disabled: !name.trim(), loading: list.isMutatingList }}
      >
        <Input
          autoFocus
          placeholder="歌单名称"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          onPressEnter={handleCreate}
        />
      </Modal>
    </>
  );
});

export const FavoritesRoutePanel = observer(() => {
  const { library, list, player, songList, ui } = rootStore;

  useEffect(() => {
    library.hydrate();
  }, [library]);

  const handleOpenSongList = async (item: Coral.Library.FavoriteSongList) => {
    await ui.withGlobalLoading(async () => {
      await songList.loadListDetail(item.id, item.source);
      ui.setActiveRoute('song-list');
    }, '正在打开收藏歌单...');
  };

  const handleAddSongsToSelectedList = async (musics: Coral.Music.MusicInfo[]) => {
    await list.hydrate();
    if (!list.selectedListId) return;
    await list.addMusicsToList(list.selectedListId, musics, 'top');
  };

  const handleOpenAlbum = async (item: Coral.Library.FavoriteAlbum) => {
    await ui.withGlobalLoading(async () => {
      await library.loadCategoryGroups('album');
      await library.loadCategoryItems(item.name.toLocaleLowerCase());
      ui.setActiveRoute('library');
    }, '正在打开收藏专辑...');
  };

  return (
    <div className="coral-page-panel">
      <div className="coral-page-toolbar">
        <Space wrap>
          <CreateListButton />
          <Button
            icon={<FolderAddOutlined />}
            disabled={!library.favoriteSongs.length}
            onClick={() => {
              handleAddSongsToSelectedList(library.favoriteSongs.map((item) => item.musicInfo));
            }}
          >
            歌曲加入当前列表
          </Button>
        </Space>
      </div>

      <Tabs
        items={[
          {
            key: 'songs',
            label: `收藏歌曲 ${library.favoriteSongs.length}`,
            children: (
              <PlainList
                items={library.favoriteSongs}
                loading={library.isHydrating || library.isMutating}
                renderItem={(item) => (
                  <PlainListItem
                    key={item.musicInfo.id}
                    actions={[
                      <OnlineMusicRowActions
                        key="actions"
                        musicInfo={item.musicInfo}
                        queue={library.favoriteSongs.map((song) => song.musicInfo)}
                        queueId="favorites:songs"
                      />,
                      <Button
                        key="remove"
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          library.toggleFavoriteSong(item.musicInfo);
                        }}
                      />,
                    ]}
                  >
                    <PlainListMeta
                      title={`${item.musicInfo.name} - ${item.musicInfo.singer}`}
                      description={item.musicInfo.meta.albumName || item.musicInfo.source}
                    />
                  </PlainListItem>
                )}
              />
            ),
          },
          {
            key: 'songlists',
            label: `收藏歌单 ${library.favoriteSongLists.length}`,
            children: (
              <PlainList
                items={library.favoriteSongLists}
                loading={library.isHydrating}
                renderItem={(item) => (
                  <PlainListItem
                    key={`${item.source}:${item.id}`}
                    actions={[
                      <Button
                        key="open"
                        type="text"
                        size="small"
                        icon={<OrderedListOutlined />}
                        onClick={() => {
                          handleOpenSongList(item);
                        }}
                      />,
                      <Button
                        key="remove"
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          library.removeFavoriteSongLists([item.id]);
                        }}
                      />,
                    ]}
                  >
                    <PlainListMeta
                      avatar={item.img ? <Image width={44} height={44} src={item.img} /> : null}
                      title={item.name}
                      description={
                        <Space size={6} wrap>
                          <Text type="secondary">{item.author || '未知作者'}</Text>
                          <Tag>{item.source}</Tag>
                          <Text type="secondary">{item.playCount}</Text>
                        </Space>
                      }
                    />
                  </PlainListItem>
                )}
              />
            ),
          },
          {
            key: 'albums',
            label: `收藏专辑 ${library.favoriteAlbums.length}`,
            children: (
              <PlainList
                items={library.favoriteAlbums}
                loading={library.isHydrating}
                renderItem={(item) => (
                  <PlainListItem
                    key={`${item.source}:${item.id}`}
                    actions={[
                      <Button
                        key="play"
                        type="text"
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={() => {
                          handleOpenAlbum(item);
                        }}
                      />,
                      <Button
                        key="remove"
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          library.removeFavoriteAlbums([item.id]);
                        }}
                      />,
                    ]}
                  >
                    <PlainListMeta
                      avatar={item.img ? <Image width={44} height={44} src={item.img} /> : null}
                      title={item.name}
                      description={
                        <Space size={6} wrap>
                          <Text type="secondary">{item.artist || '未知歌手'}</Text>
                          <Tag>{item.source}</Tag>
                        </Space>
                      }
                    />
                  </PlainListItem>
                )}
              />
            ),
          },
        ]}
      />
      {player.musicInfo ? (
        <Button
          icon={<HeartFilled />}
          onClick={() => {
            library.toggleFavoriteAlbumFromMusic(
              'progress' in player.musicInfo!
                ? player.musicInfo!.metadata.musicInfo
                : player.musicInfo!,
            );
          }}
        >
          收藏当前专辑
        </Button>
      ) : null}
    </div>
  );
});
