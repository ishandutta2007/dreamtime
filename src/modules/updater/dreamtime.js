// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import { BaseUpdater } from './base'
import dream from '../dream'

const { activeWindow } = $provider.util
const { shell, app, Notification } = $provider.api

class DreamTimeUpdater extends BaseUpdater {
  /**
   * @type {string}
   */
  get name() {
    return 'dreamtime'
  }

  /**
   * @type {string}
   */
  get currentVersion() {
    return `v${process.env.npm_package_version}`
  }

  /**
   * @type {string}
   */
  get platform() {
    let platform = super.platform

    if (dream.isPortable) {
      platform = `${platform}-portable`
    } else {
      platform = `${platform}-installer`
    }

    return platform
  }

  /**
   *
   * @param {string} filepath
   */
  async install(filepath) {
    shell.showItemInFolder(filepath)

    // Quit to update
    app.quit()
  }

  /**
   *
   */
  sendNotification() {
    const notification = new Notification(
      {
        title: `🎉 DreamTime ${this.latestCompatibleVersion}`,
        body: 'A new version of DreamTime is available.',
      },
    )

    notification.show()

    notification.on('click', () => {
      window.$redirect('/wizard/dreamtime')

      if (activeWindow()) {
        activeWindow().focus()
      }
    })
  }
}

export const dreamtime = new DreamTimeUpdater()
