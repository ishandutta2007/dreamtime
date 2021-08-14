// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import {
  isEmpty, get, cloneDeep,
} from 'lodash'

export class BaseService {
  /**
   * the payload.
   * a proxy will be used to get or set this information.
   *
   * @type {Object}
   */
  payload = {}

  /**
   * @type {Object}
   */
  service

  /**
   * @type {Boolean}
   */
  enabled = false

  /**
   * Create a new instance with a Proxy.
   *
   * @return {BaseService}
   */
  static make() {
    return new Proxy(new this(), {
      get: (obj, prop) => {
        if (prop in obj) {
          return obj[prop]
        }

        if (obj.service && prop in obj.service) {
          return obj.service[prop]
        }

        if (prop in obj.payload) {
          return obj.payload[prop]
        }

        return undefined
      },
    })
  }

  /**
   * @param {string} path
   */
  get(path = '', defaultValue = null) {
    const payload = cloneDeep(this.payload)

    if (isEmpty(path)) {
      return payload
    }

    return get(payload, path, defaultValue)
  }
}
