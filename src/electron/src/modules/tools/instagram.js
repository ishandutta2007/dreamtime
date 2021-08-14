// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import instagramSave from 'instagram-save'
import createUrl from 'instagram-save/lib/create-url'
import parsePage from 'instagram-save/lib/parse-page'
import { getPath } from './paths'

/**
 *
 * @param {string} input
 * @param {string} [destination]
 */
export async function download(input, destination) {
  if (!destination) {
    // eslint-disable-next-line no-param-reassign
    destination = getPath('temp')
  }

  return instagramSave(input, destination)
}

/**
 *
 * @param {string} input
 */
export function getPost(input) {
  const url = createUrl(input)
  return parsePage(url)
}
