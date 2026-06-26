process.env.NODE_ENV = 'development'

const chalk = require('chalk')
const electron = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { Arch } = require('electron-builder')
const replaceLib = require('./build-before-pack')
const treeKill = require('tree-kill')
const { debounce } = require('./utils')

const mainConfig = path.join(__dirname, 'vite/main.config.ts')
const preloadConfig = path.join(__dirname, 'vite/preload.config.ts')
const rendererConfig = path.join(__dirname, 'vite/renderer.config.ts')
const lyricConfig = path.join(__dirname, 'vite/lyric.config.ts')

let electronProcess = null
let isShuttingDown = false
const closeHandlers = []

const logs = [
  'Manifest version 2 is deprecated, and support will be removed in 2023',
  '"Extension server error: Operation failed: Permission denied", source: devtools://devtools/bundled',
  '"Electron sandbox_bundle.js script failed to run"',
  '"TypeError: object null is not iterable (cannot read property Symbol(Symbol.iterator))",',
  "'session.getAllExtensions' is deprecated",
  'error messaging the mach port for IMKCFRunLoopWakeUpReliable',
  'representedObject is not a WeakPtrToElectronMenuModelAsNSObject',
]

function electronLog(data, color) {
  const log = data.toString()
  if (!/[0-9A-z]+/.test(log)) return
  if (color === 'red' && logs.some(item => log.includes(item))) return
  console.log(chalk[color](log))
}

function killElectron() {
  if (!electronProcess) return
  electronProcess.removeAllListeners()
  treeKill(electronProcess.pid)
  electronProcess = null
}

const restartElectron = debounce(() => {
  killElectron()
  startElectron()
}, 200)

function startElectron() {
  const args = [
    '--inspect=5858',
    path.join(__dirname, '../dist/main.js'),
  ]

  const npmExecPath = process.env.npm_execpath ?? ''
  if (npmExecPath.endsWith('yarn.js')) {
    args.push(...process.argv.slice(3))
  } else if (npmExecPath.endsWith('npm-cli.js')) {
    args.push(...process.argv.slice(2))
  }

  electronProcess = spawn(electron, args, { env: { ...process.env } })
  electronProcess.stdout.on('data', data => electronLog(data, 'blue'))
  electronProcess.stderr.on('data', data => electronLog(data, 'red'))
  electronProcess.on('close', () => {
    if (!isShuttingDown) {
      shutdown().catch(console.error)
    }
  })
}

function getDevServerUrl(server, name) {
  const localUrl = server.resolvedUrls?.local?.[0]
  if (!localUrl) {
    throw new Error(`${name} dev server did not expose a local URL`)
  }
  return localUrl
}

function withPath(url, pathname) {
  return new URL(pathname, url).toString()
}

function printDevServerError(name, err) {
  if (!['EPERM', 'EADDRINUSE'].includes(err?.code)) return

  const isLyric = name === 'renderer-lyric'
  const portEnv = isLyric ? 'CORAL_LYRIC_DEV_PORT' : 'CORAL_RENDERER_DEV_PORT'
  const fallbackPort = isLyric ? 9181 : 9180
  console.error(chalk.red(`${name} dev server cannot listen on ${err.address ?? '127.0.0.1'}:${err.port ?? 'unknown'} (${err.code})`))
  console.error(chalk.yellow(`Try: CORAL_DEV_HOST=localhost ${portEnv}=${fallbackPort} npm run dev`))
}

async function startViteServer(name, configFile) {
  const { createServer } = await import('vite')
  const server = await createServer({
    configFile,
    mode: 'development',
  })
  try {
    await server.listen()
  } catch (err) {
    printDevServerError(name, err)
    throw err
  }
  closeHandlers.push(() => server.close())
  const url = getDevServerUrl(server, name)
  console.log(chalk.green(`${name} dev server ready`))
  server.printUrls()
  return url
}

async function watchViteBuild(name, configFile, onRebuild) {
  const { build } = await import('vite')
  let firstRun = true

  return new Promise((resolve, reject) => {
    build({
      configFile,
      mode: 'development',
      build: {
        watch: {},
      },
    }).then((watcher) => {
      closeHandlers.push(() => watcher.close())
      watcher.on('event', (event) => {
        if (event.code === 'START') {
          console.log(chalk.cyan(`${name} building...`))
          return
        }
        if (event.code === 'ERROR') {
          console.error(chalk.red(`${name} build failed`))
          console.error(event.error)
          if (firstRun) reject(event.error)
          return
        }
        if (event.code !== 'END') return
        console.log(chalk.green(`${name} build ready`))
        if (firstRun) {
          firstRun = false
          resolve(undefined)
        } else {
          onRebuild?.()
        }
      })
    }).catch(reject)
  })
}

async function shutdown(exitCode = 0) {
  isShuttingDown = true
  killElectron()
  await Promise.all(closeHandlers.splice(0).map(async close => {
    await close()
  }))
  process.exit(exitCode)
}

async function init() {
  await replaceLib({ electronPlatformName: process.platform, arch: Arch[process.arch] })

  const [rendererUrl, lyricBaseUrl] = await Promise.all([
    startViteServer('renderer', rendererConfig),
    startViteServer('renderer-lyric', lyricConfig),
    watchViteBuild('renderer-scripts', preloadConfig),
    watchViteBuild('main', mainConfig, restartElectron),
  ])

  process.env.CORAL_RENDERER_DEV_URL = rendererUrl
  process.env.CORAL_LYRIC_DEV_URL = withPath(lyricBaseUrl, 'lyric.html')

  startElectron()
}

process.on('SIGINT', () => {
  shutdown().catch(console.error)
})
process.on('SIGTERM', () => {
  shutdown().catch(console.error)
})

init().catch((err) => {
  console.error(err)
  shutdown(1).catch(console.error)
})
