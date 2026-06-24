import { useCallback, useEffect, useRef, useState } from 'react'

interface SliderBarProps {
  value: number
  min: number
  max: number
  step?: number
  disabled?: boolean
  className?: string
  onChange: (value: number) => void
}

const clampValue = (val: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, val))
}

export const SliderBar = ({ value, min, max, step = 1, disabled = false, className, onChange }: SliderBarProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef({
    isMsDown: false,
    msDownX: 0,
    msDownRatio: 0,
  })

  const range = max - min
  const ratio = range === 0 ? 0 : (value - min) / range
  const percent = `${ratio * 100}%`

  const getSteppedValue = useCallback((rawValue: number): number => {
    const s = step > 0 ? step : 1
    const stepped = Math.round((rawValue - min) / s) * s + min
    return clampValue(Number(stepped.toFixed(10)), min, max)
  }, [step, min, max])

  const getSliderWidth = useCallback((): number => {
    return containerRef.current?.clientWidth ?? 0
  }, [])

  const emitSteppedValue = useCallback((rawValue: number): void => {
    const stepped = getSteppedValue(rawValue)
    onChange(stepped)
  }, [getSteppedValue, onChange])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return
    const width = getSliderWidth()
    if (!width) return
    dragStateRef.current.isMsDown = true
    dragStateRef.current.msDownX = event.clientX
    const rawValue = (event.nativeEvent.offsetX / width) * range + min
    emitSteppedValue(rawValue)
    dragStateRef.current.msDownRatio = range === 0 ? 0 : (getSteppedValue(rawValue) - min) / range
    setIsDragging(true)
  }, [disabled, getSliderWidth, range, min, emitSteppedValue, getSteppedValue])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (event: MouseEvent): void => {
      if (!dragStateRef.current.isMsDown || disabled) return
      const width = getSliderWidth()
      if (!width) return
      const r = dragStateRef.current.msDownRatio + (event.clientX - dragStateRef.current.msDownX) / width
      const rawValue = r * range + min
      emitSteppedValue(rawValue)
    }

    const handleMouseUp = (): void => {
      dragStateRef.current.isMsDown = false
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, disabled, getSliderWidth, range, min, emitSteppedValue])

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        height: 4,
        width: '100%',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : isDragging ? 1 : 0.5,
        transition: 'opacity 0.2s',
        borderRadius: 2,
        background: 'var(--color-primary-light-100-alpha-100)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: percent,
          borderRadius: 2,
          background: 'var(--color-primary)',
          transformOrigin: 'left center',
          transform: 'scaleX(1)',
        }}
      />
    </div>
  )
}
