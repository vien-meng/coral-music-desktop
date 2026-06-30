import { makeAutoObservable, observable } from 'mobx';
import { listService } from '../../services/listService';
import {
  localAudioService,
  type LocalAudioImportOptions,
  type LocalAudioImportResult,
} from '../../services/localAudioService';

export class ListStore {
  actionError: string | null = null;

  isAddingMusic = false;

  hydrateError: string | null = null;

  isHydrated = false;

  isHydrating = false;

  isImportingLocalAudio = false;

  isLoadingMusics = false;

  isMutatingMusic = false;

  isMutatingList = false;

  musicError: string | null = null;

  selectedListId: string | null = null;

  selectedMusics: Coral.Music.MusicInfo[] = [];

  userLists: Coral.List.UserListInfo[] = [];

  constructor() {
    makeAutoObservable(
      this,
      {
        selectedMusics: observable.shallow,
        userLists: observable.shallow,
      },
      { autoBind: true },
    );
  }

  get userListCount(): number {
    return this.userLists.length;
  }

  get selectedList(): Coral.List.UserListInfo | null {
    return this.userLists.find((list) => list.id === this.selectedListId) ?? null;
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return;

    this.isHydrating = true;
    this.hydrateError = null;

    try {
      this.userLists = await listService.getUserLists();
      this.selectedListId = this.userLists[0]?.id ?? null;
      this.isHydrated = true;
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isHydrating = false;
    }
  }

  setSelectedListId(listId: string | null): void {
    this.selectedListId = listId;
  }

  async loadSelectedListMusics(listId = this.selectedListId): Promise<void> {
    if (!listId) {
      this.selectedMusics = [];
      return;
    }

    this.isLoadingMusics = true;
    this.musicError = null;
    this.selectedListId = listId;

    try {
      this.selectedMusics = await listService.getListMusics(listId);
    } catch (error) {
      this.musicError = error instanceof Error ? error.message : String(error);
      this.selectedMusics = [];
    } finally {
      this.isLoadingMusics = false;
    }
  }

  setActionError(error: string | null): void {
    this.actionError = error;
  }

  async addMusicsToList(
    listId: string,
    musicInfos: Coral.Music.MusicInfo[],
    addMusicLocationType: Coral.AddMusicLocationType,
  ): Promise<void> {
    this.isAddingMusic = true;
    this.actionError = null;

    try {
      await listService.addListMusics(listId, musicInfos, addMusicLocationType);
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isAddingMusic = false;
    }
  }

  async copyMusicsToList(
    targetListId: string,
    musicInfos: Coral.Music.MusicInfo[],
    addMusicLocationType: Coral.AddMusicLocationType,
  ): Promise<void> {
    if (!targetListId || !musicInfos.length) return;

    this.isAddingMusic = true;
    this.actionError = null;

    try {
      await listService.addListMusics(targetListId, musicInfos, addMusicLocationType);
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isAddingMusic = false;
    }
  }

  async moveMusicsToList(
    targetListId: string,
    musicInfos: Coral.Music.MusicInfo[],
    addMusicLocationType: Coral.AddMusicLocationType,
  ): Promise<void> {
    const sourceListId = this.selectedListId;
    if (!sourceListId || !targetListId || sourceListId === targetListId || !musicInfos.length)
      return;

    this.isAddingMusic = true;
    this.actionError = null;

    try {
      await listService.moveListMusics(
        sourceListId,
        targetListId,
        musicInfos,
        addMusicLocationType,
      );
      const movedIdSet = new Set(musicInfos.map((musicInfo) => musicInfo.id));
      this.selectedMusics = this.selectedMusics.filter(
        (musicInfo) => !movedIdSet.has(musicInfo.id),
      );
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isAddingMusic = false;
    }
  }

  async exportSelectedListPart(filePath: string): Promise<void> {
    const selectedList = this.selectedList;
    if (!selectedList || !filePath) return;

    this.isMutatingList = true;
    this.actionError = null;

    try {
      await listService.exportListPart(filePath, selectedList, this.selectedMusics);
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingList = false;
    }
  }

