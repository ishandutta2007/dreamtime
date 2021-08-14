// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import {
  isNil, isString, isEmpty, isArray,
} from 'lodash'
import { spawn } from 'child_process'
import EventBus from 'js-event-bus'
import semverRegex from 'semver-regex'
import * as fs from 'fs-extra'
import { getPowerPath } from './paths'
import { settings } from '../settings'

const logger = require('@dreamnet/logplease').create('power')

let version

export function exec(args, options = {}) {
  args.push('--debug')

  if (process.env.POWER_PYTHON) {
    // Main script
    args.unshift('main.py')

    // C:\Users\koles\Anaconda3\envs\dreampower\python.exe
    const pythonPath = fs.existsSync(process.env.POWER_PYTHON) ? process.env.POWER_PYTHON : 'python'

    logger.debug('[Python] Running:', {
      pythonPath,
      cwd: getPowerPath(),
      args,
      options,
    })

    return spawn(pythonPath, args, {
      cwd: getPowerPath(),
      ...options,
    })
  }

  logger.debug('Running:', args)

  return spawn(getPowerPath('dreampower'), args, {
    cwd: getPowerPath(),
    ...options,
  })
}

/**
 *
 * @param {Array} args
 * @param {EventBus} events
 */
export async function nudify(args, events) {
  const process = exec(args)
  let cancelled = false

  process.on('error', (error) => {
    logger.error(error)
    events.emit('error', null, error)
  })

  process.stdout.on('data', (output) => {
    logger.info(output.toString())
    const stdout = output.toString().trim().split('\n')
    events.emit('stdout', null, stdout)
  })

  process.stderr.on('data', (output) => {
    logger.warn(output.toString())
    events.emit('stderr', null, output)
  })

  process.on('close', async (code) => {
    logger.info(`DreamPower exited with code ${code}`)
    events.emit('close', null, code)

    if (cancelled) {
      events.emit('cancelled')
    } else if (code === 0 || isNil(code)) {
      events.emit('success')
    } else {
      events.emit('fail', null)
    }
  })

  events.on('cancel', () => {
    cancelled = true
    process.stdin.pause()
    process.kill()
  })
}

/**
 *
 * @param {PhotoRun} run
 */
export const transform = (run) => {
  // Photo data
  const { preferences, photo } = run

  logger.debug(preferences)

  // Steps
  let start = 0
  let end = 5

  // CLI Args
  const args = ['run', '--input', photo.finalFile.path]

  if (run.isMaskGeneration) {
    //
    switch (run.mask) {
      case 'correct':
        start = 0
        end = 0
        break

      case 'mask':
        // Corrected -> Mask
        start = 0
        end = 1
        break

      case 'maskref':
        start = 2
        end = 2
        break

      case 'maskdet':
        start = 3
        end = 3
        break

      case 'maskfin':
        start = 4
        end = 4
        break

      case 'nude':
      case 'overlay':
      default:
        start = 5
        end = 5
        break
    }
  } else {
    // Output
    args.push('--output', run.outputFile.path)
  }

  const {
    useColorTransfer, useArtifactsInpaint, scaleMode, compress, imageSize, device,
  } = preferences.advanced
  const { overlayData } = photo.crop

  // Device
  if (device === 'CPU') {
    args.push('--cpu')
  } else {
    for (const id of settings.processing.gpus) {
      args.push('--gpu', id)
    }
  }

  args.push('--n-cores', settings.processing.cores)

  if (scaleMode === 'overlay') {
    args.push(
      '--overlay',
      `${overlayData.startX},${overlayData.startY}:${overlayData.endX},${overlayData.endY}`,
    )
  } else if (scaleMode !== 'none' && scaleMode !== 'cropjs' && scaleMode !== 'padding') {
    args.push(`--${scaleMode}`)
  }

  if (scaleMode === 'none') {
    args.push('--ignore-size')
  } else {
    args.push('--image-size', imageSize)
  }

  if (start === 0) {
    // Image compression.
    if (compress > 0) {
      args.push('--compress', compress)
    }
  }

  // Color transfer.
  if (useColorTransfer) {
    args.push('--experimental-color-transfer')
  }

  // Artifacts Inpaint.
  if (useArtifactsInpaint) {
    args.push('--experimental-artifacts-inpaint')
  }

  // Custom masks.
  if (run.isMaskGeneration) {
    args.push('--masks-path', photo.masksPath)
    args.push('--steps', `${start}:${end}`)
  }

  // body preferences
  args.push('--bsize', preferences.body.boobs.size)
  args.push('--asize', preferences.body.areola.size)
  args.push('--nsize', preferences.body.nipple.size)
  args.push('--vsize', preferences.body.vagina.size)
  args.push('--hsize', preferences.body.pubicHair.size)

  const events = new EventBus()

  nudify(args, events, run)

  return events
}

/**
 * @return {boolean}
 */
export function isInstalled() {
  const dirpath = getPowerPath()

  if (!isString(dirpath)) {
    // how the fuck?
    return false
  }

  if (!fs.existsSync(dirpath)) {
    return false
  }

  const binaries = [
    'main.py',
    'dreampower.exe',
    'dreampower',
  ]

  for (const bin of binaries) {
    if (fs.existsSync(getPowerPath(bin))) {
      return true
    }
  }

  return false
}

/**
 * @return {Promise}
 */
export const getVersion = () => new Promise((resolve) => {
  if (version) {
    resolve({
      status: true,
      version,
    })

    return
  }

  const process = exec(['--version'])

  let response = ''

  process.on('error', (error) => {
    logger.warn(error)

    resolve({
      status: false,
      version: undefined,
      error,
    })
  })

  process.stdout.on('data', (data) => {
    response += data
  })

  process.stderr.on('data', (data) => {
    response += data
  })

  process.on('close', (code) => {
    if (code === 0 || isNil(code)) {
      if (isEmpty(response)) {
        resolve({
          status: false,
          version: undefined,
          error: new Error(`DreamPower was unable to respond or return any error code, this may be due to:

- Corrupt installation. (Please download and install again)
- Some OS update, recent program installation or external program (such as antivirus) are interfering with DreamPower.`),
        })

        return
      }

      try {
        response = semverRegex().exec(response)

        if (!isArray(response)) {
          resolve({
            status: false,
            version: undefined,
            error: new Error(response),
          })

          return
        }

        version = `v${response[0]}`

        resolve({
          status: true,
          version,
        })
      } catch (error) {
        logger.warn(error)

        resolve({
          status: false,
          version: undefined,
          error,
        })
      }
    }

    resolve({
      status: false,
      version: undefined,
      error: new Error(response),
    })
  })
})
