export const isLinux = process.platform == 'linux'
export const isWin = process.platform == 'win32'
export const isMac = process.platform == 'darwin'
export const isProd = process.env.NODE_ENV == 'production'

type LogMethod = (...args: unknown[]) => void

interface RuntimeLogger {
  debug: LogMethod
  error: LogMethod
  info: LogMethod
  warn: LogMethod
}

interface NodeRequireGlobal {
  require?: (moduleName: 'electron-log/node') => RuntimeLogger
}

let runtimeLog: RuntimeLogger | null = null

const consoleLog: RuntimeLogger = {
  debug: (...args) => { console.debug(...args) },
  error: (...args) => { console.error(...args) },
  info: (...args) => { console.info(...args) },
  warn: (...args) => { console.warn(...args) },
}

const getRuntimeLog = (): RuntimeLogger => {
  if (runtimeLog) return runtimeLog
  const nodeRequire = typeof require === 'function'
    ? require
    : (globalThis as typeof globalThis & NodeRequireGlobal).require
  if (!nodeRequire) return consoleLog
  const loadedLog = nodeRequire('electron-log/node')
  runtimeLog = loadedLog
  return loadedLog
}

const log: RuntimeLogger = {
  debug: (...args) => { getRuntimeLog().debug(...args) },
  error: (...args) => { getRuntimeLog().error(...args) },
  info: (...args) => { getRuntimeLog().info(...args) },
  warn: (...args) => { getRuntimeLog().warn(...args) },
}

export const getPlatform = (platform: NodeJS.Platform = process.platform) => {
  switch (platform) {
    case 'win32': return 'windows'
    case 'darwin': return 'mac'
    default: return 'linux'
  }
}


// https://stackoverflow.com/a/53387532
export function compareVer(currentVer: string, targetVer: string): -1 | 0 | 1 {
  // treat non-numerical characters as lower version
  // replacing them with a negative number based on charcode of each character
  const fix = (s: string) => `.${s.toLowerCase().charCodeAt(0) - 2147483647}.`

  const currentVerArr: Array<string | number> = ('' + currentVer).replace(/[^0-9.]/g, fix).split('.')
  const targetVerArr: Array<string | number> = ('' + targetVer).replace(/[^0-9.]/g, fix).split('.')
  let c = Math.max(currentVerArr.length, targetVerArr.length)
  for (let i = 0; i < c; i++) {
    // convert to integer the most efficient way
    currentVerArr[i] = ~~currentVerArr[i]
    targetVerArr[i] = ~~targetVerArr[i]
    if (currentVerArr[i] > targetVerArr[i]) return 1
    else if (currentVerArr[i] < targetVerArr[i]) return -1
  }
  return 0
}


export {
  log,
}
