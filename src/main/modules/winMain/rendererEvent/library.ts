import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames';
import { mainHandle } from '@common/mainIpc';

export default () => {
  mainHandle<undefined, Coral.Library.PlayRecord[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_history_list,
    async () => global.coral.worker.dbService.getPlayHistory(),
  );
  mainHandle<Coral.Library.PlayRecordInput, Coral.Library.PlayRecord[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_history_add,
    async ({ params }) => global.coral.worker.dbService.addPlayHistory(params),
  );
  mainHandle<string[], Coral.Library.PlayRecord[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_history_remove,
    async ({ params }) => global.coral.worker.dbService.removePlayHistory(params),
  );
  mainHandle<undefined, Coral.Library.PlayRecord[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_history_clear,
    async () => global.coral.worker.dbService.clearPlayHistory(),
  );
  mainHandle<undefined, Coral.Library.FavoriteSongList[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_favorite_songlist_list,
    async () => global.coral.worker.dbService.getFavoriteSongLists(),
  );
  mainHandle<Coral.Library.FavoriteSongList, Coral.Library.FavoriteSongList[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_favorite_songlist_save,
    async ({ params }) => global.coral.worker.dbService.saveFavoriteSongList(params),
  );
  mainHandle<Coral.Library.FavoriteSongList, Coral.Library.FavoriteSongList[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_favorite_songlist_toggle,
    async ({ params }) => global.coral.worker.dbService.toggleFavoriteSongList(params),
  );
  mainHandle<string[], Coral.Library.FavoriteSongList[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_favorite_songlist_remove,
    async ({ params }) => global.coral.worker.dbService.removeFavoriteSongLists(params),
  );
  mainHandle<undefined, Coral.Library.FavoriteAlbum[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_favorite_album_list,
    async () => global.coral.worker.dbService.getFavoriteAlbums(),
  );
  mainHandle<Coral.Library.FavoriteAlbum, Coral.Library.FavoriteAlbum[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_favorite_album_toggle,
    async ({ params }) => global.coral.worker.dbService.toggleFavoriteAlbum(params),
  );
  mainHandle<string[], Coral.Library.FavoriteAlbum[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_favorite_album_remove,
    async ({ params }) => global.coral.worker.dbService.removeFavoriteAlbums(params),
  );
  mainHandle<Coral.Library.CategoryType, Coral.Library.MusicCategoryGroup[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_category_groups,
    async ({ params }) => global.coral.worker.dbService.getLibraryCategoryGroups(params),
  );
  mainHandle<Coral.Library.CategoryItemsQuery, Coral.Library.MusicCategory>(
    WIN_MAIN_RENDERER_EVENT_NAME.library_category_items,
    async ({ params }) => global.coral.worker.dbService.getLibraryCategoryItems(params),
  );
};
