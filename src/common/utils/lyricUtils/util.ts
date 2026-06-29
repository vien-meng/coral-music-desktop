const encodeNames = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#039;': "'",
} as const;

export const decodeName = (str: string | null = '') =>
  str?.replace(
    /(?:&amp;|&lt;|&gt;|&quot;|&apos;|&#039;|&nbsp;)/gm,
    (s: string) => encodeNames[s as keyof typeof encodeNames],
  ) ?? '';
