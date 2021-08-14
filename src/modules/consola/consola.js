// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import Logger from '@dreamnet/logplease'
import { Log } from './log'

export class Consola {
  /**
   * @type {string}
   */
  category

  /**
   * @type {Logger.Logger}
   */
  logger

  /**
   *
   * @param {string} [category]
   */
  static create(category) {
    return new this(category)
  }

  /**
   *
   * @param {string} [category]
   */
  constructor(category = 'dreamtime') {
    this.category = category
    this.logger = Logger.create(category)
  }

  /**
   *
   * @param {string} message
   * @param {string} level
   * @param {LogOptions} options
   */
  log(level, ...args) {
    args.push(this.logger)
    args.push(level)

    return new Log(...args)
  }

  /**
   *
   * @param {string} message
   * @param {LogOptions} options
   */
  debug(...args) {
    return this.log('debug', ...args)
  }

  /**
   *
   * @param {string} message
   * @param {LogOptions} options
   */
  info(...args) {
    return this.log('info', ...args)
  }

  /**
   *
   * @param {string} message
   * @param {LogOptions} options
   */
  warn(...args) {
    return this.log('warn', ...args)
  }

  /**
   *
   * @param {string} message
   * @param {LogOptions} options
   */
  error(...args) {
    return this.log('error', ...args)
  }

  /**
   *
   * @param {string} event
   * @param {Object} payload
   */
  track(event, payload = {}) {
    const { dreamtrack, logrocket } = require('../services')

    if (dreamtrack.enabled) {
      dreamtrack.track(`${event}`, payload)
    }

    if (logrocket.enabled) {
      logrocket.track(`${event}`)
    }

    return this
  }
}
