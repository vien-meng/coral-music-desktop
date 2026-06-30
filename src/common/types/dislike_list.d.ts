declare namespace Coral {
  namespace Dislike {
    // interface ListItemMusicText {
    //   id?: string
    //   // type: 'music'
    //   name: string | null
    //   singer: string | null
    // }
    // interface ListItemMusic {
    //   id?: number
    //   type: 'musicId'
    //   musicId: string
    //   meta: Coral.Music.MusicInfo
    // }
    // type ListItem = ListItemMusicText
    // type ListItem = string
    // type ListItem = ListItemMusic | ListItemMusicText

    interface DislikeMusicInfo {
      name: string;
      singer: string;
    }

    type DislikeRules = string;

    interface DislikeInfo {
      // musicIds: Set<string>
      names: Set<string>;
      musicNames: Set<string>;
      singerNames: Set<string>;
      // list: Coral.Dislike.ListItem[]
      rules: DislikeRules;
    }
  }
}
