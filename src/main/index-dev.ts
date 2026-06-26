/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` and can optionally install React DevTools. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

import { app } from 'electron'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import { openDevTools } from './utils'

const shouldEnableElectronDebug = process.env.CORAL_ENABLE_ELECTRON_DEBUG === 'true'
const shouldInstallReactDevTools = process.env.CORAL_INSTALL_REACT_DEVTOOLS === 'true'

const maybeInstallReactDevTools = (name: string, win: Electron.BrowserWindow): void => {
  if (!shouldInstallReactDevTools) return

  installExtension(REACT_DEVELOPER_TOOLS, { session: win.webContents.session })
    .then((extensionName: string) => {
      console.log(`[${name}] Added Extension:  ${extensionName}`)
    })
    .catch((err: Error) => {
      console.warn(`[${name}] React DevTools install skipped: ${err.message}`)
    })
}
if (shouldEnableElectronDebug) {
  void import('electron-debug')
    .then(({ default: electronDebug }) => {
      electronDebug({
        showDevTools: false,
        devToolsMode: 'undocked',
      })
    })
    .catch((err: Error) => {
      console.warn(`electron-debug skipped: ${err.message}`)
    })
}

app.on('ready', () => {
  global.lx.event_app.on('main_window_created', (win) => {
    openDevTools(win.webContents)
    maybeInstallReactDevTools('main window', win)
  })
  global.lx.event_app.on('desktop_lyric_window_created', (win) => {
    openDevTools(win.webContents)
    maybeInstallReactDevTools('lyric window', win)
  })
})

// Require `main` process to boot app
require('./index')
