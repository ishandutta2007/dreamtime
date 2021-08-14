/* eslint-disable no-console */
/* eslint-disable mocha/no-hooks-for-single-case */
/* eslint-disable mocha/no-top-level-hooks */
// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import Vue from 'vue'
import dayjs from 'dayjs'
import {
  dreamtime, dreampower, checkpoints, community, waifu,
} from '~/modules/projects'
import {
  dreamtrack, logrocket, rollbar,
} from '~/modules/services'
import { requirements } from '~/modules/system'
import { handleError } from '~/modules/consola'

localStorage.debug = 'none'

dayjs.extend(require('dayjs/plugin/relativeTime'))

/**
 *
 *
 */
async function setupRemote() {
  Promise.all([
    rollbar.setup(),
    logrocket.setup(),
  ]).catch((error) => {
    console.warn(error)
  })

  // Projects.
  await Promise.all([
    dreamtime.init(),
    dreampower.init(),
    waifu.init(),
    checkpoints.init(),
    community.init(),
  ]).catch((error) => {
    console.warn(error)
  })
}

/**
 *
 *
 */
async function setup() {
  // Analytics & Remote settings.
  await dreamtrack.setup().catch((error) => console.warn(error))

  // Requirements check.
  await requirements.setup()

  if (!requirements.canNudify) {
    await setupRemote()
  } else {
    setupRemote()
  }
}

// eslint-disable-next-line no-unused-vars
export default async ({ app }, inject) => {
  // Error Handlers.
  window.addEventListener('error', (event) => handleError(event))
  window.addEventListener('unhandledrejection', (rejection) => handleError(rejection.reason))
  Vue.config.errorHandler = (err) => handleError(err)

  await setup()

  // Shortcuts.
  inject('provider', $provider)
  inject('dreamtrack', dreamtrack)
  inject('dreamtime', dreamtime)
  inject('dreampower', dreampower)
  inject('waifu', waifu)
  inject('checkpoints', checkpoints)
  inject('community', community)
}
