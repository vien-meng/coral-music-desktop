import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { app } from 'electron';
import iconv from 'iconv-lite';
import NodeID3 from 'node-id3';
import { DOWNLOAD_STATUS } from '@common/constants';
import { clearDownloadTasks, pauseDownloadTask, startDownloadTask } from './downloadRuntime';

const SMOKE_ENABLED = process.env.CORAL_DOWNLOAD_SMOKE === 'true';
const CHUNK_SIZE = 64 * 1024;
const CHUNK_DELAY_MS = 35;
const WAIT_TIMEOUT_MS = 15_000;

interface SmokeServer {
  close: () => Promise<void>;
  url: (pathname: string) => string;
}

const wait = async (time: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, time);
  });
};

const createSmokeMusicInfo = (id: string, name: string): Coral.Music.MusicInfoOnline => ({
  id,
  interval: '00:05',
  meta: {
    _qualitys: {
      '128k': {
        size: '1M',
      },
    },
    albumName: 'Coral Smoke',
    qualitys: [
      {
        size: '1M',
        type: '128k',
      },
    ],
    songId: id,
  },
  name,
  singer: 'Coral',
  source: 'kw',
});

const createSmokeTask = (
  id: string,
  fileName: string,
  musicInfo = createSmokeMusicInfo(id, fileName.replace(/\.\w+$/, '')),
): Coral.Download.ListItem => ({
  downloaded: 0,
  id,
  isComplate: false,
  metadata: {
    ext: 'mp3',
    fileName,
    filePath: '',
    listId: 'download',
    musicInfo,
    quality: '128k',
    url: null,
  },
  progress: 0,
  speed: '',
  status: DOWNLOAD_STATUS.PAUSE,
  statusText: '待下载',
  total: 0,
  writeQueue: 0,
});

const createServer = async (payload: Buffer, coverPayload: Buffer): Promise<SmokeServer> => {
  const server = http.createServer((req, res) => {
    if (req.url?.startsWith('/missing')) {
      res.writeHead(404, {
        'Content-Length': '0',
      });
      res.end();
      return;
    }

    if (req.url?.startsWith('/cover')) {
      res.writeHead(200, {
        'Content-Length': String(coverPayload.length),
        'Content-Type': 'image/png',
      });
      res.end(coverPayload);
      return;
    }

    if (!req.url?.startsWith('/file')) {
      res.writeHead(404);
      res.end();
      return;
    }

    const range = req.headers.range?.match(/^bytes=(\d+)-/);
    const start = range ? Math.max(0, Number(range[1])) : 0;
    const end = payload.length - 1;
    const statusCode = start > 0 ? 206 : 200;
    res.writeHead(statusCode, {
      'Accept-Ranges': 'bytes',
      'Content-Length': String(payload.length - start),
      'Content-Range': `bytes ${start}-${end}/${payload.length}`,
      'Content-Type': 'audio/mpeg',
    });

    let offset = start;
    const writeNext = () => {
      if (offset >= payload.length) {
        res.end();
        return;
      }
      const nextOffset = Math.min(offset + CHUNK_SIZE, payload.length);
      res.write(payload.subarray(offset, nextOffset));
      offset = nextOffset;
      setTimeout(writeNext, CHUNK_DELAY_MS);
    };
    writeNext();
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('download smoke server did not expose a TCP port');

  return {
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    },
    url: (pathname: string) => `http://127.0.0.1:${address.port}${pathname}`,
  };
};

const findTask = async (id: string): Promise<Coral.Download.ListItem> => {
  const task = (await global.coral.worker.dbService.getDownloadList()).find(
    (item) => item.id === id,
  );
  if (!task) throw new Error(`download smoke task not found: ${id}`);
  return task;
};

const waitForTask = async (
  id: string,
  predicate: (task: Coral.Download.ListItem) => boolean,
  description: string,
): Promise<Coral.Download.ListItem> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < WAIT_TIMEOUT_MS) {
    const task = await findTask(id);
    if (predicate(task)) return task;
    await wait(100);
  }
  const task = await findTask(id);
  throw new Error(
    `download smoke timeout waiting for ${description}; status=${task.status}; text=${task.statusText}`,
  );
};

