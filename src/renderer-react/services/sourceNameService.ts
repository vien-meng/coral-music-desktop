const sourceNameMap: Record<string, string> = {
  all: '全部平台',
  git: 'GitHub',
  kg: '酷狗音乐',
  kw: '酷我音乐',
  local: '本地音乐',
  mg: '咪咕音乐',
  tx: 'QQ音乐',
  wy: '网易云音乐',
};

export const getSourceDisplayName = (source: string): string =>
  sourceNameMap[source] ?? source.toUpperCase();

export const sourceNameService = {
  getSourceDisplayName,
};
