import {
  ClearOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Modal,
  Progress,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { PlainList, PlainListItem, PlainListMeta } from '../../components/base';
import type { SearchSource } from '../../stores/domains/searchStore';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;
type SupportedMusicSearchSource = Exclude<SearchSource, 'all'>;

const TAB_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '下载中', value: 'run' },
  { label: '已完成', value: 'completed' },
  { label: '暂停', value: 'pause' },
  { label: '错误', value: 'error' },
];

type DownloadTab = 'all' | 'run' | 'completed' | 'pause' | 'error';

const statusColorMap: Record<string, string> = {
  completed: 'green',
  error: 'red',
  pause: 'default',
  run: 'processing',
  waiting: 'gold',
};
const musicSearchSources: SupportedMusicSearchSource[] = ['kw', 'kg', 'tx', 'wy', 'mg'];

export const DownloadRoutePanel = observer(() => {
  const { download, player, search, ui } = rootStore;
  const [activeTab, setActiveTab] = useState<DownloadTab>('all');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return download.tasks;
    const statusFilter: LX.Download.DownloadTaskStatus =
      activeTab === 'error' ? 'error' : (activeTab as LX.Download.DownloadTaskStatus);
    return download.tasks.filter(
      (task) => task.status === statusFilter || (activeTab === 'completed' && task.isComplate),
    );
  }, [download.tasks, activeTab]);

  const selectedTaskIdSet = new Set(selectedTaskIds);
  const selectedTasks = download.tasks.filter((task) => selectedTaskIdSet.has(task.id));
  const selectedVisibleTasks = filteredTasks.filter((task) => selectedTaskIdSet.has(task.id));
  const selectedPlayableTasks = selectedTasks.filter(
    (task) => task.status === 'completed' || task.isComplate,
  );
  const selectedRunnableTasks = selectedTasks.filter(
    (task) => task.status === 'waiting' || task.status === 'pause' || task.status === 'error',
  );
  const selectedRunningTasks = selectedTasks.filter((task) => task.status === 'run');
  const isAllSelected =
    Boolean(filteredTasks.length) && filteredTasks.every((task) => selectedTaskIdSet.has(task.id));

  useEffect(() => {
    const existingTaskIds = new Set(download.tasks.map((task) => task.id));
    setSelectedTaskIds((ids) => ids.filter((id) => existingTaskIds.has(id)));
  }, [download.tasks]);

  const handleClearTasks = (): void => {
    if (!download.taskCount) return;
    Modal.confirm({
      content: `共 ${download.taskCount} 个任务`,
      okButtonProps: { danger: true },
      okText: '清空',
      title: '清空下载任务',
      onOk: async () => {
        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
        await download.clearTasks();
        setSelectedTaskIds([]);
      },
    });
  };

  const handleSelectAllTasks = (): void => {
    setSelectedTaskIds(isAllSelected ? [] : filteredTasks.map((task) => task.id));
  };

  const handleToggleTaskSelection = (taskId: string, checked: boolean): void => {
    setSelectedTaskIds((ids) => {
      if (checked) return ids.includes(taskId) ? ids : [...ids, taskId];
      return ids.filter((id) => id !== taskId);
    });
  };

  const handleRemoveSelectedTasks = (): void => {
    if (!selectedTasks.length) return;
    Modal.confirm({
      content: `确认移除 ${selectedTasks.length} 个下载任务？`,
      okButtonProps: { danger: true },
      okText: '移除',
      title: '批量移除下载任务',
      onOk: async () => {
        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
        await download.removeTasks(selectedTaskIds);
        setSelectedTaskIds([]);
      },
    });
  };

  const handlePlaySelectedTasks = (): void => {
    if (!selectedPlayableTasks.length) return;
    player.playFromQueue(selectedPlayableTasks[0], selectedPlayableTasks, 'download');
  };

  const handleStartSelectedTasks = (): void => {
    if (!selectedRunnableTasks.length) return;
    download.startTasks(selectedRunnableTasks.map((task) => task.id)).catch(() => {});
  };

  const handlePauseSelectedTasks = (): void => {
    if (!selectedRunningTasks.length) return;
    download.pauseTasks(selectedRunningTasks.map((task) => task.id)).catch(() => {});
  };

  const handleSearchTaskMusic = (task: LX.Download.ListItem): void => {
    const musicInfo = task.metadata.musicInfo;
    const searchText = `${musicInfo.name} ${musicInfo.singer}`.trim();

    if (musicSearchSources.includes(musicInfo.source as SupportedMusicSearchSource)) {
      search.setSource(musicInfo.source as SupportedMusicSearchSource);
    }
    search.setSearchType('music');
    search.setSearchText(searchText);
    ui.setActiveRoute('search');
    search.submitSearch();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Controls bar */}
      <div style={{ padding: '8px 15px', flex: 'none' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              loading={download.isHydrating}
              onClick={() => {
                download.refreshTasks().catch(() => {});
              }}
            >
              刷新
            </Button>
            <Button
              danger
              icon={<ClearOutlined />}
              disabled={!download.taskCount}
              loading={download.isMutatingTask}
              onClick={handleClearTasks}
            >
              清空
            </Button>
            <Button disabled={!download.taskCount} onClick={handleSelectAllTasks}>
              {isAllSelected ? '取消全选' : '全选'}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              disabled={!selectedRunnableTasks.length}
              loading={download.isMutatingTask}
              onClick={handleStartSelectedTasks}
            >
              开始选中
            </Button>
            <Button
              icon={<PauseCircleOutlined />}
              disabled={!selectedRunningTasks.length}
              loading={download.isMutatingTask}
              onClick={handlePauseSelectedTasks}
            >
              暂停选中
            </Button>
            <Button
              icon={<PlayCircleOutlined />}
              disabled={!selectedPlayableTasks.length}
              onClick={handlePlaySelectedTasks}
            >
              播放选中
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!selectedTasks.length}
              loading={download.isMutatingTask}
              onClick={handleRemoveSelectedTasks}
            >
              移除选中
            </Button>
          </Space>
          <Space>
            <Tag>总任务 {download.taskCount}</Tag>
            <Tag>已完成 {download.completedTaskCount}</Tag>
            <Tag>
              下载中 {download.runningTaskCount} / {download.maxConcurrentTaskCount}
            </Tag>
            <Tag>等待 {download.waitingTaskCount}</Tag>
            <Tag>
              当前选中 {selectedVisibleTasks.length} / {filteredTasks.length}
            </Tag>
          </Space>
        </Space>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '0 15px 8px', flex: 'none' }}>
        <Segmented
          value={activeTab}
          options={TAB_OPTIONS}
          onChange={(value) => {
            setActiveTab(value as DownloadTab);
            setSelectedTaskIds([]);
          }}
        />
      </div>

      {/* Errors */}
      {download.hydrateError ? (
        <Alert
          showIcon
          type="error"
          message={download.hydrateError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}
      {download.actionError ? (
        <Alert
          showIcon
          type="error"
          message={download.actionError}
          closable
          style={{ margin: '0 15px 8px', flex: 'none' }}
        />
      ) : null}

      {/* Task list */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 15px 15px' }}>
        <PlainList
          className="coral-result-list"
          items={filteredTasks}
          empty={
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={activeTab === 'all' ? '暂无任务' : '该分类暂无任务'}
            />
          }
          renderItem={(task) => {
            const isPlayable = task.status === 'completed' || task.isComplate;
            const canStart = task.status === 'waiting' || task.status === 'pause';
            const canPause = task.status === 'run';
            const canRetry = task.status === 'error';
            return (
              <PlainListItem
                key={task.id}
                actions={[
                  <Checkbox
                    key="select"
                    checked={selectedTaskIdSet.has(task.id)}
                    onChange={(event) => {
                      handleToggleTaskSelection(task.id, event.target.checked);
                    }}
                  />,
                  <Tooltip key="start" title={canRetry ? '重试' : '开始下载'}>
                    <Button
                      type="text"
                      size="small"
                      icon={canRetry ? <ReloadOutlined /> : <DownloadOutlined />}
                      disabled={!canStart && !canRetry}
                      loading={download.isMutatingTask && (canStart || canRetry)}
                      onClick={() => {
                        if (canRetry) {
                          download.retryTask(task.id).catch(() => {});
                        } else {
                          download.startTask(task.id).catch(() => {});
                        }
                      }}
                    />
                  </Tooltip>,
                  <Tooltip key="pause" title="暂停">
                    <Button
                      type="text"
                      size="small"
                      icon={<PauseCircleOutlined />}
                      disabled={!canPause}
                      loading={download.isMutatingTask && canPause}
                      onClick={() => {
                        download.pauseTask(task.id).catch(() => {});
                      }}
                    />
                  </Tooltip>,
                  <Tooltip key="play" title="播放">
                    <Button
                      type="text"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      disabled={!isPlayable}
                      onClick={() => {
                        player.playFromQueue(task, download.playableTasks, 'download');
                      }}
                    />
                  </Tooltip>,
                  <Tooltip key="remove" title="移除任务">
                    <Button
                      danger
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      loading={download.isMutatingTask}
                      onClick={() => {
                        download.removeTask(task.id).catch(() => {});
                      }}
                    />
                  </Tooltip>,
                  <Dropdown
                    key="more"
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          disabled: !task.metadata.filePath,
                          icon: <FolderOpenOutlined />,
                          key: 'file',
                          label: '打开文件位置',
                        },
                        {
                          icon: <SearchOutlined />,
                          key: 'search',
                          label: '搜索歌曲',
                        },
                      ],
                      onClick: ({ key }) => {
                        if (key === 'file') {
                          download.openTaskFile(task);
                        } else if (key === 'search') {
                          handleSearchTaskMusic(task);
                        }
                      },
                    }}
                  >
                    <Button type="text" size="small" icon={<MoreOutlined />} />
                  </Dropdown>,
                ]}
              >
                <PlainListMeta
                  title={
                    <Space wrap>
                      <Text ellipsis style={{ maxWidth: 300 }}>
                        {task.metadata.fileName || task.metadata.musicInfo.name}
                      </Text>
                      {task.metadata.quality ? (
                        <Tag style={{ fontSize: 11, lineHeight: '18px' }}>
                          {task.metadata.quality === 'flac24bit'
                            ? 'FLAC Hires'
                            : task.metadata.quality.toUpperCase()}
                        </Tag>
                      ) : null}
                      <Tag color={statusColorMap[task.status]}>
                        {task.statusText || task.status}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2} className="coral-wide">
                      <Progress
                        percent={Math.round(task.progress)}
                        size="small"
                        strokeColor={task.status === 'error' ? '#ff4d4f' : undefined}
                        status={task.status === 'error' ? 'exception' : undefined}
                      />
                      <Space size={4}>
                        {task.speed ? (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {task.speed}/s
                          </Text>
                        ) : null}
                        {task.metadata.filePath ? (
                          <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                            {task.metadata.filePath}
                          </Text>
                        ) : null}
                      </Space>
                    </Space>
                  }
                />
              </PlainListItem>
            );
          }}
        />
      </div>
    </div>
  );
});
