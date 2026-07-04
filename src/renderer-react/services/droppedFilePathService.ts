type FileWithPath = File & { path?: string };

interface ElectronWebUtils {
  getPathForFile?: (file: File) => string | null;
}

interface ElectronRequireGlobal {
  require?: (moduleName: 'electron') => { webUtils?: ElectronWebUtils };
}

const getElectronWebUtils = (): ElectronWebUtils | null => {
  try {
    return (
      (globalThis as typeof globalThis & ElectronRequireGlobal).require?.('electron').webUtils ??
      null
    );
  } catch {
    return null;
  }
};

export const getDroppedFilePath = (
  file: File,
  webUtils: ElectronWebUtils | null = getElectronWebUtils(),
): string => {
  const filePath = (file as FileWithPath).path?.trim();
  if (filePath) return filePath;
  return webUtils?.getPathForFile?.(file)?.trim() ?? '';
};

export const getDroppedFilePathsFromEntries = (
  files: Iterable<File>,
  items: Iterable<DataTransferItem> = [],
  webUtils: ElectronWebUtils | null = getElectronWebUtils(),
): string[] => {
  const droppedFiles: File[] = Array.from(files);
  for (const item of Array.from(items)) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file) droppedFiles.push(file);
  }

  return Array.from(
    new Set(droppedFiles.map((file) => getDroppedFilePath(file, webUtils)).filter(Boolean)),
  );
};

export const getDroppedFilePaths = (dataTransfer: DataTransfer): string[] =>
  getDroppedFilePathsFromEntries(dataTransfer.files, dataTransfer.items ?? []);
