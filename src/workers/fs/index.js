/* eslint-disable import/default */
// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import PromiseWorker from 'promise-worker'
import Worker from 'worker-loader!./worker'

const worker = new Worker()
const promiseWorker = new PromiseWorker(worker)

/**
 *
 * @param {string} filepath
 */
export function getFilesMetadata(filepath) {
  return promiseWorker.postMessage({
    name: 'getFilesMetadata',
    filepath,
  })
}

/**
 *
 * @param {string} filepath
 */
export function getMetadata(filepath) {
  return promiseWorker.postMessage({
    name: 'getMetadata',
    filepath,
  })
}
