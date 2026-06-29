import { createDBServiceWorker } from './utils';

export default () => ({
  dbService: createDBServiceWorker(),
});
