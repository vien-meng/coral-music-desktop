import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Image, InputNumber, Space, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PlainList, PlainListItem, PlainListMeta } from '../../components/base';
import { onlineMediaService } from '../../services/onlineMediaService';
import { getSourceDisplayName } from '../../services/sourceNameService';

const { Text } = Typography;

const transparentImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const isUsableCoverUrl = (url?: string | null): url is string =>
  Boolean(url && url !== transparentImage && /^(https?:|data:image\/)/i.test(url));

const onlineCoverCache = new Map<string, string | null>();
const onlineCoverRequests = new Map<string, Promise<string>>();

const getOnlineCoverCacheKey = (musicInfo: Coral.Music.MusicInfo): string =>
  `${musicInfo.source}:${musicInfo.id}`;

const canLoadOnlineCover = (
  musicInfo: Coral.Music.MusicInfo,
): musicInfo is Coral.Music.MusicInfoOnline =>
  musicInfo.source !== 'local' && musicInfo.source !== 'webdav';

const loadOnlineCover = async (musicInfo: Coral.Music.MusicInfoOnline): Promise<string> => {
  const key = getOnlineCoverCacheKey(musicInfo);
  if (onlineCoverCache.has(key)) return onlineCoverCache.get(key) ?? '';

  const pending = onlineCoverRequests.get(key);
  if (pending) return pending;

  const request = onlineMediaService
    .getOnlinePicUrl(musicInfo)
    .then((url) => {
      const nextUrl = isUsableCoverUrl(url) ? url : '';
      onlineCoverCache.set(key, nextUrl || null);
      return nextUrl;
    })
    .catch(() => {
      onlineCoverCache.set(key, null);
      return '';
    })
    .finally(() => {
      onlineCoverRequests.delete(key);
    });

  onlineCoverRequests.set(key, request);
  return request;
};

interface OnlineMusicCoverProps {
  musicInfo: Coral.Music.MusicInfo;
}

export const OnlineMusicCover = ({ musicInfo }: OnlineMusicCoverProps) => {
  const cacheKey = getOnlineCoverCacheKey(musicInfo);
  const initialCoverUrl = isUsableCoverUrl(musicInfo.meta.picUrl)
    ? musicInfo.meta.picUrl
    : (onlineCoverCache.get(cacheKey) ?? '');
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const coverRef = useRef<HTMLSpanElement | null>(null);
  const shouldLoadCover = !coverUrl && canLoadOnlineCover(musicInfo);

  useEffect(() => {
    setCoverUrl(
      isUsableCoverUrl(musicInfo.meta.picUrl)
        ? musicInfo.meta.picUrl
        : (onlineCoverCache.get(cacheKey) ?? ''),
    );
  }, [cacheKey, musicInfo.meta.picUrl]);

  useEffect(() => {
    if (!shouldLoadCover) return undefined;
    const node = coverRef.current;
    if (!node) return undefined;

    let cancelled = false;
    const fetchCover = (): void => {
      if (!canLoadOnlineCover(musicInfo)) return;
      loadOnlineCover(musicInfo).then((url) => {
        if (!cancelled && isUsableCoverUrl(url)) setCoverUrl(url);
      });
    };

    if (!('IntersectionObserver' in window)) {
      fetchCover();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        fetchCover();
      },
      { rootMargin: '160px 0px' },
    );

    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [musicInfo, shouldLoadCover]);

  return (
    <span
      ref={coverRef}
      className={`coral-online-music-cover-shell${
        isUsableCoverUrl(coverUrl) ? '' : ' is-cover-missing'
      }`}
    >
      {isUsableCoverUrl(coverUrl) ? (
        <img
          src={coverUrl}
          alt={`${musicInfo.name} 封面`}
          className="coral-online-music-cover"
          loading="lazy"
          onError={() => {
            onlineCoverCache.set(cacheKey, null);
            setCoverUrl('');
          }}
        />
      ) : null}
      <span className="coral-online-music-cover-placeholder" aria-hidden="true">
        ♪
      </span>
    </span>
  );
};

const formatPlayCount = (count: string): string => {
  const n = Number(count);
  if (Number.isNaN(n)) return count;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return count;
};

export interface OnlineSongListPreviewItem {
  author: string;
  desc?: string | null;
  id: string;
  img?: string;
  name: string;
  play_count: string;
  source: Coral.OnlineSource;
  total?: string;
}

