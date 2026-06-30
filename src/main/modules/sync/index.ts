// import Event from './event/event'

import { disconnectServer } from './client';
import { stopServer } from './server';

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
  global.coral.event_app.on('main_window_close', () => {
    if (global.coral.appSetting['sync.mode'] == 'server') {
      stopServer();
    } else {
      disconnectServer();
    }
  });
};
