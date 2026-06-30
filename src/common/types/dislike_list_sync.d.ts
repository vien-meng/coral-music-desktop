declare namespace Coral {
  namespace Sync {
    namespace Dislike {
      interface ListInfo {
        lastSyncDate?: number;
        snapshotKey: string;
      }

      interface SyncActionBase<A> {
        action: A;
      }
      interface SyncActionData<A, D> extends SyncActionBase<A> {
        data: D;
      }
      type SyncAction<A, D = undefined> = D extends undefined
        ? SyncActionBase<A>
        : SyncActionData<A, D>;
      type ActionList =
        | SyncAction<'dislike_data_overwrite', Coral.Dislike.DislikeRules>
        | SyncAction<'dislike_music_add', Coral.Dislike.DislikeMusicInfo[]>
        | SyncAction<'dislike_music_clear'>;

      type SyncMode =
        | 'merge_local_remote'
        | 'merge_remote_local'
        | 'overwrite_local_remote'
        | 'overwrite_remote_local'
        // | 'none'
        | 'cancel';
    }
  }
}
