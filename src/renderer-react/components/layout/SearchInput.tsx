import { SearchOutlined } from '@ant-design/icons';
import { AutoComplete, Input } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { rootStore } from '../../stores/rootStore';

interface SearchInputProps {
  onSearch: (text: string) => void;
}

export const SearchInput = observer(({ onSearch }: SearchInputProps) => {
  const { search, settings } = rootStore;
  const [text, setText] = useState(search.searchText);
  const [options, setOptions] = useState<Array<{ value: string }>>([]);
  const showHistory = settings.appSetting?.['search.isShowHistorySearch'] ?? false;
  const historyOptions = useMemo(
    () => (showHistory && !text.trim() ? search.historyList.map((value) => ({ value })) : []),
    [search.historyList, showHistory, text],
  );

  useEffect(() => {
    setText(search.searchText);
  }, [search.searchText]);

  const handleSearch = (value: string): void => {
    setText(value);
    if (value.trim()) {
      setOptions([]);
    } else {
      setOptions([]);
    }
  };

  const handleSelect = (value: string): void => {
    setText(value);
    onSearch(value);
  };

  const handleSubmit = (value: string): void => {
    onSearch(value);
  };

  return (
    <AutoComplete
      value={text}
      options={options.length ? options : historyOptions}
      className="coral-global-search"
      onSearch={handleSearch}
      onSelect={handleSelect}
      onChange={setText}
    >
      <Input
        prefix={<SearchOutlined />}
        autoFocus={settings.appSetting?.['search.isFocusSearchBox']}
        placeholder="搜索音乐、MV、歌单"
        onPressEnter={(event) => {
          handleSubmit(event.currentTarget.value);
        }}
        allowClear
      />
    </AutoComplete>
  );
});
