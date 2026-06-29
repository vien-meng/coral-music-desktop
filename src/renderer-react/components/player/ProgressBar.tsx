import { useCallback, useEffect, useRef, useState } from 'react';

interface ProgressBarProps {
  progress: number;
  maxPlayTime: number;
  isActiveTransition: boolean;
  onSeek: (seconds: number) => void;
  onTransitionEnd?: () => void;
  className?: string;
}

export const ProgressBar = ({
  progress,
  maxPlayTime,
  isActiveTransition,
  onSeek,
  onTransitionEnd,
  className,
}: ProgressBarProps) => {
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ isMsDown: false, msDownX: 0, msDownRatio: 0 });

  const currentProgress = dragProgress ?? progress;

  const getRatioFromEvent = useCallback((clientX: number): number => {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, []);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      const ratio = getRatioFromEvent(event.clientX);
      dragStateRef.current = { isMsDown: true, msDownX: event.clientX, msDownRatio: ratio };
      setDragProgress(ratio);
      setIsDragging(true);
    },
    [getRatioFromEvent],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent): void => {
      if (!dragStateRef.current.isMsDown) return;
      const ratio = getRatioFromEvent(event.clientX);
      setDragProgress(ratio);
    };

    const handleMouseUp = (): void => {
      if (!dragStateRef.current.isMsDown) return;
      dragStateRef.current.isMsDown = false;
      const finalRatio = dragProgress;
      if (finalRatio !== null && maxPlayTime > 0) {
        onSeek(finalRatio * maxPlayTime);
      }
      setDragProgress(null);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragProgress, maxPlayTime, onSeek, getRatioFromEvent]);

  useEffect(() => {
    if (!isActiveTransition || isDragging) return;
    const timer = setTimeout(() => {
      onTransitionEnd?.();
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [isActiveTransition, isDragging, onTransitionEnd]);

  const percent = `${currentProgress * 100}%`;

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
          height: 6,
          borderRadius: 999,
          background: 'rgba(24, 37, 56, 0.16)',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.42)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: percent,
            background: 'linear-gradient(90deg, #f0645a, #ff8a80)',
            borderRadius: 999,
            boxShadow: '0 0 12px rgba(240, 100, 90, 0.22)',
            transition: isActiveTransition && !isDragging ? 'width 0.3s ease' : 'none',
          }}
        />
        {dragProgress !== null ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${dragProgress * 100}%`,
              background: 'rgba(240, 100, 90, 0.28)',
              borderRadius: 999,
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            left: percent,
            top: '50%',
            height: isDragging ? 14 : 10,
            width: isDragging ? 14 : 10,
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid #f0645a',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.2), 0 0 0 4px rgba(240, 100, 90, 0.12)',
            transform: 'translate(-50%, -50%)',
            transition: isActiveTransition && !isDragging ? 'left 0.3s ease' : 'none',
          }}
        />
      </div>
    </div>
  );
};
