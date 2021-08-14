// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import { random } from 'lodash'
import Swal from 'sweetalert2/dist/sweetalert2'
import { events } from '../events'
import { settings } from './settings'

export const achievements = {
  async setup() {
    const Combokeys = require('combokeys')
    const combokeys = new Combokeys(document.documentElement)

    combokeys.bind('b a d t i m e', () => {
      window.$redirect('/games/badtime')
    })

    events.on('achievements.badtime', () => {
      if (settings.achievements.badtime) {
        return
      }

      consola.track('BADTIME_UNLOCK')

      Swal.fire({
        title: 'Achievement unlocked!',
        html: 'You\'re gonna have a bad time.',
        toast: true,
        position: 'bottom-end',
        timer: 15000,
        timerProgressBar: true,
      })

      settings.achievements.badtime = true
    })
  },

  probability() {
    if (!settings.achievements.badtime) {
      const dice = random(0, 100)

      if (dice === 22) {
        // Lucky!
        events.emit('achievements.badtime')
      }
    }
  },
}
