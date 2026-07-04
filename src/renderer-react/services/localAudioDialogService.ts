export interface LocalAudioDialogOptions {
  filters: Array<{ extensions: string[]; name: string }>;
  properties: Array<'multiSelections' | 'openDirectory' | 'openFile'>;
  title: string;
}

export const createLocalAudioImportDialogOptions = (
  platform: NodeJS.Platform = process.platform,
): LocalAudioDialogOptions => ({
  filters: [{ extensions: ['*'], name: 'All Files' }],
  // Windows shows a directory-only picker when openFile and openDirectory are
  // combined, so folder import uses a separate directory-only dialog there.
  properties:
    platform === 'win32'
      ? ['openFile', 'multiSelections']
      : ['openFile', 'openDirectory', 'multiSelections'],
  title: '导入本地音频',
});

export const createLocalAudioFolderImportDialogOptions = (): LocalAudioDialogOptions => ({
  filters: [{ extensions: ['*'], name: 'All Files' }],
  properties: ['openDirectory', 'multiSelections'],
  title: '导入本地音频文件夹',
});
