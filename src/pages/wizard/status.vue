<template>
  <div class="tos">
    <PageHeader>
      <h2 class="title">
        <span class="icon"><font-awesome-icon icon="magic" /></span>
        <span>Setup Wizard</span>
      </h2>

      <h3 class="subtitle">
        Make sure you can run {{ $dream.name }} before proceeding.
      </h3>
    </PageHeader>

    <div v-if="hasAlert" class="notification notification--warning">
      <h5>
        <span class="icon"><font-awesome-icon icon="exclamation-triangle" /></span>
        <span>WARNING!</span>
      </h5>
      
      <p>You may not be able to run {{ $dream.name }} correctly.</p>
    </div>

    <!-- RAM -->
    <AppBox class="requirement">
      <div class="requirement__status" :class="ramStatus" />

      <div class="requirement__description">
        <h4>+8 GB of RAM</h4>
        <h5>Your system has <b>{{ system.memory.total | bytes }}</b> of RAM</h5>

        <p v-if="requirements.recommended.ram">
          😁 Nice! You should not have any problem using the application.
        </p>

        <p v-else-if="usingGPU">
          🤔 You have less RAM than recommended but because you use your GPU for nudification you may not have problems.
        </p>

        <p v-else>
          😓 Your RAM does not reach the recommended minimum, it is very possible that the nudification algorithm fails or the application freezes. Please upgrade your RAM.
        </p>
      </div>
    </AppBox>

    <!-- GPU -->
    <AppBox v-if="usingGPU" class="requirement">
      <div class="requirement__status" :class="vramStatus" />

      <div class="requirement__description">
        <h4>+6 GB of dedicated VRAM</h4>
        <h5>Your graphics card has <b>{{ (system.primaryGpu.vram * 1000000) | bytes }}</b> of VRAM</h5>

        <p v-if="requirements.recommended.vram">
          😁 Nice! Your graphics card should be able to create fake nudes without problems.
        </p>

        <p v-else>
          😓 The VRAM of your GPU does not reach the recommended minimum, it is very possible that the nudification algorithm fails. Please upgrade your GPU or <NuxtLink to="/settings/processing">
            use CPU nudification
          </NuxtLink>.
        </p>
      </div>
    </AppBox>

    <!-- Models folder -->
    <AppBox class="requirement">
      <div class="requirement__status" :class="folderStatus" />

      <div class="requirement__description">
        <h4>Models folder</h4>
        <h5>{{ $settings.folders.models }}</h5>

        <p v-if="requirements.folders.models">
          😁 Nice! The fake nudes storage folder has no problems.
        </p>

        <p v-else>
          😓 The fake nudes storage folder has special characters or emojis, it is very possible that this may cause errors in the nudification.<br>Please check the <nuxt-link to="/settings/folders">
            folder settings
          </nuxt-link> and make sure to install DreamTime in a path that only contains characters from the English alphabet.
        </p>
      </div>
    </AppBox>

    <div class="wizard__footer">
      <button class="button button--xl" @click="next">
        Continue
      </button>
    </div>
  </div>
</template>

<script>
import prettyBytes from 'pretty-bytes'
import { requirements } from '~/modules/system'

const { system } = $provider

export default {
  layout: 'wizard',

  filters: {
    bytes(value) {
      return prettyBytes(value)
    },
  },

  data: () => ({
    requirements,
    system,
  }),

  computed: {
    usingGPU() {
      return this.$settings.preferences.advanced.device === 'GPU' && system.primaryGpu
    },

    hasAlert() {
      if (!requirements.recommended.ram) {
        return true
      }

      if (!requirements.recommended.vram && this.$settings.processing.device === 'GPU') {
        return true
      }

      return !requirements.folders.models
    },

    ramStatus() {
      if (requirements.recommended.ram) {
        return {
          'requirement__status--success': true,
        }
      }

      if (this.$settings.processing.device === 'GPU') {
        return {
          'requirement__status--warning': true,
        }
      }

      return {
        'requirement__status--danger': true,
      }
    },

    vramStatus() {
      if (requirements.recommended.vram) {
        return {
          'requirement__status--success': true,
        }
      }

      return {
        'requirement__status--danger': true,
      }
    },

    folderStatus() {
      if (requirements.folders.models) {
        return {
          'requirement__status--success': true,
        }
      }

      return {
        'requirement__status--danger': true,
      }
    },
  },

  methods: {
    next() {
      this.$settings.wizard.welcome = true
      this.$router.push('/wizard/tos')
    },
  },
}
</script>

<style lang="scss" scoped>
.tos {
  @apply pb-6;
}

.requirement {
  &::v-deep {
    .box__content {
      @apply flex gap-6;
    }
  }
}

.requirement__status {
  @apply rounded-full bg-black;
  width: 50px;
  height: 50px;

  &.requirement__status--success {
    @apply bg-success;
  }

  &.requirement__status--warning {
    @apply bg-warning;
  }

  &.requirement__status--danger {
    @apply bg-danger;
  }
}

.requirement__description {
  @apply flex-1;

  h4 {
    @apply text-lg font-semibold;
  }

  h5 {
    @apply text-xs mb-3;
  }
}
</style>
