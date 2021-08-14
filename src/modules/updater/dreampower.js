// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import path from 'path'
import { isNil } from 'lodash'
import compareVersions from 'compare-versions'
import { BaseUpdater } from './base'
import { requirements, settings } from '../system'
import { dreamtrack } from '../services'

const { getPowerPath } = $provider.paths
const { fs } = $provider
const { activeWindow } = $provider.util
const { app, Notification } = $provider.api

class DreamPowerUpdater extends BaseUpdater {
  /**
   * @type {string}
   */
  get name() {
    return 'dreampower'
  }

  /**
   * @type {string}
   */
  get githubRepo() {
    return super.githubRepo || 'dreamnettech/dreampower'
  }

  /**
   * @type {string}
   */
  get platform() {
    let platform = super.platform

    if (platform === 'macos' || settings.preferences.advanced.device === 'CPU') {
      platform = `${platform}-cpuonly`
    } else {
      platform = `${platform}-any`
    }

    return platform
  }

  /**
   * @return {string}
   */
  async _getCurrentVersion() {
    return requirements.power.version
  }

  /**
   *
   * @param {*} releases
   */
  _getLatestCompatible(releases) {
    const currentVersion = `v${process.env.npm_package_version}`

    const minimum = dreamtrack.get(['projects', 'dreamtime', 'releases', currentVersion, 'dreampower', 'minimum'], 'v1.2.10')
    const maximum = dreamtrack.get(['projects', 'dreamtime', 'releases', currentVersion, 'dreampower', 'maximum'])

    if (!minimum) {
      return null
    }

    for (const release of releases) {
      if (compareVersions.compare(release.tag_name, minimum, '<')) {
        continue
      }

      if (!isNil(maximum) && compareVersions.compare(release.tag_name, maximum, '>')) {
        continue
      }

      return release
    }

    return null
  }

  /**
   *
   */
  async setup(required = false) {
    this._currentVersion = await this._getCurrentVersion()

    await super.setup(required)
  }

  /**
   *
   * @param {string} filepath
   */
  async install(filepath) {
    const powerPath = getPowerPath()

    // Removing the previous installation
    try {
      if (fs.existsSync(powerPath)) {
        const files = await fs.readdir(powerPath)

        for (const file of files) {
          if (file.includes('checkpoints')) {
            continue
          }

          fs.removeSync(path.join(powerPath, file))
        }
      }
    } catch (error) {
      this.consola.warn(error)
    }

    // Extraction
    await fs.extractSeven(filepath, powerPath)

    // Permissions for non-windows operating systems.
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(getPowerPath('dreampower'), 0o775)
      } catch (error) {
        this.consola.warn(error)
      }
    }

    // Restart!
    app.relaunch()
    app.quit()
  }

  /**
   *
   */
  sendNotification() {
    if (!requirements.power.installed) {
      return
    }

    const notification = new Notification(
      {
        title: `🎉 DreamPower ${this.latestCompatibleVersion}`,
        body: 'A new version of DreamPower is available.',
      },
    )

    notification.show()

    notification.on('click', () => {
      window.$redirect('/wizard/power')

      if (activeWindow()) {
        activeWindow().focus()
      }
    })
  }
}

export const dreampower = (new DreamPowerUpdater())
