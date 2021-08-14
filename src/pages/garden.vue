<template>
  <div class="dev-garden">
    <section class="box cli-errors">
      <div class="box__header">
        <h2 class="title">
          DreamPower Errors
        </h2>
      </div>

      <div class="box__content">
        <button v-for="(item, index) of cliErrors"
                :key="index"
                class="button"
                @click="showCliError(item)">
          {{ item.query }}
        </button>

        <button class="button"
                @click="showCliError(null)">
          Others
        </button>
      </div>
    </section>

    <section class="box cli-errors">
      <div class="box__header">
        <h2 class="title">
          Force Error
        </h2>
      </div>

      <div class="box__content">
        <button class="button"
                @click="showError()">
          Trigger Error
        </button>
      </div>
    </section>

    <section class="box cli-errors">
      <div class="box__header">
        <h2 class="title">
          Wizard
        </h2>
      </div>

      <div class="box__content">
        <nuxt-link to="/wizard/dreamtime?forced=true" class="button">
          DreamTime
        </nuxt-link>

        <nuxt-link to="/wizard/power?forced=true" class="button">
          DreamPower
        </nuxt-link>

        <nuxt-link to="/wizard/checkpoints?forced=true" class="button">
          Checkpoints
        </nuxt-link>

        <nuxt-link to="/wizard/waifu?forced=true" class="button">
          Waifu2X
        </nuxt-link>

        <nuxt-link to="/wizard/telemetry?forced=true" class="button">
          Telemetry
        </nuxt-link>

        <nuxt-link to="/wizard/settings?forced=true" class="button">
          Basic settings
        </nuxt-link>
      </div>
    </section>
  </div>
</template>

<script>
import cliErrors from '~/modules/config/cli-errors.json'

export default {
  data: () => ({
    cliErrors,
  }),

  methods: {
    showCliError(item) {
      if (!item) {
        throw new Warning('Unknown error!', 'The algorithm has been interrupted by an unknown problem.', new Error('Im a bug! 🐞'))
      }

      throw new Warning(item.title || 'Unknown error!', item.message, new Error('Im a bug! 🐞'))
    },

    showError() {
      throw new Exception('Developer error!', 'Oh, fiddlesticks. What now?', new Error('Im a bug! 🐞'))
    },
  },
}
</script>

<style lang="scss" scoped>
.cli-errors {
  .button {
    @apply m-3;
  }
}
</style>
