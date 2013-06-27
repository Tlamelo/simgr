module.exports = require('./Service')

;[
  'get',
  'put',
  'http'
].forEach(function (x) {
  require('./' + x)
})