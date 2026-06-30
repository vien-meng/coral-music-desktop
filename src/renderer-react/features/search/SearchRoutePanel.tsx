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
  const { list, search, songList, ui } = rootStore;
  const resultState =
    search.searchType === 'music' ? search.activeMusicList : search.activeSongList;
  const resultMaxPage = resultState.maxPage > 0 ? resultState.maxPage : undefined;
  const hasNextPage = resultMaxPage != null ? search.page < resultMaxPage : false;

  const submitSearchWithLoading = (): void => {
    if (search.isSearching || ui.isGlobalLoading) return;
    if (!search.hasQuery) {
      void search.submitSearch();
      return;
    }
    void ui.withGlobalLoading(() => search.submitSearch(), '搜索中...');
  };

  const handlePageChange = (page: number): void => {
    search.setPage(page);
    submitSearchWithLoading();
  };

  return (
    <div className="coral-search-route">
      {/* Controls bar */}
      <div className="coral-search-toolbar">
        <Space wrap className="coral-search-toolbar-inner">
          <Segmented
            options={searchTypeOptions}
            value={search.searchType}
            onChange={(value) => {
              search.setSearchType(value as SearchRouteType);
              submitSearchWithLoading();
            }}
          />
          <OnlineSourceSelect
            value={search.source}
            onChange={(source) => {
              search.setSource(source);
              submitSearchWithLoading();
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
              submitSearchWithLoading();
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
      <div className="coral-search-results scroll">
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
            onOpen={(item) => {
              ui.setActiveRoute('song-list');
              void ui.withGlobalLoading(
                () => songList.loadListDetail(item.id, item.source),
                '正在打开歌单...',
              );
            }}
          />
        )}
      </div>
    </div>
  );
});
