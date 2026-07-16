import {
  ClearOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  ImportOutlined,
  MoreOutlined,
  OrderedListOutlined,
  FolderAddOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RetweetOutlined,
  SaveOutlined,
  SearchOutlined,
  SwapOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Tag,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { filterFileName } from '@common/utils/common';
import {
  externalDecoderExtensions,
  nativeLocalAudioExtensions,
} from '@shared/playbackCapabilities';
import { OnlineMusicPreviewList } from '../online/OnlinePreviewList';
import { PlainList, PlainListItem, PlainListMeta } from '../../components/base';
import type { SearchSource } from '../../stores/domains/searchStore';
import { appService } from '../../services/appService';
import { loadOnlineMusicService } from '../../services/onlineMusicServiceLoader';
import { musicDetailService } from '../../services/musicDetailService';
import { localAudioService } from '../../services/localAudioService';
import { openDownloadTaskFile } from '../../services/downloadService';
import { DownloadQualityModal } from '../../components/player/DownloadQualityModal';
import { DraggableMusicList } from '../../components/player/DraggableMusicList';
import { BatchDownloadModal } from '../../components/player/BatchDownloadModal';
import {
  createLocalAudioFolderImportDialogOptions,
  createLocalAudioImportDialogOptions,
} from '../../services/localAudioDialogService';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

type MusicSortField = 'album' | 'interval' | 'name' | 'singer' | 'source';
type SortDirection = 'asc' | 'desc';
type SupportedMusicSearchSource = Exclude<SearchSource, 'all'>;

interface DuplicateMusicReviewItem {
  duplicateName: string;
  groupIndex: number;
  index: number;
  isRetained: boolean;
  musicInfo: Coral.Music.MusicInfo;
}

const duplicateVariantPattern = /(\(|（).+(\)|）)/g;
const duplicatePunctuationPattern = /\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[/g;
const musicSearchSources: SupportedMusicSearchSource[] = ['kw', 'kg', 'tx', 'wy', 'mg'];

const parseIntervalSeconds = (interval?: string | null): number => {
  if (!interval) return 0;
  return interval
    .split(':')
    .map(Number)
    .filter(Number.isFinite)
    .reduce((total, value) => total * 60 + value, 0);
};

const compareText = (left = '', right = ''): number => left.localeCompare(right, 'zh-Hans-CN');

const normalizeDuplicateMusicName = (name: string): string =>
  name
    .toLocaleLowerCase()
    .replace(duplicateVariantPattern, '')
    .replace(duplicatePunctuationPattern, '') || name.toLocaleLowerCase().replace(/\s+/g, '');

const sortMusicInfos = (
  musicInfos: Coral.Music.MusicInfo[],
  sortField: MusicSortField,
  sortDirection: SortDirection,
): Coral.Music.MusicInfo[] =>
  musicInfos.slice().sort((left, right) => {
    let result = 0;

    switch (sortField) {
      case 'album':
        result = compareText(left.meta.albumName, right.meta.albumName);
        break;
      case 'interval':
        result = parseIntervalSeconds(left.interval) - parseIntervalSeconds(right.interval);
        break;
      case 'singer':
        result = compareText(left.singer, right.singer);
        break;
      case 'source':
        result = compareText(left.source, right.source);
        break;
      default:
        result = compareText(left.name, right.name);
        break;
    }

    return sortDirection === 'asc' ? result : -result;
  });

const shuffleMusicInfos = (musicInfos: Coral.Music.MusicInfo[]): Coral.Music.MusicInfo[] => {
  const nextMusics = musicInfos.slice();

  for (let index = nextMusics.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1));
    const current = nextMusics[index];
    nextMusics[index] = nextMusics[targetIndex];
    nextMusics[targetIndex] = current;
  }

  return nextMusics;
};

const getDuplicateMusicReviewItems = (
  musicInfos: Coral.Music.MusicInfo[],
): DuplicateMusicReviewItem[] => {
  const groupMap = new Map<string, Array<{ index: number; musicInfo: Coral.Music.MusicInfo }>>();

  musicInfos.forEach((musicInfo, index) => {
    const duplicateName = normalizeDuplicateMusicName(musicInfo.name);
    const group = groupMap.get(duplicateName);
    if (group) {
      group.push({ index, musicInfo });
    } else {
      groupMap.set(duplicateName, [{ index, musicInfo }]);
    }
  });

  const duplicateGroups = Array.from(groupMap.entries())
    .filter(([, group]) => group.length > 1)
    .sort(([left], [right]) => compareText(left, right));

  return duplicateGroups.flatMap(([duplicateName, group], groupIndex) =>
    group.map((item, index) => ({
      duplicateName,
      groupIndex,
      index: item.index,
      isRetained: index === 0,
      musicInfo: item.musicInfo,
    })),
  );
};

