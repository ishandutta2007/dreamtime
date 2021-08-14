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
const { existsSync } = require('fs-extra')

describe('Application launch', function () {
  this.timeout(3000)

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

  describe('initial files', function () {
    before(async function () {
      this.userData = await this.electron.app.getPath('userData')
    })

    it('dreamtime.log', function () {
      assert.ok(existsSync(join(this.userData, 'dreamtime.log')))
    })

    it('settings.json', function () {
      assert.ok(existsSync(join(this.userData, 'settings.json')))
    })
  })

  describe('window', function () {
    it('shows', async function () {
      assert.strict.equal(await this.client.getWindowCount(), 1)
    })

    it('is visible', async function () {
      assert.ok(await this.browserWindow.isVisible())
    })

    it('is maximized', async function () {
      assert.ok(await this.browserWindow.isMaximized())
    })

    it('is >= 1200x700', async function () {
      const { width, height } = await this.browserWindow.getBounds()

      assert.ok(width >= 1200)
      assert.ok(height >= 700)
    })
  })
})
