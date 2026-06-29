import { makeAutoObservable, runInAction } from 'mobx';
import { playerService } from './playerService';

const formatTime = (time: number): string => {
  let h: number | string = Math.trunc(time / 3600);
  h = h ? `${h.toString()}:` : '';
  time %= 3600;
  const m = Math.trunc(time / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.trunc(time % 60)
    .toString()
    .padStart(2, '0');
  return `${h}${m}:${s}`;
};

class TimeoutStopStore {
  remainingSeconds = -1;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  private endTime = 0;

  private isRunning = false;

  constructor() {
    makeAutoObservable(this);
  }

  get timeLabel(): string {
    return this.remainingSeconds > 0 ? formatTime(this.remainingSeconds) : '';
  }

  start(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      this.clear();
      return;
    }
    this.clear();
    runInAction(() => {
      this.remainingSeconds = seconds;
    });
    this.isRunning = true;
    this.endTime = performance.now() + seconds * 1000;

    this.intervalId = setInterval(() => {
      runInAction(() => {
        this.remainingSeconds = Math.max(0, Math.round((this.endTime - performance.now()) / 1000));
      });
    }, 1000);

    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      runInAction(() => {
        this.remainingSeconds = -1;
      });
      this.clear();
      this.exit();
    }, seconds * 1000);
  }

  clear(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (!this.isRunning) return;
    runInAction(() => {
      this.remainingSeconds = -1;
    });
    this.isRunning = false;
  }

  private exit(): void {
    playerService.togglePlay();
  }
}

const timeoutStopStore = new TimeoutStopStore();

export const startTimeoutStop = (seconds: number): void => {
  timeoutStopStore.start(seconds);
};

export const stopTimeoutStop = (): void => {
  timeoutStopStore.clear();
};

export const getTimeoutLabel = (): string => timeoutStopStore.timeLabel;

export const timeoutStopService = {
  get store() {
    return timeoutStopStore;
  },
  getTimeoutLabel,
  start: startTimeoutStop,
  stop: stopTimeoutStop,
};
