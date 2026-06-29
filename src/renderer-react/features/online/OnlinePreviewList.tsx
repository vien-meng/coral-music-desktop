import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Empty, InputNumber, Space, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import { PlainList, PlainListItem, PlainListMeta } from '../../components/base';
import { getSourceDisplayName } from '../../services/sourceNameService';

const { Text } = Typography;

export interface OnlineSongListPreviewItem {
  author: string;
  id: string;
  name: string;
  play_count: string;
  source: LX.OnlineSource;
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
  actions?: (item: LX.Music.MusicInfo) => ReactNode[];
  empty?: ReactNode;
  emptyText: string;
  list: LX.Music.MusicInfo[];
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
    96,
    String(Math.max(page, normalizedMaxPage ?? page)).length * 18 + 56,
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
}: OnlineSongListPreviewListProps<Item>) => (
  <PlainList
    className="coral-result-list"
    items={list}
    empty={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />}
    renderItem={(item) => (
      <PlainListItem
        key={item.id}
        actions={actions?.(item)}
        onClick={onOpen ? () => onOpen(item) : undefined}
      >
        <PlainListMeta
          title={<Text ellipsis>{item.name}</Text>}
          description={
            <Text
              type="secondary"
              ellipsis
            >{`${item.author} · ${getSourceDisplayName(item.source)} · ${item.play_count}`}</Text>
          }
        />
      </PlainListItem>
    )}
  />
);
