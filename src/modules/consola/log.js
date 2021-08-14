// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import {
  isNil, isError, isString, toString, isBoolean, isPlainObject, cloneDeep,
} from 'lodash'
import he from 'he'
import Swal from 'sweetalert2/dist/sweetalert2'
import Logger from '@dreamnet/logplease'
import { mapStackTrace } from 'sourcemapped-stacktrace'
import { HandledError } from './errors'

const LEVELS = [
  'debug',
  'info',
  'warn',
  'error',
]

export class Log {
  /**
   * @type {Logger.Logger}
   */
  logger

  /**
   * @type {string}
   */
  title

  /**
   * @type {string}
   */
  message

  /**
   * @type {boolean}
   */
  quiet = false

  /**
   * @type {string}
   */
  level = 'debug'

  /**
   * @type {Error}
   */
  error

  /**
   * @type {Object}
   */
  extra = {}

  /**
   * @type {boolean}
   */
  reported = false

  /**
   * @type {boolean}
   */
  showed = false

  /**
   * @type {boolean}
   */
  get isError() {
    return this.level === 'error'
  }

  /**
   * @type {boolean}
   */
  get isWarning() {
    return this.level === 'warn'
  }

  /**
   * @type {HandledError}
   */
  get throwable() {
    return new HandledError(this.message)
  }

  /**
   * @param {Array} args
   */
  parseArgs(args) {
    args.forEach((value) => {
      if (isNil(value)) {
        // YEP
      } else if (value instanceof Logger.Logger) {
        this.logger = value
      } else if (isError(value)) {
        this.error = value
      } else if (value instanceof ErrorEvent) {
        this.error = value.error
      } else if (LEVELS.includes(value)) {
        this.level = value
      } else if (isNil(this.message)) {
        this.message = value
      } else if (isNil(this.title) && isString(this.message)) {
        this.title = this.message
        this.message = value
      } else if (isPlainObject(value)) {
        this.extra = value
      } else if (isBoolean(value)) {
        this.quiet = value
      } else {
        // eslint-disable-next-line no-console
        console.warn('Unknown argument:', value)
      }
    })

    if (isNil(this.message) && isError(this.error)) {
      this.message = this.error.message
    }

    if (isNil(this.message)) {
      throw new HandledError('Invalid log.')
    }
  }

  /**
   *
   * @param {Logger.Logger} logger
   * @param {string} level
   * @param {string} message
   * @param {LogOptions} options
   */
  constructor(...args) {
    try {
      this.parseArgs(args)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Log could not be handled:', err)
    }

    if (this.error instanceof HandledError) {
      return
    }

    this.handle().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Log could not be handled:', err)
    })

    if (this.isError) {
      throw this.throwable
    }
  }

  /**
   *
   */
  async handle() {
    // logger.
    this.logger[this.level](this.message)

    if (this.isError) {
      await this.getSourceMapError()

      this.logger.debug({
        level: this.level,
        title: this.title,
        message: this.message,
        quiet: this.quiet,
        error: this.error ? {
          name: this.error.name,
          message: this.error.message,
          stack: this.error.stack,
        } : null,
        extra: this.extra,
      })

      this.report()

      if (!this.quiet) {
        this.show()
      }
    }
  }

  /**
   *
   */
  async report() {
    if (this.reported) {
      return this
    }

    const { rollbar, logrocket, dreamtrack } = require('../services')

    if (!rollbar.enabled) {
      return this
    }

    const { error } = this

    const snapshotUrl = await dreamtrack.takeSnapshot()
    const sessionUrl = logrocket.sessionURL
    let rollbarUrl

    // Bug tracking.
    try {
      const response = rollbar[this.level](this.title || this.message, error, {
        ...this.extra,
        sessionUrl,
        snapshotUrl,
      })

      rollbarUrl = `https://rollbar.com/occurrence/uuid/?uuid=${response?.uuid}`

      this.reported = true
    } catch (err) {
      this.logger.warn('Rollbar report fail!', err)
    }

    // Session tracking.
    if (logrocket.enabled && isError(error)) {
      try {
        logrocket.captureException(error, {
          extra: {
            rollbarUrl,
            snapshotUrl,
          },
        })

        this.reported = true
      } catch (err) {
        this.logger.warn('LogRocket report fail!', err)
      }
    }

    const urls = {
      snapshotUrl,
      sessionUrl,
      rollbarUrl,
    }

    dreamtrack.track('ERROR', cloneDeep(urls))

    consola.debug(urls)

    return this
  }

  async getSourceMapError() {
    if (!isError(this.error)) {
      return
    }

    const { error } = this

    const getStack = () => new Promise((resolve) => {
      mapStackTrace(error.stack, (stack) => {
        resolve(`${error.message}\n${stack.join('\n')}`)
      }, { cacheGlobally: true })
    })

    error.stack = await getStack()
  }

  /**
   *
   */
  show(title) {
    if (this.showed) {
      return this
    }

    let html = toString(this.message)

    if (isError(this.error)) {
      const stack = he.encode(toString(this.error.stack))
      html = `${html}<details><summary>More information</summary><pre>${stack}</pre></details>`
    }

    Swal.fire({
      title: title || this.title || 'Unexpected problem!',
      html,
      icon: this.isError ? 'error' : 'warning',
    })

    this.showed = true

    return this
  }
}
