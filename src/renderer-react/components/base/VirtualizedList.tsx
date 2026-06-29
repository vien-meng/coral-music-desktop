import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface VirtualizedListHandle {
  scrollTo: (
    scrollTop: number,
    animate?: boolean,
    onScrollEnd?: (result: boolean | 'canceled') => void,
  ) => void;
  scrollToIndex: (
    index: number,
    offset?: number,
    animate?: boolean,
    onScrollEnd?: (result: boolean | 'canceled') => void,
  ) => void;
  getScrollTop: () => number;
}

interface VirtualizedListProps<T> {
  list: T[];
  itemHeight: number;
  keyName: keyof T;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  className?: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

interface ViewItem<T> {
  item: T;
  top: number;
  style: React.CSSProperties;
  index: number;
  key: string | number;
}

const easeInOutQuad = (t: number, b: number, c: number, d: number): number => {
  t /= d / 2;
  if (t < 1) return (c / 2) * t * t + b;
  t--;
  return (-c / 2) * (t * (t - 2) - 1) + b;
};

const animateScroll = (
  element: HTMLDivElement,
  to: number,
  duration: number,
  callback: () => void,
  onCancel: () => void,
): ((cb: () => void) => void) => {
  const start = element.scrollTop;
  let cancel = false;
  if (to > start) {
    const maxScrollTop = element.scrollHeight - element.clientHeight;
    if (to > maxScrollTop) to = maxScrollTop;
  } else if (to < start) {
    if (to < 0) to = 0;
  } else {
    callback();
    return () => {};
  }
  const change = to - start;
  const increment = 10;
  if (!change) {
    callback();
    return () => {};
  }

  let currentTime = 0;
  let cancelCallback: () => void;

  const animateScrollInternal = (): void => {
    currentTime += increment;
    const val = parseInt(String(easeInOutQuad(currentTime, start, change, duration)), 10);
    element.scrollTop = val;
    if (currentTime < duration) {
      if (cancel) {
        cancelCallback();
        onCancel();
        return;
      }
      window.setTimeout(animateScrollInternal, increment);
    } else {
      callback();
    }
  };
  animateScrollInternal();
  return (cb: () => void) => {
    cancelCallback = cb;
    cancel = true;
  };
};

const VirtualizedListInner = <T,>(
  props: VirtualizedListProps<T>,
  ref: React.Ref<VirtualizedListHandle>,
) => {
  const { list, itemHeight, keyName, renderItem, renderFooter, className, onScroll } = props;
  const [views, setViews] = useState<Array<ViewItem<T>>>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startIndexRef = useRef(-1);
  const endIndexRef = useRef(-1);
  const scrollTopRef = useRef(-1);
  const cachedListRef = useRef<Array<ViewItem<T>>>([]);
  const cancelScrollRef = useRef<((cb: () => void) => void) | null>(null);
  const isAutoScrollingRef = useRef(false);
  const scrollToValueRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const createList = useCallback(
    (start: number, end: number): Array<ViewItem<T>> => {
      const cache = cachedListRef.current.slice(start, end);
      const result = list.slice(start, end).map((item, i) => {
        if (cache[i]) return cache[i];
        const top = (start + i) * itemHeight;
        const index = start + i;
        const viewItem: ViewItem<T> = {
          item,
          top,
          style: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${top}px`,
            height: `${itemHeight}px`,
          },
          index,
          key: item[keyName] as string | number,
        };
        cachedListRef.current[index] = viewItem;
        return viewItem;
      });
      return result;
    },
    [list, itemHeight, keyName],
  );

  const updateView = useCallback(
    (currentScrollTop?: number) => {
      const container = containerRef.current;
      if (!container) return;
      const top = currentScrollTop ?? container.scrollTop;
      const currentStartIndex = Math.floor(top / itemHeight);
      const scrollContainerHeight = container.clientHeight;
      const currentEndIndex = currentStartIndex + Math.ceil(scrollContainerHeight / itemHeight);
      const continuous =
        currentStartIndex <= endIndexRef.current && currentEndIndex >= startIndexRef.current;
      const currentStartRenderIndex = Math.max(currentStartIndex, 0);
      const currentEndRenderIndex = currentEndIndex + 1;

      if (continuous) {
        if (top === scrollTopRef.current && endIndexRef.current >= currentEndIndex) return;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setViews(createList(currentStartRenderIndex, currentEndRenderIndex));
      });

      startIndexRef.current = currentStartIndex;
      endIndexRef.current = currentEndIndex;
      scrollTopRef.current = top;
    },
    [itemHeight, createList],
  );

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      setIsScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 200);

      const container = containerRef.current;
      if (!container) return;
      const currentScrollTop = container.scrollTop;
      if (Math.abs(currentScrollTop - scrollTopRef.current) > itemHeight * 0.6) {
        updateView(currentScrollTop);
      }
      onScroll?.(event);
    },
    [itemHeight, updateView, onScroll],
  );

  const handleReset = useCallback(
    (newList: T[]) => {
      cachedListRef.current = Array(newList.length);
      startIndexRef.current = -1;
      endIndexRef.current = -1;
      if (newList.length) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          updateView();
        });
      } else {
        setViews([]);
      }
    },
    [updateView],
  );

  const scrollTo = useCallback(
    (
      targetScrollTop: number,
      animate = false,
      onScrollEnd?: (result: boolean | 'canceled') => void,
    ) => {
      const container = containerRef.current;
      if (!container) return;

      if (onScrollEnd) {
        new Promise<void>((resolve) => {
          if (cancelScrollRef.current) {
            cancelScrollRef.current(resolve);
          } else {
            resolve();
          }
        }).then(() => {
          if (animate) {
            isAutoScrollingRef.current = true;
            scrollToValueRef.current = targetScrollTop;
            cancelScrollRef.current = animateScroll(
              container,
              targetScrollTop,
              300,
              () => {
                cancelScrollRef.current = null;
                isAutoScrollingRef.current = false;
                onScrollEnd(true);
              },
              () => {
                cancelScrollRef.current = null;
                isAutoScrollingRef.current = false;
                onScrollEnd('canceled');
              },
            );
          } else {
            container.scrollTop = targetScrollTop;
          }
        });
      } else {
        container.scrollTo({
          top: targetScrollTop,
          behavior: animate ? 'smooth' : 'instant',
        });
      }
    },
    [],
  );

  const scrollToIndex = useCallback(
    (
      index: number,
      offset = 0,
      animate = false,
      onScrollEnd?: (result: boolean | 'canceled') => void,
    ) => {
      scrollTo(Math.max(index * itemHeight + offset, 0), animate, onScrollEnd);
    },
    [itemHeight, scrollTo],
  );

  const getScrollTop = useCallback((): number => {
    const container = containerRef.current;
    if (!container) return 0;
    return isAutoScrollingRef.current ? scrollToValueRef.current : container.scrollTop;
  }, []);

  useImperativeHandle(
    ref,
    (): VirtualizedListHandle => ({
      scrollTo,
      scrollToIndex,
      getScrollTop,
    }),
    [scrollTo, scrollToIndex, getScrollTop],
  );

  useEffect(() => {
    handleReset(list);
  }, [list, itemHeight, handleReset]);

  useEffect(() => {
    const handleResize = (): void => {
      window.setTimeout(() => {
        updateView();
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (cancelScrollRef.current) cancelScrollRef.current(() => {});
    };
  }, [updateView]);

  const contentStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = {
      display: 'block',
      height: `${list.length * itemHeight}px`,
    };
    if (isScrolling) style.pointerEvents = 'none';
    return style;
  }, [list.length, itemHeight, isScrolling]);

  return (
    <div
      ref={containerRef}
      className={className}
      tabIndex={0}
      onScroll={handleScroll}
      style={{
        outline: 'none',
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        display: 'block',
        contain: 'strict',
      }}
    >
      <div style={contentStyle}>
        {views.map((view) => (
          <div key={view.key} style={view.style}>
            {renderItem(view.item, view.index)}
          </div>
        ))}
      </div>
      {renderFooter?.()}
    </div>
  );
};

export const VirtualizedList = forwardRef(VirtualizedListInner) as unknown as <T>(
  props: VirtualizedListProps<T> & { ref?: React.Ref<VirtualizedListHandle> },
) => React.ReactElement;
