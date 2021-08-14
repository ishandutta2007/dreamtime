import { dreamtrack } from '../services'

class Community {
  data = {
    name: 'OpenDreamNet',
    slogan: 'Adult entertainment and decentralized applications to combat censorship.',
    logo: 'https://fs.dreamlink.cloud/ipfs/QmbLPEHFGaPss2Dcc7Ea3oJw2VyjahZbMRUG3pzvoqCp2S?filename=dreamnet-logo-512x512.png',
    navigation: [
      
    ],
    sections: [],
    support: [
      {
        icon: [
          'fab',
          'patreon',
        ],
        href: 'https://www.patreon.com/dreamnet',
        label: 'Patreon',
      },
      {
        icon: 'coffee',
        href: 'https://www.buymeacoffee.com/dreamnettech',
        label: 'Buy Me A Coffe',
      },
      {
        icon: 'donate',
        href: 'https://liberapay.com/dreamnet/',
        label: 'LiberaPay',
      },
      {
        icon: [
          'fab',
          'bitcoin',
        ],
        href: 'https://commerce.coinbase.com/checkout/24a8bcb6-22db-4166-9bea-fb24fe78f1cd',
        label: 'Crypto',
      },
    ],
  }

  get name() {
    return this.data.name
  }

  get slogan() {
    return this.data.slogan
  }

  get logo() {
    return this.data.logo || 'https://fs.dreamlink.cloud/ipfs/QmbLPEHFGaPss2Dcc7Ea3oJw2VyjahZbMRUG3pzvoqCp2S?filename=dreamnet-logo-512x512.png'
  }

  async init() {
    if (dreamtrack.enabled) {
      this.data = dreamtrack.get('community', this.data)
    }
  }
}

export const community = new Community()
