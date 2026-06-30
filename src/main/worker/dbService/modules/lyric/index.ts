import {
  queryLyric,
  queryRawLyric,
  insertRawLyric,
  deleteRawLyric,
  updateRawLyric,
  clearRawLyric,
  queryEditedLyric,
  insertEditedLyric,
  deleteEditedLyric,
  updateEditedLyric,
  clearEditedLyric,
  countEditedLyric,
  countRawLyric,
} from './dbHelper';

const keys = ['lyric', 'tlyric', 'rlyric', 'lxlyric'] as const;

const toDBLyric = (
  id: string,
  source: Coral.DBService.Lyricnfo['source'],
  lyricInfo: Coral.Music.LyricInfo,
): Coral.DBService.Lyricnfo[] =>
  (
    keys.map((k) => [k, lyricInfo[k]]).filter(([_k, t]) => t != null) as Array<
      [Coral.DBService.Lyricnfo['type'], string]
    >
  ).map(([k, t]) => ({
    id,
    type: k,
    text: Buffer.from(t).toString('base64'),
    source,
  }));

/**
 * 获取歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getPlayerLyric = (id: string): Coral.Player.LyricInfo => {
  const lyrics = queryLyric(id);

  let lyricInfo: Coral.Music.LyricInfo = {
    lyric: '',
  };
  let rawLyricInfo: Coral.Music.LyricInfo = {
    lyric: '',
  };
  for (const lyric of lyrics) {
    switch (lyric.source) {
      case 'edited':
        if (lyric.type == 'lyric') lyricInfo.lyric = Buffer.from(lyric.text, 'base64').toString();
        else if (lyric.text != null)
          lyricInfo[lyric.type] = Buffer.from(lyric.text, 'base64').toString();
        break;
      default:
        if (lyric.type == 'lyric')
          rawLyricInfo.lyric = Buffer.from(lyric.text, 'base64').toString();
        else if (lyric.text != null)
          rawLyricInfo[lyric.type] = Buffer.from(lyric.text, 'base64').toString();
        break;
    }
  }

  return lyricInfo.lyric
    ? {
        ...lyricInfo,
        rawlrcInfo: rawLyricInfo,
      }
    : {
        ...rawLyricInfo,
        rawlrcInfo: rawLyricInfo,
      };
};

/**
 * 获取原始歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getRawLyric = (id: string): Coral.Music.LyricInfo => {
  const lyrics = queryRawLyric(id);

  let lyricInfo: Coral.Music.LyricInfo = {
    lyric: '',
  };
  for (const lyric of lyrics) {
    if (lyric.type == 'lyric') lyricInfo.lyric = Buffer.from(lyric.text, 'base64').toString();
    else if (lyric.text != null)
      lyricInfo[lyric.type] = Buffer.from(lyric.text, 'base64').toString();
  }

  return lyricInfo;
};

/**
 * 保存原始歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const rawLyricAdd = (id: string, lyricInfo: Coral.Music.LyricInfo) => {
  insertRawLyric(toDBLyric(id, 'raw', lyricInfo));
};

/**
 * 删除原始歌词信息
 * @param ids 歌曲id
 */
export const rawLyricRemove = (ids: string[]) => {
  deleteRawLyric(ids);
};

/**
 * 更新原始歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const rawLyricUpdate = (id: string, lyricInfo: Coral.Music.LyricInfo) => {
  updateRawLyric(toDBLyric(id, 'raw', lyricInfo));
};

/**
 * 清空原始歌词信息
 */
export const rawLyricClear = () => {
  clearRawLyric();
};

/**
 * 统计原始歌词数量
 */
export const rawLyricCount = () => countRawLyric();

/**
 * 获取已编辑歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getEditedLyric = (id: string): Coral.Music.LyricInfo => {
  const lyrics = queryEditedLyric(id);

  let lyricInfo: Coral.Music.LyricInfo = {
    lyric: '',
  };
  for (const lyric of lyrics) {
    if (lyric.type == 'lyric') lyricInfo.lyric = Buffer.from(lyric.text, 'base64').toString();
    else if (lyric.text != null)
      lyricInfo[lyric.type] = Buffer.from(lyric.text, 'base64').toString();
  }

  return lyricInfo;
};

/**
 * 保存已编辑歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const editedLyricAdd = (id: string, lyricInfo: Coral.Music.LyricInfo) => {
  insertEditedLyric(toDBLyric(id, 'edited', lyricInfo));
};

/**
 * 删除已编辑歌词信息
 * @param ids 歌曲id
 */
export const editedLyricRemove = (ids: string[]) => {
  deleteEditedLyric(ids);
};

/**
 * 更新已编辑歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const editedLyricUpdate = (id: string, lyricInfo: Coral.Music.LyricInfo) => {
  updateEditedLyric(toDBLyric(id, 'edited', lyricInfo));
};

/**
 * 清空已编辑歌词信息
 */
export const editedLyricClear = () => {
  clearEditedLyric();
};

/**
 * 新增或更新已编辑歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const editedLyricUpdateAddAndUpdate = (id: string, lyricInfo: Coral.Music.LyricInfo) => {
  const lyrics = queryEditedLyric(id);
  if (lyrics.length) updateEditedLyric(toDBLyric(id, 'edited', lyricInfo));
  else insertEditedLyric(toDBLyric(id, 'edited', lyricInfo));
};

/**
 * 统计已编辑歌词数量
 */
export const editedLyricCount = () => countEditedLyric();
