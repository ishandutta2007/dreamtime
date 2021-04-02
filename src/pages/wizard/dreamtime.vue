<template>
  <div class="wizard-project">
    <PageHeader>
      <h2 class="title">
        <span class="icon"><font-awesome-icon icon="sync" /></span>
        <span>Updater</span>
      </h2>

      <h3 class="subtitle">
        {{ $dreamtime.name }}
      </h3>

      <template #right>
        <button class="button" @click="$router.replace('/')">
          <span class="icon"><font-awesome-icon icon="caret-left" /></span>
          <span>Go back</span>
        </button>
      </template>
    </PageHeader>

    <div class="project__content">
      <!-- Portable -->
      <div v-if="!$dreamtime.isPortable && isLinux" class="notification notification--warning">
        <span class="icon"><font-awesome-icon icon="info-circle" /></span> Linux users: it is recommended to update {{ $dreamtime.name }} with Snap instead:<br><code class="block font-bold text-center">sudo snap refresh dreamtimetech</code>
      </div>

      <!-- CONNECTION ERROR -->
      <div v-if="updater.error" class="notification notification--danger">
        <h5>CONNECTION ERROR!</h5>
        <span>A problem has occurred when trying to get the information from Github, please make sure you have a stable internet connection and restart the application.</span>
        <br><br>

        <pre>
<span v-if="updater.errorResponse">{{ updater.errorResponse }}</span>
{{ updater.error.stack }}
</pre>
      </div>

      <!-- Updater -->
      <AppBox>
        <ProjectUpdate project="dreamtime" />
      </AppBox>

      <hr>

      <PageHeader>
        <h2 class="title">
          <span class="icon"><font-awesome-icon icon="book" /></span>
          <span>Changelog</span>
        </h2>
      </PageHeader>

      <!-- Changelog -->
      <ProjectChangelog project="dreamtime" :limit="1" />
    </div>
  </div>
</template>

<script>
import { dreamtime } from '~/modules/updater'

const { shell } = $provider.api

export default {
  layout: 'wizard',

  middleware({ redirect }) {
    // HOTFIX: The DreamTime updater is outdated and does not work properly,
    // for now we redirect the user to the website to download the latest version.
    shell.openExternal('https://www.dreamtime.tech/docs/installation#releases')
    redirect('/')
  },

  computed: {
    updater() {
      return dreamtime
    },

    isLinux() {
      return process.platform === 'linux'
    },
  },
}
</script>
