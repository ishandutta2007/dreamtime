// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2020.

import dayjs from 'dayjs'
import { Consola } from './consola'

const consola = Consola.create('timer')

export class Timer {
  startTime

  endTime

  duration = 0

  interval

  free() {
    clearInterval(this.interval)
    this.interval = null
  }

  reset() {
    this.startTime = null

    this.endTime = null

    this.duration = 0

    this.free()
  }

  start() {
    this.reset()

    this.startTime = dayjs()

    this.interval = setInterval(this.update.bind(this), 500)
  }

  update() {
    this.duration = dayjs().diff(this.startTime, 'second')

    if (this.duration === 54001) {
      // This does not seem normal.
      consola.warn('Timer out of control.').report()
      this.stop()
    }
  }

  stop() {
    this.free()

    this.endTime = dayjs()

    this.duration = this.endTime.diff(this.startTime, 'second')
  }
}
