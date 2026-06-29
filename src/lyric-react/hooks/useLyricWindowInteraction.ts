import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { lyricWindowService } from '../services/lyricWindowService';
import { lyricRootStore } from '../stores/lyricRootStore';

export type ResizeOrigin =
  'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'top-left' | 'top-right';

interface MoveState {
  type: 'move';
  msDownX: number;
  msDownY: number;
  windowH: number;
  windowW: number;
}

interface ResizeState {
  type: 'resize';
  msDownX: number;
  msDownY: number;
  origin: ResizeOrigin;
}

type InteractionState = MoveState | ResizeState | null;

const isWindows = (): boolean =>
  new URLSearchParams(globalThis.location?.search).get('os') === 'windows';

const getTouchPoint = (event: TouchEvent | ReactTouchEvent): Touch | React.Touch | null =>
  event.changedTouches.length ? event.changedTouches[0] : null;

const getResizeBounds = (
  state: ResizeState,
  clientX: number,
  clientY: number,
): LX.DesktopLyric.NewBounds => {
  const bounds: LX.DesktopLyric.NewBounds = {
    h: 0,
    w: 0,
    x: 0,
    y: 0,
  };

  let temp: number;

  switch (state.origin) {
    case 'left':
      temp = clientX - state.msDownX;
      bounds.w = -temp;
      bounds.x = temp;
      break;
    case 'right':
      bounds.w = clientX - state.msDownX;
      state.msDownX += bounds.w;
      break;
    case 'top':
      temp = clientY - state.msDownY;
      bounds.y = temp;
      bounds.h = -temp;
      break;
    case 'bottom':
      bounds.h = clientY - state.msDownY;
      state.msDownY += bounds.h;
      break;
    case 'top-left':
      temp = clientX - state.msDownX;
      bounds.w = -temp;
      bounds.x = temp;
      temp = clientY - state.msDownY;
      bounds.y = temp;
      bounds.h = -temp;
      break;
    case 'top-right':
      temp = clientY - state.msDownY;
      bounds.y = temp;
      bounds.h = -temp;
      bounds.w = clientX - state.msDownX;
      state.msDownX += bounds.w;
      break;
    case 'bottom-left':
      temp = clientX - state.msDownX;
      bounds.w = -temp;
      bounds.x = temp;
      bounds.h = clientY - state.msDownY;
      state.msDownY += bounds.h;
      break;
    case 'bottom-right':
      bounds.w = clientX - state.msDownX;
      state.msDownX += bounds.w;
      bounds.h = clientY - state.msDownY;
      state.msDownY += bounds.h;
      break;
  }

  bounds.w = window.innerWidth + bounds.w;
  bounds.h = window.innerHeight + bounds.h;

  return bounds;
};

export const useLyricWindowInteraction = () => {
  const interactionRef = useRef<InteractionState>(null);

  useEffect(() => {
    const endInteraction = (): void => {
      if (!interactionRef.current) return;
      interactionRef.current = null;
      if (isWindows()) lyricWindowService.setWindowResizeable(true);
    };

    const handleMove = (clientX: number, clientY: number): void => {
      const interaction = interactionRef.current;
      if (!interaction || lyricRootStore.isLocked) return;

      if (interaction.type === 'move') {
        lyricWindowService.setWindowBounds({
          x: clientX - interaction.msDownX,
          y: clientY - interaction.msDownY,
          w: isWindows() ? interaction.windowW : window.innerWidth,
          h: isWindows() ? interaction.windowH : window.innerHeight,
        });
        return;
      }

      lyricWindowService.setWindowBounds(getResizeBounds(interaction, clientX, clientY));
    };

    const handleMouseMove = (event: MouseEvent): void => {
      handleMove(event.clientX, event.clientY);
    };
    const handleTouchMove = (event: TouchEvent): void => {
      const touch = getTouchPoint(event);
      if (!touch) return;
      handleMove(touch.clientX, touch.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', endInteraction);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', endInteraction);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', endInteraction);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', endInteraction);
    };
  }, []);

  const startMove = (clientX: number, clientY: number): void => {
    if (lyricRootStore.isLocked) return;

    interactionRef.current = {
      type: 'move',
      msDownX: clientX,
      msDownY: clientY,
      windowH: window.innerHeight,
      windowW: window.innerWidth,
    };

    if (isWindows()) lyricWindowService.setWindowResizeable(false);
  };

  const startResize = (origin: ResizeOrigin, clientX: number, clientY: number): void => {
    if (lyricRootStore.isLocked) return;

    interactionRef.current = {
      type: 'resize',
      msDownX: clientX,
      msDownY: clientY,
      origin,
    };
  };

  const handleMoveMouseDown = (event: ReactMouseEvent): void => {
    if (event.button !== 0) return;
    startMove(event.clientX, event.clientY);
  };

  const handleMoveTouchStart = (event: ReactTouchEvent): void => {
    const touch = getTouchPoint(event);
    if (!touch) return;
    startMove(touch.clientX, touch.clientY);
  };

  const handleResizeMouseDown = (origin: ResizeOrigin, event: ReactMouseEvent): void => {
    if (event.button !== 0) return;
    event.stopPropagation();
    startResize(origin, event.clientX, event.clientY);
  };

  const handleResizeTouchStart = (origin: ResizeOrigin, event: ReactTouchEvent): void => {
    event.stopPropagation();
    const touch = getTouchPoint(event);
    if (!touch) return;
    startResize(origin, touch.clientX, touch.clientY);
  };

  return {
    handleMoveMouseDown,
    handleMoveTouchStart,
    handleResizeMouseDown,
    handleResizeTouchStart,
  };
};
