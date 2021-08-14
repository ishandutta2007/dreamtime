// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import registerPromiseWorker from 'promise-worker/register'
import { map, flattenDeep } from 'lodash'
import { join, parse } from 'path'
import {
  existsSync, statSync, stat, readdir,
} from 'fs-extra'
import mime from 'mime-types'
import md5File from 'md5-file'

/**
 *
 * @param {string} filepath
 */
async function getMetadata(filepath) {
  const exists = existsSync(filepath)

  const workload = [
    Promise.resolve(mime.lookup(filepath)),
    Promise.resolve(parse(filepath)),
  ]

  if (exists) {
    workload.push(
      stat(filepath),
      md5File(filepath),
    )
  } else {
    workload.push(
      Promise.resolve(),
      Promise.resolve(),
    )
  }

  const [
    mimetype,
    { name, ext, dir },
    stats,
    md5,
  ] = await Promise.all(workload)

  return {
    exists,
    name,
    ext,
    dir,
    mimetype,
    size: stats?.size ? ((stats.size || 0) / 1000000.0) : null,
    md5,
    birthtime: stats?.birthtimeMs,
  }
}

/**
 *
 * @param {string} filepath
 */
async function getFilesMetadata(filepath) {
  const files = []

  if (!existsSync(filepath)) {
    return files
  }

  const fileStat = statSync(filepath)

  if (fileStat.isDirectory()) {
    const promises = []
    const paths = map(await readdir(filepath), (fpath) => join(filepath, fpath))

    paths.forEach((fpath) => {
      promises.push(getFilesMetadata(fpath))
    })

    files.push(await Promise.all(promises))
  } else {
    files.push(await getMetadata(filepath))
  }

  // you're absolutely right, this is super lazy
  return flattenDeep(files)
}

registerPromiseWorker((message) => {
  if (message.name === 'getMetadata') {
    return getMetadata(message.filepath)
  }

  if (message.name === 'getFilesMetadata') {
    return getFilesMetadata(message.filepath)
  }

  return undefined
})
