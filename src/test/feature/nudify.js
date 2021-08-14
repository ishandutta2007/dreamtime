/* eslint-disable */

// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

/* eslint arrow-body-style: ["error", "never"] */
/* eslint prefer-arrow-callback: "off" */
/* eslint consistent-return: "off" */

const { Application } = require('spectron')
const assert = require('assert')
const electronPath = require('electron')
const { join } = require('path')

describe('Nudify', function () {
  before(async function () {
    this.timeout(10000)

    this.app = new Application({
      path: electronPath,
      args: [join(__dirname, '..', '..')],
    })

    await this.app.start()

    this.client = this.app.client
    this.electron = this.app.electron.remote
    this.browserWindow = this.app.browserWindow

    await this.app.client.waitUntilWindowLoaded()
  })

  after(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  describe('File selector', function () {
    before(async function () {
      this.inputFile = await this.client.$('.uploader__alt input[type="file"]')
      console.log(this.inputFile)
    })

    it('single photo', function () {
      return true
    })

    it('multiple photos', function () {
      return true
    })
  })
})
