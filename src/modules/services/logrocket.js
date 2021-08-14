// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import { isString } from 'lodash'
import LogRocket from 'logrocket'
import { BaseService } from './base'
import { dreamtrack } from './dreamtrack'
import { settings } from '../system/settings'
import { Consola } from '../consola'
// import { requirements } from '../system'

const { system } = $provider

const consola = Consola.create('logrocket')

// const privateExtensions = ['.jpg', '.jpeg', '.png', '.gif']

/**
 * https://logrocket.com/
 * Session tracking.
 */
class LogRocketService extends BaseService {
  /**
   * @type {string}
   */
  get accessToken() {
    return process.env.LOGROCKET_ACCESS_TOKEN || dreamtrack.get('keys.logrocket', '5iqym0/dreamtime-development')
  }

  /**
   * @type {boolean}
   */
  get can() {
    return system.online && isString(this.accessToken) && settings.telemetry?.dom
  }

  /**
   * @type {string}
   */
  get release() {
    return process.env.GITHUB_SHA || process.env.npm_package_version
  }

  /**
   * @type {Object}
   */
  get config() {
    return {
      release: this.release,
      shouldCaptureIP: false,
      console: {
        isEnabled: true,
        shouldAggregateConsoleErrors: false,
      },
      network: {
        isEnabled: true,
      },
      dom: {
        isEnabled: true,
        baseHref: process.env.PUBLIC_URL || dreamtrack.get('urls.internal.cdn'),
      },
    }
  }

  async setup() {
    if (!this.can) {
      consola.debug('Logrocket disabled.')
      return
    }

    try {
      LogRocket.init(this.accessToken, this.config)

      LogRocket.identify(settings.user, {
        settings: settings.payload,
      })

      this.service = LogRocket
      this.enabled = true

      consola.info('Recording session.')
      consola.debug(`Access Token: ${this.accessToken}`)
      consola.debug(`User: ${settings.user}`)
      consola.debug(this.config)
    } catch (err) {
      consola.warn('LogRocket setup failed!', err)
    }
  }
}

export const logrocket = LogRocketService.make()
