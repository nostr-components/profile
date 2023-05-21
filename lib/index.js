import { html, Component, render } from '../js/standalone.module.js'
import { getQueryStringValue } from '../util.js'
import '../js/nostr-ui.js'
import UserProfile from '../components/UserProfile.js'
import Contacts from '../components/Contacts.js'

function doc() {
  if (di.data.length) {
    return di.data[0]
  } else {
    return di.data
  }
}

// APP
export default class Profile extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pubkey: props.pubkey,
      data: {},
      error: null
    }
  }

  getRelay() {
    const relay = getQueryStringValue('relay') || doc().relay || 'wss://nostr-pub.wellorder.net'
    return relay
  }

  async componentDidMount() {
    const key = this.state.pubkey

    let profile
    const cache = 'https://nostr.social'
    try {
      profile = await fetch(`${cache}/.well-known/nostr/pubkey/${key}/index.json`)
    } catch (e) {
      console.log('error', e)
      this.setState({ error: 'Error fetching profile. Please check your network connection and try again.' })
    }

    try {
      const data = await profile.json()
      console.log('### profile', data)
      this.setState({ data })
    } catch (e) {
      console.log('error', e)
      this.setState({ error: 'This profile is not yet set up.' })
    }
  }

  render() {
    const { data, error, pubkey } = this.state

    if (error) {
      return html`
      ${error ? html`<div class="error">${error}</div><a href="/">Back</a>` : ''} 
      `
    }

    const key = pubkey
    const me = data?.mainEntity
    if (!me) return
    console.log('### me', me)
    // if (doc().mainEntity && doc().mainEntity['@id']) {
    //   key = doc().mainEntity['@id'].replace('nostr:pubkey:', '')
    // } else {
    //   key = this.state.userPublicKey
    // }

    return html`

      <div id="container">

        <div class="content">
          <${UserProfile}
            userPublicKey="${key}"
            name="${me?.name}"
            picture="${me?.picture}"
            about="${me?.about}"
            banner="${me?.banner}"
            github="${me?.github}"
          />
          <${Contacts}
            contacts="${me.following}" userPublicKey="${key}"
          />
        </div>

      </div>
    `
  }
}
