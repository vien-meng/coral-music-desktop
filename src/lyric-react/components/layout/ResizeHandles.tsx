import type { ResizeOrigin, useLyricWindowInteraction } from '../../hooks/useLyricWindowInteraction'

type WindowInteraction = ReturnType<typeof useLyricWindowInteraction>

const resizeOrigins: ResizeOrigin[] = [
  'left',
  'top',
  'right',
  'bottom',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]

export const ResizeHandles = ({ interaction }: {
  interaction: WindowInteraction
}) => {
  return (
    <>
      {resizeOrigins.map(origin => (
        <div
          key={origin}
          className={`lyric-resize lyric-resize-${origin}`}
          onMouseDown={event => {
            interaction.handleResizeMouseDown(origin, event)
          }}
          onTouchStart={event => {
            interaction.handleResizeTouchStart(origin, event)
          }}
        />
      ))}
    </>
  )
}
