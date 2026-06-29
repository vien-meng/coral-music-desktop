import { SearchOutlined } from '@ant-design/icons';
import { Alert, Input, Segmented, Space } from 'antd';
import { observer } from 'mobx-react-lite';
import { OnlineSourceSelect } from '../online/OnlineControls';
import { OnlineMusicRowActions } from '../online/OnlineMusicRowActions';
import {
  OnlineMusicPreviewList,
  OnlinePager,
  OnlineSongListPreviewList,
} from '../online/OnlinePreviewList';
import type { SearchRouteType } from '../../stores/domains/searchStore';
import { rootStore } from '../../stores/rootStore';

const searchTypeOptions: Array<{ label: string; value: SearchRouteType }> = [
  { label: '音乐', value: 'music' },
  { label: '歌单', value: 'songlist' },
];

export const SearchRoutePanel = observer(() => {
  const { list, search } = rootStore;
  const resultState =
    search.searchType === 'music' ? search.activeMusicList : search.activeSongList;
  const resultMaxPage = resultState.maxPage > 0 ? resultState.maxPage : undefined;
  const hasNextPage = resultMaxPage != null ? search.page < resultMaxPage : false;

  const handlePageChange = (page: number): void => {
    search.setPage(page);
    if (search.hasQuery) search.submitSearch();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Controls bar */}
      <div style={{ padding: '8px 15px', flex: 'none' }}>
        <Space wrap style={{ width: '100%' }}>
          <Segmented
            options={searchTypeOptions}
            value={search.searchType}
            onChange={(value) => {
              search.setSearchType(value as SearchRouteType);
            }}
          />
          <OnlineSourceSelect
            value={search.source}
            onChange={(source) => {
              search.setSource(source);
            }}
            sources={search.sources}
          />
          <Input.Search
            allowClear
            enterButton={<SearchOutlined />}
            loading={search.isSearching}
            placeholder="搜索"
            value={search.searchText}
            className="coral-search-input"
            onChange={(event) => {
              search.setSearchText(event.target.value);
            }}
            onSearch={() => {
              search.submitSearch();
            }}
          />
          <OnlinePager
            disabled={!search.hasQuery}
            hasNext={hasNextPage}
            loading={search.isSearching}
            maxPage={resultMaxPage}
            page={search.page}
            onChange={handlePageChange}
          />
        </Space>
      </div>

      {/* Errors */}
      {search.searchError ? (
        <Alert
          showIcon
          type="error"
          message={search.searchError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}
      {list.actionError ? (
        <Alert
          showIcon
          type="error"
          message={list.actionError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}

      {/* Results */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 15px 15px' }}>
        {search.searchType === 'music' ? (
          <OnlineMusicPreviewList
            list={search.activeMusicList.list}
            emptyText={search.hasQuery ? '暂无结果' : '等待搜索'}
            actions={(item) => [
              <OnlineMusicRowActions
                key="actions"
                musicInfo={item}
                queue={search.activeMusicList.list}
                queueId={`search:${search.source}:${search.searchText}:${search.page}`}
              />,
            ]}
          />
        ) : (
          <OnlineSongListPreviewList
            list={search.activeSongList.list}
            emptyText={search.hasQuery ? '暂无结果' : '等待搜索'}
          />
        )}
      </div>
    </div>
  );
});
