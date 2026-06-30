import {
  queryMusicInfo,
  insertMusicInfo,
  deleteMusicInfo,
  clearMusicInfo,
  countMusicInfo,
} from './dbHelper';

const toDBMusicInfo = (
  id: string,
  musicInfos: Coral.Music.MusicInfo[],
): Coral.DBService.MusicInfoOtherSource[] =>
  musicInfos.map((info, index) => ({
    ...info,
    meta: JSON.stringify(info.meta),
    source_id: id,
    order: index,
  }));

/**
 * 获取歌曲信息
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getMusicInfoOtherSource = (id: string): Coral.Music.MusicInfoOnline[] => {
  const list = queryMusicInfo(id)
    .sort((a, b) => a.order - b.order)
    .map((info) => ({
      id: info.id,
      name: info.name,
      singer: info.singer,
      source: info.source,
      interval: info.interval,
      meta: JSON.parse(info.meta),
    }));

  return list;
};

/**
 * 保存歌曲信息信息
 * @param id 歌曲id
 * @param musicInfos 歌词信息
 */
export const musicInfoOtherSourceAdd = (id: string, musicInfos: Coral.Music.MusicInfoOnline[]) => {
  insertMusicInfo(toDBMusicInfo(id, musicInfos));
};

/**
 * 删除歌曲信息信息
 * @param ids 歌曲id
 */
export const musicInfoOtherSourceRemove = (ids: string[]) => {
  deleteMusicInfo(ids);
};

/**
 * 清空歌曲信息信息
 */
export const musicInfoOtherSourceClear = () => {
  clearMusicInfo();
};

/**
 * 统计歌曲信息信息数量
 */
export const musicInfoOtherSourceCount = () => countMusicInfo();
