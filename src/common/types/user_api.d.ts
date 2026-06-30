declare namespace Coral {
  namespace UserApi {
    type UserApiSourceInfoType = 'music';
    type UserApiSourceInfoActions = 'musicUrl' | 'lyric' | 'pic';

    interface UserApiSourceInfo {
      name: string;
      type: UserApiSourceInfoType;
      actions: UserApiSourceInfoActions[];
      qualitys: Coral.Quality[];
    }

    type UserApiSources = Record<Coral.Source, UserApiSourceInfo>;

    interface UserApiInfoFull {
      id: string;
      name: string;
      description: string;
      script: string;
      allowShowUpdateAlert: boolean;
      author?: string;
      homepage?: string;
      version?: string;
      sources?: UserApiSources;
    }

    type UserApiInfo = Omit<UserApiInfoFull, 'script'>;

    interface UserApiStatus {
      status: boolean;
      message?: string;
      apiInfo?: UserApiInfo;
    }

    interface UserApiUpdateInfo {
      name: string;
      description: string;
      log: string;
      updateUrl?: string;
    }

    interface UserApiRequestParams {
      requestKey: string;
      data: any;
    }
    type UserApiRequestCancelParams = string;
    type UserApiSetApiParams =
      | string
      | {
          force?: boolean;
          id: string;
        };

    interface UserApiSetAllowUpdateAlertParams {
      id: string;
      enable: boolean;
    }

    interface ImportUserApi {
      apiInfo: UserApiInfo;
      apiList: UserApiInfo[];
    }
  }
}
