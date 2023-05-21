import { html, render } from '../js/standalone.module.js'
import { getQueryStringValue } from '../util.js'
import '../js/nostr-ui.js'
import Profile from '../lib/index.js'

function doc () {
  if (di.data.length) {
    return di.data[0]
  } else {
    return di.data
  }
}

const defaultPubkey = 'de7ecd1e2976a6adb2ffa5f4db81a7d812c8bb6698aa00dcf1e76adb55efd645'
const docPubkey = doc().mainEntity && doc().mainEntity['@id'] && doc().mainEntity['@id'].replace('nostr:pubkey:', '')

const pubkey = getQueryStringValue('pubkey') || docPubkey || defaultPubkey

render(html` <${Profile} pubkey=${pubkey} /> `, document.body)
