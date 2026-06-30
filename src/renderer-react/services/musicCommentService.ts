import { toOldMusicInfo } from '@common/utils/tools';

export interface MusicCommentItem {
  avatar?: string;
  id: string;
  images?: string[];
  likedCount?: number;
  location?: string;
  reply?: MusicCommentItem[];
  text: string;
  timeStr?: string;
  userName: string;
}

export interface MusicCommentPage {
  comments: MusicCommentItem[];
  limit: number;
  maxPage: number;
  page: number;
  total: number;
}

export type MusicCommentKind = 'hot' | 'new';

interface MusicCommentApi {
  getComment?: (musicInfo: unknown, page: number, limit: number) => Promise<unknown>;
  getHotComment?: (musicInfo: unknown, page: number, limit: number) => Promise<unknown>;
}

interface MusicSdkSource {
  comment?: MusicCommentApi;
}

type MusicSdk = Record<string, unknown>;

const emptyCommentPage = (page: number, limit: number): MusicCommentPage => ({
  comments: [],
  limit,
  maxPage: 1,
  page,
  total: 0,
});

const loadMusicSdk = async (): Promise<MusicSdk> => {
  const module = await import('./musicSdk/sdk');
  return module.default as MusicSdk;
};

const getCommentApi = async (musicInfo: Coral.Music.MusicInfo): Promise<MusicCommentApi | null> => {
  if (musicInfo.source === 'local') return null;

  const sdk = await loadMusicSdk();
  const sourceSdk = sdk[musicInfo.source];
  if (typeof sourceSdk !== 'object' || sourceSdk == null || Array.isArray(sourceSdk)) return null;

  return (sourceSdk as MusicSdkSource).comment ?? null;
};

const normalizeText = (text: unknown): string => {
  if (Array.isArray(text)) return text.map((item) => String(item)).join('\n');
  return typeof text === 'string' ? text : String(text ?? '');
};

const normalizeComment = (comment: unknown, index: number): MusicCommentItem | null => {
  if (typeof comment !== 'object' || comment == null) return null;

  const info = comment as Record<string, unknown>;
  const text = normalizeText(info.text).trim();
  if (!text) return null;

  const reply = Array.isArray(info.reply)
    ? info.reply
        .map((item, replyIndex) => normalizeComment(item, replyIndex))
        .filter((item): item is MusicCommentItem => Boolean(item))
    : [];

  return {
    avatar: typeof info.avatar === 'string' ? info.avatar : undefined,
    id: String(info.id ?? `${index}-${text.slice(0, 12)}`),
    images: Array.isArray(info.images)
      ? info.images.filter((item): item is string => typeof item === 'string')
      : [],
    likedCount: typeof info.likedCount === 'number' ? info.likedCount : undefined,
    location: typeof info.location === 'string' ? info.location : undefined,
    reply,
    text,
    timeStr: typeof info.timeStr === 'string' ? info.timeStr : undefined,
    userName: typeof info.userName === 'string' ? info.userName : '',
  };
};

const normalizeCommentPage = (result: unknown, page: number, limit: number): MusicCommentPage => {
  if (typeof result !== 'object' || result == null) return emptyCommentPage(page, limit);

  const info = result as Record<string, unknown>;
  const comments = Array.isArray(info.comments)
    ? info.comments
        .map((item, index) => normalizeComment(item, index))
        .filter((item): item is MusicCommentItem => Boolean(item))
    : [];

  return {
    comments,
    limit: typeof info.limit === 'number' ? info.limit : limit,
    maxPage: typeof info.maxPage === 'number' ? info.maxPage : 1,
    page: typeof info.page === 'number' ? info.page : page,
    total: typeof info.total === 'number' ? info.total : comments.length,
  };
};

const requestWithRetry = async (
  request: () => Promise<unknown>,
  retryCount = 2,
): Promise<unknown> => {
  try {
    return await request();
  } catch (error) {
    if (error instanceof Error && error.message === '取消请求') throw error;
    if (retryCount <= 0) throw error;
    return await requestWithRetry(request, retryCount - 1);
  }
};

export const hasComment = async (musicInfo: Coral.Music.MusicInfo | null): Promise<boolean> => {
  if (!musicInfo) return false;
  return Boolean(await getCommentApi(musicInfo));
};

export const getComments = async (
  musicInfo: Coral.Music.MusicInfo,
  kind: MusicCommentKind,
  page = 1,
  limit = 20,
): Promise<MusicCommentPage> => {
  const api = await getCommentApi(musicInfo);
  const request = kind === 'hot' ? api?.getHotComment : api?.getComment;
  if (!request) return emptyCommentPage(page, limit);

  const oldMusicInfo = toOldMusicInfo(musicInfo);
  const result = await requestWithRetry(async () => await request(oldMusicInfo, page, limit));
  return normalizeCommentPage(result, page, limit);
};

export const musicCommentService = {
  getComments,
  hasComment,
};
