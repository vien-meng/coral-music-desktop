import type { ConfigEnv, UserConfig, UserConfigExport } from 'vite'
import { defineConfig } from 'vite'
import rendererConfig from './build-config/vite/renderer.config'
import lyricConfig from './build-config/vite/lyric.config'
import mainConfig from './build-config/vite/main.config'
import preloadConfig from './build-config/vite/preload.config'

type CoralViteTarget = 'renderer' | 'lyric' | 'main' | 'preload'

const targetConfigs: Record<CoralViteTarget, UserConfigExport> = {
  renderer: rendererConfig,
  lyric: lyricConfig,
  main: mainConfig,
  preload: preloadConfig,
}

const targets = Object.keys(targetConfigs) as CoralViteTarget[]

const getTarget = (): CoralViteTarget => {
  const target = process.env.CORAL_VITE_TARGET
  if (target && targets.includes(target as CoralViteTarget)) return target as CoralViteTarget
  return 'renderer'
}

const resolveTargetConfig = async(config: UserConfigExport, env: ConfigEnv): Promise<UserConfig> => {
  return await (typeof config === 'function' ? config(env) : config)
}

export default defineConfig(async(env) => {
  return resolveTargetConfig(targetConfigs[getTarget()], env)
})
