// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import Logger from '@dreamnet/logplease'
import path from 'path'
import {
  consola, LogEvent, Warning, Exception,
} from '~/modules/consola'

require('dotenv').config()

const { getPath } = $provider.paths
const { fs } = $provider

// eslint-disable-next-line no-console
console.log(`ENV Path: ${path.resolve(process.cwd(), '.env')}`)

if (!process.env.BUILD_TARGET || !process.env.npm_package_displayName) {
  throw new Error('This installation is corrupt, please contact the developers.')
}

// logger setup.
const logDate = new Date().toJSON().slice(0, 10)

const logDir = getPath('userData', 'logs', logDate)
fs.ensureDirSync(logDir)

Logger.setOptions({
  filename: getPath('userData', 'logs', logDate, 'renderer.log'),
  logLevel: process.env.LOG || 'debug',
})

/**
 * Consola.
 */
window.consola = consola

/**
 * Log exceptions.
 */
window.LogEvent = LogEvent
window.Warning = Warning
window.Exception = Exception

export default ({ redirect }) => {
  window.$redirect = redirect
}
