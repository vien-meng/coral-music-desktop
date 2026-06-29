import { Empty, Pagination, Spin } from 'antd';
import type { ReactElement, ReactNode } from 'react';

export interface PlainListPagination {
  current: number;
  pageSize: number;
  showSizeChanger?: boolean;
  size?: 'small';
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

export interface PlainListProps<Item> {
  className?: string;
  empty?: ReactNode;
  items: Item[];
  loading?: boolean;
  pagination?: PlainListPagination;
  renderItem: (item: Item, index: number) => ReactElement | null;
}

export interface PlainListItemProps {
  actions?: ReactNode[];
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface PlainListMetaProps {
  avatar?: ReactNode;
  description?: ReactNode;
  title?: ReactNode;
}

const getClassName = (...names: Array<string | undefined | false>) =>
  names.filter(Boolean).join(' ');

export const PlainList = <Item,>({
  className,
  empty,
  items,
  loading = false,
  pagination,
  renderItem,
}: PlainListProps<Item>) => {
  const emptyContent = empty ?? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
  );

  return (
    <Spin spinning={loading}>
      <div className={getClassName('coral-plain-list', className)} role="list">
        {items.length ? (
          items.map((item, index) => renderItem(item, index))
        ) : (
          <div className="coral-plain-list-empty">{emptyContent}</div>
        )}
      </div>
      {pagination && items.length ? (
        <Pagination
          className="coral-plain-list-pagination"
          current={pagination.current}
          pageSize={pagination.pageSize}
          showSizeChanger={pagination.showSizeChanger}
          size={pagination.size}
          total={pagination.total}
          onChange={pagination.onChange}
        />
      ) : null}
    </Spin>
  );
};

export const PlainListItem = ({ actions, children, className, onClick }: PlainListItemProps) => {
  const visibleActions = actions?.filter(Boolean);
  return (
    <div
      className={getClassName('coral-plain-list-item', onClick && 'is-clickable', className)}
      role="listitem"
      onClick={onClick}
    >
      <div className="coral-plain-list-item-main">{children}</div>
      {visibleActions?.length ? (
        <div className="coral-plain-list-item-actions">{visibleActions}</div>
      ) : null}
    </div>
  );
};

export const PlainListMeta = ({ avatar, description, title }: PlainListMetaProps) => (
  <div className="coral-plain-list-meta">
    {avatar ? <div className="coral-plain-list-meta-avatar">{avatar}</div> : null}
    <div className="coral-plain-list-meta-content">
      {title ? <div className="coral-plain-list-meta-title">{title}</div> : null}
      {description ? <div className="coral-plain-list-meta-description">{description}</div> : null}
    </div>
  </div>
);
