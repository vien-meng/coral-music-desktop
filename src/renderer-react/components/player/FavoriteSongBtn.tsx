import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { App, Button, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../stores/rootStore';

export interface FavoriteSongBtnProps {
  musicInfo?: Coral.Music.MusicInfo | null;
  shape?: 'circle';
  size?: 'small' | 'middle' | 'large';
}

export const FavoriteSongBtn = observer(({ musicInfo, shape = 'circle', size }: FavoriteSongBtnProps) => {
  const { message } = App.useApp();
  const { library } = rootStore;
  const isFavorite = musicInfo ? library.isFavoriteSong(musicInfo.id) : false;

  return (
    <Tooltip title={isFavorite ? '取消收藏' : '收藏歌曲'}>
      <Button
        aria-label={isFavorite ? '取消收藏歌曲' : '收藏歌曲'}
        disabled={!musicInfo}
        icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
        loading={library.isMutating}
        shape={shape}
        size={size}
        type={isFavorite ? 'primary' : 'default'}
        onClick={() => {
          if (!musicInfo) return;
          library.toggleFavoriteSong(musicInfo).then(() => {
            message.success(isFavorite ? '已取消收藏' : '已收藏歌曲');
          });
        }}
      />
    </Tooltip>
  );
});

