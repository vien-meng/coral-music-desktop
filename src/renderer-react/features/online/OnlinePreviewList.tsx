import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Empty, InputNumber, List, Space, Tooltip, Typography } from 'antd'
import type { ReactNode } from 'react'

const { Text } = Typography

export interface OnlineSongListPreviewItem {
  author: string
  id: string
  name: string
  play_count: string
  source: LX.OnlineSource
}

export interface OnlinePagerProps {
  disabled?: boolean
  hasNext?: boolean
  loading?: boolean
  maxPage?: number
  page: number
  onChange: (page: number) => void
}

export interface OnlineMusicPreviewListProps {
  actions?: (item: LX.Music.MusicInfo) => ReactNode[]
  emptyText: string
  list: LX.Music.MusicInfo[]
}

export interface OnlineSongListPreviewListProps<Item extends OnlineSongListPreviewItem = OnlineSongListPreviewItem> {
  actions?: (item: Item) => ReactNode[]
  emptyText: string
  list: Item[]
}

const formatSource = (source: string): string => source.toUpperCase()

export const OnlinePager = ({ disabled = false, hasNext, loading = false, maxPage, onChange, page }: OnlinePagerProps) => {
  const normalizedMaxPage = maxPage != null && maxPage > 0 ? maxPage : undefined
  const canGoPrev = !disabled && !loading && page > 1
  const canGoNext = !disabled && !loading && (hasNext ?? (normalizedMaxPage == null || page < normalizedMaxPage))

  return (
    <Space className="coral-online-pager">
      <Tooltip title="上一页">
        <Button
          icon={<LeftOutlined />}
          disabled={!canGoPrev}
          onClick={() => {
            onChange(page - 1)
          }}
        />
      </Tooltip>
      <InputNumber
        min={1}
        max={normalizedMaxPage}
        value={page}
        className="coral-page-input"
        disabled={disabled || loading}
        onChange={value => {
          onChange(value ?? 1)
        }}
      />
      <Tooltip title="下一页">
        <Button
          icon={<RightOutlined />}
          disabled={!canGoNext}
          onClick={() => {
            onChange(page + 1)
          }}
        />
      </Tooltip>
    </Space>
  )
}

export const OnlineMusicPreviewList = ({ actions, emptyText, list }: OnlineMusicPreviewListProps) => {
  return (
    <List
      size="small"
      className="coral-result-list"
      dataSource={list}
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />,
      }}
      renderItem={item => (
        <List.Item actions={actions?.(item)}>
          <List.Item.Meta
            title={<Text ellipsis>{item.name}</Text>}
            description={<Text type="secondary" ellipsis>{`${item.singer} · ${formatSource(item.source)} · ${item.interval ?? '--:--'}`}</Text>}
          />
        </List.Item>
      )}
    />
  )
}

export const OnlineSongListPreviewList = <Item extends OnlineSongListPreviewItem>({
  actions,
  emptyText,
  list,
}: OnlineSongListPreviewListProps<Item>) => {
  return (
    <List
      size="small"
      className="coral-result-list"
      dataSource={list}
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />,
      }}
      renderItem={item => (
        <List.Item actions={actions?.(item)}>
          <List.Item.Meta
            title={<Text ellipsis>{item.name}</Text>}
            description={<Text type="secondary" ellipsis>{`${item.author} · ${formatSource(item.source)} · ${item.play_count}`}</Text>}
          />
        </List.Item>
      )}
    />
  )
}
