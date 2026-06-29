import { SYNC_CLOSE_CODE } from '@common/constants_sync';
import { registerListActionEvent } from '../../../../listEvent';
import { getUserSpace } from '../../../user';

// let socket: LX.Sync.Server.Socket | null
let unregisterLocalListAction: (() => void) | null;

const sendListAction = async (
  wss: LX.Sync.Server.SocketServer,
  action: LX.Sync.List.ActionList,
) => {
  // console.log('sendListAction', action.action)
  const userSpace = getUserSpace();
  let key = '';
  for (const client of wss.clients) {
    if (!client.moduleReadys?.list) continue;
    // eslint-disable-next-line require-atomic-updates
    if (!key) key = await userSpace.listManage.createSnapshot();
    client.remoteQueueList
      .onListSyncAction(action)
      // eslint-disable-next-line no-loop-func
      .then(async () => userSpace.listManage.updateDeviceSnapshotKey(client.keyInfo.clientId, key))
      .catch((err) => {
        // TODO send status
        client.close(SYNC_CLOSE_CODE.failed);
        // client.moduleReadys.list = false
        console.log(err.message);
      });
  }
};

export const registerEvent = (wss: LX.Sync.Server.SocketServer) => {
  // socket = _socket
  // socket.onClose(() => {
  //   unregisterLocalListAction?.()
  //   unregisterLocalListAction = null
  // })
  unregisterEvent();
  unregisterLocalListAction = registerListActionEvent((action) => {
    sendListAction(wss, action);
  });
};

export const unregisterEvent = () => {
  unregisterLocalListAction?.();
  unregisterLocalListAction = null;
};
