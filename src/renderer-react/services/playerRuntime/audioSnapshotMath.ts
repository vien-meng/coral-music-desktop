export interface AudioSnapshotTimeInput {
  currentTime: number;
  externalStreamDuration?: number | null;
  externalStreamProgressOffset?: number;
  isEnded?: boolean;
  nativeDuration: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const calculateAudioSnapshotTimes = ({
  currentTime,
  externalStreamDuration,
  externalStreamProgressOffset = 0,
  isEnded = false,
  nativeDuration,
}: AudioSnapshotTimeInput): { duration: number; progress: number } => {
  const duration = externalStreamDuration ?? (Number.isFinite(nativeDuration) ? nativeDuration : 0);
  const rawProgress =
    Number.isFinite(currentTime) && currentTime >= 0
      ? currentTime + externalStreamProgressOffset
      : 0;
  const progress = isEnded ? duration : clamp(rawProgress, 0, duration || rawProgress);
  return { duration, progress };
};

export const normalizeExternalStreamSeekSeconds = (
  seconds: number,
  externalStreamDuration?: number | null,
): number => {
  const target = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  if (
    typeof externalStreamDuration === 'number' &&
    Number.isFinite(externalStreamDuration) &&
    externalStreamDuration > 0
  ) {
    return clamp(target, 0, externalStreamDuration);
  }
  return target;
};
