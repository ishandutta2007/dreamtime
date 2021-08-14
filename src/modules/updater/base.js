// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import {
  isNil, isArray, isPlainObject, isNumber, find,
  startsWith, filter, isEmpty, isString,
  endsWith, attempt,
} from 'lodash'
import axios from 'axios'
import compareVersions from 'compare-versions'
import filesize from 'filesize'
import delay from 'delay'
import { basename } from 'path'
import { dreamtrack } from '../services'
import { Consola } from '../consola'

const { system } = $provider
const { getPath } = $provider.paths
const {
  existsSync, statSync, download, unlinkSync,
} = $provider.fs
const { dialog } = $provider.api
const { platform } = $provider.util

const extRegex = /(?:\.(zip|7z|exe|dmg|snap))?$/

/**
 * todo: don't just depend on github
 * @type {string}
 */
const GITHUB_API = 'https://api.github.com/repos'

const DMETHOD = {
  ANY: 0,
  HTTP: 1,
  IPFS: 2,
  TORRENT: 3,
}

export class BaseUpdater {
  /**
   * @type {boolean}
   */
  enabled = false

  /**
   * @type {Error}
   */
  error

  get errorResponse() {
    return this.error?.response?.data?.message
  }

  /**
   * @type {Consola}
   */
  consola

  /**
   * @type {axios.AxiosInstance}
   */
  http

  /**
   * @type {Array}
   */
  releases = []

  /**
   * @type {Object}
   */
  latest = {}

  /**
   * @type {Object}
   */
  latestCompatible = {}

  /**
   * @type {string}
   */
  _currentVersion = 'v0.0.0'

  get currentVersion() {
    return this._currentVersion
  }

  /**
   * @type {Array}
   */
  downloadAllUrls = []

  /**
   *
   * @type {DMETHOD}
   */
  downloadMethod = DMETHOD.ANY

  getDownloadUrls(method) {
    switch (method) {
      case DMETHOD.ANY:
        return this.downloadAllUrls

      case DMETHOD.HTTP:
        return this.downloadAllUrls.filter((url) => startsWith(url, 'http') && !endsWith(url, '.torrent'))

      case DMETHOD.IPFS:
        return this.downloadAllUrls.filter((url) => startsWith(url, 'Qm'))

      case DMETHOD.TORRENT:
        return this.downloadAllUrls.filter((url) => startsWith(url, 'magnet:') || endsWith(url, '.torrent'))

      default:
        return []
    }
  }

  get downloadUrls() {
    return this.getDownloadUrls(this.downloadMethod)
  }

  get hasIPFSUrls() {
    return this.getDownloadUrls(DMETHOD.IPFS).length > 0
  }

  get hasTorrentUrls() {
    return this.getDownloadUrls(DMETHOD.TORRENT).length > 0
  }

  /**
   * @type {EventEmitter}
   */
  events

  /**
   * @type {Object}
   */
  update = {
    active: false,
    status: null,
    progress: 0,
    written: -1,
    total: -1,
    peers: -1,
  }

  /**
   * @type {string}
   */
  get can() {
    return !isNil(this.name) && !isNil(this.githubRepo)
  }

  /**
   * @type {string}
   */
  get name() {
    return null
  }

  /**
   * @type {string}
   */
  get displayName() {
    return dreamtrack.get(`projects.${this.name}.about.title`, this.name)
  }

  /**
   * @type {string}
   */
  get latestVersion() {
    // eslint-disable-next-line camelcase
    return this.latest?.tag_name || 'v0.0.0'
  }

  /**
   * @type {string}
   */
  get latestCompatibleVersion() {
    // eslint-disable-next-line camelcase
    return this.latestCompatible?.tag_name || 'v0.0.0'
  }

  /**
   * @type {boolean}
   */
  get available() {
    if (!this.enabled) {
      return false
    }

    if (!isString(this.currentVersion)) {
      return true
    }

    try {
      return compareVersions.compare(this.latestCompatibleVersion, this.currentVersion, '>')
    } catch (error) { 
      return false
    }
  }

  /**
   * @type {string}
   */
  get githubRepo() {
    return dreamtrack.get(`projects.${this.name}.repository.github`)
  }

  /**
   * @type {string}
   */
  get filename() {
    if (this.downloadAllUrls.length === 0) {
      return null
    }

    for (const url of this.downloadAllUrls) {
      const filename = basename(url).split('?')[0].split('#')[0]

      if (isEmpty(filename) || isNil(extRegex.exec(filename)[1])) {
        // empty or no filename in url
        continue
      }

      return filename
    }

    throw new Error('The file name could not be obtained!')
  }

  /**
   * @type {string}
   */
  get platform() {
    return platform({
      macos: 'macos',
      windows: 'windows',
      linux: 'ubuntu',
    })
  }

  /**
   *
   */
  constructor() {
    this.consola = Consola.create(`updater:${this.name}`)
  }

  /**
   *
   */
  async setup() {
    this.enabled = false

    if (!system.online) {
      this.error = new Warning('There is no Internet connection. Please make sure you are connected before starting.')
      this.consola.warn(this.error)
      return
    }

    if (!this.can) {
      this.consola.warn('Disabled.')
      return
    }

    try {
      this.http = axios.create({
        baseURL: `${GITHUB_API}/${this.githubRepo}`,
        timeout: 6000,
      })

      await this._fetchReleases()
      this.consola.info(`Current: ${this.currentVersion} - Latest: ${this.latestCompatibleVersion}`)

      this.refresh()

      if (this.downloadAllUrls.length === 0) {
        throw new Warning('No available download links found, please try again later.')
      }

      this.enabled = true

      if (this.available) {
        this.sendNotification()
      }
    } catch (err) {
      this.error = err
      this.consola.warn('The project information could not be obtained from Github!', err)
    }
  }

