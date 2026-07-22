// import Event from './event/event'

import { connectServer, disconnectServer } from './client';
import { startServer, stopServer } from './server';

// import eventNames from './event/name'
export {
  startServer,
  stopServer,
  getStatus as getServerStatus,
  generateCode,
  getDevices as getServerDevices,
  removeDevice as removeServerDevice,
} from './server';

export { connectServer, disconnectServer, getStatus as getClientStatus } from './client';

export default () => {
  const stopConfiguredSync = async () => {
    await Promise.allSettled([stopServer(), disconnectServer()]);
  };

  const startConfiguredSync = async () => {
    if (!global.coral.appSetting['sync.enable']) {
      await stopConfiguredSync();
      return;
    }

    if (global.coral.appSetting['sync.mode'] == 'server') {
      await disconnectServer();
      await startServer(parseInt(global.coral.appSetting['sync.server.port'], 10));
      return;
    }

    await stopServer();
    const host = global.coral.appSetting['sync.client.host'].trim();
    if (host) await connectServer(host);
  };

  global.coral.event_app.on('app_inited', () => {
    startConfiguredSync().catch((error) => console.error('sync startup failed:', error));
  });
  global.coral.event_app.on('updated_config', (keys) => {
    if (!keys.some((key) => key.startsWith('sync.'))) return;
    if (keys.includes('sync.enable') || !global.coral.appSetting['sync.enable']) {
      startConfiguredSync().catch((error) => console.error('sync reconfigure failed:', error));
    }
  });
  global.coral.event_app.on('main_window_close', () => {
    stopConfiguredSync().catch((error) => console.error('sync shutdown failed:', error));
  });
};
