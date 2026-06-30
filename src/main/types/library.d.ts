declare namespace Coral {
  namespace Library {
    type FavoriteKind = 'song' | 'songlist' | 'album';
    type CategoryType = 'album' | 'genre' | 'artist' | 'year';

    interface PlayRecord {
      id: string;
      lastDuration: number;
      musicInfo: Coral.Music.MusicInfo;
      playedAt: number;
      playCount: number;
      sourceContext: string | null;
    }

    interface FavoriteSong {
      createdAt: number;
      musicInfo: Coral.Music.MusicInfo;
    }

    interface FavoriteSongList {
      author: string;
      createdAt: number;
      desc: string | null;
      id: string;
      img: string;
      name: string;
      playCount: string;
      source: Coral.OnlineSource;
    }

    interface FavoriteAlbum {
      artist: string;
      createdAt: number;
      id: string;
      img: string;
      name: string;
      source: Coral.Music.MusicInfo['source'];
    }

    interface MusicCategoryGroup {
      count: number;
      key: string;
      name: string;
      type: CategoryType;
    }

    interface MusicCategory {
      count: number;
      items: Coral.Music.MusicInfo[];
      key: string;
      name: string;
      type: CategoryType;
    }

    interface PlayRecordInput {
      lastDuration?: number;
      musicInfo: Coral.Music.MusicInfo;
      sourceContext?: string | null;
    }

    interface CategoryItemsQuery {
      key: string;
      type: CategoryType;
    }
  }
}