  async importListPart(
    filePath: string,
    addMusicLocationType: Coral.AddMusicLocationType,
  ): Promise<void> {
    if (!filePath) return;

    this.isMutatingList = true;
    this.actionError = null;

    try {
      const listInfo = await listService.importListPartAsUserList(
        filePath,
        this.userLists,
        this.userLists.length,
        addMusicLocationType,
      );
      if (!listInfo) return;

      this.userLists = [...this.userLists, listInfo];
      this.selectedListId = listInfo.id;
      this.selectedMusics = await listService.getListMusics(listInfo.id);
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingList = false;
    }
  }

  async importLocalAudioPaths(
    inputPaths: string[],
    addMusicLocationType: Coral.AddMusicLocationType,
    options: LocalAudioImportOptions = {},
  ): Promise<LocalAudioImportResult | null> {
    const listId = this.selectedListId;
    if (!listId || !inputPaths.length) return null;

    this.isImportingLocalAudio = true;
    this.actionError = null;

    try {
      const musicInfos = await localAudioService.createLocalMusicInfosFromPaths(
        inputPaths,
        options,
      );
      const existingIds = new Set(this.selectedMusics.map((musicInfo) => musicInfo.id));
      const importedMusics = musicInfos.filter((musicInfo) => !existingIds.has(musicInfo.id));
      if (importedMusics.length) {
        await listService.addListMusics(listId, importedMusics, addMusicLocationType);
        this.selectedMusics =
          addMusicLocationType === 'top'
            ? [...importedMusics, ...this.selectedMusics]
            : [...this.selectedMusics, ...importedMusics];
      }

      return {
        candidateCount: musicInfos.length,
        duplicateCount: musicInfos.length - importedMusics.length,
        importedMusics,
        skippedCount: 0,
      };
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
      return null;
    } finally {
      this.isImportingLocalAudio = false;
    }
  }

  async moveSelectedMusicsToPosition(
    position: number,
    musicInfos: Coral.Music.MusicInfo[],
  ): Promise<void> {
    const listId = this.selectedListId;
    if (!listId || !musicInfos.length) return;

    const ids = musicInfos.map((musicInfo) => musicInfo.id);
    const movedIdSet = new Set(ids);
    const remainingMusics = this.selectedMusics.filter(
      (musicInfo) => !movedIdSet.has(musicInfo.id),
    );
    const targetPosition = Math.max(0, Math.min(position, remainingMusics.length));

    this.isMutatingMusic = true;
    this.actionError = null;

    try {
      await listService.updateListMusicsPosition(listId, targetPosition, ids);
      this.selectedMusics = [
        ...remainingMusics.slice(0, targetPosition),
        ...musicInfos,
        ...remainingMusics.slice(targetPosition),
      ];
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingMusic = false;
    }
  }

  async replaceSelectedMusicOrder(musicInfos: Coral.Music.MusicInfo[]): Promise<void> {
    const listId = this.selectedListId;
    if (!listId || musicInfos.length !== this.selectedMusics.length) return;

    const ids = musicInfos.map((musicInfo) => musicInfo.id);
    if (ids.every((id, index) => id === this.selectedMusics[index]?.id)) return;

    this.isMutatingMusic = true;
    this.actionError = null;

    try {
      await listService.updateListMusicsPosition(listId, 0, ids);
      this.selectedMusics = musicInfos;
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingMusic = false;
    }
  }

