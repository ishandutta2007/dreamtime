// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import { throttle } from 'lodash'
import { Nudify } from './nudify'
import { events } from '../events'

/**
 * Helper to add reactivity to the Nudify class.
 * TODO: Maybe implement this in a real vue-store.
 */
const store = {
  photos: [],

  waiting: [],

  pending: [],

  finished: [],

  setup() {
    events.on('nudify.update', this.update)
  },

  update: throttle(() => {
    store.photos = Nudify.photos
    store.waiting = Nudify.waiting
    store.pending = Nudify.pending
    store.finished = Nudify.finished
  }, 600, { leading: true }),
}

export const NudifyStore = new Proxy(store, {
  get: (target, property, receiver) => {
    if (property in target) {
      return target[property]
    }

    if (property in Nudify) {
      return Nudify[property]
    }

    return Reflect.get(target, property, receiver)
  },
})
