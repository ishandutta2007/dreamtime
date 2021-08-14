// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2020.

import { isError } from 'lodash'
import { Queue } from '@dreamnet/queue'
import { Consola, handleError } from '../consola'

const consola = Consola.create('queue')

/**
 *
 */
export const NudifyQueue = {
  /**
   * Queue. Photos that are waiting transformation.
   * @type {Queue}
   */
  queue: null,

  /**
   *
   */
  setup() {
    this.queue = new Queue(this.worker)

    this.queue.on('task_added', (photo) => {
      photo.onQueue()

      consola.debug(`📷 Photo added: ${photo.file.fullname}`)
    })

    this.queue.on('task_started', (photo) => {
      photo.onStart()

      consola.debug(`🚗 Photo started: ${photo.file.fullname}`)
    })

    this.queue.on('task_finished', (photo) => {
      // photo.onFinish()

      consola.debug(`🏁 Photo finished: ${photo.file.fullname}`)
    })

    this.queue.on('task_failed', (photo, error) => {
      photo.onFinish()

      consola.debug(`💥 Photo failed: ${photo.file.fullname} ${error}`)

      if (isError(error)) {
        handleError(error)
      }
    })

    this.queue.on('task_dropped', (photo) => {
      photo.stop()

      consola.debug(`⛔ Photo dropped: ${photo.id}`)
    })
  },

  /**
   *
   * @param {Photo} photo
   */
  worker(photo) {
    return photo.start()
  },

  /**
   *
   * @param {Photo} photo
   */
  add(photo) {
    this.queue.add(photo)
  },

  /**
   *
   * @param {Photo} photo
   */
  cancel(photo) {
    this.queue.drop(photo)
  },
}
