import type WS from 'ws';

type DefaultEventsMap = Record<string, (...args: any[]) => void>;

declare global {
  namespace Coral {
    namespace Sync {
      namespace Client {
        interface Socket extends WS.WebSocket {
          isReady: boolean;
          data: {
            keyInfo: ClientKeyInfo;
            urlInfo: UrlInfo;
          };
          moduleReadys: {
            list: boolean;
            dislike: boolean;
          };

          onClose: (handler: (err: Error) => void | Promise<void>) => () => void;
          remote: Coral.Sync.ServerSyncActions;
          remoteQueueList: Coral.Sync.ServerSyncListActions;
          remoteQueueDislike: Coral.Sync.ServerSyncDislikeActions;
        }

        interface UrlInfo {
          wsProtocol: string;
          httpProtocol: string;
          hostPath: string;
          href: string;
        }
      }
      namespace Server {
        interface Socket extends WS.WebSocket {
          isAlive?: boolean;
          isReady: boolean;
          userInfo: { name: 'default' };
          keyInfo: ServerKeyInfo;
          feature: Coral.Sync.EnabledFeatures;
          moduleReadys: {
            list: boolean;
            dislike: boolean;
          };

          onClose: (handler: (err: Error) => void | Promise<void>) => () => void;
          broadcast: (handler: (client: Socket) => void) => void;

          remote: Coral.Sync.ClientSyncActions;
          remoteQueueList: Coral.Sync.ClientSyncListActions;
          remoteQueueDislike: Coral.Sync.ClientSyncDislikeActions;
        }
        type SocketServer = WS.Server<Socket>;
      }
    }
  }

  // interface SyncListActionData_none {
  //   action: 'finished'
  // }
  // interface SyncListActionData_getData {
  //   action: 'getData'
  //   data: 'all'
  // }

  // type SyncListActionData = SyncListActionData_none | SyncListActionData_getData
}
