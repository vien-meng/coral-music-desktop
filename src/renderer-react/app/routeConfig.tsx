import {
  CloudOutlined,
  DownloadOutlined,
  HeartOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { lazy, type ReactNode } from 'react';

const SearchRoutePanel = lazy(async () => ({
  default: (await import('../features/search/SearchRoutePanel')).SearchRoutePanel,
}));
const SongListRoutePanel = lazy(async () => ({
  default: (await import('../features/song-list/SongListRoutePanel')).SongListRoutePanel,
}));
const LeaderboardRoutePanel = lazy(async () => ({
  default: (await import('../features/leaderboard/LeaderboardRoutePanel')).LeaderboardRoutePanel,
}));
const LocalListRoutePanel = lazy(async () => ({
  default: (await import('../features/list/LocalListRoutePanel')).LocalListRoutePanel,
}));
const FavoritesRoutePanel = lazy(async () => ({
  default: (await import('../features/favorites/FavoritesRoutePanel')).FavoritesRoutePanel,
}));
const LibraryRoutePanel = lazy(async () => ({
  default: (await import('../features/library/LibraryRoutePanel')).LibraryRoutePanel,
}));
const DownloadRoutePanel = lazy(async () => ({
  default: (await import('../features/download/DownloadRoutePanel')).DownloadRoutePanel,
}));
const WebDavRoutePanel = lazy(async () => ({
  default: (await import('../features/webdav/WebDavRoutePanel')).WebDavRoutePanel,
}));
const SettingsRoutePanel = lazy(async () => ({
  default: (await import('../features/settings/SettingsRoutePanel')).SettingsRoutePanel,
}));

export type RendererRouteKey =
  | 'search'
  | 'song-list'
  | 'leaderboard'
  | 'list'
  | 'favorites'
  | 'library'
  | 'webdav'
  | 'download'
  | 'setting';

export interface RendererRoute {
  key: RendererRouteKey;
  path: string;
  label: string;
  icon: ReactNode;
  element: ReactNode;
}

export const rendererRoutes: RendererRoute[] = [
  {
    key: 'search',
    path: '/search',
    label: '搜索',
    icon: <SearchOutlined />,
    element: <SearchRoutePanel />,
  },
  {
    key: 'song-list',
    path: '/song-list',
    label: '歌单广场',
    icon: <UnorderedListOutlined />,
    element: <SongListRoutePanel />,
  },
  {
    key: 'leaderboard',
    path: '/leaderboard',
    label: '排行榜',
    icon: <OrderedListOutlined />,
    element: <LeaderboardRoutePanel />,
  },
  {
    key: 'list',
    path: '/list',
    label: '我的列表',
    icon: <PlayCircleOutlined />,
    element: <LocalListRoutePanel />,
  },
  {
    key: 'favorites',
    path: '/favorites',
    label: '我的收藏',
    icon: <HeartOutlined />,
    element: <FavoritesRoutePanel />,
  },
  {
    key: 'library',
    path: '/library',
    label: '音乐分类',
    icon: <AppstoreOutlined />,
    element: <LibraryRoutePanel />,
  },
  {
    key: 'download',
    path: '/download',
    label: '下载',
    icon: <DownloadOutlined />,
    element: <DownloadRoutePanel />,
  },
  {
    key: 'webdav',
    path: '/webdav',
    label: '网盘资源',
    icon: <CloudOutlined />,
    element: <WebDavRoutePanel />,
  },
  {
    key: 'setting',
    path: '/setting',
    label: '设置',
    icon: <SettingOutlined />,
    element: <SettingsRoutePanel />,
  },
];

export const getRouteByKey = (key: string): RendererRoute =>
  rendererRoutes.find((route) => route.key === key) ?? rendererRoutes[0];
