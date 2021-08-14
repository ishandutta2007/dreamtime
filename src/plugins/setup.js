// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2019.

import Vue from 'vue'
import tippy from 'tippy.js'
import prettyBytes from 'pretty-bytes'
import { attempt } from 'lodash'
import { photos } from '~/modules'
import { Consola } from '~/modules/consola'
import { achievements } from '~/modules/system'
import BaseMixin from '~/mixins/BaseMixin'
import { dream } from '~/modules'
import { Nudify, NudifyStore } from '~/modules/nudify'
import { settings } from '~/modules/system'

const consola = Consola.create('setup')

// lift off!
consola.info('Lift off!')

// base mixin.
Vue.mixin(BaseMixin)

// tippyjs
tippy.setDefaultProps({
  delay: [200, 0],
  arrow: true,
  allowHTML: true,
})

export default (ctx, inject) => {
  attempt(() => {
    consola.info(`OS: ${$provider.system.os.distro}`)
    consola.info(`RAM: ${prettyBytes($provider.system.memory.total)}`)
    consola.info(`CPU: ${$provider.system.cpu.brand}`)
    consola.info(`GPU: ${$provider.system.primaryGpu?.model}`)
    consola.info(`Online?: ${$provider.system.online}`)
  })

  // User settings.
  ctx.app.$settings = settings
  inject('settings', settings)

  // DreamTime.
  ctx.app.$dream = dream
  inject('dream', dream)

  // Nudification/Queue.
  Nudify.setup()

  // Nudify store.
  NudifyStore.setup()
  inject('nudify', NudifyStore)

  // Achievements.
  achievements.setup()

  // Photos library.
  photos.setup()

  consola.info('The front-end is ready!')
}
