import { mainHandle } from '@common/mainIpc';
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames';
import { startServer, stopServer, getStatus } from '@main/modules/openApi';

export default () => {
  mainHandle<Coral.OpenAPI.Actions, any>(
    WIN_MAIN_RENDERER_EVENT_NAME.open_api_action,
    async ({ params: data }) => {
      switch (data.action) {
        case 'enable': {
          if (!data.data.enable) return await stopServer();
          const port = parseInt(data.data.port, 10);
          if (!Number.isInteger(port) || port < 1 || port > 65535) {
            throw new Error('端口必须在 1 到 65535 之间');
          }
          await stopServer();
          return await startServer(port, data.data.bindLan);
        }
        case 'status':
          return getStatus();
      }
    },
  );
};
