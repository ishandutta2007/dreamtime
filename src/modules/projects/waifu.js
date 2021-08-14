import { isNil } from 'lodash'
import { waifu as updater } from '../updater'
import { dreamtrack } from '../services'

const { getWaifuPath } = $provider.paths
const { shell } = $provider.api

class Waifu {
  data = {
    repository: {
      github: 'dreamnettech/waifu2x-chainer',
    },
    about: {
      title: 'Waifu2X',
      description: 'Image upscaling & denoise algorithm.',
      logo: 'https://fs.dreamlink.cloud/ipfs/QmR1gB7FUmheEEYQM2NpBHSYULQU3JtgpXBwiUfkcfZsy5?filename=waifu2x-logo.png',
      navigation: [
        {
          icon: ['fab', 'github'],
          href: 'https://github.com/dreamnettech/waifu2x-chainer',
          label: 'Repository',
        },
      ],
    },
  }

  updater = updater

  get name() {
    return this.data.about.title
  }

  get description() {
    return this.data.about.description
  }

  get logo() {
    return this.data.about.logo
  }

  get version() {
    return this.updater.currentVersion
  }

  get isInstalled() {
    return !isNil(this.version) && this.version !== 'v0.0.0'
  }

  async init() {
    if (dreamtrack.enabled) {
      this.data = dreamtrack.get('projects.waifu', this.data)
    }

    await this.updater.setup()
  }

  openAppFolder() {
    shell.openPath(getWaifuPath())
  }
}

export const waifu = new Waifu()
