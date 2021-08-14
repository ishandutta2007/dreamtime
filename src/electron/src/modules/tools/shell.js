// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import { isNil } from 'lodash'
import { is } from 'electron-util'
import regedit from 'regedit'
import { getAppResourcesPath } from './paths'

export const hasWindowsMedia = () => {
  if (is.windows && !is.development) {
    regedit.setExternalVBSLocation(
      getAppResourcesPath('vbs'),
    )
  }

  return new Promise((resolve) => {
    if (!is.windows) {
      resolve(true)
      return
    }

    const regKey = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Setup\\WindowsFeatures'

    regedit.list(regKey, (err, result) => {
      if (!isNil(err)) {
        resolve(false)
        return
      }

      resolve(result[regKey].keys.includes('WindowsMediaVersion'))
    })
  })
}
