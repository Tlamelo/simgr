module.exports = require('./Simgr')

;[
  'get',
  'put',
  'http',
  'utils',
  's3',
  'imagemagick'
].forEach(function (x) {
  require('./' + x)
})