// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2020.

import {
  isNil, map, isArray,
} from 'lodash'
import { DragDropMixin } from './DragDropMixin'
import { Consola } from '~/modules/consola'
import { Nudify } from '~/modules/nudify'

const consola = Consola.create('upload')

const { dialog } = $provider.api

export const UploadMixin = {
  mixins: [DragDropMixin],

  methods: {
    /**
     * File selected, start a new transformation process
     */
    addFile(file) {
      if (isNil(file)) {
        return
      }

      Nudify.addFile(file.path)
    },

    /**
     *
     */
    async addFiles(files) {
      if (!isArray(files)) {
        return
      }

      await Nudify.addFiles(files)
    },

    /**
     *
     */
    openFolder() {
      const paths = dialog.showOpenDialogSync({
        properties: ['openDirectory'],
      })

      consola.track('UPLOAD_FOLDER')

      this.addFiles(paths)
    },

    onURL(url) {
      Nudify.addUrl(url)
      consola.track('DROP_URL')
    },

    onFiles(files) {
      const paths = map(files, 'path')
      this.addFiles(paths)
      consola.track('DROP_FILE')
    },
  },
}
