const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const failures = [];
const sampleDir = path.resolve(
  root,
  process.env.CORAL_AUDIO_SAMPLE_DIR || 'test-fixtures/local-audio',
);
const requireSamples = process.env.CORAL_REQUIRE_EXTERNAL_AUDIO_SAMPLES === 'true';

const record = (name, fn) => {
  try {
    fn();
    console.log(`[externalAudioSampleSmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[externalAudioSampleSmoke] fail ${name}: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const loadTsModule = (file) => {
  const absolutePath = path.join(root, file);
  const source = fs.readFileSync(absolutePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: absolutePath,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(transpiled, {
    exports: module.exports,
    module,
    require,
  });
  return module.exports;
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(filePath);
    return entry.isFile() ? [filePath] : [];
  });
};

const getExtension = (filePath) => path.extname(filePath).slice(1).toLowerCase();

const getInputFormat = (filePath) => (getExtension(filePath) === 'dff' ? 'iff' : null);

const uint32Le = (value) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
};

const uint64Le = (value) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value));
  return buffer;
};

const uint16Be = (value) => {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value);
  return buffer;
};

const uint32Be = (value) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
};

const uint64Be = (value) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(value));
  return buffer;
};

const iffChunk = (name, data) =>
  Buffer.concat([
    Buffer.from(name),
    uint64Be(data.length),
    data,
    data.length % 2 ? Buffer.from([0]) : Buffer.alloc(0),
  ]);

const writeSyntheticDsf = (filePath) => {
  const channelCount = 1;
  const blockSizePerChannel = 4096;
  const sampleCount = blockSizePerChannel * 8;
  const dsdData = Buffer.alloc(blockSizePerChannel * channelCount, 0x69);
  const dsdChunkSize = 28;
  const fmtChunkSize = 52;
  const dataChunkSize = 12 + dsdData.length;
  const fileSize = dsdChunkSize + fmtChunkSize + dataChunkSize;
  fs.writeFileSync(
    filePath,
    Buffer.concat([
      Buffer.from('DSD '),
      uint64Le(dsdChunkSize),
      uint64Le(fileSize),
      uint64Le(0),
      Buffer.from('fmt '),
      uint64Le(fmtChunkSize),
      uint32Le(1),
      uint32Le(0),
      uint32Le(1),
      uint32Le(channelCount),
      uint32Le(2822400),
      uint32Le(1),
      uint64Le(sampleCount),
      uint32Le(blockSizePerChannel),
      uint32Le(0),
      Buffer.from('data'),
      uint64Le(dataChunkSize),
      dsdData,
    ]),
  );
};

const writeSyntheticDff = (filePath) => {
  const dsdData = Buffer.alloc(4096, 0x69);
  const compressionName = Buffer.from('not compressed');
  const formBody = Buffer.concat([
    Buffer.from('DSD '),
    iffChunk('FVER', uint32Be(0x01050000)),
    iffChunk(
      'PROP',
      Buffer.concat([
        Buffer.from('SND '),
        iffChunk('FS  ', uint32Be(2822400)),
        iffChunk('CHNL', Buffer.concat([uint16Be(1), Buffer.from('SLFT')])),
        iffChunk(
          'CMPR',
          Buffer.concat([
            Buffer.from('DSD '),
            Buffer.from([compressionName.length]),
            compressionName,
            compressionName.length % 2 === 0 ? Buffer.from([0]) : Buffer.alloc(0),
          ]),
        ),
      ]),
    ),
    iffChunk('DSD ', dsdData),
  ]);
  fs.writeFileSync(
    filePath,
    Buffer.concat([Buffer.from('FRM8'), uint64Be(formBody.length), formBody]),
  );
};

const assertWavHeader = (buffer, label) => {
  assert(buffer.length >= 12, `${label} output is too short`);
  assert(buffer.subarray(0, 4).toString('ascii') === 'RIFF', `${label} output missing RIFF header`);
  assert(
    buffer.subarray(8, 12).toString('ascii') === 'WAVE',
    `${label} output missing WAVE header`,
  );
};

const decodeSampleToWavHeader = (ffmpegPath, createExternalDecoderStreamArgs, filePath, range) => {
  const args = createExternalDecoderStreamArgs({
    endMs: range?.endMs ?? 350,
    inputFormat: getInputFormat(filePath),
    inputPath: filePath,
    startMs: range?.startMs ?? 0,
  });
  const output = execFileSync(ffmpegPath, args, {
    cwd: root,
    maxBuffer: 8 * 1024 * 1024,
    timeout: 20_000,
  });
  assertWavHeader(output, path.basename(filePath));
};

const findCueRange = (parseCueTracks, cuePath) => {
  const pathTools = {
    basename: path.basename,
    dirname: path.dirname,
    joinPath: path.join,
  };
  const tracks = parseCueTracks(fs.readFileSync(cuePath, 'utf8'), cuePath, pathTools);
  assert(tracks.length > 0, `${cuePath} should contain at least one track`);
  const firstTrack = tracks[0];
  assert(fs.existsSync(firstTrack.filePath), `CUE referenced file missing: ${firstTrack.filePath}`);
  const secondTrack = tracks.find(
    (track) => track.filePath === firstTrack.filePath && track.trackNo > firstTrack.trackNo,
  );
  return {
    filePath: firstTrack.filePath,
    range: {
      endMs: secondTrack
        ? Math.min(secondTrack.startMs, firstTrack.startMs + 350)
        : firstTrack.startMs + 350,
      startMs: firstTrack.startMs,
    },
  };
};

record('external audio sample directory is available when required', () => {
  if (!requireSamples) return;
  assert(fs.existsSync(sampleDir), `sample dir missing: ${sampleDir}`);
});

// eslint-disable-next-line global-require, import/no-dynamic-require
const ffmpegPath = require(path.join(root, 'node_modules/ffmpeg-static'));
const { createExternalDecoderStreamArgs } = loadTsModule('src/shared/externalDecoderStreamArgs.ts');
const { parseCueTracks } = loadTsModule('src/shared/localAlbumCueParser.ts');

record('synthetic dsf decodes through stream args', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coral-dsf-sample-'));
  try {
    const dsfPath = path.join(tempDir, 'synthetic.dsf');
    writeSyntheticDsf(dsfPath);
    decodeSampleToWavHeader(ffmpegPath, createExternalDecoderStreamArgs, dsfPath);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

record('synthetic dff decodes through stream args', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coral-dff-sample-'));
  try {
    const dffPath = path.join(tempDir, 'synthetic.dff');
    writeSyntheticDff(dffPath);
    decodeSampleToWavHeader(ffmpegPath, createExternalDecoderStreamArgs, dffPath);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

const supportedSampleExtensions = new Set(['ape', 'dsf', 'dff', 'cue', 'sfv']);
const sampleFiles = walk(sampleDir).filter((filePath) =>
  supportedSampleExtensions.has(getExtension(filePath)),
);
const externalAudioFiles = sampleFiles.filter((filePath) =>
  ['ape', 'dsf', 'dff'].includes(getExtension(filePath)),
);
const cueFiles = sampleFiles.filter((filePath) => getExtension(filePath) === 'cue');

if (!sampleFiles.length) {
  const message = `no external audio samples found at ${sampleDir}`;
  if (requireSamples) failures.push(message);
  else console.log(`[externalAudioSampleSmoke] skip ${message}`);
} else {
  record('external samples decode through stream args', () => {
    assert(externalAudioFiles.length > 0, `expected .ape/.dsf/.dff files under ${sampleDir}`);
    for (const filePath of externalAudioFiles) {
      decodeSampleToWavHeader(ffmpegPath, createExternalDecoderStreamArgs, filePath);
    }
  });

  record('cue album samples decode first track range', () => {
    if (!cueFiles.length) return;
    for (const cuePath of cueFiles) {
      const { filePath, range } = findCueRange(parseCueTracks, cuePath);
      decodeSampleToWavHeader(ffmpegPath, createExternalDecoderStreamArgs, filePath, range);
    }
  });
}

if (failures.length) {
  console.error(`\n[externalAudioSampleSmoke] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[externalAudioSampleSmoke] passed');
