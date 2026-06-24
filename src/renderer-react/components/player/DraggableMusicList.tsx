import { useCallback, useRef, type DragEvent, type ReactNode } from 'react'

export interface DraggableMusicListProps {
  actions?: (item: LX.Music.MusicInfo, index: number) => ReactNode[]
  list: LX.Music.MusicInfo[]
  onReorder: (fromIndex: number, toIndex: number) => void
  renderItem: (item: LX.Music.MusicInfo, index: number) => ReactNode
}

export const DraggableMusicList = ({ list, onReorder, renderItem }: DraggableMusicListProps) => {
  const dragIndex = useRef<number | null>(null)

  const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>, index: number) => {
    dragIndex.current = index
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, dropIndex: number) => {
      event.preventDefault()
      const fromIndex = dragIndex.current
      if (fromIndex == null || fromIndex === dropIndex) return

      onReorder(fromIndex, dropIndex)
      dragIndex.current = null
    },
    [onReorder],
  )

  const handleDragEnd = useCallback(() => {
    dragIndex.current = null
  }, [])

  return (
    <div className="coral-draggable-list">
      {list.map((item, index) => (
        <div
          key={item.id}
          draggable
          className="coral-draggable-item"
          onDragStart={event => { handleDragStart(event, index) }}
          onDragOver={handleDragOver}
          onDrop={event => { handleDrop(event, index) }}
          onDragEnd={handleDragEnd}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
