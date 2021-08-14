/* eslint-disable prefer-destructuring */
/* eslint-disable camelcase, no-console */
// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2020.

const path = require('path')
const fs = require('fs')
const axios = require('axios')
const sha256File = require('sha256-file')
const uuid = require('uuid')
const { Release } = require('@dreamnet/deploy')
const { choice } = require('@dreamnet/app')

require('dotenv').config()

// Release urls
const output = []

// Release detection
let IS_RELEASE = false

if (process.env.GITHUB_REF) {
  IS_RELEASE = process.env.GITHUB_REF.substring(0, 9) === 'refs/tags'
  process.env.DEPLOY_GIT_TAG = process.env.GITHUB_REF.split('/')[2]
} else {
  process.env.DEPLOY_GIT_TAG = process.env.GITHUB_SHA.substring(0, 7)
}

// Early-access detection
const IS_EARLY = process.env.DEPLOY_GIT_TAG.includes('-early') || process.env.DEPLOY_GIT_TAG.includes('-rc')

// Defaults
process.env.DEPLOY_GIT_REPO = 'dreamtime'
process.env.DEPLOY_MINIO_FOLDER = `/releases/${process.env.DEPLOY_GIT_TAG}`

if (IS_EARLY) {
  process.env.DEPLOY_MINIO_BUCKET = 'dreamtime-early'
  delete process.env.DEPLOY_MINIO_GATEWAY
}

// Release version
const VERSION = `v${process.env.npm_package_version}`

// Distribution path
const DISTPATH = path.resolve(__dirname, '..', '..', 'dist')

// Release upload providers
const PROVIDERS = []

if (IS_RELEASE) {
  if (process.env.NODE_ENV === 'development') {

  } else {
    PROVIDERS.push('Pinata')

    if (!IS_EARLY) {
      PROVIDERS.push('Github', 'Teknik')
    }

    PROVIDERS.push('MEGA')
  }
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

  if (IS_EARLY && release.cryptr) {
    output.push(release.cryptr.encrypt(JSON.stringify(response)))
  } else {
    output.push(response)
  }

  return response
}

/**
 *
 *
 * @param {Release} release
 */
async function deploy({ cid }, response, checksum) {
  const records = []
  const arch = process.env.BUILD_PORTABLE ? 'portable' : undefined
  const platform = choice({ windows: 'windows', linux: 'linux', macos: 'macos' })

  const defs = {
    filename: process.env.BUILD_FILENAME,
    format: process.env.BUILD_FORMAT,
    type: 'http',
  }

  // IPFS Gateways
  if (cid) {
    records.push({
      ...defs,
      url: cid,
      type: 'ipfs',
    })

    records.push({
      ...defs,
      url: `https://fs.dreamlink.cloud/ipfs/${cid}?filename=${process.env.BUILD_FILENAME}`,
      priority: 25,
    })

    records.push({
      ...defs,
      url: `https://gateway.ipfs.io/ipfs/${cid}?filename=${process.env.BUILD_FILENAME}`,
      priority: 20,
    })

    records.push({
      ...defs,
      url: `https://gateway.pinata.cloud/ipfs/${cid}?filename=${process.env.BUILD_FILENAME}`,
      priority: 10,
    })
  }

  response.forEach((data) => {
    if (data.cid) {
      // Already handled.
      return
    }

    let priority = 1
    let is_direct = true

    if (data.url.includes('s3.opendreamnet.com') || data.url.includes('X-Amz-Algorithm')) {
      priority = 30
    } else if (data.url.includes('git.teknik.io')) {
      priority = 15
    } else if (data.url.includes('github.com')) {
      priority = 0
      is_direct = false
    }

    records.push({
      ...defs,
      url: data.url,
      priority,
      is_direct,
    })
  })

  try {
    console.log('Deploying to DreamTrack...')

    const payload = {
      password: IS_EARLY ? uuid.v4() : undefined,
      platforms: [
        {
          platform,
          arch,
          checksum,
          records,
        },
      ],
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('response', response)
      console.log('payload', payload)
    }

    await axios({
      method: 'POST',
      baseURL: process.env.DEPLOY_DREAMTRACK_HOST,
      url: `/downloads/v2/dreamtime/${VERSION}`,
      headers: {
        Authorization: `Basic ${process.env.DEPLOY_DREAMTRACK_KEY}`,
      },
      data: payload,
    })

    console.log('✔️ Done!')
  } catch (error) {
    console.warn(error)

    if (error.response && error.response.data) {
      console.warn('message', error.response.data.message)
      console.warn('error', error.response.data.error)
    }
  }
}

/**
 *
 *
 */
async function start() {
  const filepath = path.resolve(DISTPATH, process.env.BUILD_FILENAME)

  if (!fs.existsSync(filepath)) {
    throw new Error(`The file does not exist: ${filepath}`)
  }

  if (fs.existsSync(filepath)) {
    const checksum = sha256File(filepath)

    console.log(`Deploying: ${filepath} (${checksum})`)

    if (PROVIDERS.length > 0) {
      const release = new Release(filepath)

      const response = await run(release)
      await deploy(release, response, checksum)

      // Print results
      console.log(JSON.stringify(output, null, 2))
    } else {
      throw new Error('No providers!')
    }
  }
}

start()
