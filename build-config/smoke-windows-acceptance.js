const { spawnSync } = require('node:child_process');

const shouldRun =
  process.platform === 'win32' || process.env.CORAL_RUN_WINDOWS_ACCEPTANCE === 'true';

const node = process.execPath;
const checks = [
  {
    args: ['build-config/smoke-build-pack-helper.js'],
    env: {},
    name: 'build-pack helper guard',
  },
  {
    args: ['build-config/smoke-windows-package.js'],
    env: {
      CORAL_REQUIRE_WINDOWS_HELPER_EXE: 'true',
      CORAL_REQUIRE_WINDOWS_PACKAGE_SMOKE: 'true',
    },
    name: 'Windows packaged helper',
  },
  {
    args: ['build-config/smoke-native-ape-helper.js'],
    env: {
      CORAL_REQUIRE_NATIVE_APE_HELPER: 'true',
    },
    name: 'native APE helper roundtrip',
  },
  {
    args: ['build-config/smoke-playback-capabilities.js'],
    env: {},
    name: 'local playback and import capabilities',
  },
];

if (!shouldRun) {
  console.log(
    '[windowsAcceptance] skip non-Windows host; set CORAL_RUN_WINDOWS_ACCEPTANCE=true to force',
  );
  process.exit(0);
}

for (const check of checks) {
  console.log(`[windowsAcceptance] running ${check.name}`);
  const result = spawnSync(node, check.args, {
    env: { ...process.env, ...check.env },
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`[windowsAcceptance] failed ${check.name}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n[windowsAcceptance] passed');
