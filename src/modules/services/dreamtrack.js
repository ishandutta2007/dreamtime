// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2020.

import { isNil } from 'lodash'
import Ws from '@adonisjs/websocket-client/index'
import { BaseService } from './base'
import { settings } from '../system/settings'
import { Consola } from '../consola'
import { requirements } from '../system/requirements'

const { system } = $provider

const consola = Consola.create('dreamtrack')

const CONNECT_TIMEOUT = 3000
const SNAPSHOT_TIMEOUT = 3000

/**
 * DreamTrack.
 * Analytics and remote settings for DreamTime.
 */
export class DreamTrackService extends BaseService {
  /**
   * @type {Object}
   */
  promise

  /**
   * @type {import('@adonisjs/websocket-client/src/Socket').default}
   */
  channel

  /**
   * @type {number}
   */
  timeout

  /**
   * @type {string}
   */
  get host() {
    const host = process.env.DREAMTRACK_HOST || 'track.opendreamnet.com'
    const protocol = host === 'track.opendreamnet.com' ? 'wss' : 'ws'

    return `${protocol}://${host}`
  }

  /**
   * @type {boolean}
   */
  get can() {
    return system.online && !isNil(this.host)
  }

  /**
   * @type {Object}
   */
  get config() {
    return {
      reconnectionAttempts: process.env.NODE_ENV === 'development' ? 1 : 20,
      reconnectionDelay: 500,
    }
  }

  /**
   * User information to generate anonymous statistics.
   *
   * @type {Object}
   */
  get userData() {
    return {
      userId: settings.user,
      version: process.env.npm_package_version,
      language: navigator.language,
      session: {
        graphics: system.graphics,
        cpu: system.cpu,
        os: system.os,
        memory: system.memory.total,
      },
    }
  }

  /**
   * Setup service
   */
  setup() {
    if (!this.can) {
      consola.debug('DreamTrack disabled.')
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.promise = {
        resolve,
        reject,
      }

      consola.debug(`Connecting to ${this.host}...`)

      try {
        this.timeout = setTimeout(() => {
          this.resolve()
        }, CONNECT_TIMEOUT)

        const ws = Ws(this.host, this.config)

        ws.on('open', this.onOpen.bind(this))

        ws.on('close', this.onClosed.bind(this))

        ws.on('reconnect', this.onReconnect.bind(this))

        ws.connect()

        /** @type {import('@adonisjs/websocket-client/src/Connection').default} */
        this.service = ws
      } catch (err) {
        consola.warn('Setup failed!', err)
        this.resolve()
      }
    })
  }

  resolve() {
    if (!this.promise) {
      return
    }

    this.promise.resolve()
    this.promise = null

    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  reject(error) {
    if (!this.promise) {
      return
    }

    this.promise.reject(error)
    this.promise = null
  }

  /**
   * Connected to the server.
   */
  onOpen() {
    consola.info('Connected!')

    this.channel = this.service.subscribe('dreamtime:master')

    this.channel.on('ready', this.onReady.bind(this))

    this.channel.on('error', (error) => {
      consola.warn('Could not subscribe to channel.', error)
      this.reject(error)
    })

    this.channel.on('settings', this.onSettings.bind(this))
  }

  /**
   * The connection to the server has been lost.
   */
  onClosed() {
    consola.warn('Connection lost.')

    this.enabled = false
  }

  /**
   * Reconnect attempt.
   *
   * @param {number} attempts
   */
  onReconnect(attempts) {
    if (!this.promise) {
      return
    }

    if (attempts !== this.config.reconnectionAttempts) {
      return
    }

    // The connection to the server could not be established.
    consola.warn('Could not connect to server.')

    this.resolve()
  }

  /**
   * Successfully subscribed to the primary channel of the server.
   */
  onReady() {
    this.channel.emit('hello', this.userData)
  }

  /**
   * The remote settings of the application has been received.
   *
   * @param {object} payload Remote settings
   */
  onSettings(payload) {
    consola.debug('Remote settings received.')

    this.payload = payload
    this.enabled = true

    this.resolve()
  }

  /**
   * Track an event.
   *
   * @param {string} name Event name
   * @param {object} payload Event data
   */
  track(name, payload = {}) {
    if (!this.enabled) {
      return this
    }

    consola.debug(`Event: ${name}`)

    this.channel.emit('event', {
      name,
      payload,
      version: process.env.npm_package_version,
    })

    return this
  }

  /**
   * Create a snapshot of the system (cpu load, memory, etc.)
   * and send it to the server.
   *
   * @returns {string}
   */
  async takeSnapshot() {
    if (!this.enabled) {
      return null
    }

    // Create snapshot.
    const snapshot = await system.takeSnapshot(requirements.values)

    if (!snapshot) {
      return null
    }

    // Server response promise.
    const responsePromise = new Promise((resolve) => {
      const timeout = setTimeout(resolve, SNAPSHOT_TIMEOUT)

      const handler = (url) => {
        clearTimeout(timeout)
        this.channel.off('snapshot', handler)

        resolve(url)
      }

      this.channel.on('snapshot', handler)
    })

    // Send to server and wait for response.
    this.channel.emit('snapshot', snapshot)

    const response = await responsePromise

    consola.debug(`Snapshot sent to the server: ${response}`)

    return response
  }
}

export const dreamtrack = DreamTrackService.make()
