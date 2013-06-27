module.exports = require('./Simgr')

;[
  'get',
  'put',
  'http'
].forEach(function (x) {
  require('./' + x)
})