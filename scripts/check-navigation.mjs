import assert from 'node:assert/strict'
import { resolveNavigationInput } from '../lib/browser/navigation.ts'

const brave = 'https://search.brave.com/search?q='
const google = 'https://www.google.com/search?q='

assert.deepEqual(resolveNavigationInput('github.com', brave, true), {
  url: 'https://github.com',
  upgradedToHttps: false,
  kind: 'url',
})

assert.deepEqual(resolveNavigationInput('react hooks tutorial', brave, true), {
  url: 'https://search.brave.com/search?q=react%20hooks%20tutorial',
  upgradedToHttps: false,
  kind: 'search',
})

assert.deepEqual(resolveNavigationInput('react hooks tutorial', google, true), {
  url: 'https://www.google.com/search?q=react%20hooks%20tutorial',
  upgradedToHttps: false,
  kind: 'search',
})

assert.deepEqual(resolveNavigationInput('http://example.com/path', brave, true), {
  url: 'https://example.com/path',
  upgradedToHttps: true,
  kind: 'url',
})

assert.equal(resolveNavigationInput('localhost:3000', brave, true)?.url, 'http://localhost:3000')
assert.equal(resolveNavigationInput('127.0.0.1:5000/api', brave, true)?.url, 'http://127.0.0.1:5000/api')
assert.equal(resolveNavigationInput('http://localhost:3000', brave, true)?.url, 'http://localhost:3000')
assert.equal(resolveNavigationInput('   ', brave, true), null)

console.log('Navigation checks passed.')
