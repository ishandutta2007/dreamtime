// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import { isString } from 'lodash'
import { BaseUpdater } from './base'
import { requirements } from '../system'

const { getCheckpointsPath, getPowerPath } = $provider.paths
const { existsSync, read, extractZip } = $provider.fs
const { activeWindow } = $provider.util
const { app, Notification } = $provider.api

class CheckpointsUpdater extends BaseUpdater {
  /**
   * @type {string}
   */
  get name() {
    return 'checkpoints'
  }

  /**
   * @type {string}
   */
  get githubRepo() {
    return super.githubRepo || 'dreamnettech/dreampower-checkpoints'
  }

  /**
   * @type {string}
   */
  get currentVersion() {
    if (!requirements.power.checkpoints) {
      return 'v0.0.0'
    }

    const filepath = getCheckpointsPath('version')

    if (!existsSync(filepath)) {
      return 'v0.0.1'
    }

    const version = read(filepath) || 'v0.0.1'

    if (!isString(version)) {
      return 'v0.0.1'
    }

    return version.trim()
  }

  /**
   *
   * @param {string} filepath
   */
  async install(filepath) {
    await extractZip(filepath, getPowerPath())

    // restart!
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
        title: `🎉 Checkpoints ${this.latestCompatibleVersion}`,
        body: 'A new version of the checkpoints is available.',
      },
    )

    notification.show()

    notification.on('click', () => {
      window.$redirect('/wizard/checkpoints')

      if (activeWindow()) {
        activeWindow().focus()
      }
    })
  }
}

export const checkpoints = (new CheckpointsUpdater())
