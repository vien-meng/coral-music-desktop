import type { onlineMusicService } from './onlineMusicService'

export const loadOnlineMusicService = async(): Promise<typeof onlineMusicService> => {
  return (await import('./onlineMusicService')).onlineMusicService
}
