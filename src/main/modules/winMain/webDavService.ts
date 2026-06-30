import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

const AUDIO_EXTS = new Set(['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'opus']);
const TOKEN_TTL_MS = 30 * 60 * 1000;

interface StreamToken {
  accountId: string;
  expiresAt: number;
  href: string;
}

let proxyServer: http.Server | null = null;
let proxyPort = 0;
const streamTokens = new Map<string, StreamToken>();

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '');

const normalizeDirPath = (path = '/'): string => {
  const value = `/${trimSlashes(decodeURIComponent(path || '/'))}`;
  return value === '/' ? '/' : value;
};

const getExt = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
};

const toAuthHeader = (account: Coral.WebDav.Account): string | null => {
  if (!account.username && !account.password) return null;
  return `Basic ${Buffer.from(`${account.username}:${account.password}`).toString('base64')}`;
};

const toSafeAccount = (account: Coral.WebDav.Account): Coral.WebDav.SafeAccount => {
  const { password, ...safeAccount } = account;
  return {
    ...safeAccount,
    hasPassword: Boolean(password),
  };
};

const getAccounts = (): Coral.WebDav.Account[] => global.coral.appSetting['webdav.accounts'] ?? [];

const findAccount = (accountId: string): Coral.WebDav.Account => {
  const account = getAccounts().find((item) => item.id === accountId);
  if (!account) throw new Error('WebDAV账号不存在');
  if (!account.enabled) throw new Error('WebDAV账号已禁用');
  return account;
};

const saveAccounts = (accounts: Coral.WebDav.Account[]): Coral.WebDav.SafeAccount[] => {
  const activeAccountId = global.coral.appSetting['webdav.activeAccountId'];
  const nextActiveAccountId = accounts.some((account) => account.id === activeAccountId)
    ? activeAccountId
    : (accounts[0]?.id ?? '');
  global.coral.event_app.update_config({
    'webdav.accounts': accounts,
    'webdav.activeAccountId': nextActiveAccountId,
  });
  return accounts.map(toSafeAccount);
};

const buildUrl = (account: Coral.WebDav.Account, targetPath = '/'): string => {
  const base = new URL(account.url.endsWith('/') ? account.url : `${account.url}/`);
  const root = trimSlashes(account.rootPath || '');
  const path = trimSlashes(targetPath);
  const joined = [root, path].filter(Boolean).join('/');
  base.pathname = `${trimSlashes(base.pathname) ? `/${trimSlashes(base.pathname)}` : ''}/${joined
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')}`;
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  return base.toString();
};

