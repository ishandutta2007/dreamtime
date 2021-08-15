<template>
  <div v-show="ready" class="ads">
    <div v-show="isAd" ref="adContainer" />

    <HelpLesson v-if="isLesson"
                :lesson="lesson"
                :small="true"
                @click="$router.push({ path: '/help', hash: lesson.photo })" />
  </div>
</template>

<script>
import { sample } from 'lodash'
import { settings } from '~/modules/system'
import { dreamtrack } from '~/modules/services'
import { Help, events } from '~/modules'

const CHANGE_INTERVAL = process.env.NODE_ENV === 'development' ? 60 * 1000 : 15 * 60 * 1000

export default {
  data: () => ({
    type: null,
    ready: false,
    interval: null,
    lesson: null,
  }),

  computed: {
    isAd() {
      return this.type === 'ad'
    },

    isLesson() {
      return this.type === 'lesson'
    },
  },

  mounted() {
    this.init()
    this.interval = setInterval(this.init.bind(this), CHANGE_INTERVAL)

    events.on('settings:ads', this.init.bind(this))
  },

  beforeDestroy() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  },

  methods: {
    init() {
      this.ready = false

      this.chooseType()

      if (this.isAd) {
        this.refreshAd()
      } else if (this.isLesson) {
        this.refreshLesson()
      }
    },

    chooseType() {
      const types = []

      if (settings.app.showAds) {
        types.push('ad')
      }

      if (settings.app.showTips) {
        types.push('lesson')
      }

      if (types.length === 0) {
        this.type = null
      } else if (types.length === 1) {
        // eslint-disable-next-line prefer-destructuring
        this.type = types[0]
      } else {
        this.type = sample(types)
      }
    },

    refreshAd() {
      if (!window.reviveAsync) {
        return
      }

      const id = dreamtrack.get('ads.id', 'da3c97985547acea7ead96b8b6c3890c')

      if (!window.reviveAsync[id]) {
        return
      }

      const ins = document.createElement('ins')
      ins.setAttribute('data-revive-zoneid', dreamtrack.get('ads.zoneid', '1'))
      ins.setAttribute('data-revive-id', id)

      this.$refs.adContainer.innerHTML = ''
      this.$refs.adContainer.appendChild(ins)

      this.$nextTick(() => {
        window.reviveAsync[id].refresh()
        this.ready = true
      })
    },

    refreshLesson() {
      this.lesson = Help.pickRandom()
      this.ready = true
    },
  },
}
</script>

<style lang="scss" scoped>
.ads {
  @apply border-t border-menus-light;
  height: 250px;

  &::v-deep .lesson {
    @apply rounded-none cursor-pointer;
    @include transition('background-color', 0.2s);

    &:hover {
      @apply bg-menus-light;
    }

    .box__photo {
      @apply rounded-none;
    }
  }

  .lesson {
    height: inherit;
  }
}
</style>
