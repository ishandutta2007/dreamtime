// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import {
  cloneDeep, isNil, merge, isError, random,
} from 'lodash'
import path from 'path'
import { Queue } from '@dreamnet/queue'
import EventEmitter from 'events'
import randomcolor from 'randomcolor'
import { uniqueNamesGenerator, names } from 'unique-names-generator'
import { settings, PMODE } from '../system/settings'
import { requirements } from '../system'
import { Consola, handleError } from '../consola'
import { NudifyQueue } from './queue'
import { Nudify } from './nudify'
import { PhotoRun } from './photo-run'
import { PhotoMask, STEP } from './photo-mask'
import { File } from '../file'
import { Timer } from '../timer'
import { closestNumber } from '../helpers'

const { getCurrentWindow } = require('electron').remote

const { getModelsPath, getTempPath } = $provider.paths
const { fs } = $provider
const { dialog } = $provider.api

/**
 * @typedef {object} PhotoFiles
 * @property {File} PhotoFiles.editor
 * @property {File} PhotoFiles.crop
*/

/**
 * @typedef {object} PhotoMasks
 * @property {PhotoMask} PhotoMask.correct
 * @property {PhotoMask} PhotoMask.mask
 * @property {PhotoMask} PhotoMask.maskref
 * @property {PhotoMask} PhotoMask.maskdet
 * @property {PhotoMask} PhotoMask.maskfin
 * @property {PhotoMask} PhotoMask.nude
 * @property {PhotoMask} PhotoMask.overlay
 * @property {PhotoMask} PhotoMask.padding
 * @property {PhotoMask} PhotoMask.scale
*/

export class Photo extends EventEmitter {
  /**
   * @type {string}
   */
  id

  /**
   * Identification.
   * With this we can identify duplicate photos.
   */
  avatar = {
    name: 'Amanari',
    color: '#000',
  }

  /**
   * @type {number}
   */
  time

  /**
   * Original file.
   * @type {File}
   */
  file

  /**
   * Additional files.
   * @type {PhotoFiles}
   */
  files = {
    editor: null,
    crop: null,
  }

  get fileToUpscale() {
    if (this.scaleMode === 'overlay') {
      return this.masks.overlay.file
    } if (this.useColorPaddingRemoval) {
      return this.masks.padding.file
    }

    return this.masks.nude.file
  }

  /**
   * Masks.
   * @type {PhotoMasks}
   */
  masks = {
    correct: null, // 0 = dress -> correct
    mask: null, // 1 = correct -> mask
    maskref: null, // 2 = mask -> maskref
    maskdet: null, // 3 = maskref -> maskdet
    maskfin: null, // 4 = maskdet -> maskfin
    nude: null, // 5 = maskfin -> nude
    overlay: null, // Image to overlay
    padding: null, // Color padding removal
    scale: null, // Waifu2X
  }

  /**
   * @type {string}
   */
  model

  /**
   * @type {string}
   */
  _status = 'pending'

  get status() {
    return this._status
  }

  set status(value) {
    this._status = value
  }

  /**
   * @type {Queue}
   */
  queue

  /**
   * @type {Array}
   */
  runs = []

  /**
   * @type {Object}
   */
  preferences = {}

  /**
   * @type {Timer}
   */
  timer = new Timer()

  /**
   * @typedef {object} CropBoxData
   * @property {number} CropBoxData.left
   * @property {number} CropBoxData.top
   * @property {number} CropBoxData.width
   * @property {number} CropBoxData.height
  */
  /**
   * @typedef {object} CanvasData
   * @property {number} CanvasData.left
   * @property {number} CanvasData.top
   * @property {number} CanvasData.width
   * @property {number} CanvasData.height
   * @property {number} CanvasData.naturalWidth
   * @property {number} CanvasData.naturalHeight
  */
  /**
   * @typedef {object} OverlayData
   * @property {number} OverlayData.startX
   * @property {number} OverlayData.startY
   * @property {number} OverlayData.endX
   * @property {number} OverlayData.endY
  */
  /**
   * @typedef {object} CropData
   * @property {CropBoxData} CropData.cropBoxData
   * @property {CanvasData} CropData.canvasData
   * @property {OverlayData} CropData.overlayData
  */
  /**
  * @type {CropData}
  */
  crop = {
    cropData: null,
    cropBoxData: null,
    canvasData: null,
    overlayData: null,
  }

  /**
   * @type {Consola}
   */
  consola

  /**
   * Mode.
   * Complexity of options for the photo.
   *
   * @readonly
   */
  get mode() {
    return this.preferences.mode
  }

