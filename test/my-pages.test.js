const test = require('ava')
const myPages = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => myPages(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(myPages('w'), 'w@zce.me')
  t.is(myPages('w', { host: 'wedn.net' }), 'w@wedn.net')
})