  refresh() {
    this.downloadAllUrls = this._getDownloadUrls()
  }

  /**
   *
   * @param {*} releases
   */
  _getLatestCompatible(releases) {
    return releases[0]
  }

  /**
   *
   */
  _getDownloadUrls() {
    let urls
    let asset

    try {
      urls = dreamtrack.get(['projects', this.name, 'releases', this.latestCompatibleVersion, 'urls'], [])
    } catch (err) {
      // not the best way, but works
      urls = []
    }

    if (isPlainObject(urls)) {
      urls = urls[this.platform]
    }

    if (!isArray(urls)) {
      urls = []
    }

    if (this.latestCompatible.assets.length === 1) {
      [asset] = this.latestCompatible.assets
    } else {
      asset = find(this.latestCompatible.assets, (item) => item.name.includes(this.platform))
    }

    if (!isNil(asset)) {
      // github download url at the end, it doesn't always work.
      urls.push(asset.browser_download_url)
    }

    return urls
  }

  /**
   *
   * @param {string} status
   * @param {number} progress
   */
  _setUpdateProgress(status) {
    this.update.active = true
    this.update.status = status
    this.update.progress = -1
  }

  /**
   *
   */
  _stopUpdateProgress() {
    this.update = {
      active: false,
      status: null,
      progress: 0,
      written: 0,
      total: 0,
    }
  }

  /**
   *
   */
  async _fetchReleases() {
    const response = await this.http.get('/releases')

    // only final releases
    this.releases = filter(response.data, {
      draft: false,
      prerelease: false,
    })

    if (this.releases.length === 0) {
      throw new Exception('Github has returned that there are no releases!')
    }

    // eslint-disable-next-line prefer-destructuring
    this.latest = this.releases[0]
    this.latestCompatible = this._getLatestCompatible(this.releases)

    if (isNil(this.latestCompatible)) {
      throw new Exception('Unable to fetch the latest compatible version.')
    }
  }

  /**
   *
   */
  async start() {
    try {
      let filepath = getPath('downloads', this.filename)

      if (existsSync(filepath)) {
        const useLocal = dialog.showMessageBoxSync({
          type: 'question',
          buttons: ['Yes', 'No, download it again'],
          title: 'Update.',
          message: 'The file is already on your computer, do you want to use it?',
        })

        if (useLocal === 0) {
          await this._install(filepath)
          return
        }

        attempt(() => {
          unlinkSync(filepath)
        })
      }

      filepath = await this._download()

      if (!isNil(filepath)) {
        await this._install(filepath)
      }
    } finally {
      this._stopUpdateProgress()
    }
  }

  pause() {
    if (isNil(this.events)) {
      return
    }

    this.events.emit('pause')
  }

  resume() {
    if (isNil(this.events)) {
      return
    }

    this.events.emit('resume')
  }

  /**
   *
   */
  async _install(filepath) {
    try {
      this._setUpdateProgress('installing')

      // Avoid opening it while it is in use.
      await delay(2000)

      await this.install(filepath)
    } catch (err) {
      throw new Warning('The installation failed.', 'There was a problem trying to install the downloaded file, please try again.', err)
    }
  }

  /**
   *
   */
  async _download() {
    let filepath

    this.consola.debug('Download URLS:')
    this.consola.debug(this.downloadUrls)

    for (const url of this.downloadUrls) {
      this._setUpdateProgress('preparing')

      try {
        // eslint-disable-next-line no-await-in-loop
        filepath = await this._downloadFrom(url)

        if (isNil(filepath)) {
          // cancelled by user
          this._stopUpdateProgress()
          return null
        }

        return filepath
      } catch (err) {
        this.consola.warn(`Unable to download update from: ${url}`, err).report()
        continue
      }
    }

    throw new Warning('Unable to download update.', 'Please download the update manually or verify the configuration of your VPN/Firewall.')
  }

  /**
   *
   * @param {string} url
   */
  _downloadFrom(url) {
    this.consola.info(`Downloading update from: ${url}`)

    if (this.downloadMethod === DMETHOD.IPFS) {
      consola.track('DOWNLOAD_IPFS', url)
    }

    if (this.downloadMethod === DMETHOD.TORRENT) {
      consola.track('DOWNLOAD_TORRENT', url)
    }

    return new Promise((resolve, reject) => {
      this.events = download(url, {
        filename: this.filename,
      })

      this.events.on('progress', (payload) => {
        this._setUpdateProgress('downloading')

        if (isNumber(payload.progress)) {
          this.update.progress = payload.progress
        } else {
          this.update.progress = -1
        }

        this.update.total = payload.total
        this.update.written = payload.written
      })

      this.events.on('peers', (value) => {
        this.update.peers = value
      })

      this.events.on('error', (err) => {
        this.events = null
        reject(err)
      })

      this.events.on('finish', (filepath) => {
        this.events = null

        if (!filepath || !existsSync(filepath)) {
          reject(new Warning('Unable to download update.', 'The file has been downloaded but has not been saved.'))
          return
        }

        const stats = statSync(filepath)
        const size = filesize(stats.size, { exponent: 2, output: 'object' })

        if (size.value < 20) {
          reject(new Warning('Unable to download update.', 'The file has been downloaded corrupted.'))
          return
        }

        resolve(filepath)
      })

      this.events.on('cancelled', () => {
        this.events = null
        resolve()
      })
    })
  }

  /**
   *
   */
  cancel() {
    if (isNil(this.events)) {
      return
    }

    this.events.emit('cancel')
  }

  /**
   *
   * @param {string} filepath
   */
  // eslint-disable-next-line no-unused-vars, no-empty-function
  async install(filepath) { }

  /**
   *
   */
  sendNotification() { }
}
