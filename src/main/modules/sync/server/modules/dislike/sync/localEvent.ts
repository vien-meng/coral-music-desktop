import { SYNC_CLOSE_CODE } from '@common/constants_sync';
import { registerDislikeActionEvent } from '../../../../dislikeEvent';
import { getUserSpace } from '../../../user';

// let socket: Coral.Sync.Server.Socket | null
let unregisterLocalListAction: (() => void) | null;

const sendListAction = async (
  wss: Coral.Sync.Server.SocketServer,
  action: Coral.Sync.Dislike.ActionList,
) => {
  // console.log('sendListAction', action.action)
  const userSpace = getUserSpace();
  let key = '';
  for (const client of wss.clients) {
    if (!client.moduleReadys?.dislike) continue;
    // eslint-disable-next-line require-atomic-updates
    if (!key) key = await userSpace.dislikeManage.createSnapshot();
    const snapshotKey = key;
    client.remoteQueueDislike
      .onDislikeSyncAction(action)
      .then(async () =>
        userSpace.dislikeManage.updateDeviceSnapshotKey(client.keyInfo.clientId, snapshotKey),
      )
      .catch((err) => {
        // TODO send status
        client.close(SYNC_CLOSE_CODE.failed);
        // client.moduleReadys.dislike = false
        console.log(err.message);
      });
  }
};

export const registerEvent = (wss: Coral.Sync.Server.SocketServer) => {
  // socket = _socket
  // socket.onClose(() => {
  //   unregisterLocalListAction?.()
  //   unregisterLocalListAction = null
  // })
  unregisterEvent();
  unregisterLocalListAction = registerDislikeActionEvent((action) => {
    sendListAction(wss, action);
  });
};

export const unregisterEvent = () => {
  unregisterLocalListAction?.();
  unregisterLocalListAction = null;
};
