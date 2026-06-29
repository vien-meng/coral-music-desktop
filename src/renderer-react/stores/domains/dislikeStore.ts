import { makeAutoObservable, observable } from 'mobx';
import { SPLIT_CHAR } from '@common/constants';
import { dislikeService } from '../../services/dislikeService';

const createDislikeInfo = (): LX.Dislike.DislikeInfo => ({
  musicNames: new Set(),
  names: new Set(),
  rules: '',
  singerNames: new Set(),
});

const normalizeRulePart = (value: string): string =>
  value
    .replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS)
    .toLocaleLowerCase()
    .trim();

export class DislikeStore {
  dislikeInfo: LX.Dislike.DislikeInfo = createDislikeInfo();

  hydrateError: string | null = null;

  isHydrated = false;

  isHydrating = false;

  ruleCount = 0;

  private readonly disposers: Array<() => void> = [];

  constructor() {
    makeAutoObservable<this, 'disposers'>(
      this,
      {
        dislikeInfo: observable.ref,
        disposers: false,
      },
      { autoBind: true },
    );
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return;

    this.isHydrating = true;
    this.hydrateError = null;

    try {
      const dislikeInfo = await dislikeService.getDislikeMusicInfos();
      if (dislikeInfo) this.applyDislikeInfo(dislikeInfo);
      this.startRealtimeSync();
      this.isHydrated = true;
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error);
    } finally {
      this.isHydrating = false;
    }
  }

  async addDislikeMusicInfos(infos: LX.Dislike.DislikeMusicInfo[]): Promise<void> {
    await dislikeService.addDislikeMusicInfos(infos);
    this.addDislikeMusicInfosLocal(infos);
  }

  async clearDislikeMusicInfos(): Promise<void> {
    await dislikeService.clearDislikeMusicInfos();
    this.overwriteDislikeMusicInfosLocal('');
  }

  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose();
  }

  hasDislike(info: LX.Music.MusicInfo | LX.Download.ListItem): boolean {
    const musicInfo = 'progress' in info ? info.metadata.musicInfo : info;
    const name = normalizeRulePart(musicInfo.name ?? '');
    const singer = normalizeRulePart(musicInfo.singer ?? '');

    return (
      this.dislikeInfo.musicNames.has(name) ||
      this.dislikeInfo.singerNames.has(singer) ||
      this.dislikeInfo.names.has(`${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
    );
  }

  async overwriteDislikeMusicInfos(rules: LX.Dislike.DislikeRules): Promise<void> {
    await dislikeService.overwriteDislikeMusicInfos(rules);
    this.overwriteDislikeMusicInfosLocal(rules);
  }

  private addDislikeMusicInfosLocal(infos: LX.Dislike.DislikeMusicInfo[]): void {
    const nextRules = [
      this.dislikeInfo.rules,
      ...infos.map((info) => `${info.name ?? ''}${SPLIT_CHAR.DISLIKE_NAME}${info.singer ?? ''}`),
    ]
      .filter(Boolean)
      .join('\n');

    this.overwriteDislikeMusicInfosLocal(nextRules);
  }

  private applyDislikeInfo(dislikeInfo: LX.Dislike.DislikeInfo): void {
    this.dislikeInfo = {
      musicNames: new Set(dislikeInfo.musicNames),
      names: new Set(dislikeInfo.names),
      rules: dislikeInfo.rules,
      singerNames: new Set(dislikeInfo.singerNames),
    };
    this.syncRuleCount();
  }

  private overwriteDislikeMusicInfosLocal(rules: LX.Dislike.DislikeRules): void {
    const names = new Set<string>();
    const musicNames = new Set<string>();
    const singerNames = new Set<string>();
    const normalizedRules: string[] = [];

    for (const item of rules.split('\n')) {
      if (!item) continue;

      const [rawName, rawSinger] = item.split(SPLIT_CHAR.DISLIKE_NAME);
      const name = rawName ? normalizeRulePart(rawName) : '';
      const singer = rawSinger ? normalizeRulePart(rawSinger) : '';

      if (name && singer) {
        const rule = `${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`;
        names.add(rule);
        normalizedRules.push(rule);
      } else if (name) {
        musicNames.add(name);
        normalizedRules.push(name);
      } else if (singer) {
        singerNames.add(singer);
        normalizedRules.push(`${SPLIT_CHAR.DISLIKE_NAME}${singer}`);
      }
    }

    this.dislikeInfo = {
      musicNames,
      names,
      rules: Array.from(new Set(normalizedRules)).join('\n'),
      singerNames,
    };
    this.syncRuleCount();
  }

  private startRealtimeSync(): void {
    if (this.disposers.length) return;

    this.disposers.push(
      dislikeService.onAddDislikeMusicInfos((infos) => {
        this.addDislikeMusicInfosLocal(infos);
      }),
      dislikeService.onOverwriteDislikeMusicInfos((rules) => {
        this.overwriteDislikeMusicInfosLocal(rules);
      }),
      dislikeService.onClearDislikeMusicInfos(() => {
        this.overwriteDislikeMusicInfosLocal('');
      }),
    );
  }

  private syncRuleCount(): void {
    this.ruleCount =
      this.dislikeInfo.musicNames.size +
      this.dislikeInfo.singerNames.size +
      this.dislikeInfo.names.size;
  }
}
