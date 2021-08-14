import {
  attempt, startsWith, merge, endsWith, toNumber,
} from 'lodash'
import { join } from 'path'
import fs from 'fs-extra'
import { app, dialog } from 'electron'
import axios from 'axios'
import https from 'https'
import deferred from 'deferred'
import chokidar from 'chokidar'
import WebTorrent from 'webtorrent'
import IpfsCtl from 'ipfsd-ctl'
import toStream from 'it-to-stream'
import all from 'it-all'
import prettyBytes from 'pretty-bytes'
import URI from 'urijs'
import { EventEmitter } from 'events'
import { getAppResourcesPath, getPath } from './paths'

const logger = require('@dreamnet/logplease').create('electron:modules:tools:fs')

// eslint-disable-next-line node/no-deprecated-api
export * from 'fs-extra'

function getFilename(url) {
  const uri = new URI(url)

  if (uri.hasQuery('filename')) {
    return uri.query(true).filename
  }

  return uri.filename()
}

/**
 * @typedef DownloadOptions
 * @property {boolean} showSaveAs
 * @property {string} directory
 * @property {string} filename
 * @property {string} filepath
 */

/**
 * Returns the base64 of a dataURL
 * @param {*} dataURL
 */
export function getBase64Data(dataURL) {
  let encoded = dataURL.replace(/^data:(.*;base64,)?/, '')

  if (encoded.length % 4 > 0) {
    encoded += '='.repeat(4 - (encoded.length % 4))
  }

  return encoded
}

/**
 *
 * @param {string} path
 * @param {string} encoding
 */
export function read(path, encoding = 'utf-8') {
  return fs.readFileSync(path, { encoding })
}

/**
 *
 * @param {string} path
 * @param {string} dataURL
 */
export function writeDataURL(path, dataURL) {
  const data = this.getBase64Data(dataURL)
  return fs.outputFileSync(path, data, 'base64')
}

/**
 *
 * @param {string} path
 * @param {string} destinationPath
 */
export function extractZip(path, destinationPath) {
  const unzipper = require('unzipper')

  const def = deferred()

  const stream = fs.createReadStream(path).pipe(unzipper.Extract({ path: destinationPath }))

  stream.on('close', () => {
    def.resolve()
  })

  stream.on('error', (err) => {
    def.reject(err)
  })

  return def.promise
}

/**
 *
 * @param {string} path
 * @param {string} destinationPath
 */
export function extractSeven(path, destinationPath) {
  const { is, platform } = require('electron-util')
  const { extractFull } = require('node-7z')

  const def = deferred()

  let pathTo7zip

  if (is.development) {
    const sevenBin = require('7zip-bin')
    pathTo7zip = sevenBin.path7za
  } else {
    const binName = platform({
      macos: '7za',
      linux: '7za',
      windows: '7za.exe',
    })

    pathTo7zip = getAppResourcesPath('7zip-bin', binName)
  }

  const seven = extractFull(path, destinationPath, {
    $bin: pathTo7zip,
    recursive: true,
  })

  seven.on('end', () => {
    def.resolve()
  })

  seven.on('error', (err) => {
    def.reject(err)
  })

  return def.promise
}

/**
 *
 *
 * @export
 * @param {string} url
 * @param {*} options
 * @param {EventEmitter} events
 * @param {fs.WriteStream} writeStream
 */
export async function downloadFromHttp(url, options, events, writeStream) {
  let readStream
  let headers

  try {
    const request = await axios.request({
      url,
      responseType: 'stream',
      maxContentLength: -1,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    })

    readStream = request.data
    headers = request.headers
  } catch (err) {
    events.emit('error', err)
    return
  }

  // Close handler
  events.on('close', () => {
    attempt(() => {
      if (readStream) {
        readStream.destroy()
      }
    })
  })

  const contentLength = toNumber(headers['content-length'] || -1)

  readStream.on('error', (err) => {
    events.emit('error', err)
  })

  readStream.on('data', () => {
    events.emit('progress', {
      progress: contentLength > 0 ? toNumber(((writeStream.bytesWritten / contentLength) * 100).toFixed(2)) : -1,
      written: prettyBytes(writeStream.bytesWritten),
      total: contentLength > 0 ? prettyBytes(contentLength) : -1,
    })
  })

  readStream.pipe(writeStream)
}

/**
 *
 *
 * @export
 * @param {string} cid
 * @param {DownloadOptions} options
 * @param {EventEmitter} events
 * @param {fs.WriteStream} writeStream
 */
