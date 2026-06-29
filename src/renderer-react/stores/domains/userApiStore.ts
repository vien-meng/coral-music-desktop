import { makeAutoObservable, observable } from 'mobx'
import { userApiService } from '../../services/userApiService'

const sourceNameMap: Record<string, string> = {
  git: 'Git',
  kg: '酷狗',
  kw: '酷我',
  mg: '咪咕',
  tx: 'QQ',
  wy: '网易',
}

export const getPlayableUserApiSources = (
  apiInfo?: LX.UserApi.UserApiInfo | null,
): string[] => {
  return Object.entries(apiInfo?.sources ?? {})
    .filter(([, source]) => source.type === 'music' && source.actions.includes('musicUrl'))
    .map(([source]) => source)
}

export const getPlayableUserApiSourceNames = (
  apiInfo?: LX.UserApi.UserApiInfo | null,
): string[] => {
  return getPlayableUserApiSources(apiInfo)
    .map(source => sourceNameMap[source] ?? source.toUpperCase())
}

export const canPlayWithUserApi = (
  apiInfo?: LX.UserApi.UserApiInfo | null,
): boolean => {
  return getPlayableUserApiSources(apiInfo).length > 0
}

const mergeStatusApiInfo = (
  apiList: LX.UserApi.UserApiInfo[],
  status: LX.UserApi.UserApiStatus | null,
): LX.UserApi.UserApiInfo[] => {
  const runtimeApiInfo = status?.apiInfo
  if (!runtimeApiInfo?.id) return apiList

  return apiList.map(api => api.id === runtimeApiInfo.id
    ? {
        ...api,
        ...runtimeApiInfo,
        allowShowUpdateAlert: api.allowShowUpdateAlert,
      }
    : api)
}

export class UserApiStore {
  actionError: string | null = null

  hydrateError: string | null = null

  isHydrated = false

  isHydrating = false

  isMutating = false

  status: LX.UserApi.UserApiStatus | null = null

  userApis: LX.UserApi.UserApiInfo[] = []

  constructor() {
    makeAutoObservable(
      this,
      {
        userApis: observable.shallow,
      },
      { autoBind: true },
    )
  }

  get count(): number {
    return this.userApis.length
  }

  get playableUserApis(): LX.UserApi.UserApiInfo[] {
    return this.userApis.filter(canPlayWithUserApi)
  }

  getPlayableSourceNames(apiInfo?: LX.UserApi.UserApiInfo | null): string[] {
    return getPlayableUserApiSourceNames(apiInfo)
  }

  canPlay(apiInfo?: LX.UserApi.UserApiInfo | null): boolean {
    return canPlayWithUserApi(apiInfo)
  }

  async hydrate(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return

    this.isHydrating = true
    this.hydrateError = null

    try {
      this.userApis = await userApiService.getUserApiList()
      this.status = await userApiService.getUserApiStatus()
      this.userApis = mergeStatusApiInfo(this.userApis, this.status)
      this.isHydrated = true
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isHydrating = false
    }
  }

  async refreshUserApis(): Promise<void> {
    this.isHydrating = true
    this.hydrateError = null

    try {
      this.userApis = await userApiService.getUserApiList()
      this.status = await userApiService.getUserApiStatus()
      this.userApis = mergeStatusApiInfo(this.userApis, this.status)
      this.isHydrated = true
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isHydrating = false
    }
  }

  async importUserApi(script: string): Promise<LX.UserApi.UserApiInfo | null> {
    this.isMutating = true
    this.actionError = null

    try {
      const result = await userApiService.importUserApi(script)
      this.userApis = result.apiList
      this.status = await userApiService.getUserApiStatus()
      this.userApis = mergeStatusApiInfo(this.userApis, this.status)
      return result.apiInfo
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error)
      return null
    } finally {
      this.isMutating = false
    }
  }

  async setUserApi(id: string): Promise<void> {
    this.isMutating = true
    this.actionError = null

    try {
      await userApiService.setUserApi(id)
      this.status = await userApiService.getUserApiStatus()
      this.userApis = mergeStatusApiInfo(this.userApis, this.status)
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isMutating = false
    }
  }

  async removeUserApis(ids: string[]): Promise<void> {
    if (!ids.length) return

    this.isMutating = true
    this.actionError = null

    try {
      this.userApis = await userApiService.removeUserApis(ids)
      this.status = await userApiService.getUserApiStatus()
      this.userApis = mergeStatusApiInfo(this.userApis, this.status)
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isMutating = false
    }
  }

  async setAllowUpdateAlert(id: string, enable: boolean): Promise<void> {
    this.isMutating = true
    this.actionError = null

    try {
      await userApiService.setUserApiAllowUpdateAlert(id, enable)
      this.userApis = this.userApis.map(api => api.id === id
        ? { ...api, allowShowUpdateAlert: enable }
        : api)
    } catch (error) {
      this.actionError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isMutating = false
    }
  }
}
