var os = require('os')

var env = process.env

// Bucket for saving original images
exports.store = {
  key: env.SIMGR_STORE_KEY || '',
  secret: env.SIMGR_STORE_SECRET || '',
  bucket: env.SIMGR_STORE_BUCKET || ''
}

// Bucket for saving variants,
// could be the same as the original bucket.
exports.cache = {
  key: env.SIMGR_CACHE_KEY || '',
  secret: env.SIMGR_CACHE_SECRET || '',
  bucket: env.SIMGR_CACHE_BUCKET || ''
}

exports.tmpdir = env.SIMGR_TEMP_DIR || os.tmpdir()

exports.variants = [{
  slug: 'o',
  gif: true,
  webm: {
    crf: 10,
    bitratefactor: 5
  },
  mp4: {
    crf: 23,
    bitratefactor: 10
  }
}, {
  slug: 'l',
  size: 1440
}, {
  slug: 'm',
  size: 720
}, {
  slug: 's',
  size: 360
}, {
  slug: 't',
  size: 240
}, {
  slug: 'a',
  size: 120
}]

// Maximum quality for JPEG
// Quality for WebP
exports.quality = parseInt(env.SIMGR_QUALITY, 10) || 75
// In megabytes
exports.maxsize = (parseInt(env.SIMGR_MAXSIZE, 10) || 50) * 1024 * 1024
// In megapixels
exports.maxarea = (parseInt(env.SIMGR_MAXAREA, 10) || 100) * 1000 * 1000

// webp stuff
// 0-6
exports.compressionmethod = parseInt(env.SIMGR_WEBP_COMPRESSION_METHOD, 10) || 4
// Assumed low memory system by default
exports.lowmemory = !env.SIMGR_WEBP_HIGH_MEMORY