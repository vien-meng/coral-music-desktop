process.env.NODE_ENV = 'production'

const chalk = require('chalk')
const del = require('del')
const path = require('path')
const Spinnies = require('spinnies')

const configs = [
  ['renderer', 'vite/renderer.config.ts'],
  ['renderer-lyric', 'vite/lyric.config.ts'],
  ['renderer-scripts', 'vite/preload.config.ts'],
  ['main', 'vite/main.config.ts'],
]

const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgGreen.white(' OKAY ') + ' '

async function buildTarget(name, configFile) {
  const { build } = await import('vite')
  await build({
    configFile: path.join(__dirname, configFile),
    mode: 'production',
  })
}

async function build() {
  console.time('build')
  del.sync(['dist/**', 'build/**'])

  const spinners = new Spinnies({ color: 'blue' })
  for (const [name] of configs) {
    spinners.add(name, { text: `${name} building` })
  }

  for (const [name, configFile] of configs) {
    try {
      await buildTarget(name, configFile)
      spinners.succeed(name, { text: `${name} build success!` })
    } catch (err) {
      spinners.fail(name, { text: `${name} build fail :(` })
      console.log(`\n  ${errorLog}failed to build ${name}`)
      console.error(`\n${err.stack || err}\n`)
      process.exit(1)
    }
  }

  console.log(`\n${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`)
  console.timeEnd('build')
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
