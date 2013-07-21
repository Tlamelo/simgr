var os = require('os')

var env = process.env

exports.s3 = {
  key: env.SIMGR_S3_KEY || '',
  secret: env.SIMGR_S3_SECRET || '',
  bucket: env.SIMGR_S3_BUCKET || ''
}

exports.cache = {
  key: env.SIMGR_CACHE_KEY || '',
  secret: env.SIMGR_CACHE_SECRET || '',
  bucket: env.SIMGR_CACHE_BUCKET || ''
}

exports.tmpdir = env.SIMGR_TEMP_DIR
  || (os.tmpdir && os.tmpdir())
  || os.tmpDir() // node 0.8 support

exports.variants = [{
  slug: 'o'
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
exports.maxsize = (parseInt(env.SIMGR_MAXSIZE, 10) || 25) * 1024 * 1024
// In megapixels
exports.maxarea = (parseInt(env.SIMGR_MAXAREA, 10) || 25) * 1000 * 1000

// webp stuff
// 0-6, fastest by default
exports.compressionmethod = parseInt(env.SIMGR_WEBP_COMPRESSION_METHOD, 10) || 0
// Assumed low memory system by default
exports.lowmemory = !env.SIMGR_WEBP_HIGH_MEMORY