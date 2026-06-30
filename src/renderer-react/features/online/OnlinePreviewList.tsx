import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Image, InputNumber, Space, Tag, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import { PlainList, PlainListItem, PlainListMeta } from '../../components/base';
import { getSourceDisplayName } from '../../services/sourceNameService';

const { Text } = Typography;

const transparentImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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
    className="coral-result-list"
    items={list}
    empty={empty ?? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />}
    renderItem={(item) => (
      <PlainListItem key={item.id} actions={actions?.(item)}>
        <PlainListMeta
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