const saveTasks = async (tasks: Coral.Download.ListItem[]): Promise<void> => {
  await global.coral.worker.dbService.downloadInfoSave(tasks, 'top');
};

const configureSmokeSettings = (downloadDir: string): Partial<Coral.AppSetting> => {
  const previousSetting: Partial<Coral.AppSetting> = {
    'download.isDownloadLrc': global.coral.appSetting['download.isDownloadLrc'],
    'download.isDownloadLxLrc': global.coral.appSetting['download.isDownloadLxLrc'],
    'download.isDownloadRLrc': global.coral.appSetting['download.isDownloadRLrc'],
    'download.isDownloadTLrc': global.coral.appSetting['download.isDownloadTLrc'],
    'download.isEmbedLyric': global.coral.appSetting['download.isEmbedLyric'],
    'download.isEmbedLyricLx': global.coral.appSetting['download.isEmbedLyricLx'],
    'download.isEmbedLyricR': global.coral.appSetting['download.isEmbedLyricR'],
    'download.isEmbedLyricT': global.coral.appSetting['download.isEmbedLyricT'],
    'download.isEmbedPic': global.coral.appSetting['download.isEmbedPic'],
    'download.lrcFormat': global.coral.appSetting['download.lrcFormat'],
    'download.savePath': global.coral.appSetting['download.savePath'],
    'download.skipExistFile': global.coral.appSetting['download.skipExistFile'],
  };
  global.coral.appSetting = {
    ...global.coral.appSetting,
    'download.isDownloadLrc': true,
    'download.isDownloadLxLrc': false,
    'download.isDownloadRLrc': false,
    'download.isDownloadTLrc': false,
    'download.isEmbedLyric': true,
    'download.isEmbedLyricLx': false,
    'download.isEmbedLyricR': false,
    'download.isEmbedLyricT': false,
    'download.isEmbedPic': true,
    'download.lrcFormat': 'gbk',
    'download.savePath': downloadDir,
    'download.skipExistFile': false,
  };
  return previousSetting;
};

const restoreSmokeSettings = (previousSetting: Partial<Coral.AppSetting>): void => {
  global.coral.appSetting = {
    ...global.coral.appSetting,
    ...previousSetting,
  };
};

const assertCompletedFile = async (
  task: Coral.Download.ListItem,
  expectedSize: number,
): Promise<void> => {
  if (task.status !== DOWNLOAD_STATUS.COMPLETED)
    throw new Error(`expected completed task, got ${task.status}`);
  if (!task.metadata.filePath) throw new Error('completed task has no file path');
  const stats = await fs.stat(task.metadata.filePath);
  if (stats.size < expectedSize)
    throw new Error(`downloaded file is truncated: ${stats.size} < ${expectedSize}`);
};

const waitForFile = async (filePath: string, description: string): Promise<void> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < WAIT_TIMEOUT_MS) {
    try {
      await fs.access(filePath);
      return;
    } catch {
      await wait(100);
    }
  }
  throw new Error(`download smoke timeout waiting for ${description}: ${filePath}`);
};

const waitForEmbeddedMetadata = async (filePath: string): Promise<void> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < WAIT_TIMEOUT_MS) {
    const tags = NodeID3.read(filePath);
    if (tags.image && tags.unsynchronisedLyrics?.text.includes('珊瑚下载测试')) return;
    await wait(100);
  }
  throw new Error(`download smoke timeout waiting for embedded cover and lyric: ${filePath}`);
};

