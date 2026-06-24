import {
  DownloadOutlined,
  OrderedListOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
// Typography import removed
import { observer } from 'mobx-react-lite'
import { DownloadRoutePanel } from '../features/download/DownloadRoutePanel'
import { LeaderboardRoutePanel } from '../features/leaderboard/LeaderboardRoutePanel'
import { LocalListRoutePanel } from '../features/list/LocalListRoutePanel'
import { SearchRoutePanel } from '../features/search/SearchRoutePanel'
import { SettingsRoutePanel } from '../features/settings/SettingsRoutePanel'
import { SongListRoutePanel } from '../features/song-list/SongListRoutePanel'


export type RendererRouteKey = 'search' | 'song-list' | 'leaderboard' | 'list' | 'download' | 'setting'

export interface RendererRoute {
  key: RendererRouteKey
  path: string
  label: string
  icon: ReactNode
  element: ReactNode
}

const SearchRoute = observer(() => {
  return <SearchRoutePanel />
})

const SongListRoute = observer(() => {
  return <SongListRoutePanel />
})

const LeaderboardRoute = observer(() => {
  return <LeaderboardRoutePanel />
})

const LocalListRoute = observer(() => {
  return <LocalListRoutePanel />
})

const DownloadRoute = observer(() => {
  return <DownloadRoutePanel />
})

const SettingRoute = observer(() => {
  return <SettingsRoutePanel />
})

export const rendererRoutes: RendererRoute[] = [
  {
    key: 'search',
    path: '/search',
    label: '搜索',
    icon: <SearchOutlined />,
    element: <SearchRoute />,
  },
  {
    key: 'song-list',
    path: '/song-list',
    label: '歌单广场',
    icon: <UnorderedListOutlined />,
    element: <SongListRoute />,
  },
  {
    key: 'leaderboard',
    path: '/leaderboard',
    label: '排行榜',
    icon: <OrderedListOutlined />,
    element: <LeaderboardRoute />,
  },
  {
    key: 'list',
    path: '/list',
    label: '我的列表',
    icon: <PlayCircleOutlined />,
    element: <LocalListRoute />,
  },
  {
    key: 'download',
    path: '/download',
    label: '下载',
    icon: <DownloadOutlined />,
    element: <DownloadRoute />,
  },
  {
    key: 'setting',
    path: '/setting',
    label: '设置',
    icon: <SettingOutlined />,
    element: <SettingRoute />,
  },
]

export const getRouteByKey = (key: string): RendererRoute => {
  return rendererRoutes.find(route => route.key === key) ?? rendererRoutes[0]
}
