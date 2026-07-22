import { startServer, stopServer } from './index';

const startConfiguredServer = async () => {
  if (!global.coral.appSetting['openAPI.enable']) {
    await stopServer();
    return;
  }

  const port = parseInt(global.coral.appSetting['openAPI.port'], 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return;
  await startServer(port, global.coral.appSetting['openAPI.bindLan']);
};

export default () => {
  global.coral.event_app.on('app_inited', () => {
    startConfiguredServer().catch((error) => console.error('OpenAPI startup failed:', error));
  });
  global.coral.event_app.on('updated_config', (keys) => {
    if (!keys.some((key) => key.startsWith('openAPI.'))) return;
    startConfiguredServer().catch((error) => console.error('OpenAPI reconfigure failed:', error));
  });
  global.coral.event_app.on('main_window_close', () => {
    stopServer().catch((error) => console.error('OpenAPI shutdown failed:', error));
  });
};
