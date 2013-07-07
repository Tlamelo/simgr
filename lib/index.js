module.exports = require('./Simgr')

;[
  'get',
  'http',
  'utils',
  's3',
  'identify'
].forEach(function (x) {
  require('./' + x)
})