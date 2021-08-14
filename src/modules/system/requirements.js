// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import {
  isNil, pick, clone, deburr,
} from 'lodash'
import emojiStrip from 'emoji-strip'
import { Consola } from '../consola'
import { settings } from './settings'

const consola = Consola.create('requirements')

const {
  system, fs, power, waifu,
} = $provider
const { getCheckpointsPath, getModelsPath } = $provider.paths

export const requirements = {
  power: {
    installed: false,
    compatible: false,
    checkpoints: false,
    version: undefined,
    error: undefined,
  },

  waifu: {
    installed: false,
    compatible: false,
    version: undefined,
    error: undefined,
  },

  recommended: {
    ram: false,
    vram: false,
  },

  folders: {
    models: false,
  },

  get values() {
    return pick(this, 'power', 'waifu', 'recommended', 'folders')
  },

  /**
   * @type {boolean}
   */
  get canNudify() {
    return this.power.installed && this.power.compatible && this.power.checkpoints
  },

  get canUseWaifu() {
    return this.waifu.installed && this.waifu.compatible
  },

  get hasAlerts() {
    if (!this.recommended.ram) {
      return true
    }

    if (settings.preferences.advanced.device === 'GPU' && !this.recommended.vram) {
      return true
    }

    if (!this.folders.models) {
      return true
    }

    return false
  },

  /**
   *
   */
  async setup() {
    // DreamPower
    this.power.installed = power.isInstalled()
    this.power.compatible = await this._hasCompatiblePower()
    this.power.checkpoints = this._hasCheckpoints

    // Waifu2X
    this.waifu.installed = waifu.isInstalled()
    this.waifu.compatible = await this._hasCompatibleWaifu()

    // ram
    this.recommended.ram = system.memory.total >= 8589934592 // 8 GB
    this.recommended.vram = system.graphics[0]?.vram >= 6000 // 6 GB

    // Folders
    this.folders.models = this.isValidFolder(getModelsPath())

    consola.info(this.values)
  },

  /**
   *
   * @param {string} path
   */
  isValidFolder(path) {
    const original = clone(path)

    let fixed = clone(path)
    fixed = deburr(fixed)
    fixed = emojiStrip(fixed)

    // eslint-disable-next-line no-control-regex
    fixed = fixed.replace(/[^\x00-\x7F]/g, '')

    return original === fixed
  },

  /**
   * @return {boolean}
   */
  async _hasCompatiblePower() {
    if (!this.power.installed) {
      return false
    }

    const { dreamtrack } = require('../services')
    const compareVersions = require('compare-versions')

    const payload = await power.getVersion()

    this.power.version = payload.version

    if (!payload.status) {
      consola.warn(`DreamPower compatibility check failed. (version = ${payload.version}).`, payload.error)

      this.power.error = payload.error

      return false
    }

    const { version } = payload
    const appVersion = `v${process.env.npm_package_version}`

    const minimum = dreamtrack.get(['projects', 'dreamtime', 'releases', appVersion, 'dreampower', 'minimum'], 'v1.2.10')
    const maximum = dreamtrack.get(['projects', 'dreamtime', 'releases', appVersion, 'dreampower', 'maximum'])

    if (compareVersions.compare(version, minimum, '<')) {
      return false
    }

    if (!isNil(maximum) && compareVersions.compare(version, maximum, '>')) {
      return false
    }

    return true
  },

  async _hasCompatibleWaifu() {
    if (!this.waifu.installed) {
      return false
    }

    const { dreamtrack } = require('../services')
    const compareVersions = require('compare-versions')

    const payload = await waifu.getVersion()

    this.waifu.version = payload.version

    if (!payload.status) {
      consola.warn(`Waifu2X compatibility check failed. (version = ${payload.version}).`, payload.error)

      this.waifu.error = payload.error

      return false
    }

    const { version } = payload
    const appVersion = `v${process.env.npm_package_version}`

    const minimum = dreamtrack.get(['projects', 'dreamtime', 'releases', appVersion, 'waifu', 'minimum'], 'v0.1.0')
    const maximum = dreamtrack.get(['projects', 'dreamtime', 'releases', appVersion, 'waifu', 'maximum'])

    if (compareVersions.compare(version, minimum, '<')) {
      return false
    }

    if (!isNil(maximum) && compareVersions.compare(version, maximum, '>')) {
      return false
    }

    return true
  },

  /**
   * @type {boolean}
   */
  get _hasCheckpoints() {
    const dirpath = getCheckpointsPath()

    if (!fs.existsSync(dirpath)) {
      return false
    }

    const filesize = require('filesize')

    // these files must exist
    const files = ['cm.lib', 'mm.lib', 'mn.lib']

    for (const file of files) {
      const filepath = getCheckpointsPath(file)

      if (!fs.existsSync(filepath)) {
        return false
      }

      const stats = fs.statSync(filepath)
      const size = filesize(stats.size, { exponent: 2, output: 'object' })

      if (size.value < 690) {
        return false
      }
    }

    return true
  },
}
