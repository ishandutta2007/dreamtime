import { isString } from 'lodash'
import tippy from 'tippy.js'
import {
  dreamtime, dreampower, checkpoints, community, waifu,
} from '~/modules/projects'
import {
  dreamtrack,
} from '~/modules/services'
import { NudifyStore } from '~/modules/nudify'
import { settings } from '~/modules/system'

/**
 * @mixin
 */
export default {
  directives: {
    /**
     * v-tooltip.
     * Tooltip creation.
     */
    tooltip: {
      inserted(el, binding) {
        if (!binding.value) {
          return
        }

        let options = {}

        if (isString(binding.value)) {
          options.content = binding.value
        } else {
          options = binding.value
        }

        tippy(el, options)
      },
    },

    tippy: {
      inserted(el, binding) {
        let options = {}

        if (isString(binding.value)) {
          options.content = binding.value
        } else {
          options = binding.value || {}
        }

        tippy(el, options)
      },
    },
  },

  data: () => ({
    $nudify: NudifyStore,
    $settings: settings,
    $dreamtrack: dreamtrack,
    $dreamtime: dreamtime,
    $dreampower: dreampower,
    $waifu: waifu,
    $checkpoints: checkpoints,
    $community: community,
  }),

  mounted() {
    if (this.$options.layout) {
      this.$store.commit('app/setLayoutClass', this.$options.layout)
    }
  },

  activated() {
    if (this.$options.layout) {
      this.$store.commit('app/setLayoutClass', this.$options.layout)
    }
  },
}
