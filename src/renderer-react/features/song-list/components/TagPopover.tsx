import { DownOutlined } from '@ant-design/icons'
import { Button, Popover, Typography } from 'antd'
import { observer } from 'mobx-react-lite'
import { useCallback, useMemo, useState } from 'react'
import type { SongListTagGroup, SongListTagItem } from '../../../stores/domains/songListStore'

const { Text } = Typography

export interface TagPopoverProps {
  activeTagId: string
  groupedTags: SongListTagGroup[]
  onSelect: (tag: SongListTagItem) => void
}

const TagPopoverBase = ({ activeTagId, groupedTags, onSelect }: TagPopoverProps) => {
  const [open, setOpen] = useState(false)

  const activeTagName = useMemo(() => {
    if (!activeTagId) return '默认'
    for (const group of groupedTags) {
      const found = group.list.find(t => t.id === activeTagId)
      if (found) return found.name
    }
    return activeTagId
  }, [activeTagId, groupedTags])

  const handleSelect = useCallback((tag: SongListTagItem) => {
    onSelect(tag)
    setOpen(false)
  }, [onSelect])

  return (
    <Popover
      open={open}
      trigger={['click']}
      onOpenChange={setOpen}
      placement="bottomLeft"
      content={
        <div
          className="coral-tag-popover-list"
          style={{ maxHeight: 250, overflowY: 'auto', width: 645, padding: 10 }}
        >
          <div
            className="coral-tag-item"
            onClick={() => { handleSelect({ id: '', name: '默认', parent_id: '', parent_name: '', source: '' } as any /* SongListTagItem */) }}
          >
            默认
          </div>
          {groupedTags.map(group => (
            <div key={group.name}>
              <Text type="secondary" style={{ display: 'block', paddingTop: 10, paddingBottom: 3 }}>{group.name}</Text>
              <div>
                {group.list.map(tag => (
                  <Button
                    key={tag.id}
                    type={tag.id === activeTagId ? 'primary' : 'default'}
                    size="small"
                    className="coral-tag-item-btn"
                    onClick={() => { handleSelect(tag) }}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      }
    >
      <Button className="coral-tag-popover-trigger">
        <span>{activeTagName}</span>
        <DownOutlined style={{ fontSize: '0.8em', marginLeft: 7 }} />
      </Button>
    </Popover>
  )
}

export const TagPopover = observer(TagPopoverBase)
