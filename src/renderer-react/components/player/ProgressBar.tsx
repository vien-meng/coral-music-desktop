import { useCallback, useEffect, useRef, useState } from 'react'

interface ProgressBarProps {
  progress: number
  maxPlayTime: number
  isActiveTransition: boolean
  onSeek: (seconds: number) => void
  onTransitionEnd?: () => void
  className?: string
}

export const ProgressBar = ({
  progress,
  maxPlayTime,
  isActiveTransition,
  onSeek,
  onTransitionEnd,
  className,
}: ProgressBarProps) => {
  const [dragProgress, setDragProgress] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef({ isMsDown: false, msDownX: 0, msDownRatio: 0 })

  const currentProgress = dragProgress ?? progress

  const getRatioFromEvent = useCallback((clientX: number): number => {
    const container = containerRef.current
    if (!container) return 0
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    return Math.max(0, Math.min(1, x / rect.width))
  }, [])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const ratio = getRatioFromEvent(event.clientX)
    dragStateRef.current = { isMsDown: true, msDownX: event.clientX, msDownRatio: ratio }
    setDragProgress(ratio)
    setIsDragging(true)
  }, [getRatioFromEvent])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (event: MouseEvent): void => {
      if (!dragStateRef.current.isMsDown) return
      const ratio = getRatioFromEvent(event.clientX)
      setDragProgress(ratio)
    }

    const handleMouseUp = (): void => {
      if (!dragStateRef.current.isMsDown) return
      dragStateRef.current.isMsDown = false
      const finalRatio = dragProgress
      if (finalRatio !== null && maxPlayTime > 0) {
        onSeek(finalRatio * maxPlayTime)
      }
      setDragProgress(null)
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragProgress, maxPlayTime, onSeek, getRatioFromEvent])

  useEffect(() => {
    if (!isActiveTransition || isDragging) return
    const timer = setTimeout(() => {
      onTransitionEnd?.()
    }, 300)
    return () => {
      clearTimeout(timer)
    }
  }, [isActiveTransition, isDragging, onTransitionEnd])

  const percent = `${currentProgress * 100}%`

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        height: 16,
        width: '100%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 4,
          borderRadius: 2,
          background: 'var(--color-primary-light-100-alpha-100)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: percent,
            background: 'var(--color-primary)',
            transition: isActiveTransition && !isDragging ? 'width 0.3s ease' : 'none',
          }}
        />
        {dragProgress !== null
          ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${dragProgress * 100}%`,
                background: 'var(--color-primary-alpha-50)',
              }}
            />
            )
          : null}
      </div>
    </div>
  )
}