const runSmoke = async (): Promise<void> => {
  const smokeId = `coral-smoke-${Date.now()}`;
  const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), `${smokeId}-`));
  const previousSetting = configureSmokeSettings(downloadDir);
  const payload = Buffer.alloc(4 * 1024 * 1024, 'coral-download-smoke');
  const coverPayload = await fs.readFile(path.join(process.cwd(), 'resources/icons/16x16.png'));
  const server = await createServer(payload, coverPayload);
  const taskIds = [`${smokeId}-pause-retry`, `${smokeId}-fail-refresh`];

  try {
    const pauseRetryMusic = createSmokeMusicInfo(taskIds[0], 'pause-retry');
    pauseRetryMusic.meta.picUrl = server.url('/cover.png');
    const pauseRetryTask = createSmokeTask(taskIds[0], 'pause-retry.mp3', pauseRetryMusic);
    const failRefreshTask = createSmokeTask(taskIds[1], 'fail-refresh.mp3');
    await saveTasks([pauseRetryTask, failRefreshTask]);
    await global.coral.worker.dbService.rawLyricAdd(pauseRetryTask.metadata.musicInfo.id, {
      lyric: '[00:00.00]珊瑚下载测试',
    });

    await startDownloadTask({
      task: pauseRetryTask,
      url: server.url('/file'),
    });
    await waitForTask(
      pauseRetryTask.id,
      (task) => task.status === DOWNLOAD_STATUS.RUN && task.downloaded > 0,
      'initial progress',
    );

    await pauseDownloadTask(pauseRetryTask.id);
    await waitForTask(
      pauseRetryTask.id,
      (task) => task.status === DOWNLOAD_STATUS.PAUSE,
      'pause status',
    );

    await startDownloadTask({
      isRetry: true,
      task: await findTask(pauseRetryTask.id),
      url: server.url('/file'),
    });
    const completedTask = await waitForTask(
      pauseRetryTask.id,
      (task) => task.status === DOWNLOAD_STATUS.COMPLETED,
      'completion after retry',
    );
    await assertCompletedFile(completedTask, payload.length);
    await waitForTask(
      pauseRetryTask.id,
      (task) => task.status === DOWNLOAD_STATUS.COMPLETED,
      'side effects settled',
    );
    await waitForFile(
      completedTask.metadata.filePath.replace(/\.mp3$/i, '.lrc'),
      'sidecar lyric file',
    );
    const lyricFile = completedTask.metadata.filePath.replace(/\.mp3$/i, '.lrc');
    const lyricText = iconv.decode(await fs.readFile(lyricFile), 'gb18030');
    if (!lyricText.includes('珊瑚下载测试')) throw new Error('GBK sidecar lyric content mismatch');
    await waitForEmbeddedMetadata(completedTask.metadata.filePath);

    await startDownloadTask({
      task: failRefreshTask,
      url: server.url('/missing'),
    });
    await waitForTask(
      failRefreshTask.id,
      (task) => task.status === DOWNLOAD_STATUS.ERROR && task.statusText === '下载地址失效',
      'refresh-url error status',
    );

    await startDownloadTask({
      isRetry: true,
      task: await findTask(failRefreshTask.id),
      url: server.url('/file'),
    });
    const recoveredTask = await waitForTask(
      failRefreshTask.id,
      (task) => task.status === DOWNLOAD_STATUS.COMPLETED,
      'retry after failed URL',
    );
    await assertCompletedFile(recoveredTask, payload.length);

    console.log('[downloadSmoke] passed');
  } finally {
    await clearDownloadTasks().catch(() => {});
    await global.coral.worker.dbService.downloadInfoRemove(taskIds).catch(() => {});
    restoreSmokeSettings(previousSetting);
    await server.close().catch(() => {});
    await fs.rm(downloadDir, { force: true, recursive: true }).catch(() => {});
  }
};

export const runDownloadSmokeIfEnabled = (): void => {
  if (!SMOKE_ENABLED) return;

  runSmoke()
    .then(() => {
      global.coral.isSkipTrayQuit = true;
      app.quit();
    })
    .catch((error) => {
      console.error('[downloadSmoke] failed', error);
      app.exit(1);
    });
};
