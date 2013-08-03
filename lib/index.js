module.exports = require('./Simgr')

;[
  'get',
  'http',
  'utils',
  's3',
  'identify',
  'support'
].forEach(function (x) {
  require('./' + x)
})