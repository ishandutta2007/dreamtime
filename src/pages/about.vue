<template>
  <div class="about">
    <!-- Menu -->
    <portal to="menu">
      <section class="menu__items">
        <MenuItem
          :label="$dreamtime.name"
          :icon="$dreamtime.logo"
          href="/about/dreamtime" />

        <MenuItem
          :label="$dreampower.name"
          :icon="$dreampower.logo"
          href="/about/dreampower" />

        <MenuItem
          :label="$waifu.name"
          :icon="$waifu.logo"
          href="/about/waifu" />

        <MenuItem
          label="OpenDreamNet"
          :icon="$community.logo"
          href="/about/dreamnet" />

        <MenuItem
          label="Supporters"
          icon="heart"
          href="/about/supporters" />

        <MenuItem
          label="Developers"
          icon="code"
          href="/about/developers" />
      </section>
    </portal>

    <div class="wrapper">
      <!-- Offline -->
      <div v-if="!$provider.system.online" class="notification notification--warning">
        <h5>
          <span class="icon"><font-awesome-icon icon="exclamation-triangle" /></span>
          <span>Offline mode</span>
        </h5>

        <span>
          You will not be able to install updates and get the latest information.
        </span>
      </div>

      <!-- Offline -->
      <div v-else-if="!$dreamtrack.enabled" class="notification notification--warning">
        <h5>
          <span class="icon"><font-awesome-icon icon="exclamation-triangle" /></span>
          <span>Unable to connect to {{ $community.name }} servers.</span>
        </h5>

        <span>
          The information on this page may be incomplete and/or obsolete.
        </span>
      </div>

      <nuxt-child keep-alive />
    </div>
  </div>
</template>

<script>
export default {
  middleware: ({ route, redirect }) => {
    if (route.fullPath === '/about') {
      redirect('/about/dreamtime')
    }
  },
}
</script>

<style lang="scss" scoped>

</style>
