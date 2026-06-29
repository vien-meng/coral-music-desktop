type ElectronClipboardGlobal = typeof globalThis & {
  require?: (moduleName: 'electron') => {
    clipboard: {
      writeText: (text: string) => void;
    };
  };
};

export const writeClipboardText = async (text: string): Promise<void> => {
  if (globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(text);
    return;
  }

  const electronRequire = (globalThis as ElectronClipboardGlobal).require;
  if (!electronRequire) return;
  electronRequire('electron').clipboard.writeText(text);
};

export const clipboardService = {
  writeText: writeClipboardText,
};
