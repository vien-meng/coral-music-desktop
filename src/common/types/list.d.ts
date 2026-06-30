declare namespace Coral {
  namespace List {
    interface UserListInfo {
      id: string;
      name: string;
      // list: Coral.Music.MusicInfo[]
      source?: Coral.OnlineSource;
      sourceListId?: string;
      // position?: number
      locationUpdateTime: number | null;
    }

    interface MyDefaultListInfo {
      id: 'default';
      name: 'list__name_default';
      // name: '试听列表'
      // list: Coral.Music.MusicInfo[]
    }

    interface MyLoveListInfo {
      id: 'love';
      name: 'list__name_love';
      // name: '我的收藏'
      // list: Coral.Music.MusicInfo[]
    }

    interface MyTempListInfo {
      id: 'temp';
      name: '临时列表';
      // list: Coral.Music.MusicInfo[]
      // TODO: save default lists info
      meta: {
        id?: string;
      };
    }

    type MyListInfo = MyDefaultListInfo | MyLoveListInfo | UserListInfo;

    interface MyAllList {
      defaultList: MyDefaultListInfo;
      loveList: MyLoveListInfo;
      userList: UserListInfo[];
      tempList: MyTempListInfo;
    }

    type SearchHistoryList = string[];
    type ListPositionInfo = Record<string, number>;
    type ListUpdateInfo = Record<
      string,
      {
        updateTime: number;
        isAutoUpdate: boolean;
      }
    >;

    type ListSaveType = 'myList' | 'downloadList';
    type ListSaveInfo =
      | {
          type: 'myList';
          data: Partial<MyAllList>;
        }
      | {
          type: 'downloadList';
          data: Coral.Download.ListItem[];
        };

    type ListActionDataOverwrite = MakeOptional<Coral.List.ListDataFull, 'tempList'>;
    interface ListActionAdd {
      position: number;
      listInfos: UserListInfo[];
    }
    type ListActionRemove = string[];
    type ListActionUpdate = UserListInfo[];
    interface ListActionUpdatePosition {
      /**
       * 列表id
       */
      ids: string[];
      /**
       * 位置
       */
      position: number;
    }

    interface ListActionMusicAdd {
      id: string;
      musicInfos: Coral.Music.MusicInfo[];
      addMusicLocationType: Coral.AddMusicLocationType;
    }

    interface ListActionMusicMove {
      fromId: string;
      toId: string;
      musicInfos: Coral.Music.MusicInfo[];
      addMusicLocationType: Coral.AddMusicLocationType;
    }

    interface ListActionCheckMusicExistList {
      listId: string;
      musicInfoId: string;
    }

    interface ListActionMusicRemove {
      listId: string;
      ids: string[];
    }

    type ListActionMusicUpdate = Array<{
      id: string;
      musicInfo: Coral.Music.MusicInfo;
    }>;

    interface ListActionMusicUpdatePosition {
      listId: string;
      position: number;
      ids: string[];
    }

    interface ListActionMusicOverwrite {
      listId: string;
      musicInfos: Coral.Music.MusicInfo[];
    }

    type ListActionMusicClear = string[];

    interface MyDefaultListInfoFull extends MyDefaultListInfo {
      list: Coral.Music.MusicInfo[];
    }
    interface MyLoveListInfoFull extends MyLoveListInfo {
      list: Coral.Music.MusicInfo[];
    }
    interface UserListInfoFull extends UserListInfo {
      list: Coral.Music.MusicInfo[];
    }
    interface MyTempListInfoFull extends MyTempListInfo {
      list: Coral.Music.MusicInfo[];
    }

    interface ListDataFull {
      defaultList: Coral.Music.MusicInfo[];
      loveList: Coral.Music.MusicInfo[];
      userList: UserListInfoFull[];
      tempList: Coral.Music.MusicInfo[];
    }
  }
}
