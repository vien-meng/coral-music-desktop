import { Empty, List, Select, Tag } from 'antd'

export interface OnlineSourceSelectProps<Source extends string> {
  className?: string
  sources: Source[]
  value: Source
  onChange: (source: Source) => void
}

export interface OnlineTagItem {
  id: string
  name: string
}

export interface OnlineTagCloudProps<TagItem extends OnlineTagItem = OnlineTagItem> {
  activeTagId: string
  tags: TagItem[]
  onSelect: (tag: TagItem) => void
}

export interface OnlineBoardItem {
  id: string
  name: string
}

export interface OnlineBoardSelectorProps<BoardItem extends OnlineBoardItem = OnlineBoardItem> {
  activeBoardId: string | null
  boards: BoardItem[]
  onSelect: (board: BoardItem) => void
}

const formatSource = (source: string): string => source.toUpperCase()

export const OnlineSourceSelect = <Source extends string>({
  className = 'coral-source-select',
  onChange,
  sources,
  value,
}: OnlineSourceSelectProps<Source>) => {
  return (
    <Select
      value={value}
      options={sources.map(source => ({
        label: formatSource(source),
        value: source,
      }))}
      className={className}
      onChange={source => {
        onChange(source)
      }}
    />
  )
}

export const OnlineTagCloud = <TagItem extends OnlineTagItem>({
  activeTagId,
  onSelect,
  tags,
}: OnlineTagCloudProps<TagItem>) => {
  if (!tags.length) return null

  return (
    <div className="coral-tag-row">
      {tags.slice(0, 16).map(tag => (
        <Tag
          key={tag.id}
          color={tag.id === activeTagId ? 'blue' : undefined}
          className="coral-clickable-tag"
          onClick={() => {
            onSelect(tag)
          }}
        >
          {tag.name}
        </Tag>
      ))}
    </div>
  )
}

export const OnlineBoardSelector = <BoardItem extends OnlineBoardItem>({
  activeBoardId,
  boards,
  onSelect,
}: OnlineBoardSelectorProps<BoardItem>) => {
  return (
    <List
      size="small"
      className="coral-board-list"
      dataSource={boards}
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无榜单" />,
      }}
      renderItem={item => (
        <List.Item>
          <button
            type="button"
            className={item.id === activeBoardId ? 'coral-board-native-button is-active' : 'coral-board-native-button'}
            onClick={() => {
              onSelect(item)
            }}
          >
            {item.name}
          </button>
        </List.Item>
      )}
    />
  )
}
