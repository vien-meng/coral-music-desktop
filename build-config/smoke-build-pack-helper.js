const fs = require('node:fs');
const path = require('node:path');
const {
  ensureNativeApeHelper,
  getNativeApeHelperPath,
  normalizeTargetPlatform,
  parseParams,
} = require('./build-pack');

const root = path.resolve(__dirname, '..');
const failures = [];

const record = (name, fn) => {
  try {
    fn();
    console.log(`[buildPackHelperSmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[buildPackHelperSmoke] fail ${name}: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

record('target platform normalization is explicit', () => {
  assert(normalizeTargetPlatform('win') === 'win32', 'win target should map to win32');
  assert(normalizeTargetPlatform('mac') === 'darwin', 'mac target should map to darwin');
  assert(normalizeTargetPlatform('linux') === 'linux', 'linux target should map to linux');
  assert(normalizeTargetPlatform('dir') === process.platform, 'dir target should map to host');
});

record('native ape helper path follows target platform', () => {
  assert(
    getNativeApeHelperPath('win32') === path.join(root, 'resources/bin/coral-ape-helper.exe'),
    'Windows helper path should require coral-ape-helper.exe',
  );
  assert(
    getNativeApeHelperPath('darwin') === path.join(root, 'resources/bin/coral-ape-helper'),
    'macOS helper path should require coral-ape-helper',
  );
  assert(
    getNativeApeHelperPath('linux') === path.join(root, 'resources/bin/coral-ape-helper'),
    'Linux helper path should require coral-ape-helper',
  );
});

record('cli params parse package target fields', () => {
  const params = parseParams(['target=win', 'arch=x64', 'type=setup', 'publish=never']);
  assert(params.target === 'win', 'target should parse');
  assert(params.arch === 'x64', 'arch should parse');
  assert(params.type === 'setup', 'type should parse');
  assert(params.publish === 'never', 'publish should parse');
});

record('current platform helper is present before packaging', () => {
  const helperPath = getNativeApeHelperPath(process.platform);
  assert(fs.existsSync(helperPath), `${helperPath} missing; run npm run build:native-ape-helper`);
  ensureNativeApeHelper('dir');
});

record('cross-platform Windows packaging refuses missing exe helper', () => {
  if (process.platform === 'win32') return;
  try {
    ensureNativeApeHelper('win');
  } catch (error) {
    assert(
      error.message.includes('Missing native APE helper for win32') &&
        error.message.includes('coral-ape-helper.exe'),
      'missing Windows helper should fail with a clear .exe message',
    );
    return;
  }
  throw new Error('cross-platform Windows packaging should fail without explicit override');
});

record('cross-platform Linux packaging refuses host helper reuse', () => {
  if (process.platform === 'linux') return;
  try {
    ensureNativeApeHelper('linux');
  } catch (error) {
    assert(
      error.message.includes('Missing native APE helper for linux') &&
        error.message.includes('coral-ape-helper'),
      'cross-platform Linux helper should fail with a clear helper message',
    );
    return;
  }
  throw new Error('cross-platform Linux packaging should fail without explicit override');
});

if (failures.length) {
  console.error(`\n[buildPackHelperSmoke] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[buildPackHelperSmoke] passed');
