path = require('path')
fs = require('fs')
ffmeta = require('fluent-ffmpeg').Metadata
gm = require('gm').subClass({
  imageMagick: true
})

simgr = require('../')()

// Add a random string to the names of the images
// otherwise the images will be cached
rand = Math.random().toString().slice(2)