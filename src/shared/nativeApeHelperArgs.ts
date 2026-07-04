export interface NativeApeHelperStreamArgsInput {
  endMs?: number | null;
  inputPath: string;
  startMs?: number | null;
}

const formatMilliseconds = (valueMs?: number | null): string | null => {
  if (typeof valueMs !== 'number' || !Number.isFinite(valueMs) || valueMs <= 0) return null;
  return String(Math.round(valueMs));
};

export const createNativeApeHelperStreamArgs = ({
  endMs,
  inputPath,
  startMs,
}: NativeApeHelperStreamArgsInput): string[] => [
  '--input',
  inputPath,
  '--format',
  'wav',
  ...(formatMilliseconds(startMs) ? ['--start-ms', formatMilliseconds(startMs) as string] : []),
  ...(formatMilliseconds(endMs) ? ['--end-ms', formatMilliseconds(endMs) as string] : []),
];
