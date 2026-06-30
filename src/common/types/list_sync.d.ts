declare namespace Coral {
  namespace Sync {
    namespace List {
      interface ListInfo {
        lastSyncDate?: number;
        snapshotKey: string;
      }

      type ActionList =
        | Coral.Sync.SyncAction<'list_data_overwrite', Coral.List.ListActionDataOverwrite>
        | SyncAction<'list_create', Coral.List.ListActionAdd>
        | SyncAction<'list_remove', Coral.List.ListActionRemove>
        | SyncAction<'list_update', Coral.List.ListActionUpdate>
        | SyncAction<'list_update_position', Coral.List.ListActionUpdatePosition>
        | SyncAction<'list_music_add', Coral.List.ListActionMusicAdd>
        | SyncAction<'list_music_move', Coral.List.ListActionMusicMove>
        | SyncAction<'list_music_remove', Coral.List.ListActionMusicRemove>
        | SyncAction<'list_music_update', Coral.List.ListActionMusicUpdate>
        | SyncAction<'list_music_update_position', Coral.List.ListActionMusicUpdatePosition>
        | SyncAction<'list_music_overwrite', Coral.List.ListActionMusicOverwrite>
        | SyncAction<'list_music_clear', Coral.List.ListActionMusicClear>;

      type ListData = Omit<Coral.List.ListDataFull, 'tempList'>;
      type SyncMode =
        | 'merge_local_remote'
        | 'merge_remote_local'
        | 'overwrite_local_remote'
        | 'overwrite_remote_local'
        | 'overwrite_local_remote_full'
        | 'overwrite_remote_local_full'
        // | 'none'
        | 'cancel';
    }
  }
}
