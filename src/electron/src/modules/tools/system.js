// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import EventEmitter from 'events'
import { filter, isNumber } from 'lodash'
import fs from 'fs-extra'
import si from 'systeminformation'
import isOnline from 'is-online'
import prettyBytes from 'pretty-bytes'
import { settings } from '../settings'
import { AppError } from '../app-error'
import { getModelsPath, getMasksPath } from './paths'

const logger = require('@dreamnet/logplease').create('system')

class System {
  /**
   * @type {si.Systeminformation.OsData}
   */
  os

  /**
   * @type {si.Systeminformation.GraphicsControllerData[]}
   */
  graphics = []

  /**
   * @type {si.Systeminformation.CpuData}
   */
  cpu

  /**
   * @type {si.Systeminformation.MemData}
   */
  memory

  /**
   *
   *
   */
  currentUsage = {}

  /**
   * @type {Object}
   */
  snapshot = {
    load: null,
    cpu: {
      speed: null,
      temperature: null,
    },
    memory: null,
    online: false,
  }

  /**
   * @type {boolean}
   */
  online

  /**
   *
   *
   * @readonly
   */
  get hasToCollect() {
    return !fs.existsSync(settings.path)
  }

  get primaryGpu() {
    if (this.graphics.length === 0) {
      return null
    }

    return this.graphics[settings.processing.gpus[0]]
  }

  /**
   *
   */
  async setup() {
    await this.collect()

    /*
    if (this.hasToCollect) {
      await this.collect()
    } else {
      this.collect()
    }
    */

    this.createRequiredFolders()
  }

  /**
   *
   *
   */
  async collect() {
    logger.debug('Collecting system information...')

    const [
      graphics,
      os,
      cpu,
      memory,
      online,
    ] = await Promise.all([
      si.graphics(),
      si.osInfo(),
      si.cpu(),
      si.mem(),
      isOnline(),
    ])

    this.graphics = filter(graphics.controllers, { vendor: 'NVIDIA' })
    this.os = os
    this.cpu = cpu
    this.memory = memory
    this.online = online

    logger.info('OS:', os.distro)
    logger.info('CPU:', cpu.brand)
    logger.info('GPU:', this.graphics)
    logger.info('RAM:', prettyBytes(memory.total))
    logger.info(`Online?: ${online}`)
  }

  /**
   *
   */
  /* eslint-disable-next-line no-unused-vars */
  async takeSnapshot(requirements = {}) {
    return undefined
    /*
    logger.info('Taking snapshot...')

    const [load, cpuSpeed, cpuTemperature, memory] = await Promise.all([
      si.currentLoad(),
      si.cpuCurrentspeed(),
      si.cpuTemperature(),
      si.mem(),
    ])

    this.snapshot = {
      load,
      cpu: {
        speed: cpuSpeed,
        temperature: cpuTemperature,
      },
      memory,
      settings: settings.payload,
      requirements,
    }

    // logger.info('Current load:', load)
    // logger.info('CPU Speed:', cpuSpeed)
    // logger.info('CPU Temperature:', cpuTemperature)
    // logger.info('Memory:', memory)

    return this.snapshot
    */
  }

  /**
   *
   *
   */
  async createRequiredFolders() {
    const dirs = [
      getModelsPath('Uncategorized'),
      getMasksPath(),
    ]

    dirs.forEach((dir) => {
      try {
        fs.ensureDirSync(dir)
      } catch (error) {
        throw new AppError(`Could not create the directory:\n${dir}`, { error })
      }
    })
  }

  /**
   *
   *
   * @param {'gpu'|'cpu'} [device='gpu']
   * @param {number} ms
   * @param {function} callback
   */
  observe(device = 'gpu', ms) {
    const events = new EventEmitter()

    this.observeInternal(device, ms, events)

    return events
  }

  /**
   *
   *
   * @param {'gpu'|'cpu'} device
   * @param {number} ms
   * @param {EventEmitter} events
   */
  async observeInternal(device, ms, events) {
    let stop = false
    events.on('stop', () => { stop = true })

    let previous = {}

    do {
      const func = device === 'gpu' ? si.graphics() : si.currentLoad()

      // eslint-disable-next-line no-await-in-loop
      const data = await Promise.resolve(func)

      const current = {}

      if (device === 'gpu') {
        if (data.controllers.length === 0) {
          stop = true
          continue
        }

        const gpu = data.controllers[settings.processing.gpus[0]]

        if (!gpu) {
          stop = true
          continue
        }

        if (!isNumber(gpu.memoryUsed) || !isNumber(gpu.memoryTotal) || gpu.memoryUsed <= 0 || gpu.memoryTotal <= 0) {
          current.utilizationMemory = undefined
        } else {
          current.utilizationMemory = Math.round((gpu.memoryUsed / gpu.memoryTotal) * 100)
        }

        current.utilizationGpu = isNumber(gpu.utilizationGpu) ? gpu.utilizationGpu : undefined
      } else {
        // eslint-disable-next-line no-await-in-loop
        const mem = await si.mem()

        current.utilizationMemory = Math.round((mem.used / mem.total) * 100)
        current.utilizationCpu = Math.round(data.currentLoad)
      }

      if (JSON.stringify(previous) !== JSON.stringify(current)) {
        events.emit('change', current)
        previous = current
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, ms)
      })
    } while (!stop)
  }
}

export const system = new System()
