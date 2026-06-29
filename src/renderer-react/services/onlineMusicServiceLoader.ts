import type { onlineMusicService } from './onlineMusicService';

export const loadOnlineMusicService = async (): Promise<typeof onlineMusicService> =>
  (await import('./onlineMusicService')).onlineMusicService;