export interface OnlinePagerProps {
  disabled?: boolean;
  hasNext?: boolean;
  loading?: boolean;
  maxPage?: number;
  page: number;
  onChange: (page: number) => void;
}

export interface OnlineMusicPreviewListProps {
  actions?: (item: Coral.Music.MusicInfo) => ReactNode[];
  empty?: ReactNode;
  emptyText: string;
  list: Coral.Music.MusicInfo[];
}

export interface OnlineSongListPreviewListProps<
  Item extends OnlineSongListPreviewItem = OnlineSongListPreviewItem,
> {
  actions?: (item: Item) => ReactNode[];
  emptyText: string;
  list: Item[];
  onOpen?: (item: Item) => void;
}

export const OnlinePager = ({
  disabled = false,
  hasNext,
  loading = false,
  maxPage,
  onChange,
  page,
}: OnlinePagerProps) => {
  const normalizedMaxPage = maxPage != null && maxPage > 0 ? maxPage : undefined;
  const canGoPrev = !disabled && !loading && page > 1;
  const canGoNext =
    !disabled && !loading && (hasNext ?? (normalizedMaxPage == null || page < normalizedMaxPage));
  const pageInputWidth = Math.max(
    72,
    String(Math.max(page, normalizedMaxPage ?? page)).length * 16 + 44,
  );

  return (
    <Space className="coral-online-pager">
      <Tooltip title="上一页">
        <Button
          icon={<LeftOutlined />}
          disabled={!canGoPrev}
          onClick={() => {
            onChange(page - 1);
          }}
        />
      </Tooltip>
      <InputNumber
        min={1}
        max={normalizedMaxPage}
        value={page}
        className="coral-page-input"
        style={{ width: pageInputWidth }}
        disabled={disabled || loading}
        onChange={(value) => {
          onChange(value ?? 1);
        }}
      />
      <Tooltip title="下一页">
        <Button
          icon={<RightOutlined />}
          disabled={!canGoNext}
          onClick={() => {
            onChange(page + 1);
          }}
        />
      </Tooltip>
    </Space>
  );
};

export const OnlineMusicPreviewList = ({
  actions,
  empty,
  emptyText,
  list,
}: OnlineMusicPreviewListProps) => (
  <PlainList
    className="coral-result-list coral-online-music-list"
    items={list}
    empty={empty ?? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />}
    renderItem={(item) => (
      <PlainListItem key={item.id} actions={actions?.(item)}>
        <PlainListMeta
          avatar={<OnlineMusicCover musicInfo={item} />}
          title={<Text ellipsis>{item.name}</Text>}
          description={
            <Text
              type="secondary"
              ellipsis
            >{`${item.singer} · ${getSourceDisplayName(item.source)} · ${item.interval ?? '--:--'}`}</Text>
          }
        />
      </PlainListItem>
    )}
  />
);

export const OnlineSongListPreviewList = <Item extends OnlineSongListPreviewItem>({
  actions,
  emptyText,
  list,
  onOpen,
}: OnlineSongListPreviewListProps<Item>) => {
  if (!list.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  }

  return (
    <div className="coral-song-list-grid coral-search-song-list-grid">
      {list.map((item) => (
        <Card
          key={`${item.source}__${item.id}`}
          size="small"
          hoverable={Boolean(onOpen)}
          className="coral-song-list-card"
          onClick={onOpen ? () => onOpen(item) : undefined}
          cover={
            <div className="coral-song-list-card-cover">
              <Image
                src={item.img || transparentImage}
                alt={item.name}
                preview={false}
                fallback={transparentImage}
              />
            </div>
          }
          actions={actions?.(item)}
        >
          <Card.Meta
            title={
              <Text ellipsis style={{ fontSize: 13 }}>
                {item.name}
              </Text>
            }
            description={
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }} ellipsis>
                  {item.author || item.desc || '未知作者'}
                </Text>
                <Space style={{ fontSize: 11, marginTop: 4 }}>
                  <span>{formatPlayCount(item.play_count)}</span>
                  {item.total ? <span>{item.total}首</span> : null}
                  <Tag style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
                    {getSourceDisplayName(item.source)}
                  </Tag>
                </Space>
              </div>
            }
          />
        </Card>
      ))}
    </div>
  );
};
