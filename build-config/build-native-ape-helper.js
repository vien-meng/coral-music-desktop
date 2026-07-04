const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sdkUrl = 'https://monkeysaudio.com/files/MAC_1317_SDK.zip';
const cacheDir = path.join(os.tmpdir(), 'coral-native-ape-helper');
const sdkZip = path.join(cacheDir, 'MAC_1317_SDK.zip');
const sdkDir = process.env.MAC_SDK_DIR || path.join(cacheDir, 'MAC_1317_SDK');
const outputPath = path.join(
  root,
  'resources/bin',
  process.platform === 'win32' ? 'coral-ape-helper.exe' : 'coral-ape-helper',
);
const compilerPreference = process.env.CORAL_NATIVE_APE_CXX || '';

const sharedSources = [
  'Source/Shared/BufferIO.cpp',
  'Source/Shared/CharacterHelper.cpp',
  'Source/Shared/CircleBuffer.cpp',
  'Source/Shared/CPUFeatures.cpp',
  'Source/Shared/CRC.cpp',
  'Source/Shared/GlobalFunctions.cpp',
  'Source/Shared/MemoryIO.cpp',
  'Source/Shared/Semaphore.cpp',
  'Source/Shared/Thread.cpp',
  'Source/Shared/WholeFileIO.cpp',
  process.platform === 'win32' ? 'Source/Shared/WinFileIO.cpp' : 'Source/Shared/StdLibFileIO.cpp',
];

const macLibSources = [
  'Source/MACLib/APECompress.cpp',
  'Source/MACLib/APECompressCore.cpp',
  'Source/MACLib/APECompressCreate.cpp',
  'Source/MACLib/APEDecompress.cpp',
  'Source/MACLib/APEDecompressCore.cpp',
  'Source/MACLib/APEHeader.cpp',
  'Source/MACLib/APEInfo.cpp',
  'Source/MACLib/APELink.cpp',
  'Source/MACLib/APETag.cpp',
  'Source/MACLib/BitArray.cpp',
  'Source/MACLib/FloatTransform.cpp',
  'Source/MACLib/MACLib.cpp',
  'Source/MACLib/MACProgressHelper.cpp',
  'Source/MACLib/MD5.cpp',
  'Source/MACLib/NewPredictor.cpp',
  'Source/MACLib/NNFilter.cpp',
  'Source/MACLib/NNFilterGeneric.cpp',
  'Source/MACLib/Prepare.cpp',
  'Source/MACLib/UnBitArray.cpp',
  'Source/MACLib/UnBitArrayBase.cpp',
  'Source/MACLib/WAVInputSource.cpp',
  'Source/MACLib/Old/NewPredictorOld.cpp',
  'Source/MACLib/Old/AntiPredictorOld.cpp',
  'Source/MACLib/Old/AntiPredictorExtraHighOld.cpp',
  'Source/MACLib/Old/AntiPredictorFastOld.cpp',
  'Source/MACLib/Old/AntiPredictorHighOld.cpp',
  'Source/MACLib/Old/AntiPredictorNormalOld.cpp',
  'Source/MACLib/Old/APEDecompressCoreOld.cpp',
  'Source/MACLib/Old/APEDecompressOld.cpp',
  'Source/MACLib/Old/UnBitArrayOld.cpp',
  'Source/MACLib/Old/UnMACOld.cpp',
];

const archSources =
  process.arch === 'x64'
    ? [
        'Source/MACLib/NNFilterAVX2.cpp',
        'Source/MACLib/NNFilterAVX512.cpp',
        'Source/MACLib/NNFilterSSE2.cpp',
        'Source/MACLib/NNFilterSSE4.1.cpp',
      ]
    : process.arch === 'arm64'
      ? ['Source/MACLib/NNFilterNeon.cpp']
      : [];

const compileFlagsBySource = new Map([
  ['Source/MACLib/NNFilterAVX2.cpp', ['-mavx2']],
  ['Source/MACLib/NNFilterAVX512.cpp', ['-mavx512dq', '-mavx512bw']],
  ['Source/MACLib/NNFilterSSE2.cpp', ['-msse2']],
  ['Source/MACLib/NNFilterSSE4.1.cpp', ['-msse4.1']],
]);

