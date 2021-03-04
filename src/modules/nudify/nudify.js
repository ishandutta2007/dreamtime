// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@dreamnet.tech>, 2019.

import {
  startsWith, find, isNil,
  filter,
  remove, clone,
} from 'lodash'
import { basename } from 'path'
import delay from 'delay'
import Swal from 'sweetalert2/dist/sweetalert2'
import { watch } from 'melanke-watchjs'
import { NudifyQueue } from './queue'
import { events } from '../events'
import { Photo } from './photo'
import { File } from '../file'
import { settings } from '../system'
import { Consola } from '../consola'
import { getFilesMetadata } from '~/workers/fs'

const consola = Consola.create('nudify')

/**
 * Maximum number of photos open at the same time.
 * TODO: Measure the real impact of this value.
 * @type {Number}
 */
const MAX_PHOTOS = 1000

/**
 * @type {Swal}
 */
const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
})

/**
 * Entry point for photo nudification.
 */
export const Nudify = {
  /**
   * Uploaded photos.
   * @type {Array<Photo>}
   */
  photos: [],

  /**
   * @type {Array<Photo>}
   */
  get waiting() {
    return filter(this.photos, (photo) => photo.status === 'waiting' || photo.status === 'running')
  },

  /**
   * @type {Array<Photo>}
   */
  get pending() {
    return filter(this.photos, { status: 'pending' })
  },

  /**
   * @type {Array<Photo>}
   */
  get finished() {
    return filter(this.photos, { status: 'finished' })
  },

  /**
   *
   */
  setup() {
    NudifyQueue.setup()

    watch(this, 'photos', () => {
      events.emit('nudify.update')
    }, 2)
  },

  /**
   *
   * @param {string} id
   */
  getPhotoById(id) {
    return find(this.photos, { id })
  },

  /**
   * Add a new file.
   * @param {File} input
   */
  add(file, params = {}) {
    const photo = new Photo(file, params)

    if (!settings.app.duplicates) {
      const exists = this.getPhotoById(photo.id)

      if (!isNil(exists)) {
        return
      }
    }

    this.photos.unshift(photo)

    if (this.photos.length > MAX_PHOTOS) {
      // Delete the oldest photo.
      this.photos.pop()
    }

    if (params.isMaskfin) {
      window.$redirect(`/nudify/${photo.id}/editor`)
    } else {
      const { uploadMode } = settings.app

      if (uploadMode === 'add-queue') {
        photo.add()
      } else if (uploadMode === 'go-preferences') {
        window.$redirect(`/nudify/${photo.id}/preferences`)
      }
    }
  },

  /**
   *
   * @param {string} path
   */
  async addFile(path) {
    const metadatas = await getFilesMetadata(path)
    const multiple = metadatas.length > 1

    metadatas.forEach((metadata) => {
      const file = File.fromMetadata(metadata)

      try {
        this.add(file)

        Toast.fire({
          icon: 'success',
          title: basename(path),
        })
      } catch (err) {
        if (multiple) {
          consola.warn('Error adding a photo.', err)
        } else {
          throw err
        }
      }
    })
  },

  /**
   *
   * @param {Array} paths
   */
  async addFiles(paths) {
    Swal.fire({
      title: 'Importing files...',
      text: 'One moment, please.',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    })

    Swal.showLoading()

    await delay(500)

    for (const path of paths) {
      // eslint-disable-next-line no-await-in-loop
      await this.addFile(path)
    }
  },

  /**
   *
   * @param {string} url
   */
  async addUrl(url, downloadOptions = {}) {
    if (!startsWith(url, 'http://') && !startsWith(url, 'https://')) {
      throw new Warning('Upload failed.', 'Please enter a valid web address.')
    }

    Swal.fire({
      title: 'Downloading...',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen() {
        Swal.showLoading()
      },
    })

    try {
      const file = await File.fromUrl(url, {}, downloadOptions)

      Swal.close()

      this.add(file)
    } catch (error) {
      throw new Warning(
        'Upload failed.',
        'Unable to download the photo, please verify that the address is correct and that you are connected to the Internet.',
        error,
      )
    }
  },

  /**
   *
   * @param {string} status
   */
  addAll(status = 'pending') {
    this.photos.forEach((photo) => {
      if (photo.status !== status) {
        return
      }

      if (photo.withCustomMasks) {
        return
      }

      photo.add()
    })
  },

  /**
   *
   * @param {string} status
   */
  cancelAll(status = 'pending') {
    this.photos.forEach((photo) => {
      if (photo.status !== status) {
        return
      }

      photo.cancel()
    })
  },

  /**
   *
   * @param {Photo} photo
   */
  forget(photo) {
    photo.cancel()

    // eslint-disable-next-line lodash/prefer-immutable-method
    remove(this.photos, { id: photo.id })

    events.emit('nudify.update')

    consola.debug(`Forgotten: ${photo.file.fullname}`)
  },

  /**
   *
   * @param {string} status
   */
  async forgetAll(status = 'pending') {
    const response = await Swal.fire({
      title: 'Are you sure?',
      text: 'All photos in this section will be removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F44336',
      confirmButtonText: 'Yes, remove all',
    })

    if (!response.value) {
      return
    }

    window.$redirect('/')

    const photosCopy = clone(this.photos)

    photosCopy.forEach((photo) => {
      if (photo.status !== status) {
        return
      }

      photo.forget()
    })
  },
}
