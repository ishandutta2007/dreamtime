const { stringify } = require('envfile')
const fs = require('fs')
const { pickBy, identity, toString } = require('lodash')
const { choice } = require('@dreamnet/app')
const pkg = require('../package.json')

// Normalize portable env
if (process.env.BUILD_PORTABLE) {
  const value = toString(process.env.BUILD_PORTABLE)

  if (value !== '1' && value !== 'true') {
    delete process.env.BUILD_PORTABLE
  }
}

// Default target ("target" on electron-builder)
if (!process.env.BUILD_TARGET || process.env.BUILD_TARGET === 'default') {
  if (process.env.BUILD_PORTABLE) {
    process.env.BUILD_TARGET = '7z'
  } else {
    process.env.BUILD_TARGET = choice({
      windows: 'nsis',
      linux: 'snap',
      macos: 'dmg',
    })
  }
}

// Release format
if (!process.env.BUILD_FORMAT) {
  process.env.BUILD_FORMAT = process.env.BUILD_TARGET

  if (!process.env.BUILD_PORTABLE && process.platform === 'win32') {
    // Windows installer is .exe not .nsis
    process.env.BUILD_FORMAT = 'exe'
  }
}

// Release arch
if (!process.env.BUILD_ARCH) {
  process.env.BUILD_ARCH = process.env.BUILD_PORTABLE ? 'portable' : 'installer'
}

// Release filename
if (!process.env.BUILD_FILENAME) {
  const osname = choice({
    windows: 'windows',
    linux: 'linux',
    macos: 'macos',
  })

  process.env.BUILD_FILENAME = `${pkg.displayName}-v${pkg.version}-${osname}-${process.env.BUILD_ARCH}.${process.env.BUILD_FORMAT}`
}

// Enviroment
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}

const payload = pickBy({
  // Node
  NODE_ENV: process.env.NODE_ENV,

  // Servers
  DREAMTRACK_HOST: process.env.DREAMTRACK_HOST,
  DOWNLOADS_API: process.env.DOWNLOADS_API,

  // Build
  GITHUB_SHA: process.env.GITHUB_SHA,
  BUILD_PORTABLE: process.env.BUILD_PORTABLE,
  BUILD_TARGET: process.env.BUILD_TARGET,
  BUILD_FORMAT: process.env.BUILD_FORMAT,
  BUILD_ARCH: process.env.BUILD_ARCH,
  BUILD_FILENAME: process.env.BUILD_FILENAME,

  // package.json
  npm_package_displayName: pkg.displayName,
  npm_package_version: pkg.version,
  npm_package_description: pkg.description,
}, identity)

// Deploy script testing.
if (process.env.NODE_ENV === 'development') {
  payload.DEPLOY_DREAMTRACK_HOST = 'http://127.0.0.1:30200'
  payload.DEPLOY_DREAMTRACK_KEY = 'changeme'
  payload.GITHUB_REF = `refs/tags/v${pkg.version}-early`
  payload.DEPLOY_PINATA_TOKEN = 'changeme'
}

// eslint-disable-next-line no-console
console.log(payload)

fs.writeFileSync('.env', stringify(payload))
