const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const Module = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const iconv = require('iconv-lite');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const failures = [];

const record = async (name, fn) => {
  try {
    await fn();
    console.log(`[localAudioFixtureSmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[localAudioFixtureSmoke] fail ${name}: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const registerTsRequire = () => {
  const originalResolveFilename = Module._resolveFilename;
  Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    if (request.startsWith('@shared/')) {
      return originalResolveFilename.call(
        this,
        path.join(root, 'src/shared', `${request.slice('@shared/'.length)}.ts`),
        parent,
        isMain,
        options,
      );
    }
    if (request.startsWith('@common/')) {
      return originalResolveFilename.call(
        this,
        path.join(root, 'src/common', `${request.slice('@common/'.length)}.ts`),
        parent,
        isMain,
        options,
      );
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  require.extensions['.ts'] = (module, fileName) => {
    const source = fs.readFileSync(fileName, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName,
    }).outputText;
    module._compile(transpiled, fileName);
  };
};

const runFfmpeg = (ffmpegPath, args) => {
  execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
    timeout: 20_000,
  });
};

const createFixtures = (ffmpegPath, fixtureDir) => {
  const coverPath = path.join(fixtureDir, 'cover.png');
  const toneInput = ['-f', 'lavfi', '-i', 'sine=frequency=440:duration=1:sample_rate=48000'];

  runFfmpeg(ffmpegPath, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'color=c=red:s=32x32:d=1',
    '-frames:v',
    '1',
    coverPath,
  ]);

  runFfmpeg(ffmpegPath, [
    '-y',
    ...toneInput,
    '-i',
    coverPath,
    '-map',
    '0:a',
    '-map',
    '1:v',
    '-c:a',
    'flac',
    '-c:v',
    'png',
    '-disposition:v',
    'attached_pic',
    '-metadata',
    'title=Coral Fixture FLAC',
    path.join(fixtureDir, 'cover.flac'),
  ]);

  const fixtures = [
    ['plain.flac', ['-c:a', 'flac']],
    ['tone.ogg', ['-c:a', 'libvorbis']],
    ['tone.opus', ['-c:a', 'libopus']],
    ['tone.m4a', ['-c:a', 'aac']],
    ['tone.wav', ['-c:a', 'pcm_s16le']],
    ['tone.aiff', ['-c:a', 'pcm_s16be']],
    ['tone.caf', ['-c:a', 'pcm_s16le']],
    ['tone.webm', ['-c:a', 'libopus']],
  ];

  for (const [fileName, outputArgs] of fixtures) {
    runFfmpeg(ffmpegPath, ['-y', ...toneInput, ...outputArgs, path.join(fixtureDir, fileName)]);
  }
};

const writeCueAlbum = (fixtureDir, options = {}) => {
  const albumDir = path.join(fixtureDir, options.name || 'cue-album');
  fs.mkdirSync(albumDir, { recursive: true });
  const audioPath = path.join(albumDir, 'album.wav');
  fs.copyFileSync(path.join(fixtureDir, 'tone.wav'), audioPath);
  const cueContent =
    options.content ||
    [
      'PERFORMER "Fixture Artist"',
      'TITLE "Fixture Album"',
      'FILE "album.wav" WAVE',
      '  TRACK 01 AUDIO',
      '    TITLE "Part One"',
      '    INDEX 01 00:00:00',
      '  TRACK 02 AUDIO',
      '    TITLE "Part Two"',
      '    INDEX 01 00:00:37',
      '',
    ].join('\n');
  fs.writeFileSync(
    path.join(albumDir, 'album.cue'),
    options.encoding ? iconv.encode(cueContent, options.encoding) : cueContent,
  );
  return { albumDir, audioPath };
};

const assertDecodedAudio = (fileName, decoded) => {
  assert(decoded, `${fileName} did not decode`);
  assert(decoded.sampleRate === 48000, `${fileName} sampleRate should be 48000`);
  assert(decoded.channelData.length >= 1, `${fileName} should have at least one channel`);
  assert(decoded.channelData[0].length > 40000, `${fileName} decoded PCM is too short`);
};

(async () => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const ffmpegPath = require(path.join(root, 'node_modules/ffmpeg-static'));
  assert(ffmpegPath && fs.existsSync(ffmpegPath), 'ffmpeg-static did not resolve a binary path');
  registerTsRequire();
  globalThis.require = require;

  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coral-local-audio-fixtures-'));
  try {
    createFixtures(ffmpegPath, fixtureDir);
    const [{ default: decodeAudio }, { parseFile }] = await Promise.all([
      import('audio-decode'),
      import('music-metadata'),
    ]);
    const { scanLocalMusicInfosFromPaths } = require(
      path.join(root, 'src/renderer-react/services/localAudioService.ts'),
    );
    const { calculateCrc32 } = require(path.join(root, 'src/shared/localAlbumCueParser.ts'));

    await record('audio-decode decodes generated local formats', async () => {
      for (const fileName of [
        'cover.flac',
        'plain.flac',
        'tone.ogg',
        'tone.opus',
        'tone.m4a',
        'tone.wav',
        'tone.aiff',
        'tone.caf',
        'tone.webm',
      ]) {
        const data = fs.readFileSync(path.join(fixtureDir, fileName));
        const decoded = await decodeAudio(data);
        assertDecodedAudio(fileName, decoded);
      }
    });

    await record('music-metadata preserves flac cover and audio params', async () => {
      const metadata = await parseFile(path.join(fixtureDir, 'cover.flac'), { duration: true });
      assert(metadata.common.title === 'Coral Fixture FLAC', 'FLAC title metadata missing');
      assert(
        (metadata.common.picture?.length ?? 0) === 1,
        'FLAC embedded cover should be preserved',
      );
      assert(metadata.format.sampleRate === 48000, 'FLAC sampleRate should be 48000');
      assert(
        typeof metadata.format.bitrate === 'number' && metadata.format.bitrate > 0,
        'FLAC bitrate should be present',
      );
      assert(metadata.format.duration === 1, 'FLAC duration should be 1 second');
    });

    await record('music-metadata reads generated sample rate and bitrate', async () => {
      for (const fileName of ['plain.flac', 'tone.ogg', 'tone.opus', 'tone.m4a', 'tone.wav']) {
        const metadata = await parseFile(path.join(fixtureDir, fileName), { duration: true });
        assert(metadata.format.sampleRate === 48000, `${fileName} sampleRate missing`);
        assert(
          typeof metadata.format.bitrate === 'number' && metadata.format.bitrate > 0,
          `${fileName} bitrate missing`,
        );
      }
    });

    await record(
      'local audio scanner probes large audio headers without full readFile',
      async () => {
        const largeAudioPath = path.join(fixtureDir, 'large-header.wav');
        fs.copyFileSync(path.join(fixtureDir, 'tone.wav'), largeAudioPath);
        fs.appendFileSync(largeAudioPath, Buffer.alloc(2 * 1024 * 1024));

        const originalReadFile = fsPromises.readFile;
        fsPromises.readFile = async (filePath, ...args) => {
          if (path.resolve(String(filePath)) === largeAudioPath) {
            throw new Error('large audio file should not be read with full readFile');
          }
          return await originalReadFile.call(fsPromises, filePath, ...args);
        };
        try {
          const result = await scanLocalMusicInfosFromPaths([largeAudioPath], {
            externalExtensions: [],
            nativeExtensions: ['wav'],
          });
          assert(result.musicInfos.length === 1, 'large audio file should still import');
          assert(result.musicInfos[0].meta.sampleRate === 48000, 'large audio header should parse');
        } finally {
          fsPromises.readFile = originalReadFile;
        }
      },
    );

    await record('local audio scanner imports cue and sfv album tracks', async () => {
      const { albumDir, audioPath } = writeCueAlbum(fixtureDir);
      const expectedCrc32 = calculateCrc32(fs.readFileSync(audioPath));
      fs.writeFileSync(path.join(albumDir, 'album.sfv'), `album.wav ${expectedCrc32}\n`);

      const result = await scanLocalMusicInfosFromPaths([albumDir], {
        externalExtensions: [],
        nativeExtensions: ['wav'],
      });
      assert(result.candidateCount === 3, 'cue album should scan wav/cue/sfv candidates');
      assert(result.musicInfos.length === 2, 'cue album should import two virtual tracks');
      assert(result.skippedCount === 1, 'cue album should skip the sfv sidecar as a track');
      assert(
        result.musicInfos.every((music) => music.meta.cuePath),
        'tracks should keep cuePath',
      );
      assert(
        result.musicInfos.every((music) => music.meta.albumFilePath === audioPath),
        'tracks should point to the shared album image path',
      );
      assert(
        result.musicInfos.every((music) => music.meta.sfvExpectedCrc32 === expectedCrc32),
        'tracks should attach sfv expected crc32',
      );
      assert(
        result.musicInfos.every((music) => music.meta.sfvStatus === 'unchecked'),
        'matching sfv entries should remain unchecked until full verification',
      );
      assert(result.musicInfos[0].meta.trackStartMs === 0, 'first cue track start mismatch');
      assert(result.musicInfos[0].meta.trackEndMs === 493, 'first cue track end mismatch');
      assert(result.musicInfos[1].meta.trackStartMs === 493, 'second cue track start mismatch');
    });

    await record(
      'local audio scanner marks missing sfv entries without rereading albums',
      async () => {
        const { albumDir } = writeCueAlbum(fixtureDir, { name: 'cue-album-missing-sfv' });
        fs.writeFileSync(path.join(albumDir, 'album.sfv'), 'other.wav 00000000\n');

        const result = await scanLocalMusicInfosFromPaths([albumDir], {
          externalExtensions: [],
          nativeExtensions: ['wav'],
        });
        assert(result.musicInfos.length === 2, 'missing sfv album should still import tracks');
        assert(
          result.musicInfos.every((music) => music.meta.sfvStatus === 'missing'),
          'unmatched sfv entries should mark tracks missing',
        );
        assert(
          result.musicInfos.every((music) => music.meta.sfvExpectedCrc32 == null),
          'missing sfv entries should not attach a fake crc32',
        );
      },
    );

    await record('local audio scanner decodes gb18030 cue text', async () => {
      const { albumDir } = writeCueAlbum(fixtureDir, {
        content: [
          'PERFORMER "测试歌手"',
          'TITLE "测试专辑"',
          'FILE "album.wav" WAVE',
          '  TRACK 01 AUDIO',
          '    TITLE "第一首"',
          '    INDEX 01 00:00:00',
          '',
        ].join('\n'),
        encoding: 'gb18030',
        name: 'cue-album-gb18030',
      });

      const result = await scanLocalMusicInfosFromPaths([albumDir], {
        externalExtensions: [],
        nativeExtensions: ['wav'],
      });
      assert(result.musicInfos.length === 1, 'gb18030 cue should import one virtual track');
      assert(result.musicInfos[0].name === '第一首', 'gb18030 cue title should decode');
      assert(result.musicInfos[0].singer === '测试歌手', 'gb18030 cue performer should decode');
      assert(
        result.musicInfos[0].meta.albumName === '测试专辑',
        'gb18030 cue album title should decode',
      );
    });
  } finally {
    fs.rmSync(fixtureDir, { force: true, recursive: true });
  }

  if (failures.length) {
    console.error(`\n[localAudioFixtureSmoke] ${failures.length} check(s) failed`);
    process.exit(1);
  }

  console.log('\n[localAudioFixtureSmoke] passed');
})().catch((error) => {
  console.error(`[localAudioFixtureSmoke] fatal ${error.message}`);
  process.exit(1);
});
