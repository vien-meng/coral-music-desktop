/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` and can optionally install React DevTools. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

import { app } from 'electron'
import electronDebug from 'electron-debug'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import { openDevTools } from './utils'

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
// Install `electron-debug` with `devtron`
electronDebug({
  showDevTools: false,
  devToolsMode: 'undocked',
})

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
