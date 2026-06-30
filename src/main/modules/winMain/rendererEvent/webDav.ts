import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames';
import { mainHandle } from '@common/mainIpc';
import {
  createWebDavStreamUrl,
  listWebDavAccounts,
  listWebDavDir,
  removeWebDavAccount,
  revokeWebDavStreamUrl,
  saveWebDavAccount,
  testWebDavAccount,
} from '../webDavService';

export default () => {
  mainHandle<undefined, Coral.WebDav.SafeAccount[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.webdav_account_list,
    async () => listWebDavAccounts(),
  );
  mainHandle<Coral.WebDav.Account, Coral.WebDav.SafeAccount[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.webdav_account_save,
    async ({ params }) => saveWebDavAccount(params),
  );
  mainHandle<string, Coral.WebDav.SafeAccount[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.webdav_account_remove,
    async ({ params }) => removeWebDavAccount(params),
  );
  mainHandle<Coral.WebDav.Account, Coral.WebDav.TestResult>(
    WIN_MAIN_RENDERER_EVENT_NAME.webdav_account_test,
    async ({ params }) => testWebDavAccount(params),
  );
  mainHandle<Coral.WebDav.ListDirParams, Coral.WebDav.ListDirResult>(
    WIN_MAIN_RENDERER_EVENT_NAME.webdav_list_dir,
    async ({ params }) => listWebDavDir(params),
  );
  mainHandle<Coral.WebDav.StreamUrlParams, Coral.WebDav.StreamUrlResult>(
    WIN_MAIN_RENDERER_EVENT_NAME.webdav_create_stream_url,
    async ({ params }) => createWebDavStreamUrl(params),
  );
  mainHandle<string>(WIN_MAIN_RENDERER_EVENT_NAME.webdav_revoke_stream_url, async ({ params }) => {
    revokeWebDavStreamUrl(params);
  });
};
