export interface ExternalDecoderStreamArgsInput {
  endMs?: number | null;
  inputFormat?: string | null;
  inputPath: string;
  startMs?: number | null;
}

const formatSeconds = (valueMs?: number | null): string | null => {
  if (typeof valueMs !== 'number' || !Number.isFinite(valueMs) || valueMs <= 0) return null;
  return (valueMs / 1000).toFixed(3);
};

export const createExternalDecoderStreamArgs = ({
  endMs,
  inputFormat,
  inputPath,
  startMs,
}: ExternalDecoderStreamArgsInput): string[] => {
  const startSeconds = formatSeconds(startMs);
  const durationMs =
    typeof endMs === 'number' && Number.isFinite(endMs) && endMs > (startMs ?? 0)
      ? endMs - (startMs ?? 0)
      : null;
  const durationSeconds = formatSeconds(durationMs);

  return [
    '-hide_banner',
    '-loglevel',
    'error',
    ...(startSeconds ? ['-ss', startSeconds] : []),
    ...(inputFormat?.trim() ? ['-f', inputFormat.trim()] : []),
    '-i',
    inputPath,
    ...(durationSeconds ? ['-t', durationSeconds] : []),
    '-vn',
    '-acodec',
    'pcm_s16le',
    '-ar',
    '44100',
    '-ac',
    '2',
    '-f',
    'wav',
    'pipe:1',
  ];
};