  async replaceSelectedListMusic(
    oldMusicId: string,
    newMusicInfo: Coral.Music.MusicInfo,
    removeDuplicateTarget: boolean,
  ): Promise<void> {
    const listId = this.selectedListId;
    if (!listId || !oldMusicId || !newMusicInfo.id || oldMusicId === newMusicInfo.id) return;

    const oldIndex = this.selectedMusics.findIndex((musicInfo) => musicInfo.id === oldMusicId);
    if (oldIndex < 0) return;

    const duplicateIndex = this.selectedMusics.findIndex(
      (musicInfo) => musicInfo.id === newMusicInfo.id,
    );
    const removeIds = [oldMusicId];
    if (duplicateIndex > -1 && removeDuplicateTarget) removeIds.push(newMusicInfo.id);
    if (duplicateIndex > -1 && !removeDuplicateTarget) return;

    const removeIdSet = new Set(removeIds);
    const remainingMusics = this.selectedMusics.filter(
      (musicInfo) => !removeIdSet.has(musicInfo.id),
    );
    const targetPosition =
      duplicateIndex > -1 && duplicateIndex < oldIndex ? oldIndex - 1 : oldIndex;

    this.isAddingMusic = true;
    this.actionError = null;

    try {
      await listService.removeListMusics(listId, removeIds);
      await listService.addListMusics(listId, [newMusicInfo], 'bottom');
      await listService.updateListMusicsPosition(listId, targetPosition, [newMusicInfo.id]);
      this.selectedMusics = [
        ...remainingMusics.slice(0, targetPosition),
        newMusicInfo,
        ...remainingMusics.slice(targetPosition),
      ];
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isAddingMusic = false;
    }
  }

  async createUserList(name: string): Promise<void> {
    const listName = name.trim();
    if (!listName) return;

    this.isMutatingList = true;
    this.actionError = null;

    const listInfo: Coral.List.UserListInfo = {
      id: `userlist_${Date.now()}`,
      locationUpdateTime: null,
      name: listName,
    };

    try {
      await listService.createUserLists(this.userLists.length, [listInfo]);
      this.userLists = [...this.userLists, listInfo];
      this.selectedListId = listInfo.id;
      this.selectedMusics = [];
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingList = false;
    }
  }

  async renameSelectedList(name: string): Promise<void> {
    const listName = name.trim();
    if (!this.selectedList || !listName) return;

    this.isMutatingList = true;
    this.actionError = null;

    const updatedList = {
      ...this.selectedList,
      name: listName,
    };

    try {
      await listService.updateUserLists([updatedList]);
      this.userLists = this.userLists.map((list) =>
        list.id === updatedList.id ? updatedList : list,
      );
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingList = false;
    }
  }

  async removeSelectedList(): Promise<void> {
    const listId = this.selectedListId;
    if (!listId) return;

    this.isMutatingList = true;
    this.actionError = null;

    try {
      await listService.removeUserLists([listId]);
      this.userLists = this.userLists.filter((list) => list.id !== listId);
      this.selectedListId = this.userLists[0]?.id ?? null;
      this.selectedMusics = [];
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingList = false;
    }
  }

  async moveSelectedListToPosition(position: number): Promise<void> {
    const listId = this.selectedListId;
    if (!listId) return;

    const targetList = this.userLists.find((userList) => userList.id === listId);
    if (!targetList) return;

    const remainingLists = this.userLists.filter((userList) => userList.id !== listId);
    const targetPosition = Math.max(0, Math.min(position, remainingLists.length));

    this.isMutatingList = true;
    this.actionError = null;

    try {
      await listService.updateUserListsPosition(targetPosition, [listId]);
      this.userLists = [
        ...remainingLists.slice(0, targetPosition),
        {
          ...targetList,
          locationUpdateTime: Date.now(),
        },
        ...remainingLists.slice(targetPosition),
      ];
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingList = false;
    }
  }

  async removeMusicFromSelectedList(musicId: string): Promise<void> {
    await this.removeMusicsFromSelectedList([musicId]);
  }

  async removeMusicsFromSelectedList(musicIds: string[]): Promise<void> {
    const listId = this.selectedListId;
    const ids = Array.from(new Set(musicIds)).filter(Boolean);
    if (!listId || !ids.length) return;

    this.isMutatingMusic = true;
    this.actionError = null;

    try {
      await listService.removeListMusics(listId, ids);
      const removeIdSet = new Set(ids);
      this.selectedMusics = this.selectedMusics.filter(
        (musicInfo) => !removeIdSet.has(musicInfo.id),
      );
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingMusic = false;
    }
  }

  async clearSelectedListMusics(): Promise<void> {
    const listId = this.selectedListId;
    if (!listId) return;

    this.isMutatingMusic = true;
    this.actionError = null;

    try {
      await listService.clearListMusics([listId]);
      this.selectedMusics = [];
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isMutatingMusic = false;
    }
  }
}
