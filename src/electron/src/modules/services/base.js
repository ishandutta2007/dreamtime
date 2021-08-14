// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import {
  set, get, isNil, isPlainObject, isEmpty,
} from 'lodash'
import { existsSync, readJsonSync, writeJsonSync } from 'fs-extra'

const logger = require('@dreamnet/logplease').create('services')

export function makeServiceProxy(item) {
  return new Proxy(item, {
    get: (obj, prop) => {
      if (prop in obj) {
        return obj[prop]
      }

      /* eslint-disable no-underscore-dangle */
      if (obj._service && prop in obj._service) {
        return obj._service[prop]
      }
      /* eslint-enable no-underscore-dangle */

      if (prop in obj.payload) {
        return obj.payload[prop]
      }

      return undefined
    },

    /* eslint-disable no-param-reassign */
    set: (obj, prop, value) => {
      if (!isNil(obj.payload)) {
        if (prop in obj.payload) {
          obj.payload[prop] = value
          obj.save()

          return true
        }
      }

      obj[prop] = value
      return true
    },
    /* eslint-enable no-param-reassign */
  })
}

export class BaseService {
  /**
   * the payload.
   * a proxy will be used to get or set this information.
   *
   * @type {Object}
   */
  payload = {}

  /**
   * the service.
   *
   * @type {Object}
   */
  _service

  /**
   * service enabled?
   *
   * @type {Boolean}
   */
  enabled = false

  /**
   * file where to save the payload.
   *
   * @type {string}
   */
  get path() {
    return null
  }

  /**
   * Create a new instance with a Proxy.
   *
   * @return {BaseService}
   */
  static make(obj) {
    if (!obj) {
      // eslint-disable-next-line no-param-reassign
      obj = new this()
    }

    return makeServiceProxy(obj)
  }

  /**
   * Setup service
   */
  async setup() {
    await this.load()
  }

  /**
   * Load the service file.
   */
  async load() {
    if (isNil(this.path)) {
      return
    }

    if (!existsSync(this.path)) {
      return
    }

    this.payload = readJsonSync(this.path)
    logger.debug(this.payload)
  }

  /**
   * Save the service file.
   * This function is called automatically if you set a first level variable.
   */
  async save() {
    if (isNil(this.path)) {
      return
    }

    writeJsonSync(this.path, this.payload)
  }

  /**
   * Returns the value
   *
   * @param {string} path
   */
  get(path = '') {
    if (isEmpty(path)) {
      return this.payload
    }

    return get(this.payload, path)
  }

  /**
   * Set a new value in the settings
   *
   * @param {any} path
   * @param {any} payload
   */
  set(path, payload) {
    if (isPlainObject(path)) {
      this.payload = path
    } else {
      this.payload = set(this.payload, path, payload)
    }

    this.save()
  }
}