export const LocalListRoutePanel = observer(() => {
  const { list, player, search, ui } = rootStore;
  const appSetting = rootStore.settings.appSetting;
  const addMusicLocationType = appSetting?.['list.addMusicLocationType'] ?? 'top';
  const selectedListId = list.selectedListId ?? undefined;
  const [createName, setCreateName] = useState('');
  const [renameName, setRenameName] = useState(list.selectedList?.name ?? '');
  const [selectedMusicIds, setSelectedMusicIds] = useState<string[]>([]);
  const [targetListId, setTargetListId] = useState<string | undefined>();
  const [filterText, setFilterText] = useState('');
  const [moveTargetPosition, setMoveTargetPosition] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortField, setSortField] = useState<MusicSortField>('name');
  const [duplicateReviewItems, setDuplicateReviewItems] = useState<DuplicateMusicReviewItem[]>([]);
  const [isDuplicateReviewOpen, setIsDuplicateReviewOpen] = useState(false);
  const [sourceToggleMusic, setSourceToggleMusic] = useState<Coral.Music.MusicInfo | null>(null);
  const [sourceToggleCandidates, setSourceToggleCandidates] = useState<Coral.Music.MusicInfo[]>([]);
  const [sourceToggleSearchText, setSourceToggleSearchText] = useState('');
  const [isSourceToggleOpen, setIsSourceToggleOpen] = useState(false);
  const [isLoadingSourceToggleCandidates, setIsLoadingSourceToggleCandidates] = useState(false);
  const [isDraggingMode, setIsDraggingMode] = useState(false);
  const [dragList, setDragList] = useState<Coral.Music.MusicInfo[]>([]);
  const [batchDownloadModalMusics, setBatchDownloadModalMusics] = useState<Coral.Music.MusicInfo[]>(
    [],
  );
  const [downloadModalMusic, setDownloadModalMusic] = useState<Coral.Music.MusicInfo | null>(null);
  const normalizedFilterText = filterText.trim().toLocaleLowerCase();
  const filteredMusics = normalizedFilterText
    ? list.selectedMusics.filter((musicInfo) =>
        [musicInfo.name, musicInfo.singer, musicInfo.meta.albumName, musicInfo.source]
          .filter(Boolean)
          .some((text) => text.toLocaleLowerCase().includes(normalizedFilterText)),
      )
    : list.selectedMusics;
  const sortedAllMusics = sortMusicInfos(list.selectedMusics, sortField, sortDirection);
  const sortedMusics = normalizedFilterText
    ? sortMusicInfos(filteredMusics, sortField, sortDirection)
    : sortedAllMusics;
  const selectedMusicIdSet = new Set(selectedMusicIds);
  const selectedMusics = sortedAllMusics.filter((musicInfo) =>
    selectedMusicIdSet.has(musicInfo.id),
  );
  const filteredMusicIds = filteredMusics.map((musicInfo) => musicInfo.id);
  const isAllSelected =
    Boolean(filteredMusicIds.length) && filteredMusicIds.every((id) => selectedMusicIdSet.has(id));
  const targetListOptions = list.userLists
    .filter((userList) => userList.id !== list.selectedListId)
    .map((userList) => ({
      label: userList.name,
      value: userList.id,
    }));
  const lastUserListId = list.userLists[list.userLists.length - 1]?.id;

  useEffect(() => {
    setRenameName(list.selectedList?.name ?? '');
  }, [list.selectedList?.id, list.selectedList?.name]);

  useEffect(() => {
    setSelectedMusicIds([]);
    setFilterText('');
    setMoveTargetPosition(null);
    setTargetListId(undefined);
  }, [list.selectedList?.id]);

  useEffect(() => {
    const availableIds = new Set(list.selectedMusics.map((musicInfo) => musicInfo.id));
    setSelectedMusicIds((ids) => ids.filter((id) => availableIds.has(id)));
  }, [list.selectedMusics]);

  const loadSelectedList = (): void => {
    list.loadSelectedListMusics();
  };

  const handleCreateList = async (): Promise<void> => {
    const name = createName.trim();
    if (!name) return;
    await list.createUserList(name);
    if (list.actionError) return;
    setCreateName('');
    message.success('列表已创建');
  };

  const handleCreateLocalList = async (): Promise<void> => {
    setCreateName('');
    await list.ensureLocalAudioList();
  };

  const handleRenameList = async (): Promise<void> => {
    await list.renameSelectedList(renameName);
    if (!list.actionError) message.success('列表已重命名');
  };

  const handleRemoveList = (): void => {
    if (!list.selectedList) return;

    Modal.confirm({
      content: list.selectedList.name,
      okButtonProps: {
        danger: true,
      },
      okText: '删除',
      title: '删除列表',
      onOk: async () => {
        await list.removeSelectedList();
        if (!list.actionError) message.success('列表已删除');
      },
    });
  };

  const handleClearMusics = (): void => {
    if (!list.selectedList || !list.selectedMusics.length) return;

    Modal.confirm({
      content: list.selectedList.name,
      okButtonProps: {
        danger: true,
      },
      okText: '清空',
      title: '清空列表歌曲',
      onOk: async () => {
        await list.clearSelectedListMusics();
        if (!list.actionError) message.success('列表已清空');
      },
    });
  };

  const handleToggleMusicSelection = (musicId: string, checked: boolean): void => {
    setSelectedMusicIds((ids) => {
      if (checked) return ids.includes(musicId) ? ids : [...ids, musicId];
      return ids.filter((id) => id !== musicId);
    });
  };

  const handleSelectAllMusics = (): void => {
    setSelectedMusicIds((ids) => {
      if (isAllSelected) return ids.filter((id) => !filteredMusicIds.includes(id));
      return Array.from(new Set([...ids, ...filteredMusicIds]));
    });
  };

  const handlePlaySelectedMusics = (): void => {
    if (!selectedMusics.length) return;
    player.playFromQueue(selectedMusics[0], selectedMusics, selectedListId ?? null);
  };

  const handlePlayAllMusics = (): void => {
    if (!sortedMusics.length) return;
    player.playFromQueue(sortedMusics[0], sortedMusics, selectedListId ?? null);
  };

  const handleRemoveSelectedMusics = (): void => {
    if (!selectedMusics.length) return;

    Modal.confirm({
      content: `确认移除 ${selectedMusics.length} 首歌曲？`,
      okButtonProps: {
        danger: true,
      },
      okText: '移除',
      title: '批量移除',
      onOk: async () => {
        await list.removeMusicsFromSelectedList(selectedMusicIds);
        if (list.actionError) return;
        setSelectedMusicIds([]);
        message.success('已移除选中歌曲');
      },
    });
  };

  const handleCopySelectedMusics = async (): Promise<void> => {
    if (!targetListId || !selectedMusics.length) return;
    await list.copyMusicsToList(targetListId, selectedMusics, addMusicLocationType);
    if (!list.actionError) message.success(`已复制 ${selectedMusics.length} 首歌曲`);
  };

  const handleMoveSelectedMusics = (): void => {
    if (!targetListId || !selectedMusics.length) return;

    Modal.confirm({
      content: `确认移动 ${selectedMusics.length} 首歌曲？`,
      okText: '移动',
      title: '移动到列表',
      onOk: async () => {
        await list.moveMusicsToList(targetListId, selectedMusics, addMusicLocationType);
        if (list.actionError) return;
        setSelectedMusicIds([]);
        message.success('歌曲已移动');
      },
    });
  };

  const handleMoveSelectedMusicsToPosition = async (position: number): Promise<void> => {
    if (!selectedMusics.length) return;

    await list.moveSelectedMusicsToPosition(position, selectedMusics);
    if (list.actionError) return;
    setSelectedMusicIds([]);
    setMoveTargetPosition(null);
    message.success('歌曲位置已更新');
  };

  const handleMoveSelectedMusicsToInputPosition = (): void => {
    if (moveTargetPosition == null) return;
    handleMoveSelectedMusicsToPosition(moveTargetPosition - 1);
  };

  const handleSaveCurrentSort = async (): Promise<void> => {
    if (!list.selectedMusics.length) return;

    await list.replaceSelectedMusicOrder(
      sortMusicInfos(list.selectedMusics, sortField, sortDirection),
    );
    if (!list.actionError) message.success('排序已保存');
  };

  const handleShuffleSelectedList = async (): Promise<void> => {
    if (list.selectedMusics.length < 2) return;

    await list.replaceSelectedMusicOrder(shuffleMusicInfos(list.selectedMusics));
    if (!list.actionError) message.success('已随机排序');
  };

  const handleDragReorder = (fromIndex: number, toIndex: number): void => {
    const nextDragList = [...dragList];
    const [movedItem] = nextDragList.splice(fromIndex, 1);
    nextDragList.splice(toIndex, 0, movedItem);
    setDragList(nextDragList);
  };

  const handleSaveDragOrder = async (): Promise<void> => {
    if (!dragList.length || dragList.length !== list.selectedMusics.length) return;
    await list.replaceSelectedMusicOrder(dragList);
    if (list.actionError) return;
    setIsDraggingMode(false);
    setDragList([]);
    message.success('拖拽顺序已保存');
  };

  const toggleDragMode = (): void => {
    if (isDraggingMode) {
      setIsDraggingMode(false);
      setDragList([]);
      return;
    }
    setDragList(sortedAllMusics);
    setIsDraggingMode(true);
  };

  const handleRemoveDuplicateMusics = (): void => {
    if (!list.selectedMusics.length) return;

    const reviewItems = getDuplicateMusicReviewItems(list.selectedMusics);
    if (!reviewItems.length) {
      Modal.info({
        content: '当前列表没有检测到重复歌曲。',
        title: '重复歌曲',
      });
      return;
    }

    setDuplicateReviewItems(reviewItems);
    setIsDuplicateReviewOpen(true);
  };

  const handleRemoveDuplicateIds = async (musicIds: string[]): Promise<void> => {
    const nextMusics = list.selectedMusics.filter((musicInfo) => !musicIds.includes(musicInfo.id));

    await list.removeMusicsFromSelectedList(musicIds);
    if (list.actionError) return;
    setSelectedMusicIds((ids) => ids.filter((id) => !musicIds.includes(id)));
    const reviewItems = getDuplicateMusicReviewItems(nextMusics);
    setDuplicateReviewItems(reviewItems);
    if (!reviewItems.length) setIsDuplicateReviewOpen(false);
    message.success(`已移除 ${musicIds.length} 首重复歌曲`);
  };

  const handleRemoveDuplicateCopies = async (): Promise<void> => {
    const removalIds = duplicateReviewItems
      .filter((item) => !item.isRetained)
      .map((item) => item.musicInfo.id);
    if (!removalIds.length) return;

    await handleRemoveDuplicateIds(removalIds);
  };

  const handleImportListPart = (): void => {
    appService
      .showSelectDialog({
        filters: [
          { extensions: ['json', 'lxmc'], name: 'Play List Part' },
          { extensions: ['*'], name: 'All Files' },
        ],
        properties: ['openFile'],
        title: '导入列表',
      })
      .then(async (result) => {
        if (result.canceled || !result.filePaths[0]) return;
        await list.importListPart(result.filePaths[0], addMusicLocationType);
        if (list.actionError) return;
        setSelectedMusicIds([]);
        message.success('列表已导入');
      });
  };

  const importLocalAudioPaths = async (filePaths: string[]): Promise<void> => {
    if (appSetting && !appSetting['player.localAudio.enabled']) {
      message.warning('本地音频导入已关闭，请在“设置 > 本地解码”开启。');
      ui.setActiveRoute('setting');
      ui.requestQuickAction('configureLocalAudioImport');
      return;
    }

    const nativeExtensions =
      appSetting?.['player.localAudio.supportedExts'] ?? nativeLocalAudioExtensions;
    const externalExtensions = externalDecoderExtensions;

    const importResult = await list.importLocalAudioPathsToLocalList(
      filePaths,
      addMusicLocationType,
      {
        externalExtensions,
        nativeExtensions,
      },
    );
    if (!importResult) return;
    setSelectedMusicIds([]);
    if (!importResult.importedMusics.length) {
      const skippedText = importResult.skippedCount
        ? `，跳过 ${importResult.skippedCount} 个无效或不可用条目`
        : '';
      message.warning(
        importResult.candidateCount
          ? `已跳过 ${importResult.duplicateCount} 首重复本地音频${skippedText}`
          : '未发现支持的本地音频文件',
      );
      return;
    }

    const duplicateText = importResult.duplicateCount
      ? `，跳过重复 ${importResult.duplicateCount} 首`
      : '';
    const skippedText = importResult.skippedCount
      ? `，跳过 ${importResult.skippedCount} 个无效或不可用条目`
      : '';
    message.success(
      `已导入 ${importResult.importedMusics.length} 首本地音频${duplicateText}${skippedText}`,
    );
  };

  const handleImportLocalAudio = async (): Promise<void> => {
    const result = await appService.showSelectDialog(createLocalAudioImportDialogOptions());
    if (result.canceled || !result.filePaths.length) return;
    await importLocalAudioPaths(result.filePaths);
  };

  const handleImportLocalAudioFolder = async (): Promise<void> => {
    const result = await appService.showSelectDialog(createLocalAudioFolderImportDialogOptions());
    if (result.canceled || !result.filePaths.length) return;
    await importLocalAudioPaths(result.filePaths);
  };

  const handleExportListPart = (): void => {
    if (!list.selectedList) return;

    appService
      .showSaveDialog({
        defaultPath: `coral_list_part_${filterFileName(list.selectedList.name)}.lxmc`,
        title: '导出列表',
      })
      .then(async (result) => {
        if (result.canceled || !result.filePath) return;
        await list.exportSelectedListPart(result.filePath);
        if (!list.actionError) message.success('列表已导出');
      });
  };

  const handleMoveSelectedList = async (position: number): Promise<void> => {
    await list.moveSelectedListToPosition(position);
    if (!list.actionError) message.success('列表位置已更新');
  };

  const handleOpenLocalFile = (musicInfo: Coral.Music.MusicInfo): void => {
    if (musicInfo.source !== 'local') return;
    openDownloadTaskFile(musicInfo.meta.filePath);
  };

  const handleRefreshLocalMusic = async (musicInfo: Coral.Music.MusicInfo): Promise<void> => {
    if (musicInfo.source !== 'local') return;
    const nextMusicInfo = await localAudioService.enrichLocalMusicInfoWithMetadata(musicInfo);
    await list.updateSelectedMusicInfo(nextMusicInfo);
    if (!list.actionError) message.success('歌曲信息已更新');
  };

  const handleCopyMusicName = (musicInfo: Coral.Music.MusicInfo): void => {
    const musicName = `${musicInfo.name}${musicInfo.singer ? ` - ${musicInfo.singer}` : ''}`;

    navigator.clipboard
      .writeText(musicName)
      .then(() => {
        message.success('已复制歌曲名');
      })
      .catch((error) => {
        list.setActionError(error instanceof Error ? error.message : String(error));
      });
  };

  const handleSearchMusic = (musicInfo: Coral.Music.MusicInfo): void => {
    const searchText = `${musicInfo.name} ${musicInfo.singer}`.trim();

    if (musicSearchSources.includes(musicInfo.source as SupportedMusicSearchSource)) {
      search.setSource(musicInfo.source as SupportedMusicSearchSource);
    }
    search.setSearchType('music');
    search.setSearchText(searchText);
    ui.setActiveRoute('search');
    search.submitSearch();
  };

  const searchSourceToggleCandidates = async (text: string): Promise<void> => {
    const keyword = text.trim();
    if (!keyword) return;

    setIsLoadingSourceToggleCandidates(true);
    try {
      const onlineMusicService = await loadOnlineMusicService();
      const result = await onlineMusicService.searchMusic(keyword, 1, 'all', 20);
      setSourceToggleCandidates(result.list);
    } catch (error) {
      list.setActionError(error instanceof Error ? error.message : String(error));
      setSourceToggleCandidates([]);
    } finally {
      setIsLoadingSourceToggleCandidates(false);
    }
  };
  const handleOpenSourceToggle = (musicInfo: Coral.Music.MusicInfo): void => {
    const searchText = `${musicInfo.name} ${musicInfo.singer}`.trim();

    setSourceToggleMusic(musicInfo);
    setSourceToggleSearchText(searchText);
    setSourceToggleCandidates([]);
    setIsSourceToggleOpen(true);
    searchSourceToggleCandidates(searchText);
  };

  const handleDownload = (musicInfo: Coral.Music.MusicInfo): void => {
    const selectedCount = selectedMusics.length;
    if (selectedCount > 1 && selectedMusics.some((m) => m.id === musicInfo.id)) {
      setBatchDownloadModalMusics(selectedMusics);
    } else {
      setDownloadModalMusic(musicInfo);
    }
  };

  const handleOpenSourceDetail = (musicInfo: Coral.Music.MusicInfo): void => {
    musicDetailService.openMusicDetail(musicInfo);
  };

  const handleConfirmSourceToggle = (targetMusicInfo: Coral.Music.MusicInfo): void => {
    if (!sourceToggleMusic) return;

    const duplicateTarget = list.selectedMusics.some(
      (musicInfo) => musicInfo.id === targetMusicInfo.id,
    );
    const replaceMusic = async (removeDuplicateTarget: boolean): Promise<void> => {
      await list.replaceSelectedListMusic(
        sourceToggleMusic.id,
        targetMusicInfo,
        removeDuplicateTarget,
      );
      setIsSourceToggleOpen(false);
      setSourceToggleMusic(null);
      setSourceToggleCandidates([]);
    };

    if (!duplicateTarget) {
      replaceMusic(false);
      return;
    }

    Modal.confirm({
      content: '目标歌曲已在当前列表中存在，是否移除已有目标后完成切换？',
      okText: '切换',
      title: '切换来源',
      onOk: async () => {
        await replaceMusic(true);
      },
    });
  };

  useEffect(() => {
    if (!ui.consumeQuickAction('importLocalAudio')) return;
    handleImportLocalAudio();
  }, [ui.pendingQuickAction]);

  return (
    <Space orientation="vertical" size="middle" className="coral-wide coral-local-page">
      <section className="coral-local-toolbar">
        <Space wrap className="coral-local-toolbar-header">
          <Select
            value={selectedListId}
            placeholder="列表"
            className="coral-local-list-select"
            loading={list.isHydrating}
            options={list.userLists.map((userList) => ({
              label: userList.name,
              value: userList.id,
            }))}
            onChange={(listId) => {
              list.loadSelectedListMusics(listId);
            }}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={list.isLoadingMusics}
            onClick={loadSelectedList}
          >
            刷新歌曲
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            disabled={!sortedMusics.length}
            onClick={handlePlayAllMusics}
          >
            播放全部
          </Button>
          <Tag>歌曲 {list.selectedMusics.length}</Tag>
          <Tag>已选 {selectedMusics.length}</Tag>
          {normalizedFilterText ? <Tag color="blue">筛选 {filteredMusics.length}</Tag> : null}
        </Space>

        <Tabs
          defaultActiveKey="import"
          className="coral-local-tabs"
          items={[
            {
              key: 'import',
              label: '导入与导出',
              children: (
                <Space wrap className="coral-local-tab-controls">
                  <Button
                    icon={<FileAddOutlined />}
                    type="primary"
                    disabled={list.isHydrating}
                    loading={list.isImportingLocalAudio}
                    onClick={handleImportLocalAudio}
                  >
                    本地音频
                  </Button>
                  <Button
                    icon={<FolderAddOutlined />}
                    disabled={list.isHydrating}
                    loading={list.isImportingLocalAudio}
                    onClick={handleImportLocalAudioFolder}
                  >
                    导入文件夹
                  </Button>
                  <Button
                    icon={<ImportOutlined />}
                    loading={list.isMutatingList}
                    onClick={handleImportListPart}
                  >
                    导入列表
                  </Button>
                  <Button
                    icon={<ExportOutlined />}
                    disabled={!list.selectedList}
                    loading={list.isMutatingList}
                    onClick={handleExportListPart}
                  >
                    导出列表
                  </Button>
                </Space>
              ),
            },
            {
              key: 'batch',
              label: '批量操作',
              children: (
                <Space wrap className="coral-local-tab-controls">
                  <Button disabled={!filteredMusics.length} onClick={handleSelectAllMusics}>
                    {isAllSelected ? '取消全选' : '全选当前结果'}
                  </Button>
                  <Button
                    icon={<PlayCircleOutlined />}
                    disabled={!selectedMusics.length}
                    onClick={handlePlaySelectedMusics}
                  >
                    播放选中
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!selectedMusics.length}
                    loading={list.isMutatingMusic}
                    onClick={handleRemoveSelectedMusics}
                  >
                    移除选中
                  </Button>
                  <Select
                    allowClear
                    value={targetListId}
                    placeholder="目标列表"
                    className="coral-local-list-select"
                    options={targetListOptions}
                    disabled={!targetListOptions.length}
                    onChange={setTargetListId}
                  />
                  <Button
                    disabled={!targetListId || !selectedMusics.length}
                    loading={list.isAddingMusic}
                    onClick={handleCopySelectedMusics}
                  >
                    复制到列表
                  </Button>
                  <Button
                    disabled={!targetListId || !selectedMusics.length}
                    loading={list.isAddingMusic}
                    onClick={handleMoveSelectedMusics}
                  >
                    移动到列表
                  </Button>
                  <Button
                    icon={<SwapOutlined />}
                    disabled={!list.selectedMusics.length}
                    onClick={handleRemoveDuplicateMusics}
                  >
                    移除重复
                  </Button>
                  <Button
                    danger
                    icon={<ClearOutlined />}
                    disabled={!list.selectedMusics.length}
                    loading={list.isMutatingMusic}
                    onClick={handleClearMusics}
                  >
                    清空歌曲
                  </Button>
                </Space>
              ),
            },
            {
              key: 'sort',
              label: '排序',
              children: (
                <Space wrap className="coral-local-tab-controls">
                  <Select
                    value={sortField}
                    className="coral-list-action-input"
                    options={[
                      { label: '按名称', value: 'name' },
                      { label: '按歌手', value: 'singer' },
                      { label: '按专辑', value: 'album' },
                      { label: '按来源', value: 'source' },
                      { label: '按时长', value: 'interval' },
                    ]}
                    onChange={setSortField}
                  />
                  <Select
                    value={sortDirection}
                    className="coral-list-action-input"
                    options={[
                      { label: '升序', value: 'asc' },
                      { label: '降序', value: 'desc' },
                    ]}
                    onChange={setSortDirection}
                  />
                  <Button
                    icon={<SaveOutlined />}
                    disabled={!list.selectedMusics.length}
                    loading={list.isMutatingMusic}
                    onClick={handleSaveCurrentSort}
                  >
                    保存排序
                  </Button>
                  <Button
                    icon={<RetweetOutlined />}
                    disabled={list.selectedMusics.length < 2}
                    loading={list.isMutatingMusic}
                    onClick={handleShuffleSelectedList}
                  >
                    随机排序
                  </Button>
                  <Button
                    icon={<OrderedListOutlined />}
                    type={isDraggingMode ? 'primary' : 'default'}
                    disabled={!list.selectedMusics.length}
                    onClick={toggleDragMode}
                  >
                    {isDraggingMode ? '退出拖拽' : '拖拽排序'}
                  </Button>
                  <InputNumber
                    min={1}
                    max={Math.max(list.selectedMusics.length, 1)}
                    value={moveTargetPosition}
                    placeholder="目标序号"
                    className="coral-list-action-input"
                    disabled={!selectedMusics.length}
                    onChange={(value) => {
                      const nextValue = Number(value);
                      setMoveTargetPosition(Number.isFinite(nextValue) ? nextValue : null);
                    }}
                  />
                  <Button
                    disabled={!selectedMusics.length || moveTargetPosition == null}
                    loading={list.isMutatingMusic}
                    onClick={handleMoveSelectedMusicsToInputPosition}
                  >
                    移动到序号
                  </Button>
                  <Button
                    icon={<VerticalAlignTopOutlined />}
                    disabled={!selectedMusics.length}
                    loading={list.isMutatingMusic}
                    onClick={() => handleMoveSelectedMusicsToPosition(0)}
                  >
                    置顶
                  </Button>
                  <Button
                    icon={<VerticalAlignBottomOutlined />}
                    disabled={!selectedMusics.length}
                    loading={list.isMutatingMusic}
                    onClick={() => handleMoveSelectedMusicsToPosition(list.selectedMusics.length)}
                  >
                    置底
                  </Button>
                </Space>
              ),
            },
            {
              key: 'manage',
              label: '列表管理',
              children: (
                <Space wrap className="coral-local-tab-controls">
                  <Input
                    allowClear
                    value={createName}
                    placeholder="新列表"
                    className="coral-list-action-input"
                    onChange={(event) => setCreateName(event.target.value)}
                    onPressEnter={handleCreateList}
                  />
                  <Button
                    icon={<PlusOutlined />}
                    loading={list.isMutatingList}
                    onClick={handleCreateList}
                  >
                    新建
                  </Button>
                  <Input
                    allowClear
                    value={renameName}
                    disabled={!list.selectedList}
                    placeholder="列表名称"
                    className="coral-list-action-input"
                    onChange={(event) => setRenameName(event.target.value)}
                    onPressEnter={handleRenameList}
                  />
                  <Button
                    icon={<EditOutlined />}
                    disabled={!list.selectedList}
                    loading={list.isMutatingList}
                    onClick={handleRenameList}
                  >
                    重命名
                  </Button>
                  <Button
                    icon={<VerticalAlignTopOutlined />}
                    disabled={!list.selectedList || list.userLists[0]?.id === list.selectedListId}
                    loading={list.isMutatingList}
                    onClick={() => handleMoveSelectedList(0)}
                  >
                    列表置顶
                  </Button>
                  <Button
                    icon={<VerticalAlignBottomOutlined />}
                    disabled={!list.selectedList || lastUserListId === list.selectedListId}
                    loading={list.isMutatingList}
                    onClick={() => handleMoveSelectedList(list.userLists.length)}
                  >
                    列表置底
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!list.selectedList}
                    loading={list.isMutatingList}
                    onClick={handleRemoveList}
                  >
                    删除列表
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </section>

      <Input.Search
        allowClear
        className="coral-local-search"
        size="large"
        value={filterText}
        placeholder="搜索当前列表歌曲、歌手、专辑或来源"
        onChange={(event) => {
          setFilterText(event.target.value);
        }}
        onSearch={(value) => {
          setFilterText(value);
        }}
      />

      {list.hydrateError ? <Alert showIcon type="error" title={list.hydrateError} /> : null}
      {list.actionError ? <Alert showIcon type="error" title={list.actionError} /> : null}
      {list.musicError ? <Alert showIcon type="error" title={list.musicError} /> : null}

      {isDraggingMode && dragList.length ? (
        <Space orientation="vertical" size="small" className="coral-wide">
          <DraggableMusicList
            list={dragList}
            onReorder={handleDragReorder}
            renderItem={(item, index) => (
              <PlainListItem
                key={item.id}
                actions={[
                  <Button key="confirm" type="link" size="small" onClick={handleSaveDragOrder}>
                    保存顺序
                  </Button>,
                ]}
              >
                <PlainListMeta
                  title={
                    <Text ellipsis>
                      {index + 1}. {item.name}
                    </Text>
                  }
                  description={
                    <Text type="secondary" ellipsis>
                      {item.singer}
                    </Text>
                  }
                />
              </PlainListItem>
            )}
          />
        </Space>
      ) : (
        <>
          <OnlineMusicPreviewList
            list={sortedMusics}
            empty={
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={list.selectedList ? '当前列表暂无歌曲' : '还没有选择列表'}
              >
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<FileAddOutlined />}
                    loading={list.isImportingLocalAudio}
                    onClick={() => {
                      handleImportLocalAudio();
                    }}
                  >
                    导入本地音频
                  </Button>
                  <Button
                    icon={<FolderAddOutlined />}
                    loading={list.isImportingLocalAudio}
                    onClick={() => {
                      handleImportLocalAudioFolder();
                    }}
                  >
                    导入文件夹
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    loading={list.isMutatingList}
                    onClick={handleCreateLocalList}
                  >
                    新建列表
                  </Button>
                </Space>
              </Empty>
            }
            emptyText={list.selectedList ? '暂无歌曲' : '请选择列表'}
            actions={(item) => [
              <Checkbox
                key="select"
                checked={selectedMusicIdSet.has(item.id)}
                onChange={(event) => {
                  handleToggleMusicSelection(item.id, event.target.checked);
                }}
              />,
              <Tooltip key="play" title="播放">
                <Button
                  type="text"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    player.playFromQueue(item, list.selectedMusics, selectedListId ?? null);
                  }}
                />
              </Tooltip>,
              <Tooltip key="remove" title="移除">
                <Button
                  danger
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={list.isMutatingMusic}
                  onClick={() => {
                    list.removeMusicFromSelectedList(item.id);
                  }}
                />
              </Tooltip>,
              <Dropdown
                key="more"
                trigger={['click']}
                menu={{
                  items: [
                    ...(item.source === 'local'
                      ? [
                          {
                            icon: <FolderOpenOutlined />,
                            key: 'open-local-file',
                            label: '打开文件位置',
                          },
                          {
                            icon: <ReloadOutlined />,
                            key: 'refresh-local-music',
                            label: '重新读取歌曲信息',
                          },
                        ]
                      : [
                          {
                            icon: <DownloadOutlined />,
                            key: 'download',
                            label: '下载',
                          },
                          {
                            icon: <SwapOutlined />,
                            key: 'toggle-source',
                            label: '切换来源',
                          },
                          {
                            icon: <SearchOutlined />,
                            key: 'source-detail',
                            label: '查看详情',
                          },
                        ]),
                    {
                      icon: <CopyOutlined />,
                      key: 'copy',
                      label: '复制歌曲名',
                    },
                    {
                      icon: <SearchOutlined />,
                      key: 'search',
                      label: '搜索歌曲',
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'copy') {
                      handleCopyMusicName(item);
                    } else if (key === 'search') {
                      handleSearchMusic(item);
                    } else if (key === 'toggle-source') {
                      handleOpenSourceToggle(item);
                    } else if (key === 'download') {
                      handleDownload(item);
                    } else if (key === 'source-detail') {
                      handleOpenSourceDetail(item);
                    } else if (key === 'open-local-file') {
                      handleOpenLocalFile(item);
                    } else if (key === 'refresh-local-music') {
                      handleRefreshLocalMusic(item);
                    }
                  },
                }}
              >
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>,
            ]}
          />

          <Modal
            open={isSourceToggleOpen}
            title={sourceToggleMusic ? `切换来源：${sourceToggleMusic.name}` : '切换来源'}
            width={760}
            footer={null}
            onCancel={() => {
              setIsSourceToggleOpen(false);
            }}
          >
            <Space orientation="vertical" size="middle" className="coral-wide">
              <Input.Search
                allowClear
                value={sourceToggleSearchText}
                placeholder="搜索候选歌曲"
                loading={isLoadingSourceToggleCandidates}
                onChange={(event) => {
                  setSourceToggleSearchText(event.target.value);
                }}
                onSearch={(value) => {
                  setSourceToggleSearchText(value);
                  searchSourceToggleCandidates(value);
                }}
              />
              <OnlineMusicPreviewList
                list={sourceToggleCandidates}
                emptyText={isLoadingSourceToggleCandidates ? '搜索中' : '暂无候选歌曲'}
                actions={(item) => [
                  <Button
                    key="toggle"
                    type="primary"
                    size="small"
                    icon={<SwapOutlined />}
                    loading={list.isAddingMusic}
                    disabled={sourceToggleMusic?.id === item.id}
                    onClick={() => {
                      handleConfirmSourceToggle(item);
                    }}
                  >
                    切换
                  </Button>,
                ]}
              />
            </Space>
          </Modal>

          <Modal
            open={isDuplicateReviewOpen}
            title="重复歌曲"
            width={720}
            okText="移除重复副本"
            okButtonProps={{
              danger: true,
              disabled: !duplicateReviewItems.some((item) => !item.isRetained),
              loading: list.isMutatingMusic,
            }}
            cancelText="关闭"
            onOk={handleRemoveDuplicateCopies}
            onCancel={() => {
              setIsDuplicateReviewOpen(false);
            }}
          >
            <PlainList
              items={duplicateReviewItems}
              renderItem={(item) => (
                <PlainListItem
                  key={item.musicInfo.id}
                  actions={[
                    item.isRetained ? (
                      <Tag key="keep" color="green">
                        保留
                      </Tag>
                    ) : (
                      <Button
                        key="remove"
                        danger
                        type="text"
                        size="small"
                        loading={list.isMutatingMusic}
                        onClick={() => {
                          handleRemoveDuplicateIds([item.musicInfo.id]);
                        }}
                      >
                        移除
                      </Button>
                    ),
                  ]}
                >
                  <PlainListMeta
                    title={`${item.index + 1}. ${item.musicInfo.name} - ${item.musicInfo.singer}`}
                    description={
                      <Space wrap>
                        <Tag>第 {item.groupIndex + 1} 组</Tag>
                        <Tag>{item.duplicateName}</Tag>
                        <Tag>{item.musicInfo.source}</Tag>
                        {item.musicInfo.meta.albumName ? (
                          <span>{item.musicInfo.meta.albumName}</span>
                        ) : null}
                      </Space>
                    }
                  />
                </PlainListItem>
              )}
            />
          </Modal>
          <BatchDownloadModal
            musics={batchDownloadModalMusics}
            onClose={() => {
              setBatchDownloadModalMusics([]);
            }}
          />
          <DownloadQualityModal
            musicInfo={downloadModalMusic}
            onClose={() => {
              setDownloadModalMusic(null);
            }}
          />
        </>
      )}
    </Space>
  );
});
