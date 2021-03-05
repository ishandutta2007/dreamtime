/* eslint-disable promise/always-return */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
const path = require('path')
const fs = require('fs-extra')
const { throttle } = require('lodash')
const axios = require('axios')
const URI = require('urijs')
const prettyBytes = require('pretty-bytes')
const contentDisposition = require('content-disposition')
const { Release } = require('@dreamnet/deploy')

const IS_DEV = process.env.NODE_ENV !== 'production'

// Distribution path
const DISTPATH = path.resolve(__dirname, '..', '..', 'dist')

// Defaults
process.env.DEPLOY_GIT_TAG = process.env.RELEASE_VERSION
process.env.DEPLOY_MINIO_FOLDER = `/releases/${process.env.RELEASE_VERSION}`

// Release upload providers
const PROVIDERS = ['Minio', 'Github', 'Teknik']

//
const PLATFORMS = ['windows', 'linux', 'macos']
const ARCHS = ['', 'portable']

//
const RELEASES = []
const OUTPUT = []

//
const http = axios.create({
  baseURL: `https://downloads.dreamnet.tech/v2/dreamtime/${process.env.RELEASE_VERSION}`,
  params: {
    password: process.env.RELEASE_PASSWORD,
  },
})

/**
 *
 *
 * @param {axios.AxiosResponse} response
 * @return {string}
 */
function getFilename(response) {
  if (response.headers['content-disposition']) {
    const disposition = contentDisposition.parse(response.headers['content-disposition'])

    if (disposition.parameters.filename) {
      return disposition.parameters.filename
    }
  }

  const uri = new URI(response.request.res.responseUrl)

  if (uri.hasQuery('filename')) {
    return uri.query(true).filename
  }

  return uri.filename()
}

/**
 *
 *
 * @param {*} attempts
 * @param {*} func
 * @param {*} args
 * @return {*}
 */
async function asyncAttempt(attempts, func, ...args) {
  let count = 0
  let error

  do {
    try {
      return await Promise.resolve(func.apply(undefined, args))
    } catch (err) {
      error = err
      count += 1
    }
  } while (count < attempts)

  throw error
}

/**
 *
 *
 * @param {*} platform
 * @param {*} arch
 * @param {*} format
 * @return {*}
 */
async function downloadSingle(platform, arch, format) {
  const response = await http.request({
    responseType: 'stream',
    maxContentLength: -1,
    params: {
      platform,
      arch,
      format,
    },
  })

  const filename = getFilename(response)
  const filepath = path.resolve(DISTPATH, filename)

  if (IS_DEV && fs.existsSync(filepath)) {
    return filepath
  }

  console.log(`Downloading ${filename}...`)

  const readStream = response.data
  const writeStream = fs.createWriteStream(filepath)

  if (IS_DEV) {
    console.log({
      platform,
      arch,
      format,
      'content-disposition': response.headers['content-disposition'],
      responseUrl: response.request.res.responseUrl,
    })
  }

  return new Promise((resolve, reject) => {
    writeStream.on('error', (err) => {
      reject(err)
    })

    writeStream.on('finish', () => {
      resolve(filepath)
    })

    readStream.on('error', (err) => {
      reject(err)
    })

    readStream.on('data', throttle(() => {
      const progress = prettyBytes(writeStream.bytesWritten)
      console.log(progress)
    }, 5000))

    readStream.pipe(writeStream)
  }).catch((error) => {
    readStream.destroy()
    writeStream.destroy()
    fs.removeSync(filepath)

    console.warn(error)
  })
}

/**
 *
 *
 */
async function download() {
  fs.ensureDir(DISTPATH)

  for (const platform of PLATFORMS) {
    for (const arch of ARCHS) {
      let FORMATS = ['']

      if (platform === 'linux') {
        FORMATS = ['', 'AppImage', 'rpm']
      }

      for (const format of FORMATS) {
        await asyncAttempt(3, downloadSingle, platform, arch, format)
          .then((filepath) => {
            RELEASES.push(filepath)
          })
          .catch((err) => {
            console.warn(`Download failed (${platform}-${arch}-${format}): ${err.message}`)
          })

        if (IS_DEV) {
          // My internet is shitty...
          return
        }
      }
    }
  }

  console.log(RELEASES)
}

/**
 *
 *
 * @param {Release} release
 */
async function run(release) {
  release.addProvider(PROVIDERS)

  release.on('upload:begin', (provider) => {
    console.log(`Uploading to ${provider.label}...`)
  })

  release.on('upload:success', (result, provider) => {
    console.log(`✔️ Uploaded to ${provider.label}!`)
  })

  release.on('upload:fail', (error, provider) => {
    console.warn(`❌ Upload to ${provider.label} failed: ${error.message}`)
  })

  release.on('pin:begin', (provider) => {
    console.log(`Pinning to ${provider.label}...`)
  })

  release.on('pin:success', (cid, provider) => {
    console.log(`✔️ Pinned to ${provider.label}!`)
  })

  release.on('pin:fail', (error, provider) => {
    console.log(`❌ Pin to ${provider.label} failed: ${error.message}`)
  })

  const response = await release.deploy()

  OUTPUT.push(response)

  return response
}

async function upload() {
  for (const filepath of RELEASES) {
    if (!fs.existsSync(filepath)) {
      console.warn(`The file does not exist: ${filepath}`)
      continue
    }

    console.log(`Deploying: ${filepath}`)

    const release = new Release(filepath)
    await run(release)

    // Print results
    console.log(JSON.stringify(OUTPUT, null, 2))
  }
}

/**
 *
 *
 */
async function main() {
  await download()

  await upload()
}

main()
