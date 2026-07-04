const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const failures = [];

const helperPath =
  process.env.CORAL_NATIVE_APE_HELPER_PATH ||
  path.join(
    root,
    'resources/bin',
    process.platform === 'win32' ? 'coral-ape-helper.exe' : 'coral-ape-helper',
  );
const requireHelper = process.env.CORAL_REQUIRE_NATIVE_APE_HELPER === 'true';

const record = (name, fn) => {
  try {
    fn();
    console.log(`[nativeApeHelperSmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[nativeApeHelperSmoke] fail ${name}: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const readWavDataSize = (buffer) => {
  assert(buffer.subarray(0, 4).toString('ascii') === 'RIFF', 'decoded output missing RIFF');
  assert(buffer.subarray(8, 12).toString('ascii') === 'WAVE', 'decoded output missing WAVE');

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.subarray(offset, offset + 4).toString('ascii');
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') return chunkSize;
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  throw new Error('decoded WAV output missing data chunk');
};

const findFfmpegPath = () => {
  // eslint-disable-next-line global-require
  const ffmpegPath = require('ffmpeg-static');
  assert(ffmpegPath && fs.existsSync(ffmpegPath), 'ffmpeg-static binary is required');
  return ffmpegPath;
};

const hasHelper = () => {
  const stat = fs.statSync(helperPath, { throwIfNoEntry: false });
  return Boolean(stat?.isFile());
};

record('native ape helper is available when required', () => {
  if (hasHelper()) return;
  assert(!requireHelper, `native APE helper missing at ${helperPath}`);
  console.log(`[nativeApeHelperSmoke] skip native APE helper missing at ${helperPath}`);
});

if (hasHelper()) {
  record('native ape helper command line is usable', () => {
    const result = spawnSync(helperPath, ['--help'], { encoding: 'utf8' });
    const help = `${result.stdout || ''}${result.stderr || ''}`;
    assert(result.status === 0, 'helper --help should exit cleanly');
    assert(help.includes('--input'), 'helper usage should mention --input');
    assert(help.includes('--start-ms'), 'helper usage should mention cue range args');
  });

  record('native ape helper roundtrips generated ape range to wav', () => {
    const ffmpegPath = findFfmpegPath();
    const fixtureDir = path.join(os.tmpdir(), `coral-native-ape-${process.pid}`);
    fs.rmSync(fixtureDir, { recursive: true, force: true });
    fs.mkdirSync(fixtureDir, { recursive: true });
    const wavPath = path.join(fixtureDir, 'sample.wav');
    const apePath = path.join(fixtureDir, 'sample.ape');

    execFileSync(
      ffmpegPath,
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=440:duration=0.6',
        '-ac',
        '2',
        '-ar',
        '44100',
        '-acodec',
        'pcm_s16le',
        wavPath,
      ],
      { stdio: 'inherit' },
    );

    execFileSync(helperPath, ['--input', wavPath, '--smoke-encode-wav-to-ape', apePath], {
      stdio: 'inherit',
    });
    assert(fs.statSync(apePath).size > 1024, 'generated APE fixture looks too small');

    const fullDecoded = execFileSync(helperPath, ['--input', apePath, '--format', 'wav']);
    const fullDataSize = readWavDataSize(fullDecoded);
    assert(fullDataSize > 80_000, 'full APE decode should contain the whole fixture');

    const rangeDecoded = execFileSync(helperPath, [
      '--input',
      apePath,
      '--format',
      'wav',
      '--start-ms',
      '100',
      '--end-ms',
      '300',
    ]);
    const rangeDataSize = readWavDataSize(rangeDecoded);
    assert(rangeDataSize > 8192, 'decoded APE range is too small');
    assert(
      rangeDataSize < fullDataSize / 2,
      'decoded APE range should be substantially smaller than full album output',
    );
  });
}

if (failures.length) {
  console.error(`\n[nativeApeHelperSmoke] ${failures.length} check(s) failed`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('\n[nativeApeHelperSmoke] passed');
