const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const failures = [];
const requireWindowsPackage =
  process.env.CORAL_REQUIRE_WINDOWS_PACKAGE_SMOKE === 'true' || process.platform === 'win32';

const record = (name, fn) => {
  try {
    fn();
    console.log(`[windowsPackageSmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[windowsPackageSmoke] fail ${name}: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const windowsUnpackedDir = path.join(root, 'build/win-unpacked');
const packagedHelperPath = path.join(windowsUnpackedDir, 'resources/bin/coral-ape-helper.exe');
const localHelperPath = path.join(root, 'resources/bin/coral-ape-helper.exe');

record('Windows unpacked package exists when required', () => {
  if (fs.existsSync(windowsUnpackedDir)) return;
  assert(
    !requireWindowsPackage,
    `Windows unpacked package missing at ${windowsUnpackedDir}; run npm run pack:win:setup:x64 or electron-builder target=win first`,
  );
  console.log(`[windowsPackageSmoke] skip missing Windows package at ${windowsUnpackedDir}`);
});

if (fs.existsSync(windowsUnpackedDir)) {
  record('Windows package contains native ape helper exe', () => {
    const stats = fs.statSync(packagedHelperPath, { throwIfNoEntry: false });
    assert(stats?.isFile(), `missing packaged helper: ${packagedHelperPath}`);
    assert(stats.size > 64 * 1024, `packaged helper is unexpectedly small: ${stats.size} bytes`);
  });
}

record('local Windows helper exe exists on Windows build machines', () => {
  if (process.platform !== 'win32' && !process.env.CORAL_REQUIRE_WINDOWS_HELPER_EXE) return;
  const stats = fs.statSync(localHelperPath, { throwIfNoEntry: false });
  assert(stats?.isFile(), `missing local Windows helper: ${localHelperPath}`);
  assert(stats.size > 64 * 1024, `local Windows helper is unexpectedly small: ${stats.size} bytes`);
});

if (process.platform === 'win32' && fs.existsSync(localHelperPath)) {
  record('local Windows helper command line is usable', () => {
    const result = spawnSync(localHelperPath, ['--help'], { encoding: 'utf8' });
    const help = `${result.stdout || ''}${result.stderr || ''}`;
    assert(result.status === 0, 'helper --help should exit cleanly');
    assert(help.includes('--input'), 'helper usage should mention --input');
    assert(help.includes('--start-ms'), 'helper usage should mention range args');
  });
}

if (failures.length) {
  console.error(`\n[windowsPackageSmoke] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[windowsPackageSmoke] passed');
