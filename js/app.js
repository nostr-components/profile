import { html, Component, render } from '../js/standalone.module.js'
import { getQueryStringValue, saveFile } from '../util.js'
import { findNestedObjectById } from '../js/linkedobjects.js'
import '../js/nostr-ui.js'
import UserProfile from '../components/UserProfile.js'
import Contacts from '../components/Contacts.js'

function doc () {
  if (di.data.length) {
    return di.data[0]
  } else {
    return di.data
  }
}

// APP
export class App extends Component {
  constructor () {
    super()
    this.fetchProfile = this.fetchProfile.bind(this)

    const serverUrl = getQueryStringValue('storage') || doc().storage || 'https://nosdav.nostr.rocks'
    const mode = getQueryStringValue('mode') || doc().m || 'm'
    const uri = getQueryStringValue('uri') || doc().uri || 'profile.json'

    const profilePubkey = getQueryStringValue('pubkey')

    let key
    if (doc().mainEntity['@id']) {
      key = doc().mainEntity['@id'].replace('nostr:pubkey:', '')
    } else {
      key = this.userPublicKey
    }

    const apps = findNestedObjectById(di.data, 'nostr:pubkey:' + key)?.mainEntity?.app || []

    this.state = {
      userPublicKey: null,
      filename: uri,
      fileContent: '',
      bookmarks: [],
      newBookmarkUrl: '',
      serverUrl: serverUrl,
      mode: mode,
      profilePubkey: profilePubkey,
      apps: apps,
      data: {},
      error: null
    }
  }

  getRelay () {
    const relay = getQueryStringValue('relay') || doc().relay || 'wss://nostr-pub.wellorder.net'
    return relay
  }

  async componentDidMount () {
    let key = 'de7ecd1e2976a6adb2ffa5f4db81a7d812c8bb6698aa00dcf1e76adb55efd645'
    if (doc().mainEntity && doc().mainEntity['@id']) {
      key = getQueryStringValue('pubkey') || doc().mainEntity['@id'].replace('nostr:pubkey:', '')
    } else {
      return
    }
    // this.fetchProfile(key, this.render.bind(this))

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

  // fetchProfile.js
  fetchProfile (pubkey, render) {
    const NOSTR_RELAY_URL = this.getRelay()

    let key
    if (doc().mainEntity && doc().mainEntity['@id']) {
      key = doc().mainEntity['@id'].replace('nostr:pubkey:', '')
    } else {
      key = this.state.userPublicKey
    }

    const wss = new WebSocket(NOSTR_RELAY_URL)
    const kind = 0
    const id = 'profile'
    wss.onopen = function () {
      const req = `["REQ", "${id}", { "kinds": [${kind}], "authors": ["${key}"] }]`
      wss.send(req)
    }

    // Use an arrow function here
    wss.onmessage = (msg) => {
      const response = JSON.parse(msg.data)

      if (response && response[2]) {
        const data = response[2]
        console.log(data)
        const content = JSON.parse(data.content)

        this.setState({
          name: content.name,
          picture: content.picture,
          website: content.website,
          about: content.about,
          banner: content.banner,
          github: content.identities?.[0]?.claim
        })

        doc().mainEntity.name = content.name
        doc().mainEntity.image = content.picture
        doc().mainEntity.url = content.website
        doc().mainEntity.description = content.about
        doc().mainEntity.banner = content.banner
        doc().mainEntity.github = content.identities?.[0]?.claim

        render()
      } else {
        console.error('Invalid or undefined data received:', msg.data)
      }
    }
  }

  render () {
    const { data, error } = this.state

    if (error) {
      return html`
      ${error ? html`<div class="error">${error}</div><a href="/">Back</a>` : ''} 
      `
    }

    let key
    const me = data?.mainEntity
    if (!me) return
    console.log('### me', me)
    if (doc().mainEntity && doc().mainEntity['@id']) {
      key = doc().mainEntity['@id'].replace('nostr:pubkey:', '')
    } else {
      key = this.state.userPublicKey
    }

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

render(html` <${App} /> `, document.body)