  /**
   *
   * @type {string}
   * @readonly
   */
  get folderName() {
    // TODO: Implement models
    return 'Uncategorized'
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get running() {
    return this.status === 'running'
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get finished() {
    return this.status === 'finished'
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get pending() {
    return this.status === 'pending'
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get waiting() {
    return this.status === 'waiting'
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get started() {
    return this.running || this.finished
  }

  /**
   * Number of runs to execute.
   *
   * @type {number}
   * @readonly
   */
  get runsCount() {
    if (this.mode === PMODE.ADVANCED) {
      return 1
    }

    if (this.preferences.body.runs.mode !== false) {
      return this.preferences.body.runs.count
    }

    return 1
  }

  /**
   * Indicates if the photo can be modified
   * with the tools.
   *
   * @type {boolean}
   * @readonly
   */
  get canModify() {
    return !this.file.isAnimated
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get canShowEditor() {
    return this.canModify && this.mode >= PMODE.NORMAL
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get canShowCropTool() {
    return this.canModify && this.mode >= PMODE.SIMPLE && this.preferences.advanced.scaleMode === 'cropjs'
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get canShowOverlayTool() {
    return this.canModify && this.mode >= PMODE.SIMPLE && this.preferences.advanced.scaleMode === 'overlay'
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get canShowPaddingTool() {
    return this.canModify && this.mode >= PMODE.SIMPLE && this.preferences.advanced.scaleMode === 'padding'
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get withCustomMasks() {
    return this.mode === PMODE.ADVANCED
  }

  /**
   *
   *
   * @readonly
   */
  get useUpscaling() {
    return this.preferences.advanced.waifu.enabled && requirements.canUseWaifu
  }

  /**
   *
   * @type {boolean}
   * @readonly
   */
  get useColorPaddingRemoval() {
    return this.scaleMode === 'padding' && this.preferences.advanced.useColorPaddingStrip
  }

  /**
   * Indicates if the scale mode is different from the one selected by the user.
   * TODO: Rename
   *
   * @type {boolean}
   * @readonly
   */
  get isScaleModeCorrected() {
    const { scaleMode } = this.preferences.advanced
    return scaleMode !== this.scaleMode
  }

  get scaleModeName() {
    switch (this.preferences.advanced.scaleMode) {
      case 'overlay':
        return 'Overlay'

      case 'cropjs':
        return 'Crop'

      case 'padding':
        return 'Padding'

      default:
        return 'Automatic'
    }
  }

  // TODO: Remove
  get scaleModeURL() {
    switch (this.preferences.advanced.scaleMode) {
      case 'overlay':
        return `/nudify/${this.id}/overlay`

      case 'cropjs':
        return `/nudify/${this.id}/crop`

      case 'padding':
        return `/nudify/${this.id}/padding`

      default:
        return `/nudify/${this.id}`
    }
  }

  /**
   *
   *
   * @type {number}
   * @readonly
   */
  get imageSize() {
    const { imageSize } = this.preferences.advanced
    return closestNumber(imageSize)
  }

  /**
   * Returns the final scale mode after validations.
   *
   * @type {string}
   * @readonly
   */
  get scaleMode() {
    const { mode } = this.preferences
    const { scaleMode } = this.preferences.advanced

    if (mode === PMODE.MINIMAL) {
      return 'auto-rescale'
    }

    if (scaleMode === 'cropjs' || scaleMode === 'padding') {
      if (!this.canModify) {
        return 'auto-rescale'
      }

      if (!this.files.crop.exists) {
        // Crop tool has not been used.
        return 'auto-rescale'
      }
    }

    if (scaleMode === 'overlay') {
      if (!this.canModify) {
        return 'auto-rescale'
      }

      if (!this.files.crop.exists) {
        // Crop tool has not been used.
        return 'auto-rescale'
      }
    }

    return scaleMode
  }

  /**
   * File that will be sent to the algorithm.
   *
   * @type {File}
   */
  get finalFile() {
    if (this.scaleMode === 'cropjs' || this.scaleMode === 'padding') {
      return this.files.crop
    }

    if (this.files.editor.exists && this.canModify) {
      return this.files.editor
    }

    return this.file
  }

  /**
   * File for the crop tool.
   *
   * @type {File}
   */
  get inputFile() {
    if (this.files.editor.exists) {
      return this.files.editor
    }

    return this.file
  }

  /**
   * File for the preview of the tools used.
   */
  get finalPreviewFile() {
    const { crop, editor } = this.files

    if (this.scaleMode === 'cropjs' || this.scaleMode === 'padding' || this.scaleMode === 'overlay') {
      if (crop.exists) {
        return crop
      }
    }

    if (editor.exists) {
      return editor
    }

    return this.file
  }

  /**
   * File to preview the result.
   * (Original or Nude)
   *
   * @readonly
   */
  get previewFile() {
    if (this.finished && this.runs.length > 0) {
      const [run] = this.runs

      if (run.outputFile?.exists) {
        return run.outputFile
      }
    }

    return this.file
  }

  /**
   *
   * @param {File} file
   */
  constructor(file) {
    super()
    this.time = Date.now() + random(1, 10)

    if (settings.app.duplicates) {
      this.id = `${file.md5}-${this.time}`
    } else {
      this.id = file.md5
    }

    this.file = file

    this.consola = Consola.create(file.fullname)

    this.setup()
  }

  /**
   *
   */
  setup() {
    fs.ensureDirSync(this.getFilesPath())

    this.files = {
      editor: this.createFile('Editor'),
      crop: this.createFile('Crop'),
    }

    if (this.canModify) {
      this.file.copyToFile(this.files.editor)
    }

    this.masks = {
      correct: new PhotoMask(STEP.CORRECT, this),
      mask: new PhotoMask(STEP.MASK, this),
      maskref: new PhotoMask(STEP.MASKREF, this),
      maskdet: new PhotoMask(STEP.MASKDET, this),
      maskfin: new PhotoMask(STEP.MASKFIN, this),
      nude: new PhotoMask(STEP.NUDE, this),
      overlay: new PhotoMask(STEP.OVERLAY, this),
      padding: new PhotoMask(STEP.PADDING, this),
      scale: new PhotoMask(STEP.SCALE, this),
    }

    this.validate()

    this.setupAvatar()

    this.setupPreferences()

    this.setupQueue()
  }

  /**
   * Create an {File} instance inside the photo folder.
   * (Doesn't actually create the file on disk)
   *
   * @returns {File}
   */
  createFile(name, options = { deleteIfExists: true }) {
    return new File(this.getFilesPath(`${name}.png`), options)
  }

  /**
   *
   * @param  {...any} args
   */
  getFilesPath(...args) {
    return getTempPath(this.file.md5, this.time.toString(), ...args)
  }

  /**
   *
   * @param  {...any} args
   */
  getFolderPath(...args) {
    return getModelsPath(this.folderName, ...args)
  }

  /**
   *
   */
  validate() {
    this.file.validateAsPhoto()
  }

  /**
   *
   *
   */
  setupAvatar() {
    this.avatar.name = uniqueNamesGenerator({ dictionaries: [names], length: 1 })

    this.avatar.color = randomcolor()
  }

  /**
   *
   *
   */
  setupPreferences() {
    this.preferences = cloneDeep(settings.payload.preferences)

    let forced = {}

    if (!this.canModify) {
      forced = {
        advanced: {
          scaleMode: this.scaleMode,
          useClothTransparencyEffect: false,
          waifu: {
            enabled: false,
          },
        },
      }

      if (this.preferences.mode === PMODE.ADVANCED) {
        this.preferences.mode = PMODE.NORMAL
      }
    }

    this.preferences = merge(this.preferences, forced)
  }

  /**
   *
   */
  setupQueue() {
    this.queue = new Queue(this.worker)

    this.queue.on('finished', () => {
      if (this.runs.length === 0) {
        this.status = 'pending'
      } else {
        this.onFinish()
      }

      this.consola.debug('🏁 Runs finished. 🏁')
    })

    this.queue.on('task_added', (run) => {
      run.onQueue()

      this.onQueueRun()

      this.consola.debug(`📷 Run added: #${run.id}`)
    })

    this.queue.on('task_started', (run) => {
      run.onStart()

      this.consola.debug(`🚗 Run started: #${run.id}`)
    })

    this.queue.on('task_finished', (run) => {
      run.onFinish()

      this.consola.debug(`🏁 Run finished: #${run.id}`)
    })

    this.queue.on('task_failed', (run, error) => {
      run.onFail()

      this.consola.warn(`💥 Run failed: #${run.id} ${error}`)

      if (isError(error)) {
        handleError(error)
      }
    })

    this.queue.on('task_dropped', (run) => {
      run.stop()
      run.onFinish()

      this.consola.debug(`⛔ Run dropped: ${run.id}`)
    })
  }

  /**
   * Save the results of all runs.
   */
  saveAll() {
    if (this.withCustomMasks) {
      return
    }

    const dir = dialog.showOpenDialogSync({
      properties: ['openDirectory'],
    })

    if (isNil(dir)) {
      return
    }

    if (!fs.existsSync(dir[0])) {
      return
    }

    this.consola.debug(`Saving all results in ${dir[0]}`)

    this.runs.forEach((photoRun) => {
      const savePath = path.join(dir[0], photoRun.outputName)

      this.consola.debug(savePath)
      photoRun.outputFile.copy(savePath)
    })
  }

  /**
   *
   * @param {*} id
   */
  getRunById(id) {
    return this.runs[id - 1]
  }

  /**
   * Add this photo to the queue (time to nudify)
   */
  add() {
    NudifyQueue.add(this)
  }

  /**
   * Cancel the photo runs and remove it from the queue.
   */
  cancel() {
    if (this.withCustomMasks) {
      // When working with custom masks the photo is not part of the queue
      // Why? Because that's extra work :(
      this.stop()
    } else {
      NudifyQueue.cancel(this)
    }
  }

  /**
   * Remove the photo from the application.
   */
  forget() {
    Nudify.forget(this)
  }

  /**
   *
   */
  track() {
    const { useColorTransfer, useArtifactsInpaint } = this.preferences.advanced
    const { mode: runsMode } = this.preferences.body.runs

    consola.track('DREAM_END')

    if (useColorTransfer) {
      consola.track('DREAM_COLOR_TRANSFER')
    }

    if (useArtifactsInpaint) {
      consola.track('DREAM_ARTIFACTS_INPAINT')
    }

    if (runsMode === 'randomize') {
      consola.track('DREAM_RANDOMIZE')
    }

    if (runsMode === 'increase') {
      consola.track('DREAM_PROGRESSIVE')
    }
  }

  /**
   * Nudification start.
   * This should only be called from the [NudifyQueue].
   */
  async start() {
    if (this.withCustomMasks) {
      return
    }

    await this.generateNudes()
  }

  /**
   *
   *
   * @param {string} mask
   */
  async generateMask(mask) {
    const run = new PhotoRun(1, this, mask)

    this.masks[mask].run = run

    this.runs.push(run)
    this.queue.add(run)

    await new Promise((resolve) => {
      this.queue.once('finished', () => {
        resolve()
      })
    })
  }

  /**
   *
   *
   */
  async generateNudes() {
    if (this.runsCount === 0) {
      return
    }

    consola.track('DREAM_START', { mode: this.preferences.mode })

    // X-Ray effect requires the "corrected" mask.
    if (this.preferences.advanced.useClothTransparencyEffect) {
      const xrayRun = new PhotoRun('xray', this, STEP.CORRECT)

      this.masks[STEP.CORRECT].run = xrayRun
      this.queue.add(xrayRun)
    }

    for (let it = 1; it <= this.runsCount; it += 1) {
      const run = new PhotoRun(it, this)

      this.runs.push(run)
      this.queue.add(run)
    }

    await new Promise((resolve) => {
      this.queue.once('finished', () => {
        this.track()
        resolve()
      })
    })
  }

  /**
   * Cancel the photo runs.
   * This should only be called from the queue.
   */
  stop() {
    this.queue.clear()
  }

  /**
   *
   * @param {PhotoRun} run
   */
  addRun(run) {
    this.queue.add(run)
  }

  /**
   *
   * @param {PhotoRun} run
   */
  cancelRun(run) {
    this.queue.drop(run)
  }

  /**
   *
   * @param {PhotoRun} run
   */
  worker(run) {
    return run.start()
  }

  /**
   *
   */
  onQueue() {
    this.runs = []

    this.status = 'waiting'
  }

  /**
   *
   */
  onStart() {
    this.timer.start()

    this.status = 'running'

    this.emit('start')
  }

  /**
   *
   */
  onQueueRun() {
    this.timer.start()

    this.status = 'running'
  }

  /**
   *
   */
  onFinish() {
    this.timer.stop()
    this.status = 'finished'

    this.sendNotification()

    this.emit('finish')
  }

  /**
   *
   */
  sendNotification() {
    if (!settings.notifications.allRuns) {
      return
    }

    try {
      const browserWindow = getCurrentWindow()

      if (isNil(browserWindow) || !browserWindow.isMinimized()) {
        return
      }

      const notification = new Notification('💖 Dream fulfilled!', {
        icon: this.file.path,
        body: 'All runs have finished.',
      })

      notification.onclick = () => {
        browserWindow.focus()
        window.$redirect(`/nudify/${this.id}/results`)
      }
    } catch (error) {
      this.photo.consola.warn('Unable to send a notification.', error).report()
    }
  }
}
