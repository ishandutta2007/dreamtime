// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import {
  isError, isString, isObject, isArray, attempt,
} from 'lodash'
import { app, dialog } from 'electron'

const logger = require('@dreamnet/logplease').create('error:main')

/**
 * @typedef {Object} ErrorOptions
 * @property {string} title
 * @property {string} level
 * @property {Error} error
 * @property {boolean} fatal
 * @property {boolean} quiet
 */

/**
 * @global
 */
export class AppError extends Error {
  /**
   * @type {ErrorOptions}
   */
  options = {
    title: null,
    level: 'warn',
    error: null,
    quiet: false,
  }

  /**
   *
   * @param {string} message
   * @param {ErrorOptions} options
   */
  constructor(input, options = {}) {
    if (isString(input)) {
      super(input)
    } else if (isError(input)) {
      super(input.message)

      this.stack = input.stack

      this.options.error = input

      if (input.options) {
        this.options = {
          ...this.options,
          ...input.options,
        }
      }
    } else {
      super()
    }

    this.options = {
      ...this.options,
      ...options,
    }

    if (this.options.level === 'warning') {
      this.options.level = 'warn'
    }
  }

  show() {
    dialog.showErrorBox(
      this.options.title || 'A problem has occurred!',
      `${this.message}:\n\n${this.options.error?.message}`,
    )
  }

  handle() {
    const {
      level, quiet, error,
    } = this.options

    attempt(() => {
      logger[level](this.message, { error })

      if (!quiet && level === 'error') {
        this.show()
      }
    })

    if (level === 'error') {
      app.quit()
    }
  }

  static handle(error, level = 'error') {
    let appError = error

    if (!(error instanceof AppError)) {
      let exception

      if (isError(error)) {
        exception = error
      } else if (isObject(error) || isArray(error)) {
        exception = attempt(() => new Error(JSON.stringify(error)))
      } else {
        exception = new Error(error)
      }

      appError = new AppError('The application has encountered an unexpected error', {
        error: exception,
        level,
      })
    }

    appError.handle()
  }
}