const platformDefine =
  process.platform === 'win32'
    ? 'PLATFORM_WINDOWS'
    : process.platform === 'darwin'
      ? 'PLATFORM_APPLE'
      : 'PLATFORM_LINUX';

const run = (command, args, options = {}) => {
  console.log([command, ...args].join(' '));
  execFileSync(command, args, { stdio: 'inherit', ...options });
};

const commandExists = (command) => {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [command], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
};

const resolveCompiler = () => {
  if (compilerPreference) {
    if (compilerPreference.toLowerCase().endsWith('cl.exe') || compilerPreference === 'cl') {
      return { kind: 'msvc', command: compilerPreference };
    }
    return { kind: 'clang', command: compilerPreference };
  }
  if (process.platform === 'win32' && commandExists('cl.exe')) {
    return { kind: 'msvc', command: 'cl.exe' };
  }
  if (commandExists('clang++')) {
    return { kind: 'clang', command: 'clang++' };
  }
  throw new Error(
    process.platform === 'win32'
      ? 'Missing native C++ compiler. Run from a Visual Studio Developer Prompt with cl.exe, or set CORAL_NATIVE_APE_CXX to clang++/cl.exe.'
      : 'Missing clang++. Install Xcode Command Line Tools or set CORAL_NATIVE_APE_CXX.',
  );
};

const ensureSdk = () => {
  if (fs.existsSync(path.join(sdkDir, 'Source/MACLib/MACLib.h'))) return;
  fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(sdkZip)) {
    run('curl', ['-L', '--fail', sdkUrl, '-o', sdkZip]);
  }
  fs.rmSync(sdkDir, { recursive: true, force: true });
  run('unzip', ['-q', sdkZip, '-d', sdkDir]);
};

const clangCompileObject = (compiler, sourcePath, objectPath) => {
  const relativeSource = path.relative(sdkDir, sourcePath).split(path.sep).join('/');
  run(compiler.command, [
    '-std=c++11',
    '-O2',
    '-DNDEBUG',
    `-D${platformDefine}`,
    `-I${path.join(sdkDir, 'Source/Shared')}`,
    `-I${path.join(sdkDir, 'Source/MACLib')}`,
    ...(compileFlagsBySource.get(relativeSource) ?? []),
    '-c',
    sourcePath,
    '-o',
    objectPath,
  ]);
};

const msvcCompileObject = (compiler, sourcePath, objectPath) => {
  run(compiler.command, [
    '/nologo',
    '/std:c++14',
    '/O2',
    '/DNDEBUG',
    `/D${platformDefine}`,
    `/I${path.join(sdkDir, 'Source/Shared')}`,
    `/I${path.join(sdkDir, 'Source/MACLib')}`,
    '/EHsc',
    '/c',
    sourcePath,
    `/Fo${objectPath}`,
  ]);
};

const compileObject = (compiler, sourcePath, objectPath) => {
  if (compiler.kind === 'msvc') {
    msvcCompileObject(compiler, sourcePath, objectPath);
    return;
  }
  clangCompileObject(compiler, sourcePath, objectPath);
};

const linkObjects = (compiler, objects) => {
  if (compiler.kind === 'msvc') {
    run(compiler.command, ['/nologo', ...objects, `/Fe${outputPath}`]);
    return;
  }
  run(compiler.command, [...objects, '-o', outputPath]);
};

const main = () => {
  ensureSdk();
  const compiler = resolveCompiler();
  const buildDir = path.join(cacheDir, `build-${process.platform}-${process.arch}`);
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.mkdirSync(buildDir, { recursive: true });

  const helperSource = path.join(root, 'build-config/native-ape-helper/coral-ape-helper.cpp');
  const sources = [...sharedSources, ...macLibSources, ...archSources].map((source) =>
    path.join(sdkDir, source),
  );
  sources.push(helperSource);

  const objectExt = compiler.kind === 'msvc' ? '.obj' : '.o';
  const objects = sources.map((source, index) => path.join(buildDir, `${index}${objectExt}`));
  sources.forEach((source, index) => compileObject(compiler, source, objects[index]));

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  linkObjects(compiler, objects);
  fs.chmodSync(outputPath, 0o755);
  console.log(`Built ${outputPath}`);
};

main();
