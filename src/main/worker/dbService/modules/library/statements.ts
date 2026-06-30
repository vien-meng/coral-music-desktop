import { getDB } from '../../db';

export const createPlayHistoryQueryStatement = () =>
  getDB().prepare<[]>(`
    SELECT "id", "source", "musicInfo", "playedAt", "playCount", "lastDuration", "sourceContext"
    FROM "main"."play_history"
    ORDER BY "playedAt" DESC
  `);

export const createPlayHistoryInsertStatement = () =>
  getDB().prepare<[Coral.DBService.PlayHistoryInfo]>(`
    INSERT INTO "main"."play_history" (
      "id", "source", "musicInfo", "playedAt", "playCount", "lastDuration", "sourceContext"
    )
    VALUES (@id, @source, @musicInfo, @playedAt, @playCount, @lastDuration, @sourceContext)
    ON CONFLICT("id","source") DO UPDATE SET
      "musicInfo"=excluded."musicInfo",
      "playedAt"=excluded."playedAt",
      "playCount"="play_history"."playCount" + 1,
      "lastDuration"=excluded."lastDuration",
      "sourceContext"=excluded."sourceContext"
  `);

export const createPlayHistoryDeleteStatement = () =>
  getDB().prepare<[Coral.DBService.PlayHistoryInfo]>(`
    DELETE FROM "main"."play_history"
    WHERE "id"=@id AND "source"=@source
  `);

export const createPlayHistoryClearStatement = () =>
  getDB().prepare<[]>('DELETE FROM "main"."play_history"');

export const createPlayHistoryTrimStatement = () =>
  getDB().prepare<[number]>(`
    DELETE FROM "main"."play_history"
    WHERE rowid IN (
      SELECT rowid
      FROM "main"."play_history"
      ORDER BY "playedAt" DESC
      LIMIT -1 OFFSET ?
    )
  `);

export const createFavoriteSongListQueryStatement = () =>
  getDB().prepare<[]>(`
    SELECT "id", "source", "name", "author", "img", "desc", "playCount", "createdAt"
    FROM "main"."favorite_songlist"
    ORDER BY "createdAt" DESC
  `);

export const createFavoriteSongListInsertStatement = () =>
  getDB().prepare<[Coral.DBService.FavoriteSongListInfo]>(`
    INSERT OR REPLACE INTO "main"."favorite_songlist" (
      "id", "source", "name", "author", "img", "desc", "playCount", "createdAt"
    )
    VALUES (@id, @source, @name, @author, @img, @desc, @playCount, @createdAt)
  `);

export const createFavoriteSongListDeleteStatement = () =>
  getDB().prepare<[Coral.DBService.FavoriteSongListInfo]>(`
    DELETE FROM "main"."favorite_songlist"
    WHERE "id"=@id AND "source"=@source
  `);

export const createFavoriteAlbumQueryStatement = () =>
  getDB().prepare<[]>(`
    SELECT "id", "source", "name", "artist", "img", "createdAt"
    FROM "main"."favorite_album"
    ORDER BY "createdAt" DESC
  `);

export const createFavoriteAlbumInsertStatement = () =>
  getDB().prepare<[Coral.DBService.FavoriteAlbumInfo]>(`
    INSERT OR REPLACE INTO "main"."favorite_album" (
      "id", "source", "name", "artist", "img", "createdAt"
    )
    VALUES (@id, @source, @name, @artist, @img, @createdAt)
  `);

export const createFavoriteAlbumDeleteStatement = () =>
  getDB().prepare<[Coral.DBService.FavoriteAlbumInfo]>(`
    DELETE FROM "main"."favorite_album"
    WHERE "id"=@id AND "source"=@source
  `);