export async function downloadFromIPFS(cid, options, events, writeStream) {
  /** @type {import('ipfsd-ctl/src/ipfsd-daemon')} */
  let node
  let stats
  let readStream

  // Close handler
  events.on('close', () => {
    attempt(() => {
      if (readStream) {
        readStream.destroy()
      }

      if (node) {
        node.stop()
        node = null
      }
    })

    // Always make sure to delete this file.
    fs.removeSync(getPath('temp', 'dreamtime-ipfs', 'api'))
  })

  // Utility functions
  const createNode = async function () {
    const ipfsBin = require('go-ipfs').path().replace('app.asar', 'app.asar.unpacked')
    const ipfsRepo = getPath('temp', 'dreamtime-ipfs')

    logger.debug('Creating IPFS node...')
    logger.debug(`Bin: ${ipfsBin}`)
    logger.debug(`Repo: ${ipfsRepo}`)

    fs.ensureDirSync(ipfsRepo)

    node = await IpfsCtl.createController({
      ipfsHttpModule: require('ipfs-http-client'),
      ipfsBin,
      ipfsOptions: {
        repo: ipfsRepo,
      },
      remote: false,
      disposable: false,
    })

    await node.init()

    await node.start()

    if (!node.api) {
      logger.debug(node)
      throw new Error('The IPFS node was not created correctly.')
    }

    logger.debug('Created!')
  }

  const connectToProviders = async function () {
    logger.debug('Connecting to providers...')

    try {
      await node.api.swarm.connect('/dnsaddr/node1.dreamlink.cloud/tcp/4001/p2p/12D3KooWAuvHjmNSAxekkpqp9c5Hgcht7JJcZjQDjGUuLvYUDLPe')
      await node.api.swarm.connect('/dnsaddr/node2.dreamlink.cloud/tcp/4001/p2p/12D3KooWLSBENgc42uWwhsppUaRFknmSjcYvEyN5qLFtgr1PbEQS')
    } catch (err) {
      logger.warn(err)
    }
  }

  try {
    await createNode()

    await connectToProviders()

    logger.debug('Connected!')

    if (!node) {
      // It seems that the user has canceled it
      return
    }

    logger.debug(`Obtaining file ${cid} information...`)

    stats = await node.api.object.stat(cid, { timeout: 3 * 60 * 1000 })

    // eslint-disable-next-line no-console
    console.log(stats)

    logger.debug('Downloading...')

    readStream = toStream.readable(node.api.cat(cid))
  } catch (err) {
    events.emit('error', err)
    return
  }

  // eslint-disable-next-line promise/always-return
  all(node.api.dht.findProvs(cid, { timeout: 60 * 1000 })).then((provs) => {
    events.emit('peers', provs.length)
  }).catch(() => { })

  readStream.on('error', (err) => {
    events.emit('error', err)
  })

  readStream.on('data', () => {
    events.emit('progress', {
      progress: toNumber(((writeStream.bytesWritten / stats.CumulativeSize) * 100).toFixed(2)),
      written: prettyBytes(writeStream.bytesWritten),
      total: prettyBytes(stats.CumulativeSize),
    })
  })

  readStream.pipe(writeStream)
}

/**
 *
 *
 * @export
 * @param {string} magnetURI
 * @param {DownloadOptions} options
 * @param {EventEmitter} events
 * @param {fs.WriteStream} writeStream
 */
export function downloadFromTorrent(magnetURI, options, events, writeStream) {
  let client
  let torrent

  // Error handler
  events.on('close', () => {
    attempt(() => {
      if (torrent) {
        torrent.destroy()
      }

      if (client) {
        client.destroy()
      }
    })
  })

  try {
    client = new WebTorrent()

    torrent = client.add(magnetURI)
  } catch (err) {
    events.emit('error', err)
    return
  }

  const timeout = setTimeout(() => {
    events.emit('error', new Error('timeout'))
  }, 3000)

  client.on('error', (err) => {
    events.emit('error', err)
  })

  torrent.on('error', (err) => {
    events.emit('error', err)
  })

  torrent.on('metadata', () => {
    clearTimeout(timeout)

    if (torrent.files.length > 1) {
      events.emit('error', new Error('The torrent contains more than one file.'))
      return
    }

    events.emit('peers', torrent.numPeers)

    const file = torrent.files[0]

    file.createReadStream().pipe(writeStream)
  })

  torrent.on('download', () => {
    events.emit('progress', {
      progress: toNumber(torrent.progress),
      written: prettyBytes(torrent.downloaded),
      total: prettyBytes(torrent.length),
    })
  })

  torrent.on('wire', () => {
    events.emit('peers', torrent.numPeers)
  })
}

/**
 *
 * @param {string} url
 * @param {DownloadOptions} [options]
 */
export function download(url, options = {}) {
  const events = new EventEmitter()

  let cancelled = false

  // Options setup
  options = merge({
    showSaveAs: false,
    directory: app.getPath('downloads'),
    filename: getFilename(url),
  }, options)

  if (!options.filepath) {
    options.filepath = join(options.directory, options.filename)
  }

  if (options.showSaveAs) {
    options.filepath = dialog.showSaveDialogSync({
      defaultPath: options.filepath,
    })
  }

  // Write stream
  const writeStream = fs.createWriteStream(options.filepath)

  writeStream.on('error', (err) => {
    events.emit('error', err)
  })

  writeStream.on('finish', () => {
    if (cancelled) {
      events.emit('cancelled')
      return
    }

    // Finish & Close
    events.emit('finish', options.filepath)
    events.emit('close')
  })

  // Cancel handler
  events.on('cancel', () => {
    cancelled = true

    attempt(() => {
      fs.unlinkSync(options.filepath)
    })

    logger.info('Download cancelled by user.')

    // Cancelled & Close
    events.emit('cancelled')
    events.emit('close')
  })

  // Error handler
  events.on('error', (err) => {
    attempt(() => {
      fs.unlinkSync(options.filepath)
    })

    logger.warn('Download error:', err)

    // Error & Close
    events.emit('close')
  })

  // Close handler
  events.on('close', () => {
    attempt(() => {
      writeStream.destroy()
    })
  })

  // Download!
  if (startsWith(url, 'Qm')) {
    downloadFromIPFS(url, options, events, writeStream)
  } else if (startsWith(url, 'magnet:') || endsWith(url, '.torrent')) {
    downloadFromTorrent(url, options, events, writeStream)
  } else if (startsWith(url, 'http')) {
    downloadFromHttp(url, options, events, writeStream)
  } else {
    setTimeout(() => {
      events.emit('error', new Error('Invalid download address.'))
    }, 0)
  }

  return events
}

/**
 *
 * @param {string} url
 * @param {Object} [options]
 */
export function downloadAsync(url, options = {}) {
  return new Promise((resolve, reject) => {
    const bus = download(url, options)

    bus.on('finish', (filepath) => {
      resolve(filepath)
    })

    bus.on('error', (err) => {
      reject(err)
    })
  })
}

export { chokidar }
