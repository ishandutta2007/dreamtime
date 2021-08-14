import { isNil } from 'lodash'
import { checkpoints as updater } from '../updater'
import { dreamtrack } from '../services'
import { requirements } from '../system'

const { getPowerPath } = $provider.paths
const { shell } = $provider.api

class Checkpoints {
  data = {
    repository: {
      github: 'dreamnettech/dreampower-checkpoints',
    },
    about: {
      title: 'Checkpoints',
      description: 'DeepNude pre-trained models.',
      logo: 'https://fs.dreamlink.cloud/ipfs/QmWkpwjEq6YQLSud4pS8ChkdED4NZrup6fKirFXXXLFe9u?filename=deepnude.png',
      navigation: [],
    },
    releases: {
      '0.0.1': {
        dreampower: {
          minimum: 'v0.0.1',
        },
        urls: [
          'https://d.opendreamnet.com/v2/checkpoints/v0.0.1/v0.0.1.zip?direct=1',
          'https://gateway.pinata.cloud/ipfs/QmWgk943L8XqL86pT17WENaAuwtrSKqZQ23MhZSFAquyyi?filename=checkpoints.torrent',
          'QmWqmagyqzsDdxGhJ3LGM3c88W6DhZYECeTrbhK9pDSuVP',
        ],
      },
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
      this.data = dreamtrack.get('projects.checkpoints', this.data)
    }

    await this.updater.setup(!requirements.canNudify)
  }

  openAppFolder() {
    shell.openPath(getPowerPath('checkpoints'))
  }
}

export const checkpoints = new Checkpoints()
