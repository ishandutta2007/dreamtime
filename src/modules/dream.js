// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2020.

const { getAppPath, getPowerPath, getPath } = $provider.paths
const { shell } = $provider.api

/**
 * $dream.
 * Application information.
 */
export default {
  /**
   * App Name.
   * @type {string}
   */
  get name() {
    return process.env.npm_package_displayName
  },

  /**
   * @type {string}
   */
  get description() {
    return process.env.npm_package_description
  },

  /**
   * @type {string}
   */
  get version() {
    return `v${process.env.npm_package_version}`
  },

  /**
   * @type {boolean}
   */
  get isPortable() {
    return process.env.BUILD_ARCH === 'portable'
  },

  /**
   *
   */
  openAppFolder() {
    shell.openPath(getAppPath())
  },

  /**
   *
   */
  openAppDataFolder() {
    shell.openPath(getPath('userData'))
  },

  /**
   *
   */
  openPowerFolder() {
    shell.openPath(getPowerPath())
  },
}
