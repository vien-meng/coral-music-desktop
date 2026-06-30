declare namespace Coral {
  namespace WebDav {
    type Provider = 'baidu' | 'xunlei' | 'quark' | 'aliyun' | '115' | 'tianyi' | 'uc' | 'custom';

    interface Account {
      id: string;
      name: string;
      provider: Provider;
      url: string;
      username: string;
      password: string;
      rootPath: string;
      remark?: string;
      enabled: boolean;
      createdAt: number;
      updatedAt: number;
    }

    interface SafeAccount extends Omit<Account, 'password'> {
      password?: string;
      hasPassword: boolean;
    }

    interface FileItem {
      accountId: string;
      basename: string;
      contentLength: number | null;
      contentType: string | null;
      ext: string;
      href: string;
      isAudio: boolean;
      isDirectory: boolean;
      lastModified: string | null;
      name: string;
      parentPath: string;
      path: string;
      provider: Provider;
    }

    interface ListDirParams {
      accountId: string;
      path?: string;
    }

    interface ListDirResult {
      account: SafeAccount;
      items: FileItem[];
      path: string;
    }

    interface StreamUrlParams {
      accountId: string;
      href: string;
    }

    interface StreamUrlResult {
      token: string;
      url: string;
      expiresAt: number;
    }

    interface TestResult {
      ok: boolean;
      message: string;
    }
  }
}