const resolveHrefUrl = (account: Coral.WebDav.Account, href: string): string => {
  if (/^https?:\/\//i.test(href)) return href;
  const base = new URL(account.url.endsWith('/') ? account.url : `${account.url}/`);
  return new URL(href, base).toString();
};

const requestHeaders = (account: Coral.WebDav.Account, extra?: HeadersInit): HeadersInit => {
  const headers: Record<string, string> = {};
  const auth = toAuthHeader(account);
  if (auth) headers.Authorization = auth;
  return {
    ...headers,
    ...extra,
  };
};

const decodeXml = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

const getXmlValue = (xml: string, tag: string): string => {
  const match = new RegExp(`<[^:>]*:?${tag}[^>]*>([\\s\\S]*?)<\\/[^:>]*:?${tag}>`, 'i').exec(xml);
  return match ? decodeXml(match[1].trim()) : '';
};

const hasXmlTag = (xml: string, tag: string): boolean =>
  new RegExp(`<[^:>]*:?${tag}(?:\\s|>|/)`, 'i').test(xml);

const parseMultiStatus = (
  account: Coral.WebDav.Account,
  xml: string,
  currentPath: string,
): Coral.WebDav.FileItem[] => {
  const currentUrl = buildUrl(account, currentPath);
  const currentHrefPath = decodeURIComponent(new URL(currentUrl).pathname).replace(/\/+$/g, '');
  const responses = xml.match(/<[^:>]*:?response[\s\S]*?<\/[^:>]*:?response>/gi) ?? [];

  return responses
    .map((response) => {
      const href = getXmlValue(response, 'href');
      if (!href) return null;
      const hrefUrl = new URL(resolveHrefUrl(account, href));
      const hrefPath = decodeURIComponent(hrefUrl.pathname).replace(/\/+$/g, '');
      if (hrefPath === currentHrefPath) return null;

      const basename = decodeURIComponent(hrefUrl.pathname.split('/').filter(Boolean).pop() ?? '');
      if (!basename) return null;

      const isDirectory = hasXmlTag(response, 'collection');
      const ext = isDirectory ? '' : getExt(basename);
      const itemPath = normalizeDirPath(
        hrefPath.replace(currentHrefPath, '').replace(/^\/+/, '') || basename,
      );

      return {
        accountId: account.id,
        basename,
        contentLength: Number(getXmlValue(response, 'getcontentlength')) || null,
        contentType: getXmlValue(response, 'getcontenttype') || null,
        ext,
        href,
        isAudio: !isDirectory && AUDIO_EXTS.has(ext),
        isDirectory,
        lastModified: getXmlValue(response, 'getlastmodified') || null,
        name: basename,
        parentPath: normalizeDirPath(currentPath),
        path: itemPath,
        provider: account.provider,
      } satisfies Coral.WebDav.FileItem;
    })
    .filter((item): item is Coral.WebDav.FileItem => Boolean(item))
    .sort((left, right) => {
      if (left.isDirectory !== right.isDirectory) return left.isDirectory ? -1 : 1;
      return left.name.localeCompare(right.name, 'zh-Hans-CN');
    });
};

export const listWebDavAccounts = (): Coral.WebDav.SafeAccount[] =>
  getAccounts().map(toSafeAccount);

export const saveWebDavAccount = (account: Coral.WebDav.Account): Coral.WebDav.SafeAccount[] => {
  const accounts = getAccounts();
  const now = Date.now();
  const existing = accounts.find((item) => item.id === account.id);
  const normalized: Coral.WebDav.Account = {
    ...account,
    id: account.id || randomUUID(),
    createdAt: existing?.createdAt ?? account.createdAt ?? now,
    updatedAt: now,
    password: account.password || existing?.password || '',
    rootPath: normalizeDirPath(account.rootPath || '/'),
    url: account.url.trim(),
  };
  const nextAccounts = existing
    ? accounts.map((item) => (item.id === existing.id ? normalized : item))
    : [normalized, ...accounts];
  return saveAccounts(nextAccounts);
};

export const removeWebDavAccount = (accountId: string): Coral.WebDav.SafeAccount[] =>
  saveAccounts(getAccounts().filter((account) => account.id !== accountId));

export const testWebDavAccount = async (
  account: Coral.WebDav.Account,
): Promise<Coral.WebDav.TestResult> => {
  try {
    const url = buildUrl(account, account.rootPath || '/');
    const response = await fetch(url, {
      headers: requestHeaders(account, { Depth: '0' }),
      method: 'PROPFIND',
    });
    if (!response.ok) return { ok: false, message: `连接失败：HTTP ${response.status}` };
    return { ok: true, message: '连接成功' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
};

export const listWebDavDir = async ({
  accountId,
  path = '/',
}: Coral.WebDav.ListDirParams): Promise<Coral.WebDav.ListDirResult> => {
  const account = findAccount(accountId);
  const normalizedPath = normalizeDirPath(path);
  const response = await fetch(buildUrl(account, normalizedPath), {
    body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><allprop /></propfind>',
    headers: requestHeaders(account, {
      Depth: '1',
      'Content-Type': 'application/xml; charset=utf-8',
    }),
    method: 'PROPFIND',
  });
  if (!response.ok) throw new Error(`WebDAV目录读取失败：HTTP ${response.status}`);
  const xml = await response.text();
  return {
    account: toSafeAccount(account),
    items: parseMultiStatus(account, xml, normalizedPath),
    path: normalizedPath,
  };
};

const ensureProxyServer = async (): Promise<number> => {
  if (proxyServer && proxyPort) return proxyPort;
  proxyServer = http.createServer((req, res) => {
    handleProxyRequest(req, res).catch((error) => {
      res.statusCode = 500;
      res.end(error instanceof Error ? error.message : String(error));
    });
  });
  await new Promise<void>((resolve) => {
    proxyServer!.listen(0, '127.0.0.1', () => {
      const address = proxyServer!.address();
      proxyPort = typeof address === 'object' && address ? address.port : 0;
      resolve();
    });
  });
  return proxyPort;
};

const handleProxyRequest = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> => {
  const token = decodeURIComponent((req.url ?? '').split('/').pop() ?? '');
  const info = streamTokens.get(token);
  if (!info || info.expiresAt < Date.now()) {
    streamTokens.delete(token);
    res.writeHead(404);
    res.end('WebDAV stream token expired');
    return;
  }

  const account = findAccount(info.accountId);
  const range = req.headers.range;
  const response = await fetch(resolveHrefUrl(account, info.href), {
    headers: requestHeaders(account, range ? { Range: range } : undefined),
    method: 'GET',
  });
  const responseHeaders: Record<string, string> = {
    'Accept-Ranges': response.headers.get('accept-ranges') ?? 'bytes',
    'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
  };
  const contentLength = response.headers.get('content-length');
  const contentRange = response.headers.get('content-range');
  if (contentLength) responseHeaders['Content-Length'] = contentLength;
  if (contentRange) responseHeaders['Content-Range'] = contentRange;
  res.writeHead(response.status, responseHeaders);
  if (!response.body) {
    res.end();
    return;
  }
  Readable.fromWeb(response.body as unknown as import('node:stream/web').ReadableStream).pipe(res);
};

export const createWebDavStreamUrl = async ({
  accountId,
  href,
}: Coral.WebDav.StreamUrlParams): Promise<Coral.WebDav.StreamUrlResult> => {
  findAccount(accountId);
  const port = await ensureProxyServer();
  const token = randomUUID();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  streamTokens.set(token, { accountId, expiresAt, href });
  return {
    expiresAt,
    token,
    url: `http://127.0.0.1:${port}/webdav/stream/${encodeURIComponent(token)}`,
  };
};

export const revokeWebDavStreamUrl = (token: string): void => {
  streamTokens.delete(token);
};
