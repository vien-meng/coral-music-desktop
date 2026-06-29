import { Event as App, type Type as AppType } from './AppEvent';
import { Event as List, type Type as ListType } from './ListEvent';
import { Event as Dislike, type Type as DislikeType } from './DislikeEvent';

export type { AppType, ListType, DislikeType };

export const createAppEvent = (): AppType => new App();

export const createListEvent = (): ListType => new List();

export const createDislikeEvent = (): DislikeType => new Dislike();
