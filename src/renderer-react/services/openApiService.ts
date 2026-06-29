import { ipcChannels } from '@shared/ipc/contracts';
import { ipcClient } from './ipc/client';
import { isElectronRenderer } from './appService';

export const sendOpenApiAction = async (
  action: LX.OpenAPI.Actions,
): Promise<LX.OpenAPI.Status | null> => {
  if (!isElectronRenderer()) return null;
  return await ipcClient.invoke(ipcChannels.winMain.openApiAction, action);
};

export const openApiService = {
  sendOpenApiAction,
};
